// File synchronization utilities
// Provides functionality for comparing and syncing content with source files

import { saveToFileHandle } from './fileSystem'

export interface SyncStatus {
  hasLocalChanges: boolean
  hasSourceChanges: boolean
  needsSync: boolean
}

export interface SyncResult {
  success: boolean
  newContent?: string
  error?: string
}

/**
 * Compare current editor content with source file content
 */
export function compareWithSource(
  editorContent: string,
  originalContent: string,
  sourceContent: string
): SyncStatus {
  const hasLocalChanges = editorContent !== originalContent
  const hasSourceChanges = sourceContent !== originalContent
  const needsSync = hasLocalChanges || hasSourceChanges

  return {
    hasLocalChanges,
    hasSourceChanges,
    needsSync,
  }
}

/**
 * Read current content from source file handle
 */
export async function readSourceContent(fileHandle: any): Promise<string> {
  if (!fileHandle) {
    throw new Error('No file handle provided')
  }

  try {
    const file = await fileHandle.getFile()
    return await file.text()
  } catch (error) {
    throw new Error(`Failed to read source file: ${error}`)
  }
}

/**
 * Save content to source file, checking for conflicts
 */
export async function saveWithConflictCheck(
  fileHandle: any,
  currentContent: string,
  editorContent: string,
  originalContent: string
): Promise<{ success: boolean; hasConflict: boolean; sourceContent?: string; error?: string }> {
  if (!fileHandle) {
    return { success: false, hasConflict: false, error: 'No file handle available' }
  }

  try {
    // Read current source content
    const sourceContent = await readSourceContent(fileHandle)

    // Check if source has changed since we loaded it
    const hasConflict = sourceContent !== originalContent

    if (hasConflict) {
      return {
        success: false,
        hasConflict: true,
        sourceContent,
        error: 'Source file has been modified by another process',
      }
    }

    // No conflict, proceed with save
    const success = await saveToFileHandle(fileHandle, editorContent)
    return { success, hasConflict: false }
  } catch (error) {
    return {
      success: false,
      hasConflict: false,
      error: `Failed to save file: ${error}`,
    }
  }
}

/**
 * Force save content to source file (overwrite)
 */
export async function forceSaveToSource(fileHandle: any, content: string): Promise<SyncResult> {
  if (!fileHandle) {
    return { success: false, error: 'No file handle available' }
  }

  try {
    const success = await saveToFileHandle(fileHandle, content)
    return { success, newContent: content }
  } catch (error) {
    return { success: false, error: `Failed to save file: ${error}` }
  }
}

/**
 * Refresh content from source file
 */
export async function refreshFromSource(fileHandle: any): Promise<SyncResult> {
  if (!fileHandle) {
    return { success: false, error: 'No file handle available' }
  }

  try {
    const newContent = await readSourceContent(fileHandle)
    return { success: true, newContent }
  } catch (error) {
    return { success: false, error: `Failed to read source file: ${error}` }
  }
}

/**
 * Check if file system access is available
 */
export function canSyncWithSource(): boolean {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window
}

/**
 * Get user-friendly sync status message
 */
export function getSyncStatusMessage(status: SyncStatus): string {
  if (!status.needsSync) {
    return 'File is synchronized'
  }

  if (status.hasLocalChanges && status.hasSourceChanges) {
    return 'Both local and source files have changes'
  }

  if (status.hasLocalChanges) {
    return 'Local file has unsaved changes'
  }

  if (status.hasSourceChanges) {
    return 'Source file has been modified'
  }

  return 'Sync status unknown'
}
