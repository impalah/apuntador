import { describe, it, expect, vi, beforeEach } from 'vitest'

const getPlatform = vi.fn(() => 'web')
const isTauri = vi.fn(() => false)

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => getPlatform(),
  },
}))

vi.mock('@/utils/tauri', () => ({
  isTauri: () => isTauri(),
}))

const androidCheckStatus = vi.fn()
const androidEnsureEnrolled = vi.fn()
const androidForceReEnroll = vi.fn()
const androidDeleteAll = vi.fn()

vi.mock('@/services/mtls/androidEnrollmentStrategy', () => ({
  AndroidEnrollmentStrategy: vi.fn().mockImplementation(function AndroidEnrollmentStrategy() {
    return {
      checkStatus: androidCheckStatus,
      ensureEnrolled: androidEnsureEnrolled,
      forceReEnroll: androidForceReEnroll,
      deleteAllCredentials: androidDeleteAll,
    }
  }),
}))

const iosCheckStatus = vi.fn()
vi.mock('@/services/mtls/iosEnrollmentStrategy', () => ({
  IOSEnrollmentStrategy: vi.fn().mockImplementation(function IOSEnrollmentStrategy() {
    return {
      checkStatus: iosCheckStatus,
      ensureEnrolled: vi.fn(),
      forceReEnroll: vi.fn(),
      deleteAllCredentials: vi.fn(),
    }
  }),
}))

const desktopCheckStatus = vi.fn()
vi.mock('@/services/mtls/desktopEnrollmentStrategy', () => ({
  DesktopEnrollmentStrategy: vi.fn().mockImplementation(function DesktopEnrollmentStrategy() {
    return {
      checkStatus: desktopCheckStatus,
      ensureEnrolled: vi.fn(),
      forceReEnroll: vi.fn(),
      deleteAllCredentials: vi.fn(),
    }
  }),
}))

const webCheckStatus = vi.fn()
vi.mock('@/services/mtls/webEnrollmentStrategy', () => ({
  WebEnrollmentStrategy: vi.fn().mockImplementation(function WebEnrollmentStrategy() {
    return {
      checkStatus: webCheckStatus,
      ensureEnrolled: vi.fn(),
      forceReEnroll: vi.fn(),
      deleteAllCredentials: vi.fn(),
    }
  }),
}))

