import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  compareWithSource,
  readSourceContent,
  saveWithConflictCheck,
  forceSaveToSource,
  refreshFromSource,
  canSyncWithSource,
  getSyncStatusMessage,
  type SyncStatus
} from '@/utils/files/fileSync'

// Mock fileSystem utilities
vi.mock('@/utils/files/fileSystem', () => ({
  openFile: vi.fn(),
  saveToFileHandle: vi.fn()
}))

import { saveToFileHandle } from '@/utils/files/fileSystem'

describe('File Sync Utils', () => {
  let mockFileHandle: any
  let mockFile: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockFile = {
      text: vi.fn()
    }
    
    mockFileHandle = {
      getFile: vi.fn(() => Promise.resolve(mockFile))
    }

    // Mock saveToFileHandle
    vi.mocked(saveToFileHandle).mockResolvedValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('compareWithSource', () => {
    it('should detect no changes when all content is identical', () => {
      const content = 'Hello world'
      const result = compareWithSource(content, content, content)

      expect(result).toEqual({
        hasLocalChanges: false,
        hasSourceChanges: false,
        needsSync: false
      })
    })

    it('should detect local changes when editor differs from original', () => {
      const originalContent = 'Hello world'
      const editorContent = 'Hello world!'
      const sourceContent = 'Hello world'

      const result = compareWithSource(editorContent, originalContent, sourceContent)

      expect(result).toEqual({
        hasLocalChanges: true,
        hasSourceChanges: false,
        needsSync: true
      })
    })

    it('should detect source changes when source differs from original', () => {
      const originalContent = 'Hello world'
      const editorContent = 'Hello world'
      const sourceContent = 'Hello world!'

      const result = compareWithSource(editorContent, originalContent, sourceContent)

      expect(result).toEqual({
        hasLocalChanges: false,
        hasSourceChanges: true,
        needsSync: true
      })
    })

    it('should detect both local and source changes', () => {
      const originalContent = 'Hello world'
      const editorContent = 'Hello world! (local)'
      const sourceContent = 'Hello world! (source)'

      const result = compareWithSource(editorContent, originalContent, sourceContent)

      expect(result).toEqual({
        hasLocalChanges: true,
        hasSourceChanges: true,
        needsSync: true
      })
    })
  })

  describe('readSourceContent', () => {
    it('should read content from file handle successfully', async () => {
      const expectedContent = 'File content'
      mockFile.text.mockResolvedValue(expectedContent)

      const result = await readSourceContent(mockFileHandle)

      expect(result).toBe(expectedContent)
      expect(mockFileHandle.getFile).toHaveBeenCalled()
      expect(mockFile.text).toHaveBeenCalled()
    })

    it('should throw error when no file handle provided', async () => {
      await expect(readSourceContent(null)).rejects.toThrow('No file handle provided')
    })

    it('should throw error when file handle fails', async () => {
      mockFileHandle.getFile.mockRejectedValue(new Error('File access denied'))

      await expect(readSourceContent(mockFileHandle)).rejects.toThrow('Failed to read source file: Error: File access denied')
    })

    it('should throw error when file.text() fails', async () => {
      mockFile.text.mockRejectedValue(new Error('Text reading failed'))

      await expect(readSourceContent(mockFileHandle)).rejects.toThrow('Failed to read source file: Error: Text reading failed')
    })
  })

  describe('saveWithConflictCheck', () => {
    it('should save successfully when no conflict exists', async () => {
      const originalContent = 'original'
      const editorContent = 'modified'
      mockFile.text.mockResolvedValue(originalContent) // Source unchanged

      const result = await saveWithConflictCheck(mockFileHandle, originalContent, editorContent, originalContent)

      expect(result).toEqual({
        success: true,
        hasConflict: false
      })
      expect(saveToFileHandle).toHaveBeenCalledWith(mockFileHandle, editorContent)
    })

    it('should detect conflict when source has changed', async () => {
      const originalContent = 'original'
      const editorContent = 'modified by editor'
      const sourceContent = 'modified by source'
      mockFile.text.mockResolvedValue(sourceContent)

      const result = await saveWithConflictCheck(mockFileHandle, originalContent, editorContent, originalContent)

      expect(result).toEqual({
        success: false,
        hasConflict: true,
        sourceContent: sourceContent,
        error: 'Source file has been modified by another process'
      })
      expect(saveToFileHandle).not.toHaveBeenCalled()
    })

    it('should return error when no file handle provided', async () => {
      const result = await saveWithConflictCheck(null, 'current', 'editor', 'original')

      expect(result).toEqual({
        success: false,
        hasConflict: false,
        error: 'No file handle available'
      })
    })

    it('should handle file read errors', async () => {
      mockFileHandle.getFile.mockRejectedValue(new Error('Read error'))

      const result = await saveWithConflictCheck(mockFileHandle, 'current', 'editor', 'original')

      expect(result).toEqual({
        success: false,
        hasConflict: false,
        error: 'Failed to save file: Error: Failed to read source file: Error: Read error'
      })
    })

    it('should handle save errors', async () => {
      const originalContent = 'original'
      mockFile.text.mockResolvedValue(originalContent)
      vi.mocked(saveToFileHandle).mockResolvedValue(false)

      const result = await saveWithConflictCheck(mockFileHandle, originalContent, 'editor', originalContent)

      expect(result).toEqual({
        success: false,
        hasConflict: false
      })
    })
  })

  describe('forceSaveToSource', () => {
    it('should save content successfully', async () => {
      const content = 'content to save'

      const result = await forceSaveToSource(mockFileHandle, content)

      expect(result).toEqual({
        success: true,
        newContent: content
      })
      expect(saveToFileHandle).toHaveBeenCalledWith(mockFileHandle, content)
    })

    it('should return error when no file handle provided', async () => {
      const result = await forceSaveToSource(null, 'content')

      expect(result).toEqual({
        success: false,
        error: 'No file handle available'
      })
    })

    it('should handle save errors', async () => {
      vi.mocked(saveToFileHandle).mockRejectedValue(new Error('Save failed'))

      const result = await forceSaveToSource(mockFileHandle, 'content')

      expect(result).toEqual({
        success: false,
        error: 'Failed to save file: Error: Save failed'
      })
    })
  })

  describe('refreshFromSource', () => {
    it('should refresh content successfully', async () => {
      const newContent = 'refreshed content'
      mockFile.text.mockResolvedValue(newContent)

      const result = await refreshFromSource(mockFileHandle)

      expect(result).toEqual({
        success: true,
        newContent: newContent
      })
    })

    it('should return error when no file handle provided', async () => {
      const result = await refreshFromSource(null)

      expect(result).toEqual({
        success: false,
        error: 'No file handle available'
      })
    })

    it('should handle read errors', async () => {
      mockFileHandle.getFile.mockRejectedValue(new Error('Refresh failed'))

      const result = await refreshFromSource(mockFileHandle)

      expect(result).toEqual({
        success: false,
        error: 'Failed to read source file: Error: Failed to read source file: Error: Refresh failed'
      })
    })
  })

  describe('canSyncWithSource', () => {
    beforeEach(() => {
      // Reset window object
      delete (window as any).showOpenFilePicker
      delete (window as any).showSaveFilePicker
    })

    it('should return true when file system APIs are available', () => {
      ;(window as any).showOpenFilePicker = vi.fn()
      ;(window as any).showSaveFilePicker = vi.fn()

      const result = canSyncWithSource()

      expect(result).toBe(true)
    })

    it('should return false when showOpenFilePicker is not available', () => {
      ;(window as any).showSaveFilePicker = vi.fn()

      const result = canSyncWithSource()

      expect(result).toBe(false)
    })

    it('should return false when showSaveFilePicker is not available', () => {
      ;(window as any).showOpenFilePicker = vi.fn()

      const result = canSyncWithSource()

      expect(result).toBe(false)
    })

    it('should return false when both APIs are not available', () => {
      const result = canSyncWithSource()

      expect(result).toBe(false)
    })
  })

  describe('getSyncStatusMessage', () => {
    it('should return synchronized message when no sync needed', () => {
      const status: SyncStatus = {
        hasLocalChanges: false,
        hasSourceChanges: false,
        needsSync: false
      }

      const result = getSyncStatusMessage(status)

      expect(result).toBe('File is synchronized')
    })

    it('should return both changes message when both local and source have changes', () => {
      const status: SyncStatus = {
        hasLocalChanges: true,
        hasSourceChanges: true,
        needsSync: true
      }

      const result = getSyncStatusMessage(status)

      expect(result).toBe('Both local and source files have changes')
    })

    it('should return local changes message when only local has changes', () => {
      const status: SyncStatus = {
        hasLocalChanges: true,
        hasSourceChanges: false,
        needsSync: true
      }

      const result = getSyncStatusMessage(status)

      expect(result).toBe('Local file has unsaved changes')
    })

    it('should return source changes message when only source has changes', () => {
      const status: SyncStatus = {
        hasLocalChanges: false,
        hasSourceChanges: true,
        needsSync: true
      }

      const result = getSyncStatusMessage(status)

      expect(result).toBe('Source file has been modified')
    })

    it('should return unknown status message for edge cases', () => {
      const status: SyncStatus = {
        hasLocalChanges: false,
        hasSourceChanges: false,
        needsSync: true // This is an inconsistent state
      }

      const result = getSyncStatusMessage(status)

      expect(result).toBe('Sync status unknown')
    })
  })
})