import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface FileHandle {
  name: string
  handle?: any // File System Access API handle
  lastModified?: number
}

export const useFileStore = defineStore('file', () => {
  // State
  const currentFile = ref<FileHandle | null>(null)
  const originalContent = ref('')
  const hasUnsavedChanges = ref(false)
  const isNewFile = ref(true)

  // Computed
  const fileName = computed(() => {
    if (!currentFile.value) return 'New File'
    return currentFile.value.name
  })

  const displayName = computed(() => {
    const name = fileName.value
    return hasUnsavedChanges.value ? `${name} *` : name
  })

  const canSave = computed(() => {
    return !isNewFile.value && hasUnsavedChanges.value
  })

  const canSaveCopy = computed(() => {
    return true // Always can save as copy
  })

  // Actions
  function setFileHandle(handle: any, name: string) {
    currentFile.value = { name, handle }
    isNewFile.value = false
    hasUnsavedChanges.value = false
  }

  function setContent(content: string) {
    originalContent.value = content
    hasUnsavedChanges.value = false
  }

  function markAsModified() {
    hasUnsavedChanges.value = true
  }

  function createNew() {
    currentFile.value = null
    originalContent.value = ''
    hasUnsavedChanges.value = false
    isNewFile.value = true
  }

  function markAsSaved() {
    hasUnsavedChanges.value = false
    originalContent.value = '' // Will be updated by caller
  }

  return {
    // State
    currentFile,
    originalContent,
    hasUnsavedChanges,
    isNewFile,

    // Computed
    fileName,
    displayName,
    canSave,
    canSaveCopy,

    // Actions
    setFileHandle,
    setContent,
    markAsModified,
    createNew,
    markAsSaved,
  }
})
