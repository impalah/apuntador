<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    data-testid="file-import-dialog"
  >
    <v-card>
      <v-card-title>
        {{ t('fileLoader.title') }}
        <v-chip v-if="props.autoImport" size="small" color="primary" class="ml-2">
          {{ t('fileLoader.autoImportEnabled') }}
        </v-chip>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <div class="file-loader-content">
          <!-- File Input -->
          <v-file-input
            ref="fileInputRef"
            v-model="selectedFiles"
            :label="t('settings.selectFile')"
            accept=".md,.txt,.markdown"
            prepend-icon="mdi-file-import"
            variant="outlined"
            @change="onFileSelect"
            @update:model-value="onFileSelect"
          />

          <!-- Drag and Drop Area -->
          <div
            class="drop-zone"
            :class="{ 'drop-zone--dragover': isDragOver }"
            @drop="onDrop"
            @dragover="onDragOver"
            @dragenter="onDragEnter"
            @dragleave="onDragLeave"
          >
            <v-icon size="48" class="mb-2">mdi-cloud-upload</v-icon>
            <p class="text-body-1 mb-2">{{ t('fileLoader.dropZone') }}</p>
            <p class="text-body-2 text-medium-emphasis">
              {{ t('fileLoader.supportedFormats') }}
              <span v-if="props.autoImport" class="text-primary">
                • {{ t('fileLoader.autoImportNote') }}</span
              >
            </p>
            <div class="d-flex gap-2 mt-2">
              <v-btn color="primary" variant="outlined" @click="triggerFileInput">
                {{ t('fileLoader.browseFiles') }}
              </v-btn>
              <v-btn
                v-if="isFileSystemAccessSupported()"
                color="primary"
                variant="outlined"
                @click="openWithFileAPI"
              >
                {{ t('fileLoader.openFile') }}
              </v-btn>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-4">
            <v-progress-circular indeterminate color="primary" />
            <p class="mt-2">{{ t('fileLoader.readingFile') }}</p>
          </div>

          <!-- Error State -->
          <v-alert v-if="error" type="error" variant="outlined" closable @click:close="error = ''">
            {{ error }}
          </v-alert>

          <!-- File Info -->
          <div v-if="fileInfo" class="file-info mt-4">
            <v-card variant="outlined">
              <v-card-text>
                <div class="d-flex align-center">
                  <v-icon class="mr-3">mdi-file-document</v-icon>
                  <div>
                    <div class="text-subtitle-2">{{ fileInfo.name }}</div>
                    <div class="text-body-2 text-medium-emphasis">
                      {{ formatFileSize(fileInfo.size) }} • {{ fileInfo.type || 'text/plain' }}
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn @click="$emit('update:modelValue', false)"> {{ t('common.cancel') }} </v-btn>
        <v-btn v-if="fileContent && !props.autoImport" color="primary" @click="onImport">
          {{ t('fileLoader.import') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { sanitizeMarkdown } from '@/utils/markdown'
import { useFileStore } from '@/stores/useFileStore'
import { openFile, isFileSystemAccessSupported } from '@/utils/fileSystem'

// I18n
const { t } = useI18n()

// Props
interface Props {
  modelValue: boolean
  autoImport?: boolean // New prop to enable auto-import
}

const props = withDefaults(defineProps<Props>(), {
  autoImport: false,
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  fileImported: [content: string, fileInfo?: { name: string; handle?: any }]
}>()

// Stores
const fileStore = useFileStore()

// State
const selectedFiles = ref<any>(undefined)
const fileInputRef = ref()
const loading = ref(false)
const error = ref('')
const fileContent = ref('')
const fileInfo = ref<{ name: string; size: number; type: string } | null>(null)
const isDragOver = ref(false)

// Watch for file selection
watch(
  () => selectedFiles.value,
  (newFiles) => {
    // Simple approach: try to get the first file from whatever structure we have
    let fileToProcess: File | null = null

    if (newFiles) {
      if (Array.isArray(newFiles) && newFiles.length > 0) {
        fileToProcess = newFiles[0]
      } else if (newFiles instanceof File) {
        fileToProcess = newFiles
      } else if (newFiles.length && newFiles[0]) {
        fileToProcess = newFiles[0]
      }
    }

    if (fileToProcess) {
      processFile(fileToProcess)
    }
  }
) // Actions
function triggerFileInput() {
  fileInputRef.value?.click()
}

async function processFile(file: File) {
  if (!isValidFile(file)) {
    error.value = 'Please select a valid markdown or text file (.md, .txt, .markdown)'
    return
  }

  loading.value = true
  error.value = ''
  fileContent.value = ''
  fileInfo.value = null

  try {
    const content = await readFileAsText(file)
    const sanitized = sanitizeMarkdown(content)

    fileContent.value = sanitized
    fileInfo.value = {
      name: file.name,
      size: file.size,
      type: file.type,
    }

    // Note: Traditional file input doesn't provide a handle for File System Access API
    // But we still want to update the file store for consistency
    if (props.autoImport) {
      // Update file store without handle (traditional file input)
      fileStore.setFileHandle(null, file.name)
      fileStore.setContent(sanitized)
      
      // Emit fileImported event
      emit('fileImported', sanitized, { name: file.name, handle: null })
      // DON'T close dialog automatically - let user decide when to exit
      resetState()
    }
  } catch (err) {
    error.value = `Error reading file: ${err instanceof Error ? err.message : 'Unknown error'}`
  } finally {
    loading.value = false
  }
}
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'UTF-8')
  })
}

