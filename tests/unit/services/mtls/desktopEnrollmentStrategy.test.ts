import { describe, it, expect, vi, beforeEach } from 'vitest'

const checkEnrollmentStatus = vi.fn()
const getDeviceInfo = vi.fn()
const ensureEnrolled = vi.fn()
const forceReEnroll = vi.fn()
const unenrollDevice = vi.fn()

vi.mock('@/services/desktopEnrollmentService', () => ({
  desktopEnrollmentService: {
    checkEnrollmentStatus: (...args: unknown[]) => checkEnrollmentStatus(...args),
    getDeviceInfo: (...args: unknown[]) => getDeviceInfo(...args),
    ensureEnrolled: (...args: unknown[]) => ensureEnrolled(...args),
    forceReEnroll: (...args: unknown[]) => forceReEnroll(...args),
    unenrollDevice: (...args: unknown[]) => unenrollDevice(...args),
  },
}))

import { DesktopEnrollmentStrategy } from '@/services/mtls/desktopEnrollmentStrategy'

describe('DesktopEnrollmentStrategy', () => {
  let strategy: DesktopEnrollmentStrategy

  beforeEach(() => {
    vi.clearAllMocks()
    strategy = new DesktopEnrollmentStrategy()
  })

  describe('checkStatus', () => {
    it('normalizes the snake_case Tauri result and flags macOS Keychain as HSM', async () => {
      checkEnrollmentStatus.mockResolvedValue({
        success: true,
        enrolled: true,
        device_id: 'desktop-abc',
        already_enrolled: true,
      })
      getDeviceInfo.mockResolvedValue({
        device_id: 'desktop-abc',
        platform: 'macos',
        device_model: 'MacBook Pro',
        os_version: '14.0',
        has_certificate: true,
      })

      const status = await strategy.checkStatus()

      expect(status).toEqual({
        enrolled: true,
        deviceId: 'desktop-abc',
        deviceModel: 'MacBook Pro',
        osVersion: '14.0',
        hasHSM: true,
        hsmType: 'macOS Keychain',
      })
    })

    it('reports no HSM on Windows/Linux', async () => {
      checkEnrollmentStatus.mockResolvedValue({
        success: true,
        enrolled: true,
        device_id: 'desktop-win',
        already_enrolled: true,
      })
      getDeviceInfo.mockResolvedValue({
        device_id: 'desktop-win',
        platform: 'windows',
        device_model: 'Surface',
        os_version: '11',
        has_certificate: true,
      })

      const status = await strategy.checkStatus()

      expect(status.hasHSM).toBe(false)
      expect(status.hsmType).toBe('None')
    })
  })

  it('ensureEnrolled maps device_id/already_enrolled to the shared DTO', async () => {
    ensureEnrolled.mockResolvedValue({
      success: true,
      enrolled: true,
      device_id: 'desktop-abc',
      already_enrolled: false,
    })

    const result = await strategy.ensureEnrolled()

    expect(result).toEqual({
      success: true,
      enrolled: true,
      deviceId: 'desktop-abc',
      alreadyEnrolled: false,
      error: undefined,
    })
  })

  it('forceReEnroll maps device_id to the shared DTO', async () => {
    forceReEnroll.mockResolvedValue({
      success: true,
      enrolled: true,
      device_id: 'desktop-abc',
      already_enrolled: false,
    })

    const result = await strategy.forceReEnroll()

    expect(result).toEqual({
      success: true,
      enrolled: true,
      deviceId: 'desktop-abc',
      error: undefined,
    })
  })

  it('deleteAllCredentials delegates to unenrollDevice', async () => {
    await strategy.deleteAllCredentials()
    expect(unenrollDevice).toHaveBeenCalledOnce()
  })
})
