<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="900"
    max-height="700"
    persistent
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center py-3 px-4 bg-surface-variant">
        <v-icon color="primary" class="me-2">
          {{ mode === 'open' ? 'mdi-folder-open' : 'mdi-content-save' }}
        </v-icon>
        {{ mode === 'open' ? t('fileLoader.openFile') : t('fileLoader.save') }}
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="onCancel"
        />
      </v-card-title>

      <v-tabs v-model="activeTab" bg-color="surface-variant">
        <v-tab value="local">
          <v-icon start>mdi-laptop</v-icon>
          {{ t('fileDialog.local') }}
        </v-tab>
        <v-tab value="cloud">
          <v-icon start>mdi-cloud</v-icon>
          {{ t('fileDialog.cloud') }}
        </v-tab>
      </v-tabs>

      <v-card-text style="min-height: 400px; max-height: 500px;" class="pa-0">
        <v-tabs-window v-model="activeTab">
          <!-- Local Tab -->
          <v-tabs-window-item value="local" class="pa-6">
            <div class="text-center">
              <v-icon size="64" color="primary" class="mb-4">
                {{ mode === 'open' ? 'mdi-file-document' : 'mdi-content-save-outline' }}
              </v-icon>
              
              <h3 class="text-h6 mb-2">
                {{ mode === 'open' ? t('fileDialog.localOpenTitle') : t('fileDialog.localSaveTitle') }}
              </h3>
              
              <p class="text-body-2 text-medium-emphasis mb-6">
                {{ mode === 'open' ? t('fileDialog.localOpenDescription') : t('fileDialog.localSaveDescription') }}
              </p>

              <v-btn
                color="primary"
                size="large"
                :prepend-icon="mode === 'open' ? 'mdi-folder-open' : 'mdi-content-save'"
                @click="onLocalAction"
              >
                {{ mode === 'open' ? t('fileDialog.browseFiles') : t('fileDialog.saveToComputer') }}
              </v-btn>

              <!-- Hidden file input for open mode -->
              <input
                v-if="mode === 'open'"
                ref="fileInputRef"
                type="file"
                accept=".md,.txt,.markdown"
                style="display: none"
                @change="onFileSelected"
              />
            </div>
          </v-tabs-window-item>

          <!-- Cloud Tab -->
          <v-tabs-window-item value="cloud">
            <!-- Not connected message -->
            <div v-if="!cloudStore.isConnected" class="pa-6 text-center">
              <v-icon size="64" color="warning" class="mb-4">
                mdi-cloud-off-outline
              </v-icon>
              
              <h3 class="text-h6 mb-2">
                {{ t('fileDialog.cloudNotConnected') }}
              </h3>
              
              <p class="text-body-2 text-medium-emphasis mb-6">
                {{ t('fileDialog.cloudNotConnectedDescription') }}
              </p>

              <v-btn
                color="primary"
                variant="outlined"
                prepend-icon="mdi-cog"
                @click="onOpenSettings"
              >
                {{ t('fileDialog.goToSettings') }}
              </v-btn>
            </div>

            <!-- Cloud file explorer -->
            <div v-else class="dropbox-explorer-container">
              <CloudFileExplorer
                compact-mode
                @file-selected="onCloudFileSelected"
              />
              
              <!-- File name input for save mode -->
              <div v-if="mode === 'save'" class="pa-4 bg-surface-variant">
                <v-text-field
                  v-model="fileName"
                  :label="t('fileDialog.fileName')"
                  variant="outlined"
                  density="compact"
                  :hint="t('fileDialog.fileNameHint')"
                  persistent-hint
                  prepend-inner-icon="mdi-file-document"
                />
              </div>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-4 py-3">
        <v-spacer />
        <v-btn variant="text" @click="onCancel">
          {{ t('common.cancel') }}
        </v-btn>
        <v-btn
          v-if="activeTab === 'cloud' && cloudStore.isConnected"
          color="primary"
          variant="flat"
          :disabled="!canAccept"
          @click="onAccept"
        >
          {{ mode === 'open' ? t('common.open') : t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCloudStore } from '@/stores/useCloudStore'
import CloudFileExplorer from '@/components/cloud/CloudFileExplorer.vue'
import type { CloudFile } from '@/types/cloud'

const { t } = useI18n()
const cloudStore = useCloudStore()

// Props
interface Props {
  modelValue: boolean
  mode: 'open' | 'save'
  suggestedFileName?: string
}

const props = withDefaults(defineProps<Props>(), {
  suggestedFileName: 'script.md'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'file-selected-local': [file: File]
  'file-selected-cloud': [file: CloudFile]
  'save-local': []
  'save-cloud': [fileName: string]
  'open-settings': []
}>()

// State
const activeTab = ref<'local' | 'cloud'>('local')
const fileInputRef = ref<HTMLInputElement>()
const selectedCloudFile = ref<CloudFile | null>(null)
const fileName = ref(props.suggestedFileName)

// Watch for prop changes
watch(() => props.suggestedFileName, (newName) => {
  fileName.value = newName
})

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    // Reset state when dialog opens
    selectedCloudFile.value = null
    fileName.value = props.suggestedFileName
    activeTab.value = 'local'
  }
})

// Computed
const canAccept = computed(() => {
  if (props.mode === 'open') {
    return !!selectedCloudFile.value && !selectedCloudFile.value.isFolder
  } else {
    return fileName.value.trim().length > 0
  }
})

// Methods
function onCancel() {
  emit('update:modelValue', false)
}

function onLocalAction() {
  if (props.mode === 'open') {
    // Trigger file input click
    fileInputRef.value?.click()
  } else {
    // Emit save-local event
    emit('save-local')
    emit('update:modelValue', false)
  }
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (file) {
    emit('file-selected-local', file)
    emit('update:modelValue', false)
  }
}

function onCloudFileSelected(file: CloudFile) {
  if (props.mode === 'open') {
    selectedCloudFile.value = file
  } else {
    // In save mode, if user clicks a file, use its name
    if (!file.isFolder) {
      fileName.value = file.name
    }
  }
}

function onAccept() {
  if (props.mode === 'open' && selectedCloudFile.value) {
    emit('file-selected-cloud', selectedCloudFile.value)
    emit('update:modelValue', false)
  } else if (props.mode === 'save') {
    const finalFileName = fileName.value.endsWith('.md') || fileName.value.endsWith('.txt')
      ? fileName.value
      : `${fileName.value}.md`
    
    emit('save-cloud', finalFileName)
    emit('update:modelValue', false)
  }
}

function onOpenSettings() {
  emit('open-settings')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.dropbox-explorer-container {
  min-height: 400px;
  max-height: 500px;
  overflow: auto; /* Cambiar de hidden a auto para permitir scroll */
  display: flex;
  flex-direction: column;
}

:deep(.v-tabs-window-item) {
  height: 100%;
}
</style>
