<template>
  <v-toolbar color="primary" density="compact" class="editor-toolbar">
    <v-btn icon="mdi-close" @click="onClose" />

    <v-toolbar-title>{{ fileDisplayName }}</v-toolbar-title>

    <v-spacer />

    <!-- File Operations -->
    <v-btn icon="mdi-file-plus" @click="onNew" :title="t('fileLoader.newFile')" />

    <!-- Save button - only show if can save directly -->
    <v-btn
      v-if="canSave"
      icon="mdi-content-save"
      @click="onSave"
      :disabled="saving"
      :title="t('fileLoader.save')"
    />

    <!-- Save Copy button - always available, more prominent if can't save directly -->
    <v-btn
      :icon="canSaveAsNewCopy ? 'mdi-content-save' : 'mdi-content-save-outline'"
      @click="onSaveCopy"
      :disabled="saving"
      :title="canSaveAsNewCopy ? t('fileLoader.save') : t('fileLoader.saveCopy')"
      :color="canSaveAsNewCopy ? 'primary' : undefined"
    />

    <!-- Open File button -->
    <v-btn
      icon="mdi-folder-open"
      @click="onOpenFile"
      :disabled="refreshing"
      :title="t('fileLoader.openFile')"
      data-testid="open-file-button"
    />

    <!-- Cloud Open button -->
    <v-btn 
      icon="mdi-cloud" 
      @click="onOpenCloud" 
      :title="t('cloud.files.openFile', 'Abrir desde la nube')" 
    />

    <!-- Save to Cloud button -->
    <v-btn 
      icon="mdi-cloud-upload" 
      variant="text"
      @click="onSaveToCloud" 
      :disabled="!dropboxConnected || saving"
      :title="t('cloud.files.saveFile', 'Guardar en la nube')" 
    />

    <v-divider vertical class="mx-2" />

    <!-- Desktop layout toggle -->
    <v-btn
      v-if="!$vuetify.display.mobile"
      :icon="showPreview ? 'mdi-view-split-vertical' : 'mdi-eye'"
      @click="onTogglePreview"
    />

    <!-- Mobile preview toggle -->
    <v-btn
      v-if="$vuetify.display.mobile"
      :icon="mobileView === 'edit' ? 'mdi-eye' : 'mdi-pencil'"
      @click="onToggleMobileView"
    />

    <!-- Markdown Help button -->
    <v-btn
      icon="mdi-help-circle-outline"
      @click="onMarkdownHelp"
      :title="t('editor.markdownHelp')"
      data-testid="markdown-help-button"
    />

    <v-btn icon="mdi-check" @click="onApply" />
  </v-toolbar>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// Props
interface Props {
  fileDisplayName: string
  canSave: boolean
  canSaveAsNewCopy: boolean
  saving: boolean
  refreshing: boolean
  dropboxConnected: boolean
  showPreview: boolean
  mobileView: 'edit' | 'preview'
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  new: []
  save: []
  saveCopy: []
  openFile: []
  openCloud: []
  saveToCloud: []
  togglePreview: []
  toggleMobileView: []
  markdownHelp: []
  apply: []
}>()

// Composables
const { t } = useI18n()

// Event handlers
function onClose() {
  emit('close')
}

function onNew() {
  emit('new')
}

function onSave() {
  emit('save')
}

function onSaveCopy() {
  emit('saveCopy')
}

function onOpenFile() {
  emit('openFile')
}

function onOpenCloud() {
  emit('openCloud')
}

function onSaveToCloud() {
  emit('saveToCloud')
}

function onTogglePreview() {
  emit('togglePreview')
}

function onToggleMobileView() {
  emit('toggleMobileView')
}

function onMarkdownHelp() {
  emit('markdownHelp')
}

function onApply() {
  emit('apply')
}
</script>

<style scoped>
.editor-toolbar {
  flex-shrink: 0;
}
</style>