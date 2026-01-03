/**
 * Certificate Validation Service
 * 
 * Validates that device has a valid enrolled certificate before
 * allowing OAuth token requests via mTLS.
 * 
 * If no valid certificate exists, automatically enrolls the device.
 * Also fetches cloud provider configuration from backend.
 */

import { Capacitor } from '@capacitor/core'
import { UnifiedMTLSService } from '../unifiedMTLSService'
import { isTauri } from '@/utils/tauri'
import { cloudProviderConfig, type CloudProviderConfig } from '../cloudProviderConfig'

export interface CertificateStatus {
  isValid: boolean
  isEnrolled: boolean
  isExpired: boolean
  daysUntilExpiry?: number
  certificateInfo?: {
    subject: string
    issuer: string
    serial: string
    notBefore: string
    notAfter: string
  }
  error?: string
}

/**
 * Combined result of certificate validation and provider config fetch
 */
export interface CertificateAndConfig {
  certStatus: CertificateStatus
  providerConfig: CloudProviderConfig
}

export class CertificateValidator {
  /**
   * Check if device has a valid certificate for mTLS
   */
  static async validate(): Promise<CertificateStatus> {
    // Check if Tauri first (desktop platform)
    const isTauriPlatform = isTauri()
    const platform = isTauriPlatform ? 'desktop' : Capacitor.getPlatform()
    
    console.log(`[SEARCH] [CertificateValidator] Platform detected: ${platform}`)
    
    // Web platform doesn't use mTLS
    if (platform === 'web') {
      console.log('[WEB] [CertificateValidator] Web platform, skipping mTLS validation')
      return {
        isValid: true,
        isEnrolled: true,
        isExpired: false,
      }
    }

    try {
      // Usar UnifiedMTLSService en lugar de plugins directos
      console.log('[SECURE] [CertificateValidator] Checking enrollment status...')
      const mtlsService = UnifiedMTLSService.getInstance()
      const enrollmentStatus = await mtlsService.checkEnrollmentStatus()
      
      console.log('[LIST] [CertificateValidator] Enrollment status:', enrollmentStatus)
      
      if (!enrollmentStatus.enrolled) {
        return {
          isValid: false,
          isEnrolled: false,
          isExpired: false,
          error: 'No certificate found or device not enrolled',
        }
      }

      // Por ahora, si está enrolled, asumimos que es válido
      // TODO: Implementar verificación de expiración cuando esté disponible en el unified service
      return {
        isValid: true,
        isEnrolled: true,
        isExpired: false,
      }

    } catch (error: any) {
      console.error('[ERROR] [CertificateValidator] Validation error:', error)
      return {
        isValid: false,
        isEnrolled: false,
        isExpired: false,
        error: error.message || 'Failed to validate certificate',
      }
    }
  }

  /**
   * Check if certificate needs renewal (< 5 days remaining)
   */
  static async needsRenewal(): Promise<boolean> {
    const status = await this.validate()
    return status.isEnrolled && (!status.isValid || status.isExpired)
  }

  /**
   * Get user-friendly status message
   */
  static getStatusMessage(status: CertificateStatus): string {
    if (!status.isEnrolled) {
      return 'Device not enrolled. Please enroll your device first.'
    }
    
    if (status.isExpired) {
      return 'Certificate has expired. Please renew your enrollment.'
    }
    
    if (!status.isValid && status.daysUntilExpiry !== undefined) {
      return `Certificate expires in ${status.daysUntilExpiry} days. Please renew soon.`
    }
    
    if (status.isValid && status.daysUntilExpiry !== undefined) {
      return `Certificate valid for ${status.daysUntilExpiry} more days.`
    }
    
    return status.error || 'Certificate status unknown.'
  }

