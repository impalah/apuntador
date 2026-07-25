/**
 * Normalized enrollment contract shared by all platform strategies.
 *
 * unifiedMTLSService used to repeat an `if (platform === 'android') / else if
 * ('ios') / else if ('desktop') / else` block in every public method, with
 * each branch mapping a differently-shaped platform result (e.g. iOS uses
 * `deviceId`/`alreadyEnrolled`, desktop uses `device_id`/`already_enrolled`)
 * by hand. A PlatformEnrollmentStrategy normalizes that shape once per
 * platform so unifiedMTLSService can resolve the strategy a single time and
 * delegate without repeating the switch.
 */

import { BACKEND_OAUTH_URL } from '@/config/api'

export type HsmType = 'Android Keystore' | 'Secure Enclave' | 'macOS Keychain' | 'None'

export interface EnrollmentStrategyStatus {
  enrolled: boolean
  deviceId?: string
  deviceModel?: string
  osVersion?: string
  hasHSM: boolean
  hsmType: HsmType
}

export interface EnrollmentStrategyResult {
  success: boolean
  enrolled: boolean
  deviceId?: string
  certificateSize?: number
  alreadyEnrolled?: boolean
  error?: string
}

export interface PlatformEnrollmentStrategy {
  checkStatus(): Promise<EnrollmentStrategyStatus>
  ensureEnrolled(): Promise<EnrollmentStrategyResult>
  forceReEnroll(): Promise<EnrollmentStrategyResult>
  deleteAllCredentials(): Promise<void>
}

/**
 * Resolves the backend URL with the project's standard priority order
 * (platform-specific dev override > generic dev override > prod override >
 * the centralized constant). Previously duplicated by hand in three places
 * (unifiedMTLSService's Android branches and iosSecureEnclaveService).
 */
export function resolveBackendUrl(platformDevUrl?: string): string {
  return (
    platformDevUrl ||
    import.meta.env.VITE_BACKEND_OAUTH_URL_DEV ||
    import.meta.env.VITE_BACKEND_OAUTH_URL_PROD ||
    BACKEND_OAUTH_URL
  )
}
