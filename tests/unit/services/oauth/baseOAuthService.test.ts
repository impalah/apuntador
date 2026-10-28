import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  handleCallback: vi.fn(),
  isTauri: vi.fn(() => false),
  isNativePlatform: vi.fn(() => false),
  browserOpen: vi.fn(),
  tauriOpenUrl: vi.fn(),
  handleCloudError: vi.fn(),
  handleOAuthError: vi.fn(),
  showCloudSuccess: vi.fn(),
}))

vi.mock('@/services/oauth/backendOAuthClient', () => ({
  BackendOAuthClient: class {
    authorize = mocks.authorize
    handleCallback = mocks.handleCallback
  },
}))
vi.mock('@/services/oauth/config', () => ({
  getBackendUrl: () => 'https://backend.test',
  getOAuthRedirectUri: () => 'https://app.test/oauth-callback',
}))
vi.mock('@/utils/tauri', () => ({ isTauri: mocks.isTauri }))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.isNativePlatform, getPlatform: () => 'web' },
}))
vi.mock('@capacitor/browser', () => ({ Browser: { open: mocks.browserOpen } }))
vi.mock('@/services/tauriService', () => ({ tauriService: { openUrl: mocks.tauriOpenUrl } }))
vi.mock('@/services/serviceErrorHandler', () => ({
  createServiceErrorHandler: () => ({
    handleCloudError: mocks.handleCloudError,
    handleOAuthError: mocks.handleOAuthError,
  }),
  createServiceSuccessHandler: () => ({ showCloudSuccess: mocks.showCloudSuccess }),
}))

import { BaseOAuthService } from '@/services/oauth/baseOAuthService'

class TestOAuthService extends BaseOAuthService {
  saveTokensSpy = vi.fn()
  onTokensReceivedSpy = vi.fn()

  constructor() {
    super({} as any, 'dropbox')
  }

  protected getProviderName(): string {
    return 'Dropbox'
  }

  protected async saveTokens(accessToken: string, refreshToken?: string) {
    this.saveTokensSpy(accessToken, refreshToken)
  }

  protected async onTokensReceived(accessToken: string, refreshToken?: string) {
    this.onTokensReceivedSpy(accessToken, refreshToken)
  }
}

const STATE_KEY = 'dropbox_oauth_state'

describe('BaseOAuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mocks.isTauri.mockReturnValue(false)
    mocks.isNativePlatform.mockReturnValue(false)
    mocks.authorize.mockResolvedValue({
      authorization_url: 'https://provider.test/authorize',
      state: 'signed-state',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('connect', () => {
    it('saves the backend state and opens the system browser on native platforms', async () => {
      mocks.isNativePlatform.mockReturnValue(true)
      const service = new TestOAuthService()

      await service.connect()

      expect(localStorage.getItem(STATE_KEY)).toBe('signed-state')
      expect(mocks.browserOpen).toHaveBeenCalledWith({ url: 'https://provider.test/authorize' })
      expect(mocks.tauriOpenUrl).not.toHaveBeenCalled()
    })

    it('opens the URL through Tauri on desktop', async () => {
      mocks.isTauri.mockReturnValue(true)
      const service = new TestOAuthService()

      await service.connect()

      expect(mocks.tauriOpenUrl).toHaveBeenCalledWith('https://provider.test/authorize')
      expect(mocks.browserOpen).not.toHaveBeenCalled()
    })

    it('redirects the page and remembers where to return on the web', async () => {
      const location = { pathname: '/edit', href: 'http://localhost/edit' }
      vi.stubGlobal('location', location)
      const service = new TestOAuthService()

      await service.connect()

      expect(location.href).toBe('https://provider.test/authorize')
      expect(localStorage.getItem('oauth_return_to')).toBe('/edit')
    })

    it('reports and rethrows backend failures without saving a state', async () => {
      const failure = new Error('backend down')
      mocks.authorize.mockRejectedValue(failure)
      const service = new TestOAuthService()

      await expect(service.connect()).rejects.toThrow('backend down')

      expect(localStorage.getItem(STATE_KEY)).toBeNull()
      expect(mocks.handleCloudError).toHaveBeenCalledWith(failure, 'connect', {
        provider: 'dropbox',
      })
    })
  })

  describe('handleOAuthCallback', () => {
    beforeEach(() => {
      localStorage.setItem(STATE_KEY, 'signed-state')
      mocks.handleCallback.mockResolvedValue({
        access_token: 'access',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
      })
    })

    it('exchanges the code, stores the tokens and clears the saved state', async () => {
      const service = new TestOAuthService()

      await service.handleOAuthCallback('code-123', 'signed-state')

      expect(mocks.handleCallback).toHaveBeenCalledWith('code-123', 'signed-state')
      expect(service.saveTokensSpy).toHaveBeenCalledWith('access', 'refresh')
      expect(service.onTokensReceivedSpy).toHaveBeenCalledWith('access', 'refresh')
      expect(localStorage.getItem(STATE_KEY)).toBeNull()
      expect(mocks.showCloudSuccess).toHaveBeenCalledWith('connect')
    })

    it('rejects a callback without state before contacting the backend (CSRF)', async () => {
      const service = new TestOAuthService()

      await expect(service.handleOAuthCallback('code-123')).rejects.toThrow(/Invalid OAuth state/)

      expect(mocks.handleCallback).not.toHaveBeenCalled()
      expect(service.saveTokensSpy).not.toHaveBeenCalled()
    })

    it('rejects a state that does not match the saved one', async () => {
      const service = new TestOAuthService()

      await expect(service.handleOAuthCallback('code-123', 'forged')).rejects.toThrow(
        /Invalid OAuth state/
      )
      expect(mocks.handleCallback).not.toHaveBeenCalled()
    })

    it('rejects any state when none was saved', async () => {
      localStorage.removeItem(STATE_KEY)
      const service = new TestOAuthService()

      await expect(service.handleOAuthCallback('code-123', 'signed-state')).rejects.toThrow(
        /Invalid OAuth state/
      )
      expect(mocks.handleCallback).not.toHaveBeenCalled()
    })

    it('fails when the backend returns no access token, and clears the state', async () => {
      mocks.handleCallback.mockResolvedValue({ expires_in: 3600, token_type: 'bearer' })
      const service = new TestOAuthService()

      await expect(service.handleOAuthCallback('code-123', 'signed-state')).rejects.toThrow(
        'No access token received from backend'
      )

      expect(service.saveTokensSpy).not.toHaveBeenCalled()
      expect(localStorage.getItem(STATE_KEY)).toBeNull()
      expect(mocks.handleOAuthError).toHaveBeenCalledWith(expect.any(Error), {
        provider: 'dropbox',
        step: 'callback',
      })
    })
  })
})
