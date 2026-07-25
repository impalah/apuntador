<template>
  <div class="editor-toolbar-container">
    <div class="editor-toolbar">
      <!-- Nuevo -->
      <button
        class="toolbar-btn"
        :aria-label="t('fileLoader.newFile')"
        data-testid="new-file-button"
        @click="onNew"
      >
        <v-icon
          icon="mdi-file-plus"
          size="28"
        />
      </button>

      <!-- Abrir archivo -->
      <button
        class="toolbar-btn"
        :aria-label="t('fileLoader.openFile')"
        :disabled="refreshing"
        data-testid="open-file-button"
        @click="onOpenFile"
      >
        <v-icon
          icon="mdi-folder-open"
          size="28"
        />
      </button>

      <!-- Guardar -->
      <button
        class="toolbar-btn"
        :aria-label="t('fileLoader.save')"
        :disabled="saving"
        data-testid="save-button"
        @click="onSave"
      >
        <v-icon
          icon="mdi-content-save"
          size="28"
        />
      </button>

      <!-- Configuración -->
      <button
        class="toolbar-btn"
        :aria-label="t('settings.options')"
        data-testid="settings-button"
        @click="onOpenSettings"
      >
        <v-icon
          icon="mdi-tune-variant"
          size="28"
        />
      </button>

      <!-- Ayuda -->
      <button
        class="toolbar-btn"
        :aria-label="t('editor.markdownHelp')"
        data-testid="markdown-help-button"
        @click="onMarkdownHelp"
      >
        <v-icon
          icon="mdi-help-circle-outline"
          size="28"
        />
      </button>

      <!-- Cerrar -->
      <button
        class="toolbar-btn"
        :aria-label="t('common.close')"
        data-testid="close-button"
        @click="onClose"
      >
        <v-icon
          icon="mdi-close"
          size="28"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// Props
interface Props {
  saving: boolean
  refreshing: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  new: []
  save: []
  openFile: []
  openSettings: []
  markdownHelp: []
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

function onOpenSettings() {
  emit('openSettings')
}

function onMarkdownHelp() {
  emit('markdownHelp')
}
</script>

<style scoped>
.editor-toolbar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
  pointer-events: none;
}

.editor-toolbar {
  pointer-events: auto;
  min-width: 320px;
  max-width: calc(100vw - 40px);
  border-radius: 28px;
  background: #1a1a1a; /* Gris oscuro como FloatingToolbar */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  padding: 8px 20px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  gap: 12px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000; /* Fondo negro para contraste */
  border: none;
  color: white;
  cursor: pointer;
  padding: 12px;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}

.toolbar-btn:hover:not(:disabled) {
  background: #111; /* Negro más claro al hover */
}

.toolbar-btn:active:not(:disabled) {
  transform: scale(0.95);
  background: #222;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Responsive adjustments */
@media (max-width: 360px) {
  .editor-toolbar {
    min-width: 280px;
    gap: 8px;
    padding: 8px 16px;
  }
  
  .toolbar-btn {
    width: 48px;
    height: 48px;
    padding: 10px;
  }
}

@media (min-width: 600px) {
  .editor-toolbar {
    max-width: 600px;
    gap: 16px;
    padding: 10px 24px;
  }
  
  .toolbar-btn {
    width: 56px;
    height: 56px;
    padding: 14px;
  }
}
</style>