<template>
  <div 
    class="dropbox-file-explorer" 
    :class="{ 'compact-mode': compactMode }"
  >
    <!-- Header - Only show in non-compact mode -->
    <v-card-title 
      v-if="!compactMode"
      class="d-flex align-center"
    >
      <v-icon
        color="primary"
        class="me-2"
      >
        mdi-folder-open
      </v-icon>
      {{ $t('dropbox.files.title', 'Explorador de archivos') }}
    </v-card-title>

    <div class="file-explorer-content" :class="{ 'pa-4': !compactMode, 'pa-2': compactMode }">
      <!-- Navegación -->
      <div class="d-flex align-center mb-4">
        <v-btn
          v-if="dropboxStore.currentPath"
          icon
          variant="text"
          size="small"
          @click="navigateUp"
        >
          <v-icon>mdi-arrow-left</v-icon>
        </v-btn>
        
        <v-chip
          color="primary"
          variant="tonal"
          class="ms-2"
        >
          <v-icon start>
            mdi-folder
          </v-icon>
          {{ currentPathDisplay }}
        </v-chip>
      </div>

      <!-- Estado de carga -->
      <div
        v-if="isLoading"
        class="text-center py-8"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="48"
        />
        <p class="text-body-2 mt-4">
          {{ $t('dropbox.files.loading') }}
        </p>
      </div>

      <!-- Lista de archivos -->
      <div v-else-if="dropboxStore.currentFiles.length > 0">
        <v-list 
          :class="{ 'compact-list': compactMode }"
          :density="compactMode ? 'compact' : 'default'"
        >
          <v-list-item
            v-for="file in dropboxStore.currentFiles"
            :key="file.id"
            :class="{ 
              'selected-file': compactMode && selectedFile?.id === file.id,
              'selectable': compactMode && !file.isFolder && isTextFile(file.name)
            }"
            @click="handleFileClick(file)"
          >
            <template #prepend>
              <v-icon :color="file.isFolder ? 'amber' : 'blue'">
                {{ file.isFolder ? 'mdi-folder' : 'mdi-file-document' }}
              </v-icon>
            </template>

            <v-list-item-title>{{ file.name }}</v-list-item-title>
            <v-list-item-subtitle v-if="!file.isFolder">
              {{ formatFileSize(file.size) }} • {{ formatDate(file.modified) }}
            </v-list-item-subtitle>

            <template #append>
              <!-- Only show action buttons in full mode -->
              <div v-if="!compactMode" class="d-flex">
                <!-- Abrir archivo (solo archivos .md o .txt) -->
                <v-btn
                  v-if="!file.isFolder && isTextFile(file.name)"
                  icon
                  variant="text"
                  size="small"
                  color="success"
                  @click.stop="openFile(file)"
                >
                  <v-icon>mdi-open-in-new</v-icon>
                </v-btn>

                <!-- Descargar archivo -->
                <v-btn
                  v-if="!file.isFolder"
                  icon
                  variant="text"
                  size="small"
                  color="primary"
                  @click.stop="downloadFile(file)"
                >
                  <v-icon>mdi-download</v-icon>
                </v-btn>

                <!-- Eliminar archivo -->
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  @click.stop="confirmDelete(file)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- Estado vacío -->
      <div
        v-else
        class="text-center py-8"
      >
        <v-icon
          size="64"
          color="grey-lighten-1"
          class="mb-4"
        >
          mdi-folder-open-outline
        </v-icon>
        <p class="text-body-2 text-medium-emphasis">
          {{ $t('dropbox.files.empty') }}
        </p>
      </div>

      <!-- Error -->
      <v-alert
        v-if="dropboxStore.error"
        type="error"
        variant="tonal"
        class="mt-4"
        closable
        @click:close="dropboxStore.clearError"
      >
        {{ dropboxStore.error }}
      </v-alert>
    </div>

    <!-- Diálogo de confirmación de eliminación -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>
          {{ $t('dropbox.files.deleteFile') }}
        </v-card-title>
        <v-card-text>
          {{ $t('dropbox.files.deleteConfirm', { name: fileToDelete?.name }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            @click="showDeleteDialog = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            @click="deleteFile"
          >
            {{ $t('common.delete', 'Eliminar') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de subida de archivo -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDropboxStore } from '@/stores/useDropboxStore'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import type { CloudFile } from '@/types/cloud'

// Props
interface Props {
  modelValue?: boolean
  compactMode?: boolean
}

// Emits
interface Emits {
  (e: 'file-selected', file: CloudFile): void // Changed: no content, just file selection
  (e: 'update:modelValue', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  compactMode: false
})

const emit = defineEmits<Emits>()

// Composables
const dropboxStore = useDropboxStore()
const teleprompterStore = useTeleprompterStore()

// Estado local
const isLoading = ref(false)
const selectedFile = ref<CloudFile | null>(null)
const showDeleteDialog = ref(false)
const fileToDelete = ref<CloudFile | null>(null)

// Computed
const currentPathDisplay = computed(() => {
  if (!dropboxStore.currentPath) return 'Apuntador' // App name, not translatable
  return dropboxStore.currentPath.split('/').pop() || 'Apuntador'
})

// Métodos
const navigateUp = async (): Promise<void> => {
  isLoading.value = true
  try {
    await dropboxStore.navigateUp()
  } finally {
    isLoading.value = false
  }
}

const handleFileClick = async (file: CloudFile): Promise<void> => {
  if (file.isFolder) {
    isLoading.value = true
    try {
      await dropboxStore.navigateToFolder(file.path)
    } finally {
      isLoading.value = false
    }
  } else {
    // In compact mode, select the file instead of opening it
    if (props.compactMode) {
      selectedFile.value = file
      emit('file-selected', file)
    }
  }
}

const isTextFile = (fileName: string): boolean => {
  const extensions = ['.md', '.txt', '.markdown']
  return extensions.some(ext => fileName.toLowerCase().endsWith(ext))
}

const openFile = async (file: CloudFile): Promise<void> => {
  try {
    isLoading.value = true
    const content = await dropboxStore.downloadFile(file.path)
    
    // Cargar contenido en el teleprompter
    teleprompterStore.setContent(content)
    
    // Emitir evento (solo el archivo, no el contenido)
    emit('file-selected', file)
    
    // DON'T close dialog automatically - let user decide when to exit editor
  } catch (error) {
    console.error('Error opening file:', error)
  } finally {
    isLoading.value = false
  }
}

const downloadFile = async (file: CloudFile): Promise<void> => {
  try {
    const content = await dropboxStore.downloadFile(file.path)
    
    // Crear blob y descargar
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file:', error)
  }
}

const confirmDelete = (file: CloudFile): void => {
  fileToDelete.value = file
  showDeleteDialog.value = true
}

const deleteFile = async (): Promise<void> => {
  if (!fileToDelete.value) return
  
  try {
    await dropboxStore.deleteFile(fileToDelete.value.path)
    showDeleteDialog.value = false
    fileToDelete.value = null
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const loadFiles = async (): Promise<void> => {
  if (!dropboxStore.isConnected) return
  
  isLoading.value = true
  try {
    await dropboxStore.loadFiles()
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  if (dropboxStore.isConnected) {
    loadFiles()
  }
})
</script>

<style scoped>
.dropbox-file-explorer {
  max-width: 600px;
  min-height: 400px;
}

/* Compact mode styles */
.dropbox-file-explorer.compact-mode {
  max-width: 100%;
  min-height: 300px;
}

.compact-list {
  max-height: 300px;
  overflow-y: auto;
}

.selectable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.selectable:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.selected-file {
  background-color: rgba(var(--v-theme-primary), 0.12);
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.selected-file .v-list-item-title {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

/* Compact layout for file explorer content */
.file-explorer-content {
  padding: 8px;
}

.dropbox-content-container {
  max-height: 450px;
  overflow: hidden;
}

.dropbox-explorer-container {
  height: 400px;
  overflow: hidden;
}
</style>