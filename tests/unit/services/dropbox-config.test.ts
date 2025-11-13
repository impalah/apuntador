import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock oauth/config functions
vi.mock('@/services/oauth/config', () => ({
  getBackendUrl: vi.fn(() => 'https://api.apuntador.io'),
  getOAuthRedirectUri: vi.fn(() => 'apuntador://oauth-callback'),
}))

describe('services/dropbox/config.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('DROPBOX_CONFIG', () => {
    it('should have empty clientId (backend handles it)', async () => {
      const { DROPBOX_CONFIG } = await import('@/services/dropbox/config')
      expect(DROPBOX_CONFIG.clientId).toBe('')
    })

    it('should have redirectUri from getOAuthRedirectUri()', async () => {
      const { DROPBOX_CONFIG } = await import('@/services/dropbox/config')
      expect(DROPBOX_CONFIG.redirectUri).toBe('apuntador://oauth-callback')
    })

    it('should have correct Dropbox scope', async () => {
      const { DROPBOX_CONFIG } = await import('@/services/dropbox/config')
      expect(DROPBOX_CONFIG.scope).toBe('files.metadata.read files.content.read files.content.write')
    })

    it('should have all required OAuthConfig properties', async () => {
      const { DROPBOX_CONFIG } = await import('@/services/dropbox/config')
      expect(DROPBOX_CONFIG).toHaveProperty('clientId')
      expect(DROPBOX_CONFIG).toHaveProperty('redirectUri')
      expect(DROPBOX_CONFIG).toHaveProperty('scope')
    })
  })
})
