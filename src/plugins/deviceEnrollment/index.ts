import { registerPlugin } from '@capacitor/core'

/**
 * Información del dispositivo y capacidades de seguridad.
 */
export interface DeviceInfo {
  /** Android ID único del dispositivo */
  deviceId: string
  /** Fabricante del dispositivo (Samsung, Google, etc.) */
  manufacturer: string
  /** Modelo del dispositivo */
  model: string
  /** Versión de Android (11, 12, 13, etc.) */
  androidVersion: string
  /** Nivel de API de Android */
  apiLevel: number
  /** true si el dispositivo tiene chip StrongBox (hardware dedicado) */
  hasStrongBox: boolean
  /** true si el dispositivo tiene TEE (Trusted Execution Environment) */
  hasTEE: boolean
  /** true si el dispositivo tiene Android Keystore */
  hasKeystore: boolean
}

/**
 * Resultado del enrollment del dispositivo.
 */
export interface EnrollmentResult {
  /** true si el enrollment fue exitoso */
  success: boolean
  /** true si el dispositivo ya estaba enrollado */
  alreadyEnrolled: boolean
  /** Device ID del dispositivo */
  deviceId: string
  /** Fecha de expiración del certificado */
  certificateExpiry: string
  /** Subject del certificado (DN) */
  certificateSubject?: string
  /** Número de serie del certificado */
  certificateSerial?: string
  /** Días restantes hasta expiración */
  daysRemaining?: number
}

/**
 * Estado del enrollment del dispositivo.
 */
export interface EnrollmentStatus {
  /** true si el dispositivo está enrollado con certificado válido */
  isEnrolled: boolean
  /** Fecha de expiración del certificado */
  certificateExpiry?: string
  /** Días restantes hasta expiración */
  daysRemaining?: number
  /** true si el certificado necesita renovación (< 5 días) */
  needsRenewal: boolean
  /** Subject del certificado (DN) */
  certificateSubject?: string
  /** Número de serie del certificado */
  certificateSerial?: string
}

/**
 * Opciones para el enrollment del dispositivo.
 */
export interface EnrollmentOptions {
  /** URL del backend (ej: https://api.apuntador.io) */
  backendUrl: string
  /** 
   * Si se debe intentar usar StrongBox (chip hardware dedicado).
   * Default: true (intentar StrongBox, fallback a TEE)
   */
  useStrongBox?: boolean
}

/**
 * Opciones para unenroll del dispositivo.
 */
export interface UnenrollOptions {
  /** URL del backend para revocar en servidor (opcional) */
  backendUrl?: string
}

/**
 * Plugin de Capacitor para enrollment de dispositivos con mTLS y HSM.
 * 
 * Características:
 * - Generación de claves en Hardware Security Module (StrongBox/TEE)
 * - Enrollment con Certificate Authority del backend
 * - Certificados de corta duración con auto-renovación
 * - Autenticación mTLS para API requests
 * 
 * Flujo típico:
 * 1. Obtener información del dispositivo: `getDeviceInfo()`
 * 2. Enrollar dispositivo: `enrollDevice({ backendUrl })`
 * 3. Verificar estado: `checkEnrollmentStatus()`
 * 4. (Opcional) Renovar antes de expirar: `enrollDevice()` de nuevo
 * 5. (Opcional) Revocar: `unenrollDevice()`
 */
export interface DeviceEnrollmentPlugin {
  /**
   * Obtiene información del dispositivo y capacidades de seguridad.
   * 
   * @returns Información del dispositivo incluyendo capacidades HSM
   * 
   * @example
   * ```typescript
   * const info = await DeviceEnrollment.getDeviceInfo()
   * console.log('Device:', info.manufacturer, info.model)
   * console.log('Has StrongBox:', info.hasStrongBox)
   * console.log('Has TEE:', info.hasTEE)
   * ```
   */
  getDeviceInfo(): Promise<DeviceInfo>

  /**
   * Enrolla el dispositivo en el backend con mTLS.
   * 
   * Proceso:
   * 1. Genera par de claves en HSM (StrongBox o TEE)
   * 2. Crea Certificate Signing Request (CSR)
   * 3. Envía CSR al backend CA
   * 4. Recibe certificado firmado
   * 5. Almacena certificado en Keystore
   * 
   * Si el dispositivo ya está enrollado con certificado válido (> 5 días),
   * no hace nada y retorna el estado actual.
   * 
   * Si el certificado expira en < 5 días, automáticamente renueva.
   * 
   * @param options Opciones de enrollment
   * @returns Resultado del enrollment
   * @throws Error si falla el enrollment o no hay conectividad
   * 
   * @example
   * ```typescript
   * try {
   *   const result = await DeviceEnrollment.enrollDevice({
   *     backendUrl: 'https://api.apuntador.io',
   *     useStrongBox: true
   *   })
   *   
   *   if (result.alreadyEnrolled) {
   *     console.log('Already enrolled, expires:', result.certificateExpiry)
   *   } else {
   *     console.log('Enrollment successful!')
   *     console.log('Certificate serial:', result.certificateSerial)
   *   }
   * } catch (error) {
   *   console.error('Enrollment failed:', error)
   * }
   * ```
   */
  enrollDevice(options: EnrollmentOptions): Promise<EnrollmentResult>

  /**
   * Verifica si el dispositivo está enrollado y el estado del certificado.
   * 
   * @returns Estado del enrollment
   * 
   * @example
   * ```typescript
   * const status = await DeviceEnrollment.checkEnrollmentStatus()
   * 
   * if (!status.isEnrolled) {
   *   console.log('Device not enrolled')
   *   // Llamar enrollDevice()
   * } else if (status.needsRenewal) {
   *   console.log('Certificate expires in', status.daysRemaining, 'days')
   *   // Llamar enrollDevice() para renovar
   * } else {
   *   console.log('Certificate valid for', status.daysRemaining, 'days')
   * }
   * ```
   */
  checkEnrollmentStatus(): Promise<EnrollmentStatus>

  /**
   * Elimina el enrollment del dispositivo (revoca certificado).
   * 
   * Elimina las claves y certificado del Keystore local.
   * Opcionalmente, puede notificar al backend para revocar en servidor.
   * 
   * @param options Opciones de unenroll
   * @returns Resultado de la operación
   * 
   * @example
   * ```typescript
   * await DeviceEnrollment.unenrollDevice({
   *   backendUrl: 'https://api.apuntador.io'
   * })
   * console.log('Device unenrolled')
   * ```
   */
  unenrollDevice(options?: UnenrollOptions): Promise<{ success: boolean }>
}

const DeviceEnrollment = registerPlugin<DeviceEnrollmentPlugin>('DeviceEnrollment', {
  web: () => import('./web').then((m) => new m.DeviceEnrollmentWeb()),
})

export default DeviceEnrollment
