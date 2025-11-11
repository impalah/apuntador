<template>
  <v-toolbar color="primary" density="compact" class="editor-toolbar">
    <v-btn 
      icon="mdi-close"
      data-testid="close-button"
      @click="onClose"
    />

    <v-toolbar-title>{{ fileDisplayName }}</v-toolbar-title>

    <v-spacer />

    <!-- File Operations -->
    <v-btn icon="mdi-file-plus" @click="onNew" :title="t('fileLoader.newFile')" />

    <!-- Open File button (unified local + cloud) -->
    <v-btn
      icon="mdi-folder-open"
      @click="onOpenFile"
      :disabled="refreshing"
      :title="t('fileLoader.openFile')"
      data-testid="open-file-button"
    />

    <!-- Save button (unified local + cloud) -->
    <v-btn
      icon="mdi-content-save"
      @click="onSave"
      :disabled="saving"
      :title="t('fileLoader.save')"
    />

    <v-divider vertical class="mx-2" />

    <!-- Preview toggle (same for all screen sizes) -->
    <v-btn
      :icon="showPreview ? 'mdi-pencil' : 'mdi-eye'"
      @click="onTogglePreview"
      :title="showPreview ? t('editor.editMode') : t('editor.previewMode')"
    />

    <!-- Markdown Help button -->
    <v-btn
      icon="mdi-help-circle-outline"
      @click="onMarkdownHelp"
      :title="t('editor.markdownHelp')"
      data-testid="markdown-help-button"
    />

    <v-btn 
      icon="mdi-check"
      data-testid="apply-button"
      @click="onApply"
    />
  </v-toolbar>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// Props
interface Props {
  fileDisplayName: string
  saving: boolean
  refreshing: boolean
  showPreview: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  new: []
  save: []
  openFile: []
  togglePreview: []
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

function onOpenFile() {
  emit('openFile')
}

function onTogglePreview() {
  emit('togglePreview')
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