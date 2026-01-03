/**
 * Cliente mTLS unificado para todas las plataformas
 * 
 * Detecta automáticamente la plataforma y usa el servicio apropiado:
 * - Android: Android Keystore (TEE/StrongBox)
 * - iOS: Secure Enclave
 * - Desktop: macOS Keychain, Windows Certificate Store, Linux encrypted file
 * - Web: OAuth sin mTLS
 * 
 * Proporciona una interfaz unificada para el auto-enrollment
 * independientemente de la plataforma.
 */

import { Capacitor } from '@capacitor/core'
import DeviceEnrollment from '../plugins/deviceEnrollment'
import { iosSecureEnclaveService } from './iosSecureEnclaveService'
import { desktopEnrollmentService } from './desktopEnrollmentService'
import { isTauri } from '@/utils/tauri'
import { BACKEND_OAUTH_URL } from '@/config/api'

export interface MTLSEnrollmentStatus {
  platform: 'android' | 'ios' | 'desktop' | 'web'
  enrolled: boolean
  deviceId?: string
  deviceModel?: string
  osVersion?: string
  hasHSM?: boolean
  hsmType?: 'Android Keystore' | 'Secure Enclave' | 'macOS Keychain' | 'None'
}

export interface MTLSEnrollmentResult {
  success: boolean
  enrolled: boolean
  platform: 'android' | 'ios' | 'desktop' | 'web'
  deviceId?: string
  certificateSize?: number
  alreadyEnrolled?: boolean
  error?: string
}

/**
 * Servicio unificado de mTLS para todas las plataformas
 * 
 * Proporciona una API consistente independientemente de si la app
 * se ejecuta en Android, iOS, Desktop o Web.
 */
export class UnifiedMTLSService {
  private static instance: UnifiedMTLSService

  private constructor() {
    const platform = this.getPlatform()
    console.log(`[SECURE] [Unified mTLS] Initialized for platform: ${platform}`)
  }

  public static getInstance(): UnifiedMTLSService {
    if (!UnifiedMTLSService.instance) {
      UnifiedMTLSService.instance = new UnifiedMTLSService()
    }
    return UnifiedMTLSService.instance
  }

  /**
   * Check if running in Tauri (Desktop)
   */
  private isTauri(): boolean {
    return isTauri()
  }

  /**
   * Obtiene la plataforma actual
   */
  public getPlatform(): 'android' | 'ios' | 'desktop' | 'web' {
    // Check Tauri first (Desktop apps)
    if (this.isTauri()) {
      return 'desktop'
    }

    // Then check Capacitor (Mobile apps)
    const platform = Capacitor.getPlatform()
    if (platform === 'android') return 'android'
    if (platform === 'ios') return 'ios'
    
    // Default to web
    return 'web'
  }

  /**
   * Verifica si la plataforma soporta mTLS con HSM
   */
  public supportsHSM(): boolean {
    const platform = this.getPlatform()
    return platform === 'android' || platform === 'ios'
  }

  /**
   * Verifica si la plataforma soporta mTLS (con o sin HSM)
   */
  public supportsMTLS(): boolean {
    const platform = this.getPlatform()
    return platform === 'android' || platform === 'ios' || platform === 'desktop'
  }

