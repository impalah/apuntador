import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('services/mtls/enrollmentStrategy', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  describe('resolveBackendUrl()', () => {
    it('prefers the platform-specific dev URL when provided', async () => {
      vi.stubEnv('VITE_BACKEND_OAUTH_URL_DEV', 'https://dev.example.com')
      vi.stubEnv('VITE_BACKEND_OAUTH_URL_PROD', 'https://prod.example.com')

      const { resolveBackendUrl } = await import('@/services/mtls/enrollmentStrategy')
      expect(resolveBackendUrl('https://ios-dev.example.com')).toBe('https://ios-dev.example.com')
    })

    it('falls back to the generic dev URL when no platform-specific URL is given', async () => {
      vi.stubEnv('VITE_BACKEND_OAUTH_URL_DEV', 'https://dev.example.com')
      vi.stubEnv('VITE_BACKEND_OAUTH_URL_PROD', 'https://prod.example.com')

      const { resolveBackendUrl } = await import('@/services/mtls/enrollmentStrategy')
      expect(resolveBackendUrl()).toBe('https://dev.example.com')
    })

    it('falls back to the prod URL when no dev URL is configured', async () => {
      vi.stubEnv('VITE_BACKEND_OAUTH_URL_DEV', '')
      vi.stubEnv('VITE_BACKEND_OAUTH_URL_PROD', 'https://prod.example.com')

      const { resolveBackendUrl } = await import('@/services/mtls/enrollmentStrategy')
      expect(resolveBackendUrl()).toBe('https://prod.example.com')
    })

    it('falls back to the centralized BACKEND_OAUTH_URL constant as a last resort', async () => {
      vi.stubEnv('VITE_BACKEND_OAUTH_URL_DEV', '')
      vi.stubEnv('VITE_BACKEND_OAUTH_URL_PROD', '')

      const { resolveBackendUrl } = await import('@/services/mtls/enrollmentStrategy')
      const { BACKEND_OAUTH_URL } = await import('@/config/api')
      expect(resolveBackendUrl()).toBe(BACKEND_OAUTH_URL)
    })
  })
})
