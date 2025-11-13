import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Capacitor } from '@capacitor/core'

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn(() => 'web'),
    isNativePlatform: vi.fn(() => false),
  },
}))

// Mock tauri
vi.mock('@/utils/tauri', () => ({
  isTauri: vi.fn(() => false),
}))

// Mock BACKEND_OAUTH_URL import
vi.mock('@/config/api', () => ({
  BACKEND_OAUTH_URL: 'https://api.apuntador.io',
}))

describe('services/oauth/config.ts', () => {
  // Guardar env original
  const originalEnv = { ...import.meta.env }
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    // Restaurar env original
    Object.keys(import.meta.env).forEach(key => {
      if (!(key in originalEnv)) {
        delete import.meta.env[key]
      }
    })
    Object.assign(import.meta.env, originalEnv)
  })

  describe('getBackendUrl()', () => {
    it('should return a valid backend URL', async () => {
      const { getBackendUrl } = await import('@/services/oauth/config')
      const url = getBackendUrl()
      
      expect(typeof url).toBe('string')
      expect(url).toMatch(/^https?:\/\//)
    })

    it('should call Capacitor.getPlatform()', async () => {
      const { getBackendUrl } = await import('@/services/oauth/config')
      getBackendUrl()
      
      expect(Capacitor.getPlatform).toHaveBeenCalled()
    })
  })

  describe('getOAuthRedirectUri()', () => {
    it('should return a valid redirect URI', async () => {
      const { getOAuthRedirectUri } = await import('@/services/oauth/config')
      const uri = getOAuthRedirectUri()
      
      expect(typeof uri).toBe('string')
      expect(uri.length).toBeGreaterThan(0)
    })

    it('should return URI with valid protocol', async () => {
      const { getOAuthRedirectUri } = await import('@/services/oauth/config')
      const uri = getOAuthRedirectUri()
      
      // Should be http://, https://, or custom scheme like apuntador://
      expect(uri).toMatch(/^[a-z]+:\/\//)
    })
  })

  describe('OAUTH_URLS', () => {
    it('should have development URLs', async () => {
      const { OAUTH_URLS } = await import('@/services/oauth/config')
      
      expect(OAUTH_URLS.development).toHaveProperty('backend')
      expect(OAUTH_URLS.development).toHaveProperty('redirect')
      expect(typeof OAUTH_URLS.development.backend).toBe('string')
      expect(typeof OAUTH_URLS.development.redirect).toBe('string')
    })

    it('should have production URLs', async () => {
      const { OAUTH_URLS } = await import('@/services/oauth/config')
      
      expect(OAUTH_URLS.production).toHaveProperty('backend')
      expect(OAUTH_URLS.production).toHaveProperty('redirect')
      expect(typeof OAUTH_URLS.production.backend).toBe('string')
      expect(typeof OAUTH_URLS.production.redirect).toBe('string')
    })

    it('should have native URLs', async () => {
      const { OAUTH_URLS } = await import('@/services/oauth/config')
      
      expect(OAUTH_URLS.native).toHaveProperty('backend')
      expect(OAUTH_URLS.native).toHaveProperty('redirect')
      expect(typeof OAUTH_URLS.native.backend).toBe('string')
      expect(typeof OAUTH_URLS.native.redirect).toBe('string')
    })

    it('should have valid URL formats', async () => {
      const { OAUTH_URLS } = await import('@/services/oauth/config')
      
      expect(OAUTH_URLS.development.backend).toMatch(/^https?:\/\//)
      expect(OAUTH_URLS.development.redirect).toMatch(/^[a-z]+:\/\//)
      expect(OAUTH_URLS.production.backend).toMatch(/^https:\/\//)
      expect(OAUTH_URLS.production.redirect).toMatch(/^[a-z]+:\/\//)
      expect(OAUTH_URLS.native.backend).toMatch(/^https:\/\//)
      expect(OAUTH_URLS.native.redirect).toMatch(/^[a-z]+:\/\//)
    })
  })
})
