import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface FileHandle {
  name: string
  handle?: any // File System Access API handle
  lastModified?: number
  sourceContent?: string // Contenido del archivo origen para comparación
}

export const useFileStore = defineStore('file', () => {
  // State
  const currentFile = ref<FileHandle | null>(null)
  const originalContent = ref('')
  const sourceContent = ref('') // Contenido actual del archivo origen
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
    return !isNewFile.value && hasUnsavedChanges.value && !!currentFile.value?.handle
  })

  const canSaveCopy = computed(() => {
    return true // Always can save as copy
  })

  const canRefreshFromSource = computed(() => {
    return !isNewFile.value && currentFile.value
  })

  const hasSourceContentChanged = computed(() => {
    if (isNewFile.value || !currentFile.value?.handle) return false
    return sourceContent.value !== originalContent.value
  })

  const canSaveAsNewCopy = computed(() => {
    return !isNewFile.value && hasUnsavedChanges.value && !currentFile.value?.handle
  })

  // Actions
  function setFileHandle(handle: any, name: string) {
    currentFile.value = { name, handle }
    isNewFile.value = false
    hasUnsavedChanges.value = false
  }

  function setContent(content: string) {
    originalContent.value = content
    sourceContent.value = content // Mantener referencia del contenido origen
    hasUnsavedChanges.value = false
  }

  function updateSourceContent(content: string) {
    sourceContent.value = content
  }

  function markAsModified() {
    hasUnsavedChanges.value = true
  }

  function createNew() {
    currentFile.value = null
    originalContent.value = ''
    sourceContent.value = ''
    hasUnsavedChanges.value = false
    isNewFile.value = true
  }

  function markAsSaved(newContent?: string) {
    hasUnsavedChanges.value = false
    if (newContent !== undefined) {
      originalContent.value = newContent
      sourceContent.value = newContent
    }
  }

  return {
    // State
    currentFile,
    originalContent,
    sourceContent,
    hasUnsavedChanges,
    isNewFile,

    // Computed
    fileName,
    displayName,
    canSave,
    canSaveCopy,
    canRefreshFromSource,
    hasSourceContentChanged,
    canSaveAsNewCopy,

    // Actions
    setFileHandle,
    setContent,
    updateSourceContent,
    markAsModified,
    createNew,
    markAsSaved,
  }
})
