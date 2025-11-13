import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Capacitor } from '@capacitor/core'

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(() => 'web'),
  },
}))

// Mock window.location
const mockLocation = {
  origin: 'http://localhost:3000',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('services/oauth/config.android.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAndroidBackendUrl()', () => {
    it('should return a valid backend URL', async () => {
      const { getAndroidBackendUrl } = await import('@/services/oauth/config.android')
      const url = getAndroidBackendUrl()
      
      expect(typeof url).toBe('string')
      expect(url).toMatch(/^https?:\/\//)
    })
  })

  describe('getAndroidRedirectUri()', () => {
    it('should return Android deep link URI', async () => {
      const { getAndroidRedirectUri } = await import('@/services/oauth/config.android')
      const uri = getAndroidRedirectUri()
      
      expect(uri).toBe('apuntador://oauth-callback')
    })
  })

  describe('getPlatformBackendUrl()', () => {
    it('should return Android backend URL when on Android platform', async () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      
      const { getPlatformBackendUrl } = await import('@/services/oauth/config.android')
      const url = getPlatformBackendUrl()
      
      expect(typeof url).toBe('string')
      expect(url).toMatch(/^https?:\/\//)
    })

    it('should return web backend URL when on web platform', async () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web')
      
      const { getPlatformBackendUrl } = await import('@/services/oauth/config.android')
      const url = getPlatformBackendUrl()
      
      expect(typeof url).toBe('string')
      expect(url).toMatch(/^https?:\/\//)
    })

    it('should call Capacitor.getPlatform()', async () => {
      const { getPlatformBackendUrl } = await import('@/services/oauth/config.android')
      getPlatformBackendUrl()
      
      expect(Capacitor.getPlatform).toHaveBeenCalled()
    })
  })

  describe('getPlatformRedirectUri()', () => {
    it('should return Android deep link when on Android platform', async () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
      
      const { getPlatformRedirectUri } = await import('@/services/oauth/config.android')
      const uri = getPlatformRedirectUri()
      
      expect(uri).toBe('apuntador://oauth-callback')
    })

    it('should return web OAuth callback URL when on web platform', async () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('web')
      
      const { getPlatformRedirectUri } = await import('@/services/oauth/config.android')
      const uri = getPlatformRedirectUri()
      
      expect(uri).toBe('http://localhost:3000/oauth-callback')
    })

    it('should call Capacitor.getPlatform()', async () => {
      const { getPlatformRedirectUri } = await import('@/services/oauth/config.android')
      getPlatformRedirectUri()
      
      expect(Capacitor.getPlatform).toHaveBeenCalled()
    })
  })
})
