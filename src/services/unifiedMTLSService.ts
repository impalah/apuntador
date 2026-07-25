/**
 * Cliente mTLS unificado para todas las plataformas
 *
 * Detecta automáticamente la plataforma y delega en la estrategia
 * (`PlatformEnrollmentStrategy`) apropiada:
 * - Android: Android Keystore (TEE/StrongBox)
 * - iOS: Secure Enclave
 * - Desktop: macOS Keychain, Windows Certificate Store, Linux encrypted file
 * - Web: OAuth sin mTLS
 *
 * Proporciona una interfaz unificada para el auto-enrollment
 * independientemente de la plataforma. La plataforma se resuelve una única
 * vez (en el constructor) y cada método público delega en la estrategia
 * resuelta, en vez de repetir un switch por plataforma en cada método.
 */

import { Capacitor } from '@capacitor/core'
import { isTauri } from '@/utils/tauri'
import type { PlatformEnrollmentStrategy } from './mtls/enrollmentStrategy'
import { AndroidEnrollmentStrategy } from './mtls/androidEnrollmentStrategy'
import { IOSEnrollmentStrategy } from './mtls/iosEnrollmentStrategy'
import { DesktopEnrollmentStrategy } from './mtls/desktopEnrollmentStrategy'
import { WebEnrollmentStrategy } from './mtls/webEnrollmentStrategy'

export type MTLSPlatform = 'android' | 'ios' | 'desktop' | 'web'

export interface MTLSEnrollmentStatus {
  platform: MTLSPlatform
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
  platform: MTLSPlatform
  deviceId?: string
  certificateSize?: number
  alreadyEnrolled?: boolean
  error?: string
}

function detectPlatform(): MTLSPlatform {
  // Check Tauri first (Desktop apps)
  if (isTauri()) {
    return 'desktop'
  }

  // Then check Capacitor (Mobile apps)
  const platform = Capacitor.getPlatform()
  if (platform === 'android') return 'android'
  if (platform === 'ios') return 'ios'

  // Default to web
  return 'web'
}

function createStrategy(platform: MTLSPlatform): PlatformEnrollmentStrategy {
  switch (platform) {
    case 'android':
      return new AndroidEnrollmentStrategy()
    case 'ios':
      return new IOSEnrollmentStrategy()
    case 'desktop':
      return new DesktopEnrollmentStrategy()
    default:
      return new WebEnrollmentStrategy()
  }
}

/**
 * Servicio unificado de mTLS para todas las plataformas
 *
 * Proporciona una API consistente independientemente de si la app
 * se ejecuta en Android, iOS, Desktop o Web.
 */
export class UnifiedMTLSService {
  private static instance: UnifiedMTLSService

  private readonly platform: MTLSPlatform
  private readonly strategy: PlatformEnrollmentStrategy

  private constructor() {
    this.platform = detectPlatform()
    this.strategy = createStrategy(this.platform)
    console.log(`[Unified mTLS] Initialized for platform: ${this.platform}`)
  }

  public static getInstance(): UnifiedMTLSService {
    if (!UnifiedMTLSService.instance) {
      UnifiedMTLSService.instance = new UnifiedMTLSService()
    }
    return UnifiedMTLSService.instance
  }

  /**
   * Obtiene la plataforma actual
   */
  public getPlatform(): MTLSPlatform {
    return this.platform
  }

  /**
   * Verifica si la plataforma soporta mTLS con HSM
   */
  public supportsHSM(): boolean {
    return this.platform === 'android' || this.platform === 'ios'
  }

  /**
   * Verifica si la plataforma soporta mTLS (con o sin HSM)
   */
  public supportsMTLS(): boolean {
    return this.platform !== 'web'
  }

  /**
   * Verifica el estado del enrollment (todas las plataformas)
   */
  public async checkEnrollmentStatus(): Promise<MTLSEnrollmentStatus> {
    const status = await this.strategy.checkStatus()
    return {
      platform: this.platform,
      ...status,
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
    console.log(`[Unified mTLS] Ensuring enrollment for platform: ${this.platform}`)
    const result = await this.strategy.ensureEnrolled()
    return {
      platform: this.platform,
      ...result,
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
    console.log(`[Unified mTLS] Forcing re-enrollment for platform: ${this.platform}`)
    const result = await this.strategy.forceReEnroll()
    return {
      platform: this.platform,
      ...result,
    }
  }

  /**
   * Elimina todas las credenciales (para testing/debugging)
   */
  public async deleteAllCredentials(): Promise<void> {
    console.log(`[Unified mTLS] Deleting credentials for platform: ${this.platform}`)
    await this.strategy.deleteAllCredentials()
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
 *         console.log('mTLS ready')
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
