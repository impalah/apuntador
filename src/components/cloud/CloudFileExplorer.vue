<template>
  <div 
    class="cloud-file-explorer" 
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
      {{ t('cloud.files.title', 'File Explorer') }}
    </v-card-title>

    <div class="file-explorer-content" :class="{ 'pa-4': !compactMode, 'pa-2': compactMode }">
      <!-- Navegación -->
      <div class="d-flex align-center mb-4">
        <v-btn
          v-if="cloudStore.currentPath"
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

        <v-spacer />

        <!-- Provider indicator -->
        <v-chip
          v-if="cloudStore.activeProvider"
          size="small"
          variant="tonal"
        >
          <v-icon start size="small">
            {{ getProviderIcon(cloudStore.activeProvider.id) }}
          </v-icon>
          {{ cloudStore.activeProvider.name }}
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
          {{ t('cloud.files.loading') }}
        </p>
      </div>

      <!-- Lista de archivos -->
      <div v-else-if="cloudStore.currentFiles.length > 0">
        <v-list 
          :class="{ 'compact-list': compactMode }"
          :density="compactMode ? 'compact' : 'default'"
        >
          <v-list-item
            v-for="file in cloudStore.currentFiles"
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

      <!-- Lista vacía -->
      <div v-else class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1">
          mdi-folder-open-outline
        </v-icon>
        <p class="text-body-2 text-medium-emphasis mt-4">
          {{ t('cloud.files.empty') }}
        </p>
      </div>

      <!-- Error -->
      <v-alert
        v-if="cloudStore.error"
        type="error"
        variant="tonal"
        closable
        class="mt-4"
        @click:close="cloudStore.error = null"
      >
        {{ cloudStore.error }}
      </v-alert>

      <!-- Overlay para operaciones de descarga/subida -->
      <v-overlay
        :model-value="cloudStore.isDownloading || cloudStore.isUploading"
        contained
        persistent
        class="align-center justify-center"
      >
        <div class="text-center">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          />
          <p class="text-body-1 mt-4 white--text">
            {{ cloudStore.isDownloading ? t('cloud.files.downloading') : t('cloud.files.uploading') }}
          </p>
        </div>
      </v-overlay>
    </div>

    <!-- Diálogo de confirmación para eliminar -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>{{ t('cloud.files.deleteFile') }}</v-card-title>
        <v-card-text>
          {{ t('cloud.files.deleteConfirm', { name: fileToDelete?.name }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn 
            variant="text" 
            :disabled="cloudStore.isDeleting"
            @click="deleteDialog = false"
          >
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn 
            color="error" 
            variant="flat"
            :loading="cloudStore.isDeleting"
            @click="deleteFile"
          >
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCloudStore } from '@/stores/useCloudStore'
import type { CloudFile, CloudProviderId } from '@/types/cloud'

// Props
interface Props {
  compactMode?: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  fileSelected: [file: CloudFile]
  fileOpened: [file: CloudFile]
}>()

// Composables
const { t } = useI18n()
const cloudStore = useCloudStore()

// State
const selectedFile = ref<CloudFile | null>(null)
const deleteDialog = ref(false)
const fileToDelete = ref<CloudFile | null>(null)

// Computed
const isLoading = computed(() => cloudStore.isLoadingFiles)

const currentPathDisplay = computed(() => {
  if (!cloudStore.currentPath || cloudStore.currentPath === '' || cloudStore.currentPath === 'root') {
    return t('common.home', 'Home')
  }
  
  // For Google Drive, path is ID, so just show last part
  const parts = cloudStore.currentPath.split('/')
  return parts[parts.length - 1] || t('common.home', 'Home')
})

// Methods
function getProviderIcon(providerId: CloudProviderId): string {
  const icons: Record<CloudProviderId, string> = {
    dropbox: 'mdi-dropbox',
    googledrive: 'mdi-google-drive'
  }
  return icons[providerId] || 'mdi-cloud'
}

function isTextFile(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop()
  return ext === 'md' || ext === 'txt' || ext === 'markdown'
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString()
}

async function loadFiles(path?: string) {
  try {
    await cloudStore.loadFiles(path)
  } catch (error) {
    console.error('Error loading files:', error)
  }
}

async function navigateUp() {
  // For Dropbox, navigate to parent folder
  if (cloudStore.activeProviderId === 'dropbox') {
    const parts = cloudStore.currentPath.split('/')
    parts.pop()
    const parentPath = parts.join('/')
    await loadFiles(parentPath)
  } else {
    // For Google Drive, navigate to root
    await loadFiles('root')
  }
}

function handleFileClick(file: CloudFile) {
  if (file.isFolder) {
    loadFiles(file.path)
  } else {
    selectedFile.value = file
    emit('fileSelected', file)
  }
}

function openFile(file: CloudFile) {
  emit('fileOpened', file)
}

async function downloadFile(file: CloudFile) {
  try {
    const content = await cloudStore.downloadFile(file.path, file.name)
    
    // Trigger browser download
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file:', error)
  }
}

function confirmDelete(file: CloudFile) {
  fileToDelete.value = file
  deleteDialog.value = true
}

async function deleteFile() {
  if (!fileToDelete.value) return

  try {
    await cloudStore.deleteFile(fileToDelete.value.id)
    deleteDialog.value = false
    fileToDelete.value = null
  } catch (error) {
    console.error('Error deleting file:', error)
  }
}

// Lifecycle
onMounted(async () => {
  if (cloudStore.isConnected) {
    await loadFiles()
  }
})
</script>

<style scoped>
.cloud-file-explorer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.file-explorer-content {
  flex: 1;
  overflow-y: auto;
}

.compact-mode {
  background: transparent;
}

.compact-list {
  background: transparent;
}

.selected-file {
  background: rgba(var(--v-theme-primary), 0.1);
  border-left: 3px solid rgb(var(--v-theme-primary));
}

.selectable {
  cursor: pointer;
}

.selectable:hover {
  background: rgba(var(--v-theme-surface-variant), 0.5);
}

:deep(.v-list-item__prepend) {
  margin-right: 12px;
}
</style>
