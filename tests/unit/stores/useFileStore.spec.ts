import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFileStore } from '@/stores/useFileStore'

describe('useFileStore', () => {
  let fileStore: ReturnType<typeof useFileStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    fileStore = useFileStore()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      expect(fileStore.currentFile).toBeNull()
      expect(fileStore.originalContent).toBe('')
      expect(fileStore.hasUnsavedChanges).toBe(false)
      expect(fileStore.isNewFile).toBe(true)
    })

    it('should return correct computed values for new file', () => {
      expect(fileStore.fileName).toBe('New File')
      expect(fileStore.displayName).toBe('New File')
      expect(fileStore.canSave).toBe(false)
      expect(fileStore.canSaveCopy).toBe(true)
    })
  })

  describe('File Operations', () => {
    it('should set file handle correctly', () => {
      const mockHandle = { name: 'test.md' }
      fileStore.setFileHandle(mockHandle, 'test.md')

      expect(fileStore.currentFile).toEqual({ name: 'test.md', handle: mockHandle })
      expect(fileStore.isNewFile).toBe(false)
      expect(fileStore.hasUnsavedChanges).toBe(false)
      expect(fileStore.fileName).toBe('test.md')
    })

    it('should set content correctly', () => {
      const content = '# Test Content'
      fileStore.setContent(content)

      expect(fileStore.originalContent).toBe(content)
      expect(fileStore.hasUnsavedChanges).toBe(false)
    })

    it('should mark as modified', () => {
      fileStore.markAsModified()
      expect(fileStore.hasUnsavedChanges).toBe(true)
    })

    it('should create new file correctly', () => {
      // Set up some state first
      fileStore.setFileHandle({ name: 'test.md' }, 'test.md')
      fileStore.setContent('some content')
      fileStore.markAsModified()

      // Create new
      fileStore.createNew()

      expect(fileStore.currentFile).toBeNull()
      expect(fileStore.originalContent).toBe('')
      expect(fileStore.hasUnsavedChanges).toBe(false)
      expect(fileStore.isNewFile).toBe(true)
    })

    it('should mark as saved correctly', () => {
      fileStore.markAsModified()
      expect(fileStore.hasUnsavedChanges).toBe(true)

      fileStore.markAsSaved()
      expect(fileStore.hasUnsavedChanges).toBe(false)
    })
  })

  describe('Computed Properties', () => {
    it('should show asterisk in display name when modified', () => {
      const mockHandle = { name: 'test.md' }
      fileStore.setFileHandle(mockHandle, 'test.md')

      expect(fileStore.displayName).toBe('test.md')

      fileStore.markAsModified()
      expect(fileStore.displayName).toBe('test.md *')
    })

    it('should enable save only when file exists and has changes', () => {
      // New file - can't save
      expect(fileStore.canSave).toBe(false)

      // Existing file without changes - can't save
      const mockHandle = { name: 'test.md', handle: 'mock-handle' }
      fileStore.setFileHandle(mockHandle, 'test.md')
      expect(fileStore.canSave).toBe(false)

      // Existing file with changes - can save
      fileStore.markAsModified()
      expect(fileStore.canSave).toBe(true)

      // Back to new file - can't save
      fileStore.createNew()
      fileStore.markAsModified()
      expect(fileStore.canSave).toBe(false)
    })

    it('should always allow save copy', () => {
      expect(fileStore.canSaveCopy).toBe(true)

      fileStore.setFileHandle({ name: 'test.md' }, 'test.md')
      expect(fileStore.canSaveCopy).toBe(true)

      fileStore.markAsModified()
      expect(fileStore.canSaveCopy).toBe(true)
    })
  })
})
