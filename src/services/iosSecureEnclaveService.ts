/**
 * Servicio de auto-enrollment para iOS usando Secure Enclave
 * 
 * Gestiona automáticamente el enrollment del dispositivo iOS con el backend:
 * 1. Detecta si el dispositivo ya está enrolled
 * 2. Si no, genera claves en Secure Enclave y realiza enrollment
 * 3. Almacena el certificado para usar en peticiones mTLS
 * 
 * Similar al AndroidKeystoreService pero usando Secure Enclave en iOS
 */

import { Capacitor } from '@capacitor/core'
import { SecureEnclave, AutoEnrollment } from '../plugins/ios-mtls'
import { getSecureEnclaveNativeBridge } from './secureEnclaveNativeBridge'

// Simple logger replacement
const logger = {
  info: (message: string, data?: any) => console.log(`ℹ️  ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`⚠️  ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`❌ ${message}`, data || ''),
}

export interface IOSEnrollmentStatus {
  enrolled: boolean
  deviceId: string
  deviceModel: string
  osVersion: string
  hasSecureEnclave?: boolean
}

export interface IOSEnrollmentResult {
  success: boolean
  enrolled: boolean
  deviceId?: string
  certificateSize?: number
  alreadyEnrolled?: boolean
  error?: string
}

export class IOSSecureEnclaveService {
  private static instance: IOSSecureEnclaveService
  private backendUrl: string
  private enrollmentPromise: Promise<IOSEnrollmentResult> | null = null
  private useNativeBridge = false

  private constructor() {
    // Obtener URL del backend desde variables de entorno
    // Prioridad: iOS Dev > Dev genérico > Prod
    this.backendUrl = 
      import.meta.env.VITE_BACKEND_OAUTH_URL_IOS_DEV || 
      import.meta.env.VITE_BACKEND_OAUTH_URL_DEV || 
      import.meta.env.VITE_BACKEND_OAUTH_URL_PROD || 
      'https://api.apuntador.io'

    // Detectar si el native bridge está disponible
    if (typeof (window as any).webkit !== 'undefined') {
      this.useNativeBridge = true
      logger.info('📱 [iOS Secure Enclave] Using native WebKit bridge')
    } else {
      logger.info('📱 [iOS Secure Enclave] Using Capacitor plugins')
    }

    logger.info('📱 [iOS Secure Enclave] Service initialized', {
      backendUrl: this.backendUrl,
      platform: Capacitor.getPlatform(),
      useNativeBridge: this.useNativeBridge,
    })
  }

  public static getInstance(): IOSSecureEnclaveService {
    if (!IOSSecureEnclaveService.instance) {
      IOSSecureEnclaveService.instance = new IOSSecureEnclaveService()
    }
    return IOSSecureEnclaveService.instance
  }

