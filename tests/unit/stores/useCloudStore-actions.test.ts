import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

function createServiceMock() {
  return {
    isConnected: vi.fn(() => false),
    connect: vi.fn(async () => {}),
    disconnect: vi.fn(async () => {}),
    restoreSession: vi.fn(async () => false) as ReturnType<typeof vi.fn> | undefined,
    initialize: vi.fn(async () => {}),
    handleOAuthCallback: vi.fn(async () => {}),
    listFiles: vi.fn(async () => [] as any[]),
    downloadFile: vi.fn(async () => 'content'),
    uploadFile: vi.fn(async () => ({ id: 'f1', name: 'script.md' })),
    deleteFile: vi.fn(async () => {}),
    getUserInfo: vi.fn(async () => ({ name: 'Ada', email: 'ada@example.com' })),
  }
}

const mocks = vi.hoisted(() => ({
  dropbox: null as any,
  googledrive: null as any,
  tauri: {
    isAvailable: vi.fn(async () => false),
    startOAuthCallbackServer: vi.fn(async () => {}),
    listenForOAuthCallback: vi.fn(),
    cancelOAuthCallback: vi.fn(),
  },
  ensureValidCertificateAndConfig: vi.fn(),
  getConfig: vi.fn(),
  storage: { get: vi.fn(), set: vi.fn(async () => {}), remove: vi.fn(async () => {}) },
}))

vi.mock('@/services/dropbox/dropboxService', () => ({
  DropboxService: function () {
    return mocks.dropbox
  },
}))
vi.mock('@/services/googledrive/googleDriveService', () => ({
  GoogleDriveService: function () {
    return mocks.googledrive
  },
}))
vi.mock('@/services/tauriService', () => ({ tauriService: mocks.tauri }))
vi.mock('@/services/certificate/certificateValidator', () => ({
  CertificateValidator: {
    ensureValidCertificateAndConfig: mocks.ensureValidCertificateAndConfig,
    getStatusMessage: () => 'Device not enrolled',
  },
}))
vi.mock('@/services/cloudProviderConfig', () => ({
  cloudProviderConfig: { getConfig: mocks.getConfig },
}))
vi.mock('@/services/persistence', () => ({ storage: mocks.storage }))

import { useCloudStore } from '@/stores/useCloudStore'
import { STORAGE_KEYS } from '@/utils/constants'

const ENABLED_CONFIG = {
  providers: {
    dropbox: { enabled: true, name: 'Dropbox' },
    googledrive: { enabled: true, name: 'Google Drive' },
  },
}

function certificateOk(config = ENABLED_CONFIG) {
  mocks.ensureValidCertificateAndConfig.mockResolvedValue({
    certStatus: { isValid: true, daysUntilExpiry: 30 },
    providerConfig: config,
  })
}

