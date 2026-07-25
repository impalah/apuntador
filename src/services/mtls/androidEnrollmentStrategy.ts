import DeviceEnrollment from '@/plugins/deviceEnrollment'
import type {
  EnrollmentStrategyResult,
  EnrollmentStrategyStatus,
  PlatformEnrollmentStrategy,
} from './enrollmentStrategy'
import { resolveBackendUrl } from './enrollmentStrategy'

/**
 * Android enrollment via the Android Keystore (TEE/StrongBox), through the
 * DeviceEnrollment Capacitor plugin. Unlike iOS/desktop, Android had no
 * dedicated service wrapping its plugin before this strategy - the plugin
 * was called directly from unifiedMTLSService.
 */
export class AndroidEnrollmentStrategy implements PlatformEnrollmentStrategy {
  async checkStatus(): Promise<EnrollmentStrategyStatus> {
    const [info, status] = await Promise.all([
      DeviceEnrollment.getDeviceInfo(),
      DeviceEnrollment.checkEnrollmentStatus(),
    ])

    const hasHSM = info.hasStrongBox || info.hasTEE

    return {
      enrolled: status.isEnrolled,
      deviceId: info.deviceId,
      deviceModel: info.model,
      osVersion: info.androidVersion,
      hasHSM,
      hsmType: hasHSM ? 'Android Keystore' : 'None',
    }
  }

  async ensureEnrolled(): Promise<EnrollmentStrategyResult> {
    const result = await DeviceEnrollment.enrollDevice({
      backendUrl: resolveBackendUrl(),
      useStrongBox: true,
    })

    return {
      success: result.success,
      enrolled: true,
      deviceId: result.deviceId,
      alreadyEnrolled: result.alreadyEnrolled,
    }
  }

  async forceReEnroll(): Promise<EnrollmentStrategyResult> {
    await DeviceEnrollment.unenrollDevice()

    const result = await DeviceEnrollment.enrollDevice({
      backendUrl: resolveBackendUrl(),
      useStrongBox: true,
    })

    return {
      success: result.success,
      enrolled: true,
      deviceId: result.deviceId,
    }
  }

  async deleteAllCredentials(): Promise<void> {
    await DeviceEnrollment.unenrollDevice()
  }
}
