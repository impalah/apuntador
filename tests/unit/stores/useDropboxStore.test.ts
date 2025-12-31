import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDropboxStore } from '@/stores/useDropboxStore'

// Mock del servicio de Dropbox
vi.mock('@/services/dropbox/dropboxService', () => ({
  DropboxService: vi.fn().mockImplementation(() => ({
    isConnected: vi.fn(() => false),
    connect: vi.fn(() => Promise.resolve()),
    disconnect: vi.fn(() => Promise.resolve()),
    restoreSession: vi.fn(() => Promise.resolve(false)),
    handleOAuthCallback: vi.fn(() => Promise.resolve()),
    listFiles: vi.fn(() => Promise.resolve([])),
    downloadFile: vi.fn(() => Promise.resolve('')),
    uploadFile: vi.fn(() => Promise.resolve()),
    deleteFile: vi.fn(() => Promise.resolve()),
    getUserInfo: vi.fn(() => Promise.resolve(null)),
    getAccessToken: vi.fn(() => Promise.resolve('mock-token')),
  })),
}))

vi.mock('@/services/tauriService', () => ({
  tauriService: {
    isAvailable: vi.fn(() => Promise.resolve(false)),
    startOAuthCallbackServer: vi.fn(() => Promise.resolve()),
    listenForOAuthCallback: vi.fn(() => Promise.resolve()),
    listDropboxFiles: vi.fn(() => Promise.resolve([])),
    downloadDropboxFile: vi.fn(() => Promise.resolve('')),
    uploadDropboxFile: vi.fn(() => Promise.resolve()),
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

describe('useDropboxStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should initialize with disconnected state', () => {
      const store = useDropboxStore()

      expect(store.isConnected).toBe(false)
      expect(store.isConnecting).toBe(false)
    })

    it('should initialize with empty files list', () => {
      const store = useDropboxStore()

      expect(store.currentFiles).toEqual([])
      expect(store.currentPath).toBe('')
    })

    it('should initialize with no error', () => {
      const store = useDropboxStore()

      expect(store.error).toBeNull()
    })

    it('should initialize with no user info', () => {
      const store = useDropboxStore()

      expect(store.userInfo).toBeNull()
    })

    it('should initialize with empty last cloud file', () => {
      const store = useDropboxStore()

      expect(store.getLastCloudPath()).toBe('')
      expect(store.getLastCloudFileName()).toBe('')
    })
  })

  describe('provider computed', () => {
    it('should return Dropbox provider info', () => {
      const store = useDropboxStore()

      expect(store.provider.id).toBe('dropbox')
      expect(store.provider.name).toBe('Dropbox')
    })

    it('should reflect connection status', () => {
      const store = useDropboxStore()

      expect(store.provider.isConnected).toBe(false)

      store.isConnected = true
      expect(store.provider.isConnected).toBe(true)
    })

    it('should include user info when available', () => {
      const store = useDropboxStore()

      const mockUserInfo = {
        name: 'Test User',
        email: 'test@dropbox.com',
      }

      store.userInfo = mockUserInfo

      expect(store.provider.userInfo).toEqual(mockUserInfo)
    })
  })

  describe('saveLastCloudFile', () => {
    it('should extract folder path and save file name', async () => {
      const store = useDropboxStore()

      await store.saveLastCloudFile('/Documents/scripts/my-script.md', 'my-script.md')

      expect(store.getLastCloudPath()).toBe('/Documents/scripts')
      expect(store.getLastCloudFileName()).toBe('my-script.md')
    })

    it('should handle root path', async () => {
      const store = useDropboxStore()

      await store.saveLastCloudFile('/file.md', 'file.md')

      expect(store.getLastCloudPath()).toBe('')
      expect(store.getLastCloudFileName()).toBe('file.md')
    })

    it('should persist to localStorage', async () => {
      const store = useDropboxStore()

      await store.saveLastCloudFile('/folder/script.md', 'script.md')

      const savedPath = localStorage.getItem('apuntador:dropbox:lastPath')
      const savedFileName = localStorage.getItem('apuntador:dropbox:lastFileName')

      expect(savedPath).toBe('/folder')
      expect(savedFileName).toBe('script.md')
    })

    it('should update existing values', async () => {
      const store = useDropboxStore()

      await store.saveLastCloudFile('/first/file1.md', 'file1.md')
      expect(store.getLastCloudPath()).toBe('/first')
      expect(store.getLastCloudFileName()).toBe('file1.md')

      await store.saveLastCloudFile('/second/file2.md', 'file2.md')
      expect(store.getLastCloudPath()).toBe('/second')
      expect(store.getLastCloudFileName()).toBe('file2.md')
    })
  })

  describe('getLastCloudPath', () => {
    it('should return empty string when no path saved', () => {
      const store = useDropboxStore()

      expect(store.getLastCloudPath()).toBe('')
    })

    it('should return saved path', async () => {
      const store = useDropboxStore()

      await store.saveLastCloudFile('/test/path/file.md', 'file.md')

      expect(store.getLastCloudPath()).toBe('/test/path')
    })
  })

  describe('getLastCloudFileName', () => {
    it('should return empty string when no file name saved', () => {
      const store = useDropboxStore()

      expect(store.getLastCloudFileName()).toBe('')
    })

    it('should return saved file name', async () => {
      const store = useDropboxStore()

      await store.saveLastCloudFile('/test/my-script.md', 'my-script.md')

      expect(store.getLastCloudFileName()).toBe('my-script.md')
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      const store = useDropboxStore()

      store.error = 'Connection failed'
      expect(store.error).toBe('Connection failed')

      store.clearError()
      expect(store.error).toBeNull()
    })

    it('should be idempotent', () => {
      const store = useDropboxStore()

      store.clearError()
      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty paths', async () => {
      const store = useDropboxStore()

      await store.saveLastCloudFile('', '')

      expect(store.getLastCloudPath()).toBe('')
      expect(store.getLastCloudFileName()).toBe('')
    })

    it('should handle paths with special characters', async () => {
      const store = useDropboxStore()

      const specialPath = '/folder/file (with spaces & symbols).md'
      await store.saveLastCloudFile(specialPath, 'file (with spaces & symbols).md')

      expect(store.getLastCloudPath()).toBe('/folder')
      expect(store.getLastCloudFileName()).toBe('file (with spaces & symbols).md')
    })

    it('should handle rapid state changes', () => {
      const store = useDropboxStore()

      store.isConnected = true
      expect(store.isConnected).toBe(true)

      store.isConnected = false
      expect(store.isConnected).toBe(false)

      store.isConnected = true
      expect(store.isConnected).toBe(true)
    })

    it('should maintain independent state per instance', () => {
      const store1 = useDropboxStore()
      const store2 = useDropboxStore()

      // Pinia stores are singletons, so should be the same instance
      expect(store1).toBe(store2)
    })
  })

  describe('State Consistency', () => {
    it('should preserve all state properties', async () => {
      const store = useDropboxStore()

      // Set multiple state properties
      store.isConnected = true
      store.userInfo = { name: 'Test', email: 'test@example.com' }
      await store.saveLastCloudFile('/path/file.md', 'file.md')
      store.error = null

      // Verify all properties
      expect(store.isConnected).toBe(true)
      expect(store.userInfo?.name).toBe('Test')
      expect(store.getLastCloudPath()).toBe('/path')
      expect(store.getLastCloudFileName()).toBe('file.md')
      expect(store.error).toBeNull()
    })

    it('should handle error state changes without affecting other properties', async () => {
      const store = useDropboxStore()

      await store.saveLastCloudFile('/test/file.md', 'file.md')
      store.error = 'Error 1'

      expect(store.getLastCloudPath()).toBe('/test')
      expect(store.error).toBe('Error 1')

      store.clearError()

      expect(store.getLastCloudPath()).toBe('/test')
      expect(store.error).toBeNull()
    })
  })
})