describe('useCloudStore actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.dropbox = createServiceMock()
    mocks.googledrive = createServiceMock()
    mocks.tauri.isAvailable.mockResolvedValue(false)
    mocks.storage.get.mockResolvedValue(null)
    mocks.getConfig.mockResolvedValue(ENABLED_CONFIG)
    certificateOk()
    setActivePinia(createPinia())
  })

  describe('initialize', () => {
    it('restores the saved provider and its user info', async () => {
      mocks.storage.get.mockResolvedValue('dropbox')
      mocks.dropbox.isConnected.mockReturnValue(true)
      const store = useCloudStore()

      await store.initialize()

      expect(store.activeProviderId).toBe('dropbox')
      expect(mocks.dropbox.initialize).toHaveBeenCalled()
      expect(store.activeProvider?.userInfo).toEqual({ name: 'Ada', email: 'ada@example.com' })
    })

    it('keeps working when the provider configuration cannot be loaded', async () => {
      mocks.getConfig.mockRejectedValue(new Error('offline'))
      const store = useCloudStore()

      await expect(store.initialize()).resolves.toBeUndefined()
      expect(store.availableProviders.map((p) => p.id)).toEqual(['dropbox', 'googledrive'])
    })

    it('hides providers disabled by the backend configuration', async () => {
      mocks.getConfig.mockResolvedValue({
        providers: { dropbox: { enabled: true }, googledrive: { enabled: false } },
      })
      const store = useCloudStore()

      await store.initialize()

      expect(store.availableProviders.map((p) => p.id)).toEqual(['dropbox'])
    })
  })

  describe('setActiveProvider', () => {
    it('switches without re-authenticating when the session can be restored', async () => {
      mocks.googledrive.restoreSession.mockResolvedValue(true)
      const store = useCloudStore()

      await store.setActiveProvider('googledrive')

      expect(store.activeProviderId).toBe('googledrive')
      expect(mocks.storage.set).toHaveBeenCalledWith(
        STORAGE_KEYS.CLOUD_ACTIVE_PROVIDER,
        'googledrive'
      )
      expect(mocks.googledrive.connect).not.toHaveBeenCalled()
    })

    it('starts OAuth when there are no saved credentials', async () => {
      // Regression: setActiveProvider set isConnecting and then called connect(),
      // whose re-entrancy guard returned immediately, so OAuth never started
      const store = useCloudStore()

      await store.setActiveProvider('dropbox')

      expect(mocks.ensureValidCertificateAndConfig).toHaveBeenCalled()
      expect(mocks.dropbox.connect).toHaveBeenCalled()
      expect(store.isConnecting).toBe(false)
    })

    it('starts OAuth when the service cannot restore sessions at all', async () => {
      mocks.dropbox.restoreSession = undefined
      const store = useCloudStore()

      await store.setActiveProvider('dropbox')

      expect(mocks.dropbox.connect).toHaveBeenCalled()
    })

    it('does nothing when the provider is already active', async () => {
      mocks.dropbox.restoreSession.mockResolvedValue(true)
      const store = useCloudStore()
      await store.setActiveProvider('dropbox')
      vi.clearAllMocks()

      await store.setActiveProvider('dropbox')

      expect(mocks.dropbox.restoreSession).not.toHaveBeenCalled()
    })
  })

  describe('connect', () => {
    it('ignores a second call while a connection is in progress', async () => {
      let release: () => void = () => {}
      mocks.ensureValidCertificateAndConfig.mockReturnValue(
        new Promise((resolve) => {
          release = () => resolve({ certStatus: { isValid: true }, providerConfig: ENABLED_CONFIG })
        })
      )
      const store = useCloudStore()

      const first = store.connect('dropbox')
      await store.connect('dropbox')
      release()
      await first

      expect(mocks.ensureValidCertificateAndConfig).toHaveBeenCalledTimes(1)
    })

    it('does not start OAuth without a valid device certificate', async () => {
      mocks.ensureValidCertificateAndConfig.mockResolvedValue({
        certStatus: { isValid: false, isEnrolled: false },
        providerConfig: ENABLED_CONFIG,
      })
      const store = useCloudStore()

      await store.connect('dropbox')

      expect(mocks.dropbox.connect).not.toHaveBeenCalled()
      expect(store.error).toMatch(/Certificate required|not enrolled/)
      expect(store.isConnecting).toBe(false)
    })

    it('does not start OAuth for a provider disabled on the backend', async () => {
      certificateOk({
        providers: { dropbox: { enabled: false }, googledrive: { enabled: true } },
      } as any)
      const store = useCloudStore()

      await store.connect('dropbox')

      expect(mocks.dropbox.connect).not.toHaveBeenCalled()
      expect(store.error).toMatch(/not enabled/)
    })

    it('on the web, opens the provider and leaves activation to the callback', async () => {
      const store = useCloudStore()

      await store.connect('dropbox')

      expect(mocks.dropbox.connect).toHaveBeenCalled()
      expect(mocks.tauri.startOAuthCallbackServer).not.toHaveBeenCalled()
      expect(store.activeProviderId).toBeNull()
    })

    it('on desktop, waits for the local callback and completes the login', async () => {
      mocks.tauri.isAvailable.mockResolvedValue(true)
      mocks.tauri.listenForOAuthCallback.mockResolvedValue({ code: 'code-1', state: 'state-1' })
      const store = useCloudStore()

      await store.connect('dropbox')

      expect(mocks.tauri.startOAuthCallbackServer).toHaveBeenCalled()
      expect(mocks.dropbox.handleOAuthCallback).toHaveBeenCalledWith('code-1', 'state-1')
      expect(store.activeProviderId).toBe('dropbox')
      expect(mocks.storage.set).toHaveBeenCalledWith(STORAGE_KEYS.CLOUD_ACTIVE_PROVIDER, 'dropbox')
    })

    it('on desktop, cancels the callback wait when opening the browser fails', async () => {
      // Regression: the pending wait kept a 5-minute timer that later rejected
      // unhandled and could tear down a retry's listener
      mocks.tauri.isAvailable.mockResolvedValue(true)
      mocks.tauri.listenForOAuthCallback.mockReturnValue(new Promise(() => {}))
      mocks.dropbox.connect.mockRejectedValue(new Error('browser failed'))
      const store = useCloudStore()

      await store.connect('dropbox')

      expect(mocks.tauri.cancelOAuthCallback).toHaveBeenCalled()
      expect(store.error).toBe('browser failed')
      expect(store.isConnecting).toBe(false)
    })
  })

  describe('handleOAuthCallback', () => {
    it('activates and persists the provider after a successful callback', async () => {
      const store = useCloudStore()

      await store.handleOAuthCallback('code', 'state', 'googledrive')

      expect(mocks.googledrive.handleOAuthCallback).toHaveBeenCalledWith('code', 'state')
      expect(store.activeProviderId).toBe('googledrive')
      expect(mocks.storage.set).toHaveBeenCalledWith(
        STORAGE_KEYS.CLOUD_ACTIVE_PROVIDER,
        'googledrive'
      )
    })

    it('throws when no provider can be determined', async () => {
      const store = useCloudStore()

      await expect(store.handleOAuthCallback('code', 'state')).rejects.toThrow(/No provider/)
    })

    it('records the error, rethrows and does not activate the provider on failure', async () => {
      mocks.dropbox.handleOAuthCallback.mockRejectedValue(new Error('Invalid OAuth state'))
      const store = useCloudStore()

      await expect(store.handleOAuthCallback('code', 'state', 'dropbox')).rejects.toThrow(
        'Invalid OAuth state'
      )

      expect(store.error).toBe('Invalid OAuth state')
      expect(store.activeProviderId).toBeNull()
      expect(store.isConnecting).toBe(false)
    })
  })

  describe('disconnect and revoke', () => {
    async function storeWithActiveDropbox() {
      mocks.dropbox.restoreSession.mockResolvedValue(true)
      const store = useCloudStore()
      await store.setActiveProvider('dropbox')
      store.currentFiles = [{ id: 'x' } as any]
      return store
    }

    it('deactivating keeps the credentials for a later quick switch', async () => {
      const store = await storeWithActiveDropbox()

      await store.disconnect()

      expect(mocks.dropbox.disconnect).not.toHaveBeenCalled()
      expect(store.activeProviderId).toBeNull()
      expect(store.currentFiles).toEqual([])
      expect(mocks.storage.remove).toHaveBeenCalledWith(STORAGE_KEYS.CLOUD_ACTIVE_PROVIDER)
    })

    it('disconnecting with clearCredentials removes them', async () => {
      const store = await storeWithActiveDropbox()

      await store.disconnect(true)

      expect(mocks.dropbox.disconnect).toHaveBeenCalled()
      expect(store.activeProviderId).toBeNull()
    })

    it('revoking the active provider also deactivates it', async () => {
      const store = await storeWithActiveDropbox()

      await store.revokeProvider('dropbox')

      expect(mocks.dropbox.disconnect).toHaveBeenCalled()
      expect(store.activeProviderId).toBeNull()
    })

    it('revoking another provider leaves the active one alone', async () => {
      const store = await storeWithActiveDropbox()

      await store.revokeProvider('googledrive')

      expect(mocks.googledrive.disconnect).toHaveBeenCalled()
      expect(store.activeProviderId).toBe('dropbox')
    })

    it('revoke failures are recorded and rethrown', async () => {
      mocks.googledrive.disconnect.mockRejectedValue(new Error('revoke failed'))
      const store = useCloudStore()

      await expect(store.revokeProvider('googledrive')).rejects.toThrow('revoke failed')
      expect(store.error).toBe('revoke failed')
    })
  })

  describe('file operations', () => {
    async function activeStore() {
      mocks.dropbox.restoreSession.mockResolvedValue(true)
      const store = useCloudStore()
      await store.setActiveProvider('dropbox')
      return store
    }

    it('require an active provider', async () => {
      const store = useCloudStore()

      await expect(store.loadFiles()).rejects.toThrow(/No active cloud provider/)
      await expect(store.downloadFile('/a.md')).rejects.toThrow(/No active cloud provider/)
      await expect(store.uploadFile('/a.md', 'x')).rejects.toThrow(/No active cloud provider/)
      await expect(store.deleteFile('id')).rejects.toThrow(/No active cloud provider/)
    })

    it('loadFiles tracks the path and folder name, and clears the name at the root', async () => {
      mocks.dropbox.listFiles.mockResolvedValue([{ id: 'a' }])
      const store = await activeStore()

      await store.navigateToFolder('/scripts', 'Scripts')
      expect(store.currentFiles).toEqual([{ id: 'a' }])
      expect(store.currentPath).toBe('/scripts')
      expect(store.currentFolderName).toBe('Scripts')

      await store.loadFiles('')
      expect(store.currentFolderName).toBe('')
    })

    it('loadFiles records the error and resets the loading flag on failure', async () => {
      mocks.dropbox.listFiles.mockRejectedValue(new Error('list failed'))
      const store = await activeStore()

      await expect(store.loadFiles('/x')).rejects.toThrow('list failed')
      expect(store.error).toBe('list failed')
      expect(store.isLoadingFiles).toBe(false)
    })

    it('downloadFile remembers the last cloud file, deriving the name from the path', async () => {
      const store = await activeStore()

      await expect(store.downloadFile('/scripts/talk.md')).resolves.toBe('content')
      expect(store.lastCloudPath).toBe('/scripts/talk.md')
      expect(store.lastCloudFileName).toBe('talk.md')

      await store.downloadFile('drive-id-123', 'named.md')
      expect(store.lastCloudFileName).toBe('named.md')
    })

    it('upload and delete reload the current folder', async () => {
      const store = await activeStore()

      await store.uploadFile('/a.md', 'text')
      await store.deleteFile('f1')

      expect(mocks.dropbox.uploadFile).toHaveBeenCalledWith('/a.md', 'text')
      expect(mocks.dropbox.deleteFile).toHaveBeenCalledWith('f1')
      expect(mocks.dropbox.listFiles).toHaveBeenCalledTimes(2)
      expect(store.isUploading).toBe(false)
      expect(store.isDeleting).toBe(false)
    })
  })
})
