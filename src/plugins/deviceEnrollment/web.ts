import { WebPlugin } from '@capacitor/core'

import type {
  DeviceEnrollmentPlugin,
  DeviceInfo,
  EnrollmentResult,
  EnrollmentStatus,
  EnrollmentOptions,
  UnenrollOptions,
} from './index'

/**
 * Implementación web stub del plugin DeviceEnrollment.
 * 
 * El enrollment con HSM solo está disponible en plataformas móviles nativas
 * (Android con StrongBox/TEE, iOS con Secure Enclave).
 * 
 * En web, se puede usar OAuth 2.0 + PKCE en su lugar.
 */
export class DeviceEnrollmentWeb extends WebPlugin implements DeviceEnrollmentPlugin {
  async getDeviceInfo(): Promise<DeviceInfo> {
    throw this.unavailable('Device enrollment with HSM is only available on native platforms (Android/iOS)')
  }

  async enrollDevice(_options: EnrollmentOptions): Promise<EnrollmentResult> {
    throw this.unavailable('Device enrollment with HSM is only available on native platforms (Android/iOS)')
  }

  async checkEnrollmentStatus(): Promise<EnrollmentStatus> {
    throw this.unavailable('Device enrollment with HSM is only available on native platforms (Android/iOS)')
  }

  async unenrollDevice(_options?: UnenrollOptions): Promise<{ success: boolean }> {
    throw this.unavailable('Device enrollment with HSM is only available on native platforms (Android/iOS)')
  }
}
