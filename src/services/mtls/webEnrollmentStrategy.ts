import type {
  EnrollmentStrategyResult,
  EnrollmentStrategyStatus,
  PlatformEnrollmentStrategy,
} from './enrollmentStrategy'

/**
 * Web uses OAuth 2.0 + PKCE instead of mTLS, so there's nothing to enroll.
 */
export class WebEnrollmentStrategy implements PlatformEnrollmentStrategy {
  async checkStatus(): Promise<EnrollmentStrategyStatus> {
    return {
      enrolled: false,
      hasHSM: false,
      hsmType: 'None',
    }
  }

  async ensureEnrolled(): Promise<EnrollmentStrategyResult> {
    return {
      success: true,
      enrolled: false,
    }
  }

  async forceReEnroll(): Promise<EnrollmentStrategyResult> {
    return {
      success: false,
      enrolled: false,
      error: 'Web platform does not support mTLS',
    }
  }

  async deleteAllCredentials(): Promise<void> {
    // No credentials to delete on web.
  }
}
