import { describe, it, expect } from 'vitest'
import { GOOGLE_DRIVE_CONFIG, GOOGLE_API_URLS, OAUTH_URLS } from '@/services/googledrive/config'

describe('services/googledrive/config.ts', () => {
  describe('GOOGLE_DRIVE_CONFIG', () => {
    it('should have empty clientId (backend handles it)', () => {
      expect(GOOGLE_DRIVE_CONFIG.clientId).toBe('')
    })

    it('should have undefined clientSecret', () => {
      expect(GOOGLE_DRIVE_CONFIG.clientSecret).toBeUndefined()
    })

    it('should have redirectUri for native app', () => {
      expect(GOOGLE_DRIVE_CONFIG.redirectUri).toBe('apuntador://oauth-callback')
    })

    it('should have correct Google Drive scope', () => {
      expect(GOOGLE_DRIVE_CONFIG.scope).toBe('https://www.googleapis.com/auth/drive')
    })

    it('should have all required OAuthConfig properties', () => {
      expect(GOOGLE_DRIVE_CONFIG).toHaveProperty('clientId')
      expect(GOOGLE_DRIVE_CONFIG).toHaveProperty('clientSecret')
      expect(GOOGLE_DRIVE_CONFIG).toHaveProperty('redirectUri')
      expect(GOOGLE_DRIVE_CONFIG).toHaveProperty('scope')
    })
  })

  describe('GOOGLE_API_URLS (re-export)', () => {
    it('should re-export Google API URLs from config/api', () => {
      expect(GOOGLE_API_URLS).toBeDefined()
      expect(GOOGLE_API_URLS).toHaveProperty('drive')
      expect(GOOGLE_API_URLS).toHaveProperty('upload')
      expect(GOOGLE_API_URLS).toHaveProperty('content')
    })

    it('should have correct URL structure', () => {
      expect(GOOGLE_API_URLS.drive).toMatch(/^https:\/\//)
      expect(GOOGLE_API_URLS.upload).toMatch(/^https:\/\//)
      expect(GOOGLE_API_URLS.content).toMatch(/^https:\/\//)
    })
  })

  describe('OAUTH_URLS', () => {
    it('should have development URL', () => {
      expect(OAUTH_URLS).toHaveProperty('development')
      expect(typeof OAUTH_URLS.development).toBe('string')
    })

    it('should have production URL', () => {
      expect(OAUTH_URLS).toHaveProperty('production')
      expect(typeof OAUTH_URLS.production).toBe('string')
    })

    it('should have native URL', () => {
      expect(OAUTH_URLS).toHaveProperty('native')
      expect(typeof OAUTH_URLS.native).toBe('string')
    })

    it('should have valid URL formats', () => {
      expect(OAUTH_URLS.development).toMatch(/^https?:\/\//)
      expect(OAUTH_URLS.production).toMatch(/^https:\/\//)
      expect(OAUTH_URLS.native).toMatch(/^[a-z]+:\/\//)
    })
  })
})
