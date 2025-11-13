import { describe, it, expect } from 'vitest'
import { GOOGLE_API_URLS, DROPBOX_API_URLS, BACKEND_OAUTH_URL } from '@/config/api'

describe('config/api.ts', () => {
  describe('GOOGLE_API_URLS', () => {
    it('should have default Google API URLs', () => {
      expect(GOOGLE_API_URLS.drive).toBe('https://www.googleapis.com/drive/v3')
      expect(GOOGLE_API_URLS.upload).toBe('https://www.googleapis.com/upload/drive/v3')
      expect(GOOGLE_API_URLS.content).toBe('https://content.googleapis.com')
    })

    it('should have all required properties', () => {
      expect(GOOGLE_API_URLS).toHaveProperty('drive')
      expect(GOOGLE_API_URLS).toHaveProperty('upload')
      expect(GOOGLE_API_URLS).toHaveProperty('content')
    })
  })

  describe('DROPBOX_API_URLS', () => {
    it('should have default Dropbox API URLs', () => {
      expect(DROPBOX_API_URLS.auth).toBe('https://www.dropbox.com/oauth2/authorize')
      expect(DROPBOX_API_URLS.token).toBe('https://api.dropboxapi.com/oauth2/token')
      expect(DROPBOX_API_URLS.api).toBe('https://api.dropboxapi.com/2')
      expect(DROPBOX_API_URLS.content).toBe('https://content.dropboxapi.com/2')
    })

    it('should have all required properties', () => {
      expect(DROPBOX_API_URLS).toHaveProperty('auth')
      expect(DROPBOX_API_URLS).toHaveProperty('token')
      expect(DROPBOX_API_URLS).toHaveProperty('api')
      expect(DROPBOX_API_URLS).toHaveProperty('content')
    })
  })

  describe('BACKEND_OAUTH_URL', () => {
    it('should have a backend OAuth URL', () => {
      expect(BACKEND_OAUTH_URL).toBeDefined()
      expect(typeof BACKEND_OAUTH_URL).toBe('string')
    })

    it('should be a string', () => {
      expect(typeof BACKEND_OAUTH_URL).toBe('string')
    })

    it('should be a valid URL format', () => {
      expect(BACKEND_OAUTH_URL).toMatch(/^https?:\/\//)
    })
  })
})
