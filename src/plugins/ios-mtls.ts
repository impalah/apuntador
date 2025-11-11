/**
 * Interfaces TypeScript para los plugins nativos de iOS
 * 
 * Secure Enclave (HSM) y Auto-Enrollment para mTLS
 */

export interface SecureEnclavePlugin {
  /**
   * Verifica si el dispositivo tiene Secure Enclave disponible
   */
  isSecureEnclaveAvailable(): Promise<{
    available: boolean
    deviceModel: string
    osVersion: string
  }>

  /**
   * Genera un par de claves EC (P-256) en el Secure Enclave
   * La clave privada NUNCA sale del Secure Enclave
   */
  generateKeyPair(): Promise<{
    success: boolean
    publicKey: string // Base64
    keySize: number
    algorithm: string
    secureEnclave: boolean
  }>

  /**
   * Genera un Certificate Signing Request (CSR)
   */
  generateCSR(options: {
    commonName: string
    organization?: string
    country?: string
  }): Promise<{
    success: boolean
    csr: string // Base64 DER format
    csrSize: number
  }>

  /**
   * Almacena un certificado firmado en el Keychain
   */
  storeCertificate(options: {
    certificate: string // Base64 DER format
  }): Promise<{
    success: boolean
    size: number
  }>

  /**
   * Obtiene el certificado almacenado
   */
  getCertificate(): Promise<{
    success: boolean
    certificate?: string // Base64
    size?: number
    message?: string
  }>

  /**
   * Verifica si existe un certificado
   */
  hasCertificate(): Promise<{
    hasCertificate: boolean
  }>

  /**
   * Elimina todas las claves y certificados (para testing o re-enrollment)
   */
  deleteAll(): Promise<{
    success: boolean
  }>
}

export interface AutoEnrollmentPlugin {
  /**
   * Verifica el estado del enrollment
   */
  checkEnrollmentStatus(): Promise<{
    enrolled: boolean
    deviceId: string
    deviceModel: string
    osVersion: string
  }>

  /**
   * Realiza el enrollment automático con el backend
   * 
   * Proceso:
   * 1. Genera par de claves en Secure Enclave
   * 2. Genera CSR
   * 3. Envía CSR al backend
   * 4. Recibe y almacena certificado firmado
   */
  autoEnroll(options: {
    backendUrl: string
  }): Promise<{
    success: boolean
    enrolled: boolean
    alreadyEnrolled?: boolean
    deviceId?: string
    certificateSize?: number
    message?: string
  }>

  /**
   * Re-enrollment (elimina credenciales antiguas y hace nuevo enrollment)
   */
  reEnroll(options: {
    backendUrl: string
  }): Promise<{
    success: boolean
    enrolled: boolean
    deviceId?: string
    certificateSize?: number
  }>
}

// Registro de los plugins
import { registerPlugin } from '@capacitor/core'

export const SecureEnclave = registerPlugin<SecureEnclavePlugin>('SecureEnclave')
export const AutoEnrollment = registerPlugin<AutoEnrollmentPlugin>('AutoEnrollment')
