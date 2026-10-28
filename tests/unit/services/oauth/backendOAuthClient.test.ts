import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  capacitorPost: vi.fn(),
  backendPost: vi.fn(),
  isTauri: vi.fn(() => false),
  tauriAuthorize: vi.fn(),
  tauriTokenExchange: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({ CapacitorHttp: { post: mocks.capacitorPost } }))
vi.mock('@/services/http/mtlsHttpAdapter', () => ({
  createBackendClient: () => ({ post: mocks.backendPost }),
}))
vi.mock('@/utils/tauri', () => ({ isTauri: mocks.isTauri }))
vi.mock('@/services/tauriService', () => ({
  tauriService: {
    backendOAuthAuthorize: mocks.tauriAuthorize,
    backendOAuthTokenExchange: mocks.tauriTokenExchange,
  },
}))

import { BackendOAuthClient } from '@/services/oauth/backendOAuthClient'

const VERIFIER_KEY = 'dropbox_code_verifier'
const TOKENS = {
  access_token: 'access',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer',
}

function createClient() {
  return new BackendOAuthClient({
    backendUrl: 'https://backend.test',
    provider: 'dropbox',
    redirectUri: 'https://app.test/oauth-callback',
  })
}

describe('BackendOAuthClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mocks.isTauri.mockReturnValue(false)
  })

  describe('authorize', () => {
    it('sends a PKCE verifier to the backend and keeps it for the callback', async () => {
      mocks.capacitorPost.mockResolvedValue({
        status: 200,
        data: { authorization_url: 'https://provider.test/authorize', state: 'signed' },
      })

      const result = await createClient().authorize()

      expect(result.state).toBe('signed')
      const request = mocks.capacitorPost.mock.calls[0]![0]
      expect(request.url).toBe('https://backend.test/oauth/authorize/dropbox')
      const verifier = request.data.code_verifier
      expect(verifier).toMatch(/^[A-Za-z0-9_-]{40,}$/) // base64url, no padding
      expect(localStorage.getItem(VERIFIER_KEY)).toBe(verifier)
      expect(localStorage.getItem('oauth_current_provider')).toBe('dropbox')
    })

    it('throws on a non-200 response and does not keep a verifier', async () => {
      mocks.capacitorPost.mockResolvedValue({ status: 403, data: { detail: 'not enrolled' } })

      await expect(createClient().authorize()).rejects.toThrow(/403/)
      expect(localStorage.getItem(VERIFIER_KEY)).toBeNull()
    })

    it('uses the Tauri mTLS command on desktop', async () => {
      mocks.isTauri.mockReturnValue(true)
      mocks.tauriAuthorize.mockResolvedValue({
        authorization_url: 'https://provider.test/authorize',
        state: 'signed',
      })

      await createClient().authorize()

      expect(mocks.capacitorPost).not.toHaveBeenCalled()
      expect(mocks.tauriAuthorize).toHaveBeenCalledWith(
        'dropbox',
        expect.any(String),
        'https://app.test/oauth-callback'
      )
      expect(localStorage.getItem(VERIFIER_KEY)).not.toBeNull()
    })
  })

  describe('handleCallback', () => {
    it('fails fast when the verifier is missing (flow must restart)', async () => {
      await expect(createClient().handleCallback('code', 'state')).rejects.toThrow(
        /Code verifier not found/
      )
      expect(mocks.backendPost).not.toHaveBeenCalled()
    })

    it('exchanges the code with the stored verifier and then discards it', async () => {
      localStorage.setItem(VERIFIER_KEY, 'verifier-123')
      mocks.backendPost.mockResolvedValue({ status: 200, data: TOKENS })

      const tokens = await createClient().handleCallback('code', 'state')

      expect(tokens).toEqual(TOKENS)
      expect(mocks.backendPost).toHaveBeenCalledWith('/oauth/token/dropbox', {
        code: 'code',
        code_verifier: 'verifier-123',
        state: 'state',
      })
      expect(localStorage.getItem(VERIFIER_KEY)).toBeNull()
    })

    it('discards the verifier when the exchange fails too', async () => {
      localStorage.setItem(VERIFIER_KEY, 'verifier-123')
      mocks.backendPost.mockResolvedValue({ status: 500, data: {} })

      await expect(createClient().handleCallback('code', 'state')).rejects.toThrow(/500/)
      expect(localStorage.getItem(VERIFIER_KEY)).toBeNull()
    })

    it('uses the Tauri mTLS command on desktop', async () => {
      mocks.isTauri.mockReturnValue(true)
      localStorage.setItem(VERIFIER_KEY, 'verifier-123')
      mocks.tauriTokenExchange.mockResolvedValue(TOKENS)

      await createClient().handleCallback('code', 'state')

      expect(mocks.tauriTokenExchange).toHaveBeenCalledWith(
        'dropbox',
        'code',
        'verifier-123',
        'state'
      )
      expect(mocks.backendPost).not.toHaveBeenCalled()
    })
  })

  describe('refreshToken', () => {
    it('returns the refreshed tokens', async () => {
      mocks.backendPost.mockResolvedValue({ status: 200, data: TOKENS })

      await expect(createClient().refreshToken('refresh')).resolves.toEqual(TOKENS)
      expect(mocks.backendPost).toHaveBeenCalledWith('/oauth/token/refresh/dropbox', {
        refresh_token: 'refresh',
      })
    })

    it('throws on a non-200 response', async () => {
      mocks.backendPost.mockResolvedValue({ status: 401, data: {} })

      await expect(createClient().refreshToken('refresh')).rejects.toThrow(/401/)
    })
  })

  describe('revokeToken', () => {
    it('never throws, so a local logout always completes', async () => {
      mocks.backendPost.mockRejectedValueOnce(new Error('network'))
      await expect(createClient().revokeToken('token')).resolves.toBeUndefined()

      mocks.backendPost.mockResolvedValueOnce({ status: 400, data: {} })
      await expect(createClient().revokeToken('token')).resolves.toBeUndefined()
    })
  })
})