  /**
   * Verifica si el dispositivo es iOS
   */
  public isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios'
  }

  /**
   * Verifica si el Secure Enclave está disponible en el dispositivo
   */
  public async isSecureEnclaveAvailable(): Promise<boolean> {
    if (!this.isIOS()) {
      return false
    }

    try {
      let result
      
      if (this.useNativeBridge) {
        // Usar native bridge
        const bridge = getSecureEnclaveNativeBridge()
        result = await bridge.isSecureEnclaveAvailable()
        logger.info('🔐 [iOS Native Bridge] Availability check', {
          available: result.available,
          deviceModel: result.deviceModel,
          osVersion: result.osVersion,
        })
      } else {
        // Usar Capacitor plugin
        result = await SecureEnclave.isSecureEnclaveAvailable()
        logger.info('🔐 [iOS Secure Enclave] Availability check', {
          available: result.available,
          deviceModel: result.deviceModel,
          osVersion: result.osVersion,
        })
      }
      
      return result.available
    } catch (error) {
      logger.error('❌ [iOS Secure Enclave] Failed to check availability', { error })
      return false
    }
  }

  /**
   * Verifica el estado del enrollment
   */
  public async checkEnrollmentStatus(): Promise<IOSEnrollmentStatus> {
    if (!this.isIOS()) {
      throw new Error('This method is only available on iOS')
    }

    if (this.useNativeBridge) {
      // Usar native bridge: verificar si existe certificado
      const bridge = getSecureEnclaveNativeBridge()
      try {
        const certResult = await bridge.getCertificate()
        const availResult = await bridge.isSecureEnclaveAvailable()
        
        // Si certResult.success es false, significa que no hay certificado (no enrolled)
        const enrolled = certResult.success && !!certResult.certificate
        
        logger.info('📊 [iOS Native Bridge] Enrollment status check', {
          hasCertificate: certResult.success,
          enrolled: enrolled
        })
        
        return {
          enrolled: enrolled,
          deviceId: `ios-${Capacitor.getPlatform()}`,
          deviceModel: availResult.deviceModel,
          osVersion: availResult.osVersion,
          hasSecureEnclave: availResult.available
        }
      } catch (error) {
        // Si hay un error real (no solo "no encontrado"), loguearlo
        logger.error('❌ [iOS Enrollment] Failed to check status', { error })
        // Pero no lanzar el error, devolver como "no enrolled"
        const availResult = await bridge.isSecureEnclaveAvailable()
        return {
          enrolled: false,
          deviceId: `ios-${Capacitor.getPlatform()}`,
          deviceModel: availResult.deviceModel,
          osVersion: availResult.osVersion,
          hasSecureEnclave: availResult.available
        }
      }
    }

    try {
      const [status, hasSecureEnclave] = await Promise.all([
        AutoEnrollment.checkEnrollmentStatus(),
        this.isSecureEnclaveAvailable(),
      ])

      logger.info('📊 [iOS Enrollment] Status check', {
        enrolled: status.enrolled,
        deviceId: status.deviceId,
        hasSecureEnclave,
      })

      return {
        ...status,
        hasSecureEnclave,
      }
    } catch (error) {
      logger.error('❌ [iOS Enrollment] Failed to check status', { error })
      throw error
    }
  }

  /**
   * Realiza el auto-enrollment si es necesario
   * 
   * Si el dispositivo ya está enrolled, no hace nada.
   * Si no está enrolled, genera claves y realiza el enrollment.
   * 
   * Esta función es idempotente y thread-safe.
   */
  public async ensureEnrolled(): Promise<IOSEnrollmentResult> {
    if (!this.isIOS()) {
      return {
        success: false,
        enrolled: false,
        error: 'Not running on iOS',
      }
    }

    // Si ya hay un enrollment en progreso, esperar a que termine
    if (this.enrollmentPromise) {
      logger.info('⏳ [iOS Enrollment] Waiting for existing enrollment process...')
      return this.enrollmentPromise
    }

    // Verificar si ya está enrolled
    try {
      const status = await this.checkEnrollmentStatus()
      if (status.enrolled) {
        logger.info('✅ [iOS Enrollment] Device already enrolled', {
          deviceId: status.deviceId,
        })
        return {
          success: true,
          enrolled: true,
          deviceId: status.deviceId,
          alreadyEnrolled: true,
        }
      }
    } catch (error) {
      logger.warn('⚠️  [iOS Enrollment] Could not check status, proceeding with enrollment', {
        error,
      })
    }

    // Realizar enrollment
    this.enrollmentPromise = this.performEnrollment()

    try {
      const result = await this.enrollmentPromise
      return result
    } finally {
      this.enrollmentPromise = null
    }
  }

  /**
   * Realiza el proceso de enrollment con el backend
   */
  private async performEnrollment(): Promise<IOSEnrollmentResult> {
    logger.info('🔐 [iOS Enrollment] Starting enrollment process...')

    try {
      // Verificar que el Secure Enclave está disponible
      const hasSecureEnclave = await this.isSecureEnclaveAvailable()
      if (!hasSecureEnclave) {
        throw new Error('Secure Enclave not available on this device')
      }

      if (this.useNativeBridge) {
        // Realizar enrollment manualmente usando native bridge
        return await this.performNativeBridgeEnrollment()
      }

      // Realizar auto-enrollment usando el plugin nativo Capacitor
      const result = await AutoEnrollment.autoEnroll({
        backendUrl: this.backendUrl,
      })

      if (result.success && result.enrolled) {
        logger.info('✅ [iOS Enrollment] Enrollment completed successfully!', {
          deviceId: result.deviceId,
          certificateSize: result.certificateSize,
        })
        return {
          success: true,
          enrolled: true,
          deviceId: result.deviceId,
          certificateSize: result.certificateSize,
        }
      } else {
        logger.error('❌ [iOS Enrollment] Enrollment failed', { result })
        return {
          success: false,
          enrolled: false,
          error: result.message || 'Enrollment failed',
        }
      }
    } catch (error) {
      logger.error('❌ [iOS Enrollment] Enrollment error', { error })
      return {
        success: false,
        enrolled: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Realiza el enrollment usando el Native Bridge (bypass de Capacitor)
   */
  private async performNativeBridgeEnrollment(): Promise<IOSEnrollmentResult> {
    const bridge = getSecureEnclaveNativeBridge()
    
    try {
      // 1. Generar par de claves en Secure Enclave
      logger.info('🔑 [iOS Native Enrollment] Generating key pair in Secure Enclave...')
      const keyResult = await bridge.generateKeyPair()
      if (!keyResult.success) {
        throw new Error('Failed to generate key pair')
      }

      // 2. Generar CSR
      logger.info('📝 [iOS Native Enrollment] Generating CSR...')
      const deviceInfo = await bridge.isSecureEnclaveAvailable()
      const deviceId = `ios-${deviceInfo.deviceModel}-${Date.now()}`
      
      const csrResult = await bridge.generateCSR({
        commonName: deviceId,
        organization: 'Apuntador',
        country: 'ES'
      })
      
      if (!csrResult.success) {
        throw new Error('Failed to generate CSR')
      }

      // 3. Enviar CSR al backend con Certificate Pinning
      logger.info('📤 [iOS Native Enrollment] Sending CSR to backend...', {
        backendUrl: this.backendUrl
      })
      
      // IMPORTANTE: Certificate pinning para enrollment
      // En iOS, el certificate pinning se aplica automáticamente a TODAS las conexiones
      // gracias a MTLSHTTPClient.urlSession que actúa como delegate global
      // No necesitamos un plugin especial, CapacitorHttp ya usa el pinning configurado
      logger.info('🔐 [iOS Native Enrollment] Using Certificate Pinning (via URLSession delegate)')
      
      const { CapacitorHttp } = await import('@capacitor/core')
      
      const response = await CapacitorHttp.post({
        url: `${this.backendUrl}/device/enroll`,
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          csr: csrResult.csr,
          device_id: deviceId,
          platform: 'ios',
          device_model: deviceInfo.deviceModel,
          os_version: deviceInfo.osVersion,
        }
      })

      // Aceptar 200 OK o 201 Created
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(`Backend enrollment failed: ${response.status}`)
      }

      const enrollmentData = response.data
      logger.info('📥 [iOS Native Enrollment] Received certificate from backend')

      // 4. Almacenar certificado
      logger.info('💾 [iOS Native Enrollment] Storing certificate...')
      const storeResult = await bridge.storeCertificate({
        certificate: enrollmentData.certificate
      })

      if (!storeResult.success) {
        throw new Error('Failed to store certificate')
      }

      logger.info('✅ [iOS Native Enrollment] Enrollment completed successfully!', {
        deviceId: deviceId,
        certificateSize: enrollmentData.certificate?.length || 0
      })

      return {
        success: true,
        enrolled: true,
        deviceId: deviceId,
        certificateSize: enrollmentData.certificate?.length || 0,
      }
    } catch (error) {
      logger.error('❌ [iOS Native Enrollment] Enrollment failed', { error })
      return {
        success: false,
        enrolled: false,
        error: error instanceof Error ? error.message : 'Unknown enrollment error',
      }
    }
  }

  /**
   * Forzar re-enrollment (eliminar credenciales actuales y re-enrollar)
   * 
   * Útil cuando:
   * - El certificado ha expirado
   * - Hay problemas con el certificado actual
   * - Se quiere renovar el certificado
   */
  public async forceReEnroll(): Promise<IOSEnrollmentResult> {
    if (!this.isIOS()) {
      return {
        success: false,
        enrolled: false,
        error: 'Not running on iOS',
      }
    }

    logger.info('🔄 [iOS Enrollment] Starting forced re-enrollment...')

    try {
      if (this.useNativeBridge) {
        // Eliminar certificado actual y volver a enrollar usando native bridge
        const bridge = getSecureEnclaveNativeBridge()
        await bridge.deleteCertificate()
        logger.info('🗑️  [iOS Native Enrollment] Previous certificate deleted')
        
        // Realizar nuevo enrollment
        return await this.performNativeBridgeEnrollment()
      }

      // Usar plugin Capacitor
      const result = await AutoEnrollment.reEnroll({
        backendUrl: this.backendUrl,
      })

      if (result.success && result.enrolled) {
        logger.info('✅ [iOS Enrollment] Re-enrollment completed successfully!', {
          deviceId: result.deviceId,
          certificateSize: result.certificateSize,
        })
        return {
          success: true,
          enrolled: true,
          deviceId: result.deviceId,
          certificateSize: result.certificateSize,
        }
      } else {
        logger.error('❌ [iOS Enrollment] Re-enrollment failed', { result })
        return {
          success: false,
          enrolled: false,
          error: 'Re-enrollment failed',
        }
      }
    } catch (error) {
      logger.error('❌ [iOS Enrollment] Re-enrollment error', { error })
      return {
        success: false,
        enrolled: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Elimina todas las credenciales (para testing o debugging)
   */
  public async deleteAllCredentials(): Promise<void> {
    if (!this.isIOS()) {
      throw new Error('This method is only available on iOS')
    }

    try {
      if (this.useNativeBridge) {
        const bridge = getSecureEnclaveNativeBridge()
        await bridge.deleteCertificate()
        logger.info('🗑️  [iOS Native Bridge] All credentials deleted')
      } else {
        await SecureEnclave.deleteAll()
        logger.info('🗑️  [iOS Secure Enclave] All credentials deleted')
      }
    } catch (error) {
      logger.error('❌ [iOS Secure Enclave] Failed to delete credentials', { error })
      throw error
    }
  }

  /**
   * Obtiene información del dispositivo iOS
   */
  public async getDeviceInfo(): Promise<IOSEnrollmentStatus> {
    return this.checkEnrollmentStatus()
  }
}

// Exportar instancia singleton
export const iosSecureEnclaveService = IOSSecureEnclaveService.getInstance()
