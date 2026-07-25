import { iosSecureEnclaveService } from '../iosSecureEnclaveService'
import type {
  EnrollmentStrategyResult,
  EnrollmentStrategyStatus,
  PlatformEnrollmentStrategy,
} from './enrollmentStrategy'

/**
 * Thin adapter over iosSecureEnclaveService, normalizing its shape to the
 * shared PlatformEnrollmentStrategy contract. The service itself is left
 * untouched beyond centralizing its backend URL resolution - it has two
 * hardware-dependent enrollment paths (Capacitor plugin vs native WebKit
 * bridge) that aren't practical to verify without a physical iOS device, so
 * this refactor deliberately doesn't touch that logic.
 */
export class IOSEnrollmentStrategy implements PlatformEnrollmentStrategy {
  async checkStatus(): Promise<EnrollmentStrategyStatus> {
    const status = await iosSecureEnclaveService.checkEnrollmentStatus()

    return {
      enrolled: status.enrolled,
      deviceId: status.deviceId,
      deviceModel: status.deviceModel,
      osVersion: status.osVersion,
      hasHSM: !!status.hasSecureEnclave,
      hsmType: status.hasSecureEnclave ? 'Secure Enclave' : 'None',
    }
  }

  async ensureEnrolled(): Promise<EnrollmentStrategyResult> {
    const result = await iosSecureEnclaveService.ensureEnrolled()
    return {
      success: result.success,
      enrolled: result.enrolled,
      deviceId: result.deviceId,
      certificateSize: result.certificateSize,
      alreadyEnrolled: result.alreadyEnrolled,
      error: result.error,
    }
  }

  async forceReEnroll(): Promise<EnrollmentStrategyResult> {
    const result = await iosSecureEnclaveService.forceReEnroll()
    return {
      success: result.success,
      enrolled: result.enrolled,
      deviceId: result.deviceId,
      certificateSize: result.certificateSize,
      error: result.error,
    }
  }

  async deleteAllCredentials(): Promise<void> {
    await iosSecureEnclaveService.deleteAllCredentials()
  }
}
