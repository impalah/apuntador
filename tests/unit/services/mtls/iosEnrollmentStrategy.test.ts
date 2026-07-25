import { describe, it, expect, vi, beforeEach } from 'vitest'

const checkEnrollmentStatus = vi.fn()
const ensureEnrolled = vi.fn()
const forceReEnroll = vi.fn()
const deleteAllCredentials = vi.fn()

vi.mock('@/services/iosSecureEnclaveService', () => ({
  iosSecureEnclaveService: {
    checkEnrollmentStatus: (...args: unknown[]) => checkEnrollmentStatus(...args),
    ensureEnrolled: (...args: unknown[]) => ensureEnrolled(...args),
    forceReEnroll: (...args: unknown[]) => forceReEnroll(...args),
    deleteAllCredentials: (...args: unknown[]) => deleteAllCredentials(...args),
  },
}))

import { IOSEnrollmentStrategy } from '@/services/mtls/iosEnrollmentStrategy'

describe('IOSEnrollmentStrategy', () => {
  let strategy: IOSEnrollmentStrategy

  beforeEach(() => {
    vi.clearAllMocks()
    strategy = new IOSEnrollmentStrategy()
  })

  describe('checkStatus', () => {
    it('normalizes Secure Enclave availability into the shared DTO', async () => {
      checkEnrollmentStatus.mockResolvedValue({
        enrolled: true,
        deviceId: 'ios-device',
        deviceModel: 'iPhone 15',
        osVersion: '17.0',
        hasSecureEnclave: true,
      })

      const status = await strategy.checkStatus()

      expect(status).toEqual({
        enrolled: true,
        deviceId: 'ios-device',
        deviceModel: 'iPhone 15',
        osVersion: '17.0',
        hasHSM: true,
        hsmType: 'Secure Enclave',
      })
    })

    it('reports no HSM when Secure Enclave is unavailable', async () => {
      checkEnrollmentStatus.mockResolvedValue({
        enrolled: false,
        deviceId: 'ios-device',
        deviceModel: 'iPhone SE',
        osVersion: '17.0',
        hasSecureEnclave: false,
      })

      const status = await strategy.checkStatus()

      expect(status.hasHSM).toBe(false)
      expect(status.hsmType).toBe('None')
    })
  })

  it('ensureEnrolled forwards the underlying service result', async () => {
    ensureEnrolled.mockResolvedValue({
      success: true,
      enrolled: true,
      deviceId: 'ios-device',
      certificateSize: 1024,
      alreadyEnrolled: false,
    })

    const result = await strategy.ensureEnrolled()

    expect(result).toEqual({
      success: true,
      enrolled: true,
      deviceId: 'ios-device',
      certificateSize: 1024,
      alreadyEnrolled: false,
      error: undefined,
    })
  })

  it('forceReEnroll forwards the underlying service result', async () => {
    forceReEnroll.mockResolvedValue({
      success: false,
      enrolled: false,
      error: 'Secure Enclave not available on this device',
    })

    const result = await strategy.forceReEnroll()

    expect(result).toEqual({
      success: false,
      enrolled: false,
      deviceId: undefined,
      certificateSize: undefined,
      error: 'Secure Enclave not available on this device',
    })
  })

  it('deleteAllCredentials delegates to the underlying service', async () => {
    await strategy.deleteAllCredentials()
    expect(deleteAllCredentials).toHaveBeenCalledOnce()
  })
})
