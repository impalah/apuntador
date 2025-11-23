<template>
  <v-bottom-sheet
    :model-value="modelValue"
    :persistent="false"
    :scrim="true"
    :z-index="10000"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card
      class="editor-actions-menu"
      :class="{ 'maximized': isMaximized }"
      rounded="t-xl"
    >
      <!-- Handle bar para indicar que es arrastrable -->
      <div class="handle-bar" @click="toggleMaximize">
        <div class="handle" />
      </div>

      <v-card-text class="menu-content">
        <!-- Settings View (when mode is 'settings') - Use ActionsMenu from prompter -->
        <ActionsMenu
          v-if="mode === 'settings'"
          :model-value="true"
          :font-size="prefsStore.fontSizePx"
          :mirror-h="prefsStore.mirrorH"
          :mirror-v="prefsStore.mirrorV"
          :initial-settings-view="true"
          @update:model-value="emit('update:modelValue', $event)"
        />

        <!-- File Operations View (when no provider selected) -->
        <div v-else-if="!selectedProvider" class="file-operations-container">
          <!-- Header -->
          <div class="operations-header">
            <h2 class="operations-title">
              {{ mode === 'open' ? t('fileLoader.openFile') : t('fileLoader.save') }}
            </h2>
          </div>

          <!-- Operations Content -->
          <div class="operations-content">
            <!-- Local File Option -->
            <v-card
              class="operation-card"
              variant="outlined"
              @click="onLocalFile"
            >
              <v-card-text class="d-flex align-center">
                <v-icon icon="mdi-laptop" size="32" class="mr-4" />
                <div>
                  <div class="text-h6">
                    {{ mode === 'open' ? t('cloud.files.openLocal') : t('cloud.files.saveLocal') }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ mode === 'open' ? t('cloud.files.openLocalDesc') : t('cloud.files.saveLocalDesc') }}
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Cloud Storage Options -->
            <v-divider class="my-4" />
            
            <div class="text-overline mb-2">
              {{ t('cloud.storage') }}
            </div>

            <!-- Google Drive -->
            <v-card
              class="operation-card mb-3"
              variant="outlined"
              :disabled="!isGoogleDriveConnected"
              @click="onSelectCloudProvider('googledrive')"
            >
              <v-card-text class="d-flex align-center">
                <v-icon icon="mdi-google-drive" size="32" class="mr-4" color="primary" />
                <div class="flex-grow-1">
                  <div class="text-h6">Google Drive</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ isGoogleDriveConnected 
                      ? (mode === 'open' ? t('cloud.files.openFrom') : t('cloud.files.saveTo')) + ' Google Drive'
                      : t('cloud.notConnected') 
                    }}
                  </div>
                </div>
                <v-chip
                  v-if="!isGoogleDriveConnected"
                  size="small"
                  color="warning"
                  variant="flat"
                >
                  {{ t('cloud.notConnected') }}
                </v-chip>
              </v-card-text>
            </v-card>

            <!-- Dropbox -->
            <v-card
              class="operation-card mb-3"
              variant="outlined"
              :disabled="!isDropboxConnected"
              @click="onSelectCloudProvider('dropbox')"
            >
              <v-card-text class="d-flex align-center">
                <v-icon icon="mdi-dropbox" size="32" class="mr-4" color="primary" />
                <div class="flex-grow-1">
                  <div class="text-h6">Dropbox</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ isDropboxConnected 
                      ? (mode === 'open' ? t('cloud.files.openFrom') : t('cloud.files.saveTo')) + ' Dropbox'
                      : t('cloud.notConnected') 
                    }}
                  </div>
                </div>
                <v-chip
                  v-if="!isDropboxConnected"
                  size="small"
                  color="warning"
                  variant="flat"
                >
                  {{ t('cloud.notConnected') }}
                </v-chip>
              </v-card-text>
            </v-card>

            <!-- Cloud Settings Link -->
            <v-btn
              variant="text"
              color="primary"
              prepend-icon="mdi-tune-variant"
              block
              @click="onOpenCloudSettings"
            >
              {{ t('cloud.manageConnections') }}
            </v-btn>
          </div>
        </div>

        <!-- Cloud File Explorer View (when provider selected) -->
        <div v-else class="cloud-explorer-container">
          <!-- Header with back button -->
          <div class="explorer-header d-flex align-center mb-4">
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              @click="onBackToProviders"
            />
            <h2 class="operations-title ml-2">
              {{ selectedProvider === 'googledrive' ? 'Google Drive' : 'Dropbox' }}
            </h2>
          </div>

          <!-- Cloud File Explorer Component -->
          <CloudFileExplorer
            compact-mode
            @file-selected="onCloudFileSelected"
          />

          <!-- File name input for save mode -->
          <div v-if="mode === 'save'" class="mt-4">
            <v-text-field
              v-model="fileName"
              :label="t('fileDialog.fileName')"
              variant="outlined"
              density="compact"
              :hint="t('fileDialog.fileNameHint')"
              persistent-hint
              prepend-inner-icon="mdi-file-document"
            />
            <v-btn
              color="primary"
              block
              class="mt-3"
              @click="onSaveToCloud"
            >
              {{ t('fileLoader.save') }}
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCloudStore } from '@/stores/useCloudStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import type { CloudProviderId, CloudFile } from '@/types/cloud'
import CloudFileExplorer from '@/components/cloud/CloudFileExplorer.vue'
import ActionsMenu from '@/components/ActionsMenu.vue'

