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

    it('should leave content untouched when marking as saved without new content', () => {
      fileStore.setContent('original')
      fileStore.markAsModified()

      fileStore.markAsSaved()

      expect(fileStore.originalContent).toBe('original')
      expect(fileStore.sourceContent).toBe('original')
    })

    it('should update original and source content when marking as saved with new content', () => {
      fileStore.setContent('original')
      fileStore.markAsModified()

      fileStore.markAsSaved('updated content')

      expect(fileStore.hasUnsavedChanges).toBe(false)
      expect(fileStore.originalContent).toBe('updated content')
      expect(fileStore.sourceContent).toBe('updated content')
    })

    it('should set both original and source content when setting content', () => {
      fileStore.setContent('# Test Content')

      expect(fileStore.originalContent).toBe('# Test Content')
      expect(fileStore.sourceContent).toBe('# Test Content')
    })

    it('should update source content independently of original content', () => {
      fileStore.setContent('original')
      fileStore.updateSourceContent('changed on disk')

      expect(fileStore.sourceContent).toBe('changed on disk')
      expect(fileStore.originalContent).toBe('original')
    })
  })

  describe('canRefreshFromSource', () => {
    it('is falsy for a new file', () => {
      expect(fileStore.canRefreshFromSource).toBeFalsy()
    })

    it('is truthy once a file handle is set', () => {
      fileStore.setFileHandle({ name: 'test.md' }, 'test.md')
      expect(fileStore.canRefreshFromSource).toBeTruthy()
    })

    it('is falsy again after creating a new file', () => {
      fileStore.setFileHandle({ name: 'test.md' }, 'test.md')
      fileStore.createNew()
      expect(fileStore.canRefreshFromSource).toBeFalsy()
    })
  })

  describe('hasSourceContentChanged', () => {
    it('is false for a new file even if content differs', () => {
      expect(fileStore.hasSourceContentChanged).toBe(false)
    })

    it('is false when the current file has no handle', () => {
      fileStore.setFileHandle(null, 'test.md')
      fileStore.setContent('original')
      fileStore.updateSourceContent('changed')

      expect(fileStore.hasSourceContentChanged).toBe(false)
    })

    it('is false when source content matches original content', () => {
      fileStore.setFileHandle({ name: 'test.md' }, 'test.md')
      fileStore.setContent('same content')

      expect(fileStore.hasSourceContentChanged).toBe(false)
    })

    it('is true when source content diverges from original content', () => {
      fileStore.setFileHandle({ name: 'test.md' }, 'test.md')
      fileStore.setContent('original')
      fileStore.updateSourceContent('changed externally')

      expect(fileStore.hasSourceContentChanged).toBe(true)
    })
  })

  describe('canSaveAsNewCopy', () => {
    it('is false for a new file', () => {
      fileStore.markAsModified()
      expect(fileStore.canSaveAsNewCopy).toBe(false)
    })

    it('is false for an existing file with a handle, even if modified', () => {
      fileStore.setFileHandle({ name: 'test.md' }, 'test.md')
      fileStore.markAsModified()

      expect(fileStore.canSaveAsNewCopy).toBe(false)
    })

    it('is false for an existing file without a handle when unmodified', () => {
      fileStore.setFileHandle(null, 'test.md')
      expect(fileStore.canSaveAsNewCopy).toBe(false)
    })

    it('is true for an existing file without a handle that has been modified', () => {
      fileStore.setFileHandle(null, 'test.md')
      fileStore.markAsModified()

      expect(fileStore.canSaveAsNewCopy).toBe(true)
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
