/**
 * Desktop Enrollment Service
 * 
 * Handles mTLS device enrollment for Desktop platforms (Tauri)
 * - macOS: Uses Keychain for secure certificate storage
 * - Windows: Uses Certificate Store + DPAPI (TODO)
 * - Linux: Uses encrypted file storage (TODO)
 */

import { invoke } from '@tauri-apps/api/core'

export interface DesktopDeviceInfo {
  device_id: string
  platform: 'macos' | 'windows' | 'linux'
  device_model: string
  os_version: string
  has_certificate: boolean
}

export interface DesktopEnrollmentResult {
  success: boolean
  enrolled: boolean
  device_id: string
  already_enrolled: boolean
  certificate_expires_at?: string
  error?: string
}

export class DesktopEnrollmentService {
  private backendUrl: string

  constructor(backendUrl?: string) {
    this.backendUrl =
      backendUrl ||
      import.meta.env.VITE_BACKEND_OAUTH_URL_DEV ||
      import.meta.env.VITE_BACKEND_OAUTH_URL_PROD ||
      'https://api.apuntador.io'
  }

  /**
   * Get device information
   */
  async getDeviceInfo(): Promise<DesktopDeviceInfo> {
    console.log('📱 [Desktop Enrollment] Getting device info...')
    const info = await invoke<DesktopDeviceInfo>('get_desktop_device_info')
    console.log('✅ Device info:', info)
    return info
  }

  /**
   * Check if device is enrolled
   */
  async checkEnrollmentStatus(): Promise<DesktopEnrollmentResult> {
    console.log('🔍 [Desktop Enrollment] Checking enrollment status...')
    const status = await invoke<DesktopEnrollmentResult>('check_enrollment_status')
    console.log('✅ Enrollment status:', status)
    return status
  }

  /**
   * Enroll device with backend
   */
  async enrollDevice(): Promise<DesktopEnrollmentResult> {
    console.log('🚀 [Desktop Enrollment] Starting enrollment...')
    console.log('   Backend URL:', this.backendUrl)

    try {
      // 1. Get certificate pins from backend
      const pins = await this.getCertificatePins()
      console.log('📌 Certificate pins received:', pins)

      // 2. Call Tauri enrollment command
      const result = await invoke<DesktopEnrollmentResult>('enroll_desktop_device', {
        backendUrl: this.backendUrl,
        certificatePins: pins,
      })

      if (result.success) {
        console.log('✅ [Desktop Enrollment] Enrollment successful!')
        console.log('   Device ID:', result.device_id)
        console.log('   Expires:', result.certificate_expires_at)
      } else {
        console.error('❌ [Desktop Enrollment] Enrollment failed:', result.error)
      }

      return result
    } catch (error) {
      console.error('❌ [Desktop Enrollment] Enrollment error:', error)
      throw error
    }
  }

  /**
   * Force re-enrollment (renewal)
   */
  async forceReEnroll(): Promise<DesktopEnrollmentResult> {
    console.log('🔄 [Desktop Enrollment] Forcing re-enrollment...')

    // 1. Delete existing certificate
    await this.unenrollDevice()

    // 2. Enroll again
    return await this.enrollDevice()
  }

  /**
   * Unenroll device (delete certificate)
   */
  async unenrollDevice(): Promise<void> {
    console.log('🗑️  [Desktop Enrollment] Unenrolling device...')
    await invoke('unenroll_desktop_device')
    console.log('✅ Device unenrolled')
  }

  /**
   * Get certificate pins from backend
   */
  private async getCertificatePins(): Promise<string[]> {
    console.log('🔐 [Desktop Enrollment] Fetching certificate pins...')
    
    // TEMPORAL: Usar pins hardcodeados para ngrok
    // TODO: El backend debería exponer un endpoint público para obtener pins
    // antes del enrollment (sin requerir certificado de cliente)
    
    if (this.backendUrl.includes('ngrok.app')) {
      console.log('ℹ️  Using hardcoded ngrok pins for testing')
      return [
        'wexXiEAY/v67Xokb8oZpilJNMfon0OnTAB6vGdI94Mw=', // ngrok certificate pin
      ]
    }

    // Para otros backends, intentar obtener desde el endpoint
    console.log('   URL:', `${this.backendUrl}/public/ca-certificate-pin`)

    try {
      // Intentar endpoint público (sin autenticación)
      const response = await fetch(`${this.backendUrl}/public/ca-certificate-pin`)

      if (!response.ok) {
        throw new Error(`Failed to get certificate pins: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Certificate pins response:', data)

      // Extract base64 pins from response
      const pins: string[] = []
      if (data.sha256_base64) {
        pins.push(data.sha256_base64)
      }
      if (data.backup_pin_base64) {
        pins.push(data.backup_pin_base64)
      }

      if (pins.length === 0) {
        throw new Error('No certificate pins received from backend')
      }

      return pins
    } catch (error) {
      console.error('❌ Failed to get certificate pins:', error)
      console.warn('⚠️  Falling back to default pins')
      
      // Fallback: usar pins de ngrok por defecto
      return ['wexXiEAY/v67Xokb8oZpilJNMfon0OnTAB6vGdI94Mw=']
    }
  }

  /**
   * Ensure device is enrolled (idempotent)
   */
  async ensureEnrolled(): Promise<DesktopEnrollmentResult> {
    console.log('🔐 [Desktop Enrollment] Ensuring device is enrolled...')

    // Check if already enrolled
    const status = await this.checkEnrollmentStatus()

    if (status.enrolled && !this.isCertificateExpiringSoon(status.certificate_expires_at)) {
      console.log('✅ Device already enrolled and certificate is valid')
      return status
    }

    if (status.enrolled) {
      console.log('⚠️  Certificate expiring soon, re-enrolling...')
      return await this.forceReEnroll()
    }

    // Not enrolled, enroll now
    console.log('ℹ️  Device not enrolled, enrolling now...')
    return await this.enrollDevice()
  }

  /**
   * Check if certificate is expiring soon (< 2 days)
   */
  private isCertificateExpiringSoon(expiresAt?: string): boolean {
    if (!expiresAt) return true

    try {
      const expiryDate = new Date(expiresAt)
      const now = new Date()
      const twoDaysInMs = 2 * 24 * 60 * 60 * 1000
      const timeUntilExpiry = expiryDate.getTime() - now.getTime()

      return timeUntilExpiry < twoDaysInMs
    } catch {
      return true // If we can't parse the date, assume it's expiring
    }
  }
}

// Export singleton instance
export const desktopEnrollmentService = new DesktopEnrollmentService()
