import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCloudStore } from '@/stores/useCloudStore'

// Mock de los servicios
vi.mock('@/services/dropbox/dropboxService', () => ({
  DropboxService: class {
    isConnected = vi.fn(() => false)
    connect = vi.fn()
    disconnect = vi.fn()
    restoreSession = vi.fn(() => Promise.resolve(false))
    listFiles = vi.fn(() => Promise.resolve([]))
    downloadFile = vi.fn()
    uploadFile = vi.fn()
    deleteFile = vi.fn()
    getUserInfo = vi.fn(() => Promise.resolve(null))
  },
}))

vi.mock('@/services/googledrive/googleDriveService', () => ({
  GoogleDriveService: class {
    isConnected = vi.fn(() => false)
    connect = vi.fn()
    disconnect = vi.fn()
    restoreSession = vi.fn(() => Promise.resolve(false))
    listFiles = vi.fn(() => Promise.resolve([]))
    downloadFile = vi.fn()
    uploadFile = vi.fn()
    deleteFile = vi.fn()
    getUserInfo = vi.fn(() => Promise.resolve(null))
  },
}))

vi.mock('@/services/tauriService', () => ({
  tauriService: {
    isAvailable: vi.fn(() => Promise.resolve(false)),
    startOAuthCallbackServer: vi.fn(),
    listenForOAuthCallback: vi.fn(),
  },
}))

vi.mock('@/services/certificate/certificateValidator', () => ({
  CertificateValidator: {
    ensureValidCertificate: vi.fn(() =>
      Promise.resolve({
        isValid: true,
        daysUntilExpiry: 30,
        certificateExists: true,
        needsEnrollment: false,
        needsRenewal: false,
        errors: [],
      })
    ),
    getStatusMessage: vi.fn(() => 'Valid certificate'),
  },
}))

vi.mock('@/services/cloudProviderConfig', () => ({
  cloudProviderConfig: {
    getConfig: vi.fn(() =>
      Promise.resolve({
        providers: {
          dropbox: { enabled: true, name: 'Dropbox', icon: 'mdi-dropbox' },
          googledrive: { enabled: true, name: 'Google Drive', icon: 'mdi-google-drive' },
        },
      })
    ),
  },
}))

describe('useCloudStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should initialize with no active provider', () => {
      const store = useCloudStore()

      expect(store.activeProviderId).toBeNull()
      expect(store.activeProvider).toBeNull()
    })

    it('should initialize with disconnected state', () => {
      const store = useCloudStore()

      expect(store.isConnecting).toBe(false)
      expect(store.isLoadingFiles).toBe(false)
      expect(store.isDownloading).toBe(false)
      expect(store.isUploading).toBe(false)
      expect(store.isDeleting).toBe(false)
    })

    it('should initialize with empty files list', () => {
      const store = useCloudStore()

      expect(store.currentFiles).toEqual([])
      expect(store.currentPath).toBe('')
      expect(store.currentFolderName).toBe('')
    })

    it('should initialize with no error', () => {
      const store = useCloudStore()

      expect(store.error).toBeNull()
    })

    it('should initialize with empty last cloud file tracking', () => {
      const store = useCloudStore()

      expect(store.lastCloudPath).toBe('')
      expect(store.lastCloudFileName).toBe('')
    })
  })

  describe('State Mutations', () => {
    it('should allow direct mutation of lastCloudPath', () => {
      const store = useCloudStore()

      store.lastCloudPath = '/test/folder'

      expect(store.lastCloudPath).toBe('/test/folder')
    })

    it('should allow direct mutation of lastCloudFileName', () => {
      const store = useCloudStore()

      store.lastCloudFileName = 'script.md'

      expect(store.lastCloudFileName).toBe('script.md')
    })

    it('should allow direct mutation of error', () => {
      const store = useCloudStore()

      store.error = 'Connection failed'
      expect(store.error).toBe('Connection failed')

      store.error = null
      expect(store.error).toBeNull()
    })

    it('should allow direct mutation of activeProviderId', () => {
      const store = useCloudStore()

      store.activeProviderId = 'dropbox'
      expect(store.activeProviderId).toBe('dropbox')

      store.activeProviderId = 'googledrive'
      expect(store.activeProviderId).toBe('googledrive')

      store.activeProviderId = null
      expect(store.activeProviderId).toBeNull()
    })
  })

  describe('activeProvider computed', () => {
    it('should return null when no provider is active', () => {
      const store = useCloudStore()

      expect(store.activeProvider).toBeNull()
    })

    it('should return basic info for Dropbox when active', () => {
      const store = useCloudStore()

      store.activeProviderId = 'dropbox'

      const provider = store.activeProvider
      expect(provider).not.toBeNull()
      expect(provider?.id).toBe('dropbox')
      expect(provider?.name).toBe('Dropbox')
    })

    it('should return basic info for Google Drive when active', () => {
      const store = useCloudStore()

      store.activeProviderId = 'googledrive'

      const provider = store.activeProvider
      expect(provider).not.toBeNull()
      expect(provider?.id).toBe('googledrive')
      expect(provider?.name).toBe('Google Drive')
    })
  })

  describe('isConnected computed', () => {
    it('should return false when no provider is active', () => {
      const store = useCloudStore()

      expect(store.isConnected).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty paths', () => {
      const store = useCloudStore()

      store.lastCloudPath = ''
      store.lastCloudFileName = ''

      expect(store.lastCloudPath).toBe('')
      expect(store.lastCloudFileName).toBe('')
    })

    it('should handle paths with special characters', () => {
      const store = useCloudStore()

      const specialPath = '/folder/file (with spaces & symbols).md'
      store.lastCloudPath = specialPath

      expect(store.lastCloudPath).toBe(specialPath)
    })

    it('should handle rapid provider changes', () => {
      const store = useCloudStore()

      store.activeProviderId = 'dropbox'
      expect(store.activeProvider?.id).toBe('dropbox')

      store.activeProviderId = 'googledrive'
      expect(store.activeProvider?.id).toBe('googledrive')

      store.activeProviderId = null
      expect(store.activeProvider).toBeNull()
    })

    it('should maintain independent state for different properties', () => {
      const store = useCloudStore()

      store.lastCloudPath = '/test/path'
      store.lastCloudFileName = 'test.md'
      store.error = 'Test error'
      store.activeProviderId = 'dropbox'

      expect(store.lastCloudPath).toBe('/test/path')
      expect(store.lastCloudFileName).toBe('test.md')
      expect(store.error).toBe('Test error')
      expect(store.activeProviderId).toBe('dropbox')
    })
  })

  describe('State Consistency', () => {
    it('should preserve state values after mutations', () => {
      const store = useCloudStore()

      // Set multiple values
      store.lastCloudPath = '/my/file.md'
      store.lastCloudFileName = 'file.md'
      store.activeProviderId = 'dropbox'

      // Verify all values are preserved
      expect(store.lastCloudPath).toBe('/my/file.md')
      expect(store.lastCloudFileName).toBe('file.md')
      expect(store.activeProviderId).toBe('dropbox')
    })

    it('should handle multiple error state changes', () => {
      const store = useCloudStore()

      expect(store.error).toBeNull()

      store.error = 'Error 1'
      expect(store.error).toBe('Error 1')

      store.error = 'Error 2'
      expect(store.error).toBe('Error 2')

      store.error = null
      expect(store.error).toBeNull()
    })
  })
})