  /**
   * Verifica el estado del enrollment (todas las plataformas)
   */
  public async checkEnrollmentStatus(): Promise<MTLSEnrollmentStatus> {
    const platform = this.getPlatform()

    if (platform === 'android') {
      const info = await DeviceEnrollment.getDeviceInfo()
      const status = await DeviceEnrollment.checkEnrollmentStatus()
      
      let hsmType: 'Android Keystore' | 'Secure Enclave' | 'macOS Keychain' | 'None' = 'None'
      if (info.hasStrongBox || info.hasTEE) {
        hsmType = 'Android Keystore'
      }
      
      return {
        platform: 'android',
        enrolled: status.isEnrolled,
        deviceId: info.deviceId,
        deviceModel: info.model,
        osVersion: info.androidVersion,
        hasHSM: info.hasStrongBox || info.hasTEE,
        hsmType,
      }
    } else if (platform === 'ios') {
      const status = await iosSecureEnclaveService.checkEnrollmentStatus()
      return {
        platform: 'ios',
        enrolled: status.enrolled,
        deviceId: status.deviceId,
        deviceModel: status.deviceModel,
        osVersion: status.osVersion,
        hasHSM: status.hasSecureEnclave,
        hsmType: status.hasSecureEnclave ? 'Secure Enclave' : 'None',
      }
    } else if (platform === 'desktop') {
      // Desktop (Tauri)
      const desktopStatus = await desktopEnrollmentService.checkEnrollmentStatus()
      const deviceInfo = await desktopEnrollmentService.getDeviceInfo()
      
      return {
        platform: 'desktop',
        enrolled: desktopStatus.enrolled,
        deviceId: desktopStatus.device_id,
        deviceModel: deviceInfo.device_model,
        osVersion: deviceInfo.os_version,
        hasHSM: deviceInfo.platform === 'macos', // macOS has Keychain (partial HSM)
        hsmType: deviceInfo.platform === 'macos' ? 'macOS Keychain' : 'None',
      }
    } else {
      // Web no soporta mTLS
      return {
        platform: 'web',
        enrolled: false,
        hasHSM: false,
        hsmType: 'None',
      }
    }
  }

  /**
   * Realiza auto-enrollment si es necesario (idempotente y thread-safe)
   * 
   * Esta es la función principal que debes llamar al inicializar la app.
   * Se encarga de:
   * 1. Detectar la plataforma
   * 2. Verificar si ya está enrolled
   * 3. Si no, realizar el enrollment automáticamente
   * 4. Manejar errores y reintentos
   */
  public async ensureEnrolled(): Promise<MTLSEnrollmentResult> {
    const platform = this.getPlatform()

    console.log(`[SECURE] [Unified mTLS] Ensuring enrollment for platform: ${platform}`)

    if (platform === 'android') {
      // Usar la API de producción desplegada en AWS
      const backendUrl = 
        import.meta.env.VITE_BACKEND_OAUTH_URL_DEV || 
        import.meta.env.VITE_BACKEND_OAUTH_URL_PROD || 
        BACKEND_OAUTH_URL

      const result = await DeviceEnrollment.enrollDevice({
        backendUrl,
        useStrongBox: true,
      })

      return {
        success: result.success,
        enrolled: true,
        platform: 'android',
        deviceId: result.deviceId,
        alreadyEnrolled: result.alreadyEnrolled,
      }
    } else if (platform === 'ios') {
      const result = await iosSecureEnclaveService.ensureEnrolled()
      return {
        success: result.success,
        enrolled: result.enrolled,
        platform: 'ios',
        deviceId: result.deviceId,
        certificateSize: result.certificateSize,
        alreadyEnrolled: result.alreadyEnrolled,
        error: result.error,
      }
    } else if (platform === 'desktop') {
      // Desktop (Tauri)
      const result = await desktopEnrollmentService.ensureEnrolled()
      return {
        success: result.success,
        enrolled: result.enrolled,
        platform: 'desktop',
        deviceId: result.device_id,
        alreadyEnrolled: result.already_enrolled,
        error: result.error,
      }
    } else {
      // Web no requiere enrollment
      console.log('[INFO]  [Unified mTLS] Web platform does not require enrollment')
      return {
        success: true,
        enrolled: false,
        platform: 'web',
      }
    }
  }

