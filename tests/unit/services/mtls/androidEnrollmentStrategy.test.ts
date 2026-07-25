import { describe, it, expect, vi, beforeEach } from 'vitest'

const getDeviceInfo = vi.fn()
const checkEnrollmentStatus = vi.fn()
const enrollDevice = vi.fn()
const unenrollDevice = vi.fn()

vi.mock('@/plugins/deviceEnrollment', () => ({
  default: {
    getDeviceInfo: (...args: unknown[]) => getDeviceInfo(...args),
    checkEnrollmentStatus: (...args: unknown[]) => checkEnrollmentStatus(...args),
    enrollDevice: (...args: unknown[]) => enrollDevice(...args),
    unenrollDevice: (...args: unknown[]) => unenrollDevice(...args),
  },
}))

vi.mock('@/services/mtls/enrollmentStrategy', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/mtls/enrollmentStrategy')>()
  return {
    ...actual,
    resolveBackendUrl: vi.fn(() => 'https://backend.example.com'),
  }
})

import { AndroidEnrollmentStrategy } from '@/services/mtls/androidEnrollmentStrategy'

describe('AndroidEnrollmentStrategy', () => {
  let strategy: AndroidEnrollmentStrategy

  beforeEach(() => {
    vi.clearAllMocks()
    strategy = new AndroidEnrollmentStrategy()
  })

  describe('checkStatus', () => {
    it('normalizes StrongBox-backed device info into the shared DTO', async () => {
      getDeviceInfo.mockResolvedValue({
        deviceId: 'device-123',
        model: 'Pixel 8',
        androidVersion: '14',
        hasStrongBox: true,
        hasTEE: true,
      })
      checkEnrollmentStatus.mockResolvedValue({ isEnrolled: true })

      const status = await strategy.checkStatus()

      expect(status).toEqual({
        enrolled: true,
        deviceId: 'device-123',
        deviceModel: 'Pixel 8',
        osVersion: '14',
        hasHSM: true,
        hsmType: 'Android Keystore',
      })
    })

    it('reports no HSM when neither StrongBox nor TEE is available', async () => {
      getDeviceInfo.mockResolvedValue({
        deviceId: 'device-456',
        model: 'Generic Android',
        androidVersion: '10',
        hasStrongBox: false,
        hasTEE: false,
      })
      checkEnrollmentStatus.mockResolvedValue({ isEnrolled: false })

      const status = await strategy.checkStatus()

      expect(status.hasHSM).toBe(false)
      expect(status.hsmType).toBe('None')
      expect(status.enrolled).toBe(false)
    })
  })

  describe('ensureEnrolled', () => {
    it('enrolls using StrongBox and returns the normalized result', async () => {
      enrollDevice.mockResolvedValue({
        success: true,
        deviceId: 'device-123',
        alreadyEnrolled: false,
      })

      const result = await strategy.ensureEnrolled()

      expect(enrollDevice).toHaveBeenCalledWith({
        backendUrl: 'https://backend.example.com',
        useStrongBox: true,
      })
      expect(result).toEqual({
        success: true,
        enrolled: true,
        deviceId: 'device-123',
        alreadyEnrolled: false,
      })
    })
  })

  describe('forceReEnroll', () => {
    it('unenrolls before enrolling again', async () => {
      enrollDevice.mockResolvedValue({ success: true, deviceId: 'device-789' })

      const result = await strategy.forceReEnroll()

      expect(unenrollDevice).toHaveBeenCalledOnce()
      expect(enrollDevice).toHaveBeenCalledOnce()
      expect(result).toEqual({
        success: true,
        enrolled: true,
        deviceId: 'device-789',
      })
    })
  })

  describe('deleteAllCredentials', () => {
    it('delegates to the plugin unenroll', async () => {
      await strategy.deleteAllCredentials()
      expect(unenrollDevice).toHaveBeenCalledOnce()
    })
  })
})