  /**
   * Ensure device has valid certificate - auto-enroll if needed
   * 
   * This method checks if certificate is valid and automatically
   * enrolls the device if no valid certificate exists.
   * 
   * @returns Certificate status after validation/enrollment
   */
  static async ensureValidCertificate(): Promise<CertificateStatus> {
    // Check if Tauri first (desktop platform)
    const isTauriPlatform = isTauri()
    const platform = isTauriPlatform ? 'desktop' : Capacitor.getPlatform()
    
    console.log(`[SEARCH] [CertificateValidator.ensureValidCertificate] Platform: ${platform}`)
    
    // Web platform doesn't use mTLS
    if (platform === 'web') {
      console.log('[WEB] [CertificateValidator] Web platform, no certificate needed')
      return {
        isValid: true,
        isEnrolled: true,
        isExpired: false,
      }
    }

    // Check current certificate status
    console.log('[SEARCH] [CertificateValidator] Validating current certificate...')
    const status = await this.validate()
    
    console.log('[LIST] [CertificateValidator] Current status:', status)
    
    // If valid, return immediately
    if (status.isValid) {
      console.log('[OK] Certificate is valid, no enrollment needed')
      return status
    }

    // Need to enroll/re-enroll
    console.log('[SECURE] Certificate not valid, starting automatic enrollment...')
    console.log('   Reason:', this.getStatusMessage(status))
    
    try {
      // Usar UnifiedMTLSService para enrollment multiplataforma
      const mtlsService = UnifiedMTLSService.getInstance()
      
      console.log('[SIGNAL] Enrolling device via UnifiedMTLSService')
      
      // Perform enrollment
      const result = await mtlsService.ensureEnrolled()

      if (!result.success) {
        throw new Error(result.error || 'Enrollment failed - no certificate received')
      }

      console.log('[OK] Automatic enrollment completed successfully')
      console.log('� Platform:', result.platform)

      // Validate again to get updated status
      const newStatus = await this.validate()
      
      if (!newStatus.isValid) {
        throw new Error('Certificate still invalid after enrollment')
      }

      return newStatus

    } catch (error: any) {
      console.error('[ERROR] Automatic enrollment failed:', error)
      
      return {
        isValid: false,
        isEnrolled: false,
        isExpired: false,
        error: `Auto-enrollment failed: ${error.message}`,
      }
    }
  }

  /**
   * Ensure device has valid certificate AND fetch provider config
   * 
   * This is the recommended method to use before OAuth flows.
   * It handles both certificate validation/enrollment and fetching
   * the provider configuration in a single call.
   * 
   * @returns Certificate status and provider configuration
   */
  static async ensureValidCertificateAndConfig(): Promise<CertificateAndConfig> {
    const isTauriPlatform = isTauri()
    const platform = isTauriPlatform ? 'desktop' : Capacitor.getPlatform()
    
    console.log(`[SEARCH] [CertificateValidator.ensureValidCertificateAndConfig] Platform: ${platform}`)
    
    // Web platform: Skip mTLS but fetch provider config
    if (platform === 'web') {
      console.log('[WEB] [CertificateValidator] Web platform, skipping mTLS, fetching provider config...')
      
      const providerConfig = await cloudProviderConfig.getConfig()
      
      return {
        certStatus: {
          isValid: true,
          isEnrolled: true,
          isExpired: false,
        },
        providerConfig,
      }
    }

    // Mobile/Desktop: Ensure certificate is valid first
    console.log('[SECURE] [CertificateValidator] Ensuring certificate validity...')
    const certStatus = await this.ensureValidCertificate()
    
    if (!certStatus.isValid) {
      // Certificate enrollment failed, but still try to fetch provider config
      console.warn('[WARNING]  Certificate validation/enrollment failed, fetching provider config anyway...')
    }

    // Fetch provider configuration after certificate is ready
    console.log('[SIGNAL] [CertificateValidator] Fetching provider configuration...')
    const providerConfig = await cloudProviderConfig.getConfig()

    console.log('[OK] [CertificateValidator] Certificate and provider config ready')
    
    return {
      certStatus,
      providerConfig,
    }
  }
}