  /**
   * Fuerza un re-enrollment (renovación de certificado)
   * 
   * Útil cuando:
   * - El certificado ha expirado
   * - Hay problemas con el certificado actual
   * - Se quiere renovar el certificado manualmente
   */
  public async forceReEnroll(): Promise<MTLSEnrollmentResult> {
    const platform = this.getPlatform()

    console.log(`[REFRESH] [Unified mTLS] Forcing re-enrollment for platform: ${platform}`)

    if (platform === 'android') {
      // Para Android, primero unenroll y luego enroll de nuevo
      await DeviceEnrollment.unenrollDevice()

      const backendUrl = 
        import.meta.env.VITE_BACKEND_OAUTH_URL_DEV || 
        import.meta.env.VITE_BACKEND_OAUTH_URL_PROD || 
        BACKEND_OAUTH_URL

      const result = await DeviceEnrollment.enrollDevice({
        backendUrl,
        useStrongBox: true,
      })

      return {
        success: result.success,
        enrolled: true,
        platform: 'android',
        deviceId: result.deviceId,
      }
    } else if (platform === 'ios') {
      const result = await iosSecureEnclaveService.forceReEnroll()
      return {
        success: result.success,
        enrolled: result.enrolled,
        platform: 'ios',
        deviceId: result.deviceId,
        certificateSize: result.certificateSize,
        error: result.error,
      }
    } else if (platform === 'desktop') {
      // Desktop (Tauri)
      const result = await desktopEnrollmentService.forceReEnroll()
      return {
        success: result.success,
        enrolled: result.enrolled,
        platform: 'desktop',
        deviceId: result.device_id,
        error: result.error,
      }
    } else {
      console.log('[INFO]  [Unified mTLS] Web platform does not support re-enrollment')
      return {
        success: false,
        enrolled: false,
        platform: 'web',
        error: 'Web platform does not support mTLS',
      }
    }
  }

  /**
   * Elimina todas las credenciales (para testing/debugging)
   */
  public async deleteAllCredentials(): Promise<void> {
    const platform = this.getPlatform()

    console.log(`[DELETE]  [Unified mTLS] Deleting credentials for platform: ${platform}`)

    if (platform === 'android') {
      await DeviceEnrollment.unenrollDevice()
    } else if (platform === 'ios') {
      await iosSecureEnclaveService.deleteAllCredentials()
    } else if (platform === 'desktop') {
      await desktopEnrollmentService.unenrollDevice()
    } else {
      console.log('[INFO]  [Unified mTLS] Web platform has no credentials to delete')
    }
  }

  /**
   * Obtiene información del dispositivo
   */
  public async getDeviceInfo(): Promise<MTLSEnrollmentStatus> {
    return this.checkEnrollmentStatus()
  }

  /**
   * Obtiene el tipo de HSM disponible en el dispositivo
   */
  public async getHSMType(): Promise<string> {
    const status = await this.checkEnrollmentStatus()
    return status.hsmType || 'None'
  }
}

// Exportar instancia singleton
export const unifiedMTLSService = UnifiedMTLSService.getInstance()

/**
 * Hook de Vue para usar el servicio mTLS unificado
 * 
 * @example
 * ```typescript
 * import { useUnifiedMTLS } from '@/services/unifiedMTLSService'
 * 
 * export default {
 *   setup() {
 *     const { ensureEnrolled, checkStatus, platform, supportsHSM } = useUnifiedMTLS()
 *     
 *     onMounted(async () => {
 *       console.log('Platform:', platform.value)
 *       console.log('Supports HSM:', supportsHSM.value)
 *       
 *       const result = await ensureEnrolled()
 *       if (result.success) {
 *         console.log('[OK] mTLS ready')
 *       }
 *     })
 *   }
 * }
 * ```
 */
export function useUnifiedMTLS() {
  const service = UnifiedMTLSService.getInstance()

  return {
    // Propiedades reactivas
    platform: Capacitor.getPlatform(),
    supportsHSM: service.supportsHSM(),

    // Métodos
    checkStatus: () => service.checkEnrollmentStatus(),
    ensureEnrolled: () => service.ensureEnrolled(),
    forceReEnroll: () => service.forceReEnroll(),
    deleteCredentials: () => service.deleteAllCredentials(),
    getDeviceInfo: () => service.getDeviceInfo(),
    getHSMType: () => service.getHSMType(),
  }
}