function isValidFile(file: File): boolean {
  const validExtensions = ['.md', '.txt', '.markdown']
  const validTypes = ['text/markdown', 'text/plain', 'text/x-markdown']

  const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  const hasValidType = validTypes.includes(file.type) || file.type === ''

  return hasValidExtension || hasValidType
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function onFileSelect() {
  // File processing is handled by the watcher
}

function onImport() {
  if (fileContent.value && fileInfo.value) {
    emit('fileImported', fileContent.value, { name: fileInfo.value.name })
    // DON'T close dialog automatically - let user decide when to exit editor
    resetState()
  }
}

async function openWithFileAPI() {
  try {
    loading.value = true
    error.value = ''

    const result = await openFile()
    if (result) {
      const sanitized = sanitizeMarkdown(result.content)

      // Update file store with handle
      fileStore.setFileHandle(result.handle, result.name)
      fileStore.setContent(sanitized)

      fileContent.value = sanitized
      fileInfo.value = {
        name: result.name,
        size: result.content.length,
        type: 'text/markdown',
      }

      // Auto-import if enabled
      if (props.autoImport) {
        emit('fileImported', sanitized, { name: result.name, handle: result.handle })
        // DON'T close dialog automatically - let user decide when to exit
        resetState()
      }
    }
  } catch (error: any) {
    console.error('File open failed:', error)
    error.value = `Failed to open file: ${error.message || 'Unknown error'}`
  } finally {
    loading.value = false
  }
}

function resetState() {
  selectedFiles.value = undefined
  fileContent.value = ''
  fileInfo.value = null
  error.value = ''
  loading.value = false
}

// Drag and Drop
function onDragEnter(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
}

function onDragLeave(event: DragEvent) {
  event.preventDefault()
  // Only set to false if we're leaving the drop zone itself
  const target = event.currentTarget as HTMLElement
  const related = event.relatedTarget as HTMLElement
  if (!target?.contains(related)) {
    isDragOver.value = false
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false

  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length > 0) {
    selectedFiles.value = files // This will be handled by the watcher
  }
}

// Expose for testing
defineExpose({
  fileContent,
  processFile,
  resetState,
  onImport,
})
</script>

<style scoped>
.file-loader-content {
  min-height: 200px;
}

.drop-zone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  transition: all 0.2s ease;
  margin: 16px 0;
  cursor: pointer;
}

.drop-zone:hover,
.drop-zone--dragover {
  border-color: rgba(var(--v-theme-primary), 0.6);
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.file-info {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