// I18n
const { t } = useI18n()

// Stores
const cloudStore = useCloudStore()
const prefsStore = usePrefsStore()

// Props
interface Props {
  modelValue: boolean
  mode: 'open' | 'save' | 'settings'
  suggestedFileName?: string
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'local-file': []
  'cloud-file': [provider: CloudProviderId]
  'file-selected': [file: CloudFile]
  'save-cloud': [fileName: string]
  'open-settings': []
}>()

// State
const isMaximized = ref(false)
const selectedProvider = ref<CloudProviderId | null>(null)
const fileName = ref('')

// Watch for suggested file name changes
watch(() => props.suggestedFileName, (newName) => {
  if (newName) {
    fileName.value = newName
  }
}, { immediate: true })

// Watch for modelValue changes to reset state
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    selectedProvider.value = null
  }
})

// Computed
const isGoogleDriveConnected = computed(() => {
  const provider = cloudStore.availableProviders.find(p => p.id === 'googledrive')
  return provider?.isConnected || false
})

const isDropboxConnected = computed(() => {
  const provider = cloudStore.availableProviders.find(p => p.id === 'dropbox')
  return provider?.isConnected || false
})

// Methods
function toggleMaximize() {
  isMaximized.value = !isMaximized.value
}

function onLocalFile() {
  emit('local-file')
  emit('update:modelValue', false)
}

function onSelectCloudProvider(provider: CloudProviderId) {
  if (provider === 'googledrive' && !isGoogleDriveConnected.value) return
  if (provider === 'dropbox' && !isDropboxConnected.value) return
  
  // Set the provider as active in the store
  cloudStore.setActiveProvider(provider)
  
  // Show the cloud file explorer
  selectedProvider.value = provider
}

function onBackToProviders() {
  selectedProvider.value = null
}

function onCloudFileSelected(file: CloudFile) {
  emit('file-selected', file)
  emit('update:modelValue', false)
  selectedProvider.value = null
}

function onSaveToCloud() {
  if (!fileName.value) return
  
  emit('save-cloud', fileName.value)
  emit('update:modelValue', false)
  selectedProvider.value = null
}

function onOpenCloudSettings() {
  emit('open-settings')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.editor-actions-menu {
  background: #1a1a1a !important;
  color: white;
  max-height: 85vh;
  transition: max-height 0.3s ease;
}

.editor-actions-menu.maximized {
  max-height: 95vh;
}

.handle-bar {
  display: flex;
  justify-content: center;
  padding: 12px 0 8px 0;
  cursor: pointer;
  user-select: none;
}

.handle {
  width: 40px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  transition: background 0.2s ease;
}

.handle-bar:hover .handle {
  background: rgba(255, 255, 255, 0.5);
}

.menu-content {
  overflow-y: auto;
  max-height: calc(85vh - 40px);
  padding: 16px 24px 24px 24px;
}

.maximized .menu-content {
  max-height: calc(95vh - 40px);
}

.file-operations-container,
.cloud-explorer-container {
  width: 100%;
}

.operations-header,
.explorer-header {
  margin-bottom: 24px;
  text-align: center;
}

.explorer-header {
  text-align: left;
}

.operations-title {
  font-size: 1.5rem;
  font-weight: 500;
  color: white;
}

.operations-content {
  margin-top: 16px;
}

.operation-card {
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}

.operation-card:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08) !important;
  border-color: rgba(255, 255, 255, 0.2) !important;
  transform: translateY(-2px);
}

.operation-card:active:not(:disabled) {
  transform: translateY(0);
}

.operation-card:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 600px) {
  .menu-content {
    padding: 12px 16px 20px 16px;
  }

  .operations-title {
    font-size: 1.25rem;
  }
}
</style>
