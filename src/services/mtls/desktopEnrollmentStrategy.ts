import { desktopEnrollmentService } from '../desktopEnrollmentService'
import type {
  EnrollmentStrategyResult,
  EnrollmentStrategyStatus,
  PlatformEnrollmentStrategy,
} from './enrollmentStrategy'

/**
 * Thin adapter over desktopEnrollmentService (Tauri), normalizing its
 * snake_case Rust-command shape (device_id, already_enrolled) to the shared
 * camelCase PlatformEnrollmentStrategy contract.
 */
export class DesktopEnrollmentStrategy implements PlatformEnrollmentStrategy {
  async checkStatus(): Promise<EnrollmentStrategyStatus> {
    const [status, deviceInfo] = await Promise.all([
      desktopEnrollmentService.checkEnrollmentStatus(),
      desktopEnrollmentService.getDeviceInfo(),
    ])

    const hasHSM = deviceInfo.platform === 'macos' // macOS Keychain (partial HSM)

    return {
      enrolled: status.enrolled,
      deviceId: status.device_id,
      deviceModel: deviceInfo.device_model,
      osVersion: deviceInfo.os_version,
      hasHSM,
      hsmType: hasHSM ? 'macOS Keychain' : 'None',
    }
  }

  async ensureEnrolled(): Promise<EnrollmentStrategyResult> {
    const result = await desktopEnrollmentService.ensureEnrolled()
    return {
      success: result.success,
      enrolled: result.enrolled,
      deviceId: result.device_id,
      alreadyEnrolled: result.already_enrolled,
      error: result.error,
    }
  }

  async forceReEnroll(): Promise<EnrollmentStrategyResult> {
    const result = await desktopEnrollmentService.forceReEnroll()
    return {
      success: result.success,
      enrolled: result.enrolled,
      deviceId: result.device_id,
      error: result.error,
    }
  }

  async deleteAllCredentials(): Promise<void> {
    await desktopEnrollmentService.unenrollDevice()
  }
}