describe('UnifiedMTLSService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    getPlatform.mockReturnValue('web')
    isTauri.mockReturnValue(false)
  })

  it('resolves the Android strategy on Android', async () => {
    getPlatform.mockReturnValue('android')
    const { AndroidEnrollmentStrategy } = await import(
      '@/services/mtls/androidEnrollmentStrategy'
    )
    const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')

    const service = UnifiedMTLSService.getInstance()

    expect(service.getPlatform()).toBe('android')
    expect(AndroidEnrollmentStrategy).toHaveBeenCalledOnce()
  })

  it('resolves the iOS strategy on iOS', async () => {
    getPlatform.mockReturnValue('ios')
    const { IOSEnrollmentStrategy } = await import('@/services/mtls/iosEnrollmentStrategy')
    const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')

    const service = UnifiedMTLSService.getInstance()

    expect(service.getPlatform()).toBe('ios')
    expect(IOSEnrollmentStrategy).toHaveBeenCalledOnce()
  })

  it('resolves the desktop strategy under Tauri regardless of Capacitor platform', async () => {
    isTauri.mockReturnValue(true)
    getPlatform.mockReturnValue('web')
    const { DesktopEnrollmentStrategy } = await import(
      '@/services/mtls/desktopEnrollmentStrategy'
    )
    const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')

    const service = UnifiedMTLSService.getInstance()

    expect(service.getPlatform()).toBe('desktop')
    expect(DesktopEnrollmentStrategy).toHaveBeenCalledOnce()
  })

  it('falls back to the web strategy for anything else', async () => {
    getPlatform.mockReturnValue('electron') // not android/ios, and not Tauri
    const { WebEnrollmentStrategy } = await import('@/services/mtls/webEnrollmentStrategy')
    const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')

    const service = UnifiedMTLSService.getInstance()

    expect(service.getPlatform()).toBe('web')
    expect(WebEnrollmentStrategy).toHaveBeenCalledOnce()
  })

  it('getInstance() returns the same singleton on repeated calls', async () => {
    const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')
    expect(UnifiedMTLSService.getInstance()).toBe(UnifiedMTLSService.getInstance())
  })

  describe('supportsHSM / supportsMTLS', () => {
    it('android and iOS support HSM and mTLS', async () => {
      getPlatform.mockReturnValue('android')
      const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')
      const service = UnifiedMTLSService.getInstance()
      expect(service.supportsHSM()).toBe(true)
      expect(service.supportsMTLS()).toBe(true)
    })

    it('desktop supports mTLS but not HSM', async () => {
      isTauri.mockReturnValue(true)
      const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')
      const service = UnifiedMTLSService.getInstance()
      expect(service.supportsHSM()).toBe(false)
      expect(service.supportsMTLS()).toBe(true)
    })

    it('web supports neither', async () => {
      const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')
      const service = UnifiedMTLSService.getInstance()
      expect(service.supportsHSM()).toBe(false)
      expect(service.supportsMTLS()).toBe(false)
    })
  })

  it('checkEnrollmentStatus merges the platform into the strategy status', async () => {
    getPlatform.mockReturnValue('android')
    androidCheckStatus.mockResolvedValue({
      enrolled: true,
      deviceId: 'device-1',
      hasHSM: true,
      hsmType: 'Android Keystore',
    })

    const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')
    const service = UnifiedMTLSService.getInstance()

    const status = await service.checkEnrollmentStatus()

    expect(status).toEqual({
      platform: 'android',
      enrolled: true,
      deviceId: 'device-1',
      hasHSM: true,
      hsmType: 'Android Keystore',
    })
  })

  it('ensureEnrolled merges the platform into the strategy result', async () => {
    getPlatform.mockReturnValue('android')
    androidEnsureEnrolled.mockResolvedValue({
      success: true,
      enrolled: true,
      deviceId: 'device-1',
      alreadyEnrolled: false,
    })

    const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')
    const service = UnifiedMTLSService.getInstance()

    const result = await service.ensureEnrolled()

    expect(result).toEqual({
      platform: 'android',
      success: true,
      enrolled: true,
      deviceId: 'device-1',
      alreadyEnrolled: false,
    })
  })

  it('forceReEnroll merges the platform into the strategy result', async () => {
    getPlatform.mockReturnValue('android')
    androidForceReEnroll.mockResolvedValue({
      success: true,
      enrolled: true,
      deviceId: 'device-1',
    })

    const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')
    const service = UnifiedMTLSService.getInstance()

    const result = await service.forceReEnroll()

    expect(result).toEqual({
      platform: 'android',
      success: true,
      enrolled: true,
      deviceId: 'device-1',
    })
  })

  it('deleteAllCredentials delegates to the resolved strategy', async () => {
    getPlatform.mockReturnValue('android')
    const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')
    const service = UnifiedMTLSService.getInstance()

    await service.deleteAllCredentials()

    expect(androidDeleteAll).toHaveBeenCalledOnce()
  })

  it('getDeviceInfo delegates to checkEnrollmentStatus', async () => {
    getPlatform.mockReturnValue('desktop')
    isTauri.mockReturnValue(true)
    desktopCheckStatus.mockResolvedValue({
      enrolled: true,
      deviceId: 'desktop-1',
      hasHSM: true,
      hsmType: 'macOS Keychain',
    })

    const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')
    const service = UnifiedMTLSService.getInstance()

    const info = await service.getDeviceInfo()
    expect(info.deviceId).toBe('desktop-1')
  })

  it('getHSMType returns the resolved hsmType, defaulting to None', async () => {
    getPlatform.mockReturnValue('web')
    webCheckStatus.mockResolvedValue({ enrolled: false, hasHSM: false, hsmType: 'None' })

    const { UnifiedMTLSService } = await import('@/services/unifiedMTLSService')
    const service = UnifiedMTLSService.getInstance()

    expect(await service.getHSMType()).toBe('None')
  })

  it('useUnifiedMTLS() exposes the platform and delegates to the singleton', async () => {
    getPlatform.mockReturnValue('web')
    webCheckStatus.mockResolvedValue({ enrolled: false, hasHSM: false, hsmType: 'None' })

    const { useUnifiedMTLS } = await import('@/services/unifiedMTLSService')
    const hook = useUnifiedMTLS()

    expect(hook.platform).toBe('web')
    expect(hook.supportsHSM).toBe(false)
    const status = await hook.checkStatus()
    expect(status.platform).toBe('web')
  })
})
