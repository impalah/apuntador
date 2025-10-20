<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    fullscreen
    transition="dialog-bottom-transition"
    data-testid="markdown-editor-dialog"
  >
    <v-card class="editor-card" data-testid="markdown-editor">
      <v-toolbar color="primary" density="compact" class="editor-toolbar">
        <v-btn icon="mdi-close" @click="onCancel" />

        <v-toolbar-title>{{ fileState.displayName }}</v-toolbar-title>

        <v-spacer />

        <!-- File Operations -->
        <v-btn icon="mdi-file-plus" @click="onNew" :title="t('fileLoader.newFile')" />

        <!-- Save button - only show if can save directly -->
        <v-btn
          v-if="fileState.canSave"
          icon="mdi-content-save"
          @click="onSave"
          :disabled="saving"
          :title="t('fileLoader.save')"
        />

        <!-- Save Copy button - always available, more prominent if can't save directly -->
        <v-btn
          :icon="fileState.canSaveAsNewCopy ? 'mdi-content-save' : 'mdi-content-save-outline'"
          @click="onSaveCopy"
          :disabled="saving"
          :title="fileState.canSaveAsNewCopy ? t('fileLoader.save') : t('fileLoader.saveCopy')"
          :color="fileState.canSaveAsNewCopy ? 'primary' : undefined"
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
          :disabled="!dropboxStore.isConnected || saving"
          :title="t('cloud.files.saveFile', 'Guardar en la nube')" 
        />

        <v-divider vertical class="mx-2" />

        <!-- Desktop layout toggle -->
        <v-btn
          v-if="!$vuetify.display.mobile"
          :icon="showPreview ? 'mdi-view-split-vertical' : 'mdi-eye'"
          @click="showPreview = !showPreview"
        />

        <!-- Mobile preview toggle -->
        <v-btn
          v-if="$vuetify.display.mobile"
          :icon="mobileView === 'edit' ? 'mdi-eye' : 'mdi-pencil'"
          @click="toggleMobileView"
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

      <v-container fluid class="editor-container pa-0">
        <!-- Desktop: Side-by-side layout -->
        <v-row v-if="!$vuetify.display.mobile" no-gutters class="editor-content">
          <v-col :cols="showPreview ? 6 : 12">
            <div class="editor-panel">
              <v-textarea
                ref="textareaRef"
                v-model="localContent"
                variant="solo-filled"
                flat
                hide-details
                no-resize
                class="editor-textarea"
                :placeholder="t('editor.placeholder')"
                @keydown="onKeyDown"
              />
            </div>
          </v-col>

          <v-divider v-if="showPreview" vertical />

          <v-col v-if="showPreview" cols="6">
            <div class="preview-panel" :style="previewPanelStyle">
              <div class="preview-content" :style="previewStyle" v-html="compiledPreview" />
            </div>
          </v-col>
        </v-row>

        <!-- Mobile: Single view with toggle -->
        <div v-else class="editor-content mobile">
          <div v-if="mobileView === 'edit'" class="editor-panel">
            <v-textarea
              ref="textareaRef"
              v-model="localContent"
              variant="solo-filled"
              flat
              hide-details
              no-resize
              class="editor-textarea mobile"
              :placeholder="t('editor.placeholder')"
              @keydown="onKeyDown"
            />
          </div>

          <div v-else class="preview-panel" :style="previewPanelStyle">
            <div class="preview-content" :style="previewStyle" v-html="compiledPreview" />
          </div>
        </div>
      </v-container>

      <!-- Help FAB -->
      <v-fab icon="mdi-help" location="bottom end" size="small" @click="showHelp = !showHelp" />

      <!-- Help dialog -->
      <v-dialog v-model="showHelp" max-width="500">
        <v-card>
          <v-card-title>{{ t('editor.markdownHelp') }}</v-card-title>
          <v-card-text>
            <div class="help-content">
              <h4>{{ t('editor.basicSyntax') }}</h4>
              <pre><code># Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*
==Highlighted text==

- Bullet point
1. Numbered list

> Blockquote

`inline code`

```
Code block
```

[Link](https://example.com)</code></pre>

              <h4>{{ t('editor.specialFeatures') }}</h4>
              <ul>
                <li>{{ t('editor.superscript') }}: H^2^O</li>
                <li>{{ t('editor.subscript') }}: H~2~O</li>
                <li>{{ t('editor.footnotes') }}: Text[^1]</li>
              </ul>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="showHelp = false">{{ t('common.close') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dropbox Dialog - Compact File Picker Style -->
      <!-- Cloud File Explorer Dialog -->
      <v-dialog 
        v-model="showCloudDialog"
        max-width="900"
        max-height="600"
        persistent
        scrollable
      >
        <v-card class="dropbox-file-picker">
          <v-card-title class="d-flex align-center py-3 px-4 bg-surface-variant">
            <v-icon
              color="primary"
              class="me-2"
            >
              mdi-cloud
            </v-icon>
            {{ t('cloud.files.openFile', 'Abrir desde la nube') }}
            <v-spacer />
            <v-btn
              icon="mdi-close"
              variant="text"
              size="small"
              @click="onCancelCloud"
            />
          </v-card-title>
          
          <!-- Compact content area -->
          <div class="dropbox-content-container">
            <!-- Mostrar conexión si no está conectado -->
            <div
              v-if="!dropboxStore.isConnected"
              class="pa-6 text-center"
            >
              <DropboxConnection />
            </div>
            
            <!-- Mostrar explorador compacto si está conectado -->
            <div
              v-else
              class="dropbox-explorer-container"
            >
              <DropboxFileExplorer
                @file-selected="onCloudFileSelected"
                compact-mode
              />
            </div>
          </div>

          <!-- Action buttons -->
          <v-card-actions class="px-4 py-3 bg-surface-variant">
            <v-spacer />
            <v-btn
              variant="text"
              @click="onCancelCloud"
            >
              {{ t('common.cancel', 'Cancelar') }}
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              :disabled="!selectedCloudFile"
              @click="onAcceptCloud"
            >
              {{ t('common.open', 'Abrir') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>

  <!-- Cloud Save Dialog -->
  <v-dialog 
    v-model="showCloudSaveDialog" 
    max-width="900px" 
    persistent 
    scrollable
  >
    <v-card>
      <v-card-title>
        <span class="text-h6">{{ t('dropbox.files.saveFile', 'Guardar archivo') }}</span>
      </v-card-title>

      <v-card-text style="max-height: 600px;">
        <!-- File Explorer for navigation -->
        <DropboxFileExplorer 
          :compact-mode="true"
          @file-selected="onSaveLocationSelected"
        />
        
        <!-- File name input -->
        <v-divider class="my-4" />
        <v-text-field
          v-model="suggestedFileName"
          :label="t('cloud.files.fileName', 'Nombre del archivo')"
          variant="outlined"
          density="compact"
          hint="Incluye la extensión (.md, .txt)"
          persistent-hint
          class="mt-2"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="onCancelCloudSave"
        >
          {{ t('common.cancel', 'Cancelar') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!suggestedFileName.trim() || saving"
          :loading="saving"
          @click="onSaveCloudFile"
        >
          {{ t('cloud.files.saveFile', 'Guardar') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { compileMarkdown } from '@/utils/markdown'
import { useDropboxStore } from '@/stores/useDropboxStore'
import DropboxConnection from '@/components/cloud/DropboxConnection.vue'
import DropboxFileExplorer from '@/components/cloud/DropboxFileExplorer.vue'
import type { EditorProps, EditorEmits } from '@/types/editor'
import type { CloudFile } from '@/types/cloud'
/**
 * MarkdownEditor: Editor modular e intercambiable para contenido markdown.
 * Props y eventos definidos en src/types/editor.d.ts
 */

// I18n
const { t } = useI18n()

// Props formales
const props = defineProps<EditorProps>()

// Preferir pasar stores y acciones por props para mayor aislamiento
// const prefsStore = usePrefsStore()
// const fileStore = useFileStore()

// Emits formales
const emit = defineEmits<EditorEmits>()

// State
const localContent = ref('')
const showPreview = ref(true)
const mobileView = ref<'edit' | 'preview'>('edit')
const showHelp = ref(false)
const textareaRef = ref()
const saving = ref(false)
const refreshing = ref(false)

// Cloud state
const dropboxStore = useDropboxStore()
const showCloudDialog = ref(false)
const selectedCloudFile = ref<CloudFile | null>(null)
const showCloudSaveDialog = ref(false)
const suggestedFileName = ref('')

// Computed
const compiledPreview = computed(() => {
  try {
    return compileMarkdown(localContent.value)
  } catch (error) {
    return `<p style=\"color: red;\">Error compiling markdown: ${error}</p>`
  }
})

const previewStyle = computed(() => {
  // Aseguramos que textAlign sea un valor CSS válido
  let align: 'left' | 'center' | 'right' | 'justify' = 'left'
  switch (props.displayPrefs.textAlignment) {
    case 'center':
    case 'right':
    case 'justify':
      align = props.displayPrefs.textAlignment as typeof align
      break
    default:
      align = 'left'
  }
  return {
    textAlign: align,
    backgroundColor: props.displayPrefs.bgColor,
    color: props.displayPrefs.fgColor,
  }
})

const previewPanelStyle = computed(() => {
  return {
    backgroundColor: props.displayPrefs.bgColor,
  }
})

// Watch for prop changes
watch(
  () => props.content,
  (newContent) => {
    localContent.value = newContent
  },
  { immediate: true }
)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      localContent.value = props.content
      props.fileActions.setContent(props.content)
      nextTick(() => {
        // Focus the textarea when dialog opens
        textareaRef.value?.focus()
      })
    }
  }
)

// Watch for content changes to mark as modified
watch(
  () => localContent.value,
  (newContent) => {
    if (newContent !== props.fileState.originalContent) {
      props.fileActions.markAsModified()
    }
  }
)

// Actions
async function onNew() {
  // Check for unsaved changes
  if (props.fileState.hasUnsavedChanges) {
    if (!confirm(t('editor.discardChanges'))) {
      return
    }
  }

  // Clear everything - both file store and local content
  props.fileActions.createNew()
  localContent.value = ''
  
  // Also update teleprompter store to keep everything in sync
  emit('save', '')
  
  // Note: Do NOT close editor here - keep editor open
  // Only 'onApply' should close the editor
}

async function onSave() {
  if (!props.fileState.canSave) {
    // If can't save directly (new file or no handle), trigger save as new file
    await onSaveAsNewFile()
    return
  }
  // Save directly to existing file
  emit('save', localContent.value)
}

async function onSaveCopy() {
  // Always save as a new file
  await onSaveAsNewFile()
}

async function onSaveAsNewFile() {
  try {
    saving.value = true
    
    // Use File System Access API to save as new file
    const { saveFile } = await import('@/utils/fileSystem')
    const fileHandle = await saveFile(localContent.value, {
      suggestedName: props.fileState.isNewFile ? 'script.md' : props.fileState.fileName
    })
    
    if (fileHandle) {
      // Update file store with new file handle
      props.fileActions.setFileHandle(fileHandle, fileHandle.name)
      props.fileActions.setContent(localContent.value)
      props.fileActions.markAsSaved(localContent.value)
      
      // Update teleprompter content
      emit('save', localContent.value)
      
      console.log('✅ File saved successfully:', fileHandle.name)
    } else {
      // User cancelled or fallback download occurred
      console.log('❌ Save cancelled or completed via download')
    }
  } catch (error) {
    console.error('Error saving file:', error)
  } finally {
    saving.value = false
  }
}

async function onOpenFile() {
  // Emit event to open file loader dialog instead of using native input
  emit('open-file')
}

async function onOpenCloud() {
  // Initialize Dropbox if not connected (in the future, could select provider)
  if (!dropboxStore.isConnected) {
    await dropboxStore.initialize()
  }
  
  // Show Cloud file explorer
  showCloudDialog.value = true
}

function onCloudFileSelected(file: CloudFile) {
  // Only select the file, don't download yet
  selectedCloudFile.value = file
  console.log('📁 File selected:', file.name)
}

function onCancelCloud() {
  selectedCloudFile.value = null
  showCloudDialog.value = false
}

async function onAcceptCloud() {
  if (!selectedCloudFile.value) return
  
  try {
    const fileName = selectedCloudFile.value.name
    
    // Download the selected file
    console.log('⬇️ Downloading file:', fileName)
    const content = await dropboxStore.downloadFile(selectedCloudFile.value.path)
    
    // Load content into editor
    localContent.value = content
    
    // Update file state - cloud files are treated as new files that need to be saved locally
    props.fileActions.setContent(content)
    
    // For cloud files, we don't set a fileHandle because they can't be saved directly
    // Instead, we create a new file state but preserve the filename
    props.fileActions.createNew()
    // Update the store to use the cloud filename as the base name
    if (props.fileActions.setFileHandle) {
      props.fileActions.setFileHandle(null, fileName)
    }
    
    // Update teleprompter content
    emit('save', content)
    
    // Close cloud dialog after successful file load
    selectedCloudFile.value = null
    showCloudDialog.value = false
    
    console.log('✅ File loaded successfully from cloud:', fileName)
    
  } catch (error) {
    console.error('❌ Error downloading file:', error)
    // TODO: Show error message to user
  }
}

async function onSaveToCloud() {
  // Initialize Dropbox if not connected (in the future, could select provider)
  if (!dropboxStore.isConnected) {
    await dropboxStore.initialize()
  }
  
  // Load files from last cloud path (or root if no path saved)
  try {
    await dropboxStore.loadFiles()
  } catch (error) {
    console.error('Error loading cloud files:', error)
  }
  
  // Show Cloud save dialog
  showCloudSaveDialog.value = true
  
  // Set suggested filename based on current file state
  if (props.fileState.isNewFile || props.fileState.fileName === 'New File') {
    suggestedFileName.value = 'NewFile.md'
  } else {
    // Use current filename, ensure it has .md extension
    const currentName = props.fileState.fileName
    if (currentName.endsWith('.md') || currentName.endsWith('.txt')) {
      suggestedFileName.value = currentName
    } else {
      suggestedFileName.value = `${currentName}.md`
    }
  }
}

function onSaveLocationSelected(file: CloudFile) {
  // If it's a folder, navigate to it
  if (file.isFolder) {
    dropboxStore.navigateToFolder(file.path)
  } else {
    // If it's a file, use its name as suggestion
    suggestedFileName.value = file.name
  }
}

function onCancelCloudSave() {
  showCloudSaveDialog.value = false
  suggestedFileName.value = ''
}

async function onSaveCloudFile() {
  if (!suggestedFileName.value.trim()) return
  
  saving.value = true
  
  try {
    // Construct full path
    const fileName = suggestedFileName.value.trim()
    const currentPath = dropboxStore.currentPath
    const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName
    
    console.log('💾 Saving file to cloud:', fullPath)
    
    // Upload file to cloud (currently using Dropbox)
    await dropboxStore.uploadFile(fullPath, localContent.value)
    
    // Close dialog after successful save
    showCloudSaveDialog.value = false
    suggestedFileName.value = ''
    
    console.log('✅ File saved successfully to cloud')
    
    // TODO: Show success message to user
    
  } catch (error) {
    console.error('❌ Error saving file to Dropbox:', error)
    // TODO: Show error message to user
  } finally {
    saving.value = false
  }
}

function onApply() {
  emit('save', localContent.value)
  emit('update:modelValue', false) // Close editor after applying changes
}

function onCancel() {
  // Ask for confirmation if content changed
  if (props.fileState.hasUnsavedChanges) {
    if (confirm(t('editor.discardChanges'))) {
      localContent.value = props.fileState.originalContent
      emit('update:modelValue', false)
    }
  } else {
    emit('update:modelValue', false)
  }
}

function onMarkdownHelp() {
  // Open Markdown help in a new window/tab
  window.open('https://www.markdownguide.org/basic-syntax/', '_blank', 'noopener,noreferrer')
}

function toggleMobileView() {
  mobileView.value = mobileView.value === 'edit' ? 'preview' : 'edit'
}

// Keyboard shortcuts
function onKeyDown(event: KeyboardEvent) {
  // Ctrl+S or Cmd+S to save
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault()
    if (event.shiftKey) {
      // Ctrl+Shift+S for Save Copy
      onSaveCopy()
    } else {
      onSave()
    }
    return
  }

  // Ctrl+N or Cmd+N for new file
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault()
    onNew()
    return
  }

  // Ctrl+P or Cmd+P to toggle preview
  if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
    event.preventDefault()
    if (window.innerWidth > 960) {
      showPreview.value = !showPreview.value
    } else {
      toggleMobileView()
    }
    return
  }

  // Tab indentation
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = event.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    if (event.shiftKey) {
      // Remove indentation
      const lineStart = localContent.value.lastIndexOf('\n', start - 1) + 1
      if (localContent.value.substring(lineStart, lineStart + 2) === '  ') {
        localContent.value =
          localContent.value.substring(0, lineStart) + localContent.value.substring(lineStart + 2)
        nextTick(() => {
          textarea.selectionStart = textarea.selectionEnd = start - 2
        })
      }
    } else {
      // Add indentation
      localContent.value =
        localContent.value.substring(0, start) + '  ' + localContent.value.substring(end)
      nextTick(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }
}

// Inicializar Dropbox cuando se monta el componente
onMounted(async () => {
  console.log('🎯 MarkdownEditor: Component mounted, checking Dropbox connection...')
  await dropboxStore.refreshConnectionStatus()
})
</script>

<style scoped>
.editor-card {
  position: relative;
  height: 100vh;
  overflow: hidden;
}

.editor-toolbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 64px;
}

.editor-container {
  height: 100vh;
  padding-top: 80px; /* Increased space for fixed toolbar */
}

.editor-content {
  height: calc(100vh - 80px);
}

.editor-content.mobile {
  height: calc(100vh - 80px);
}

.editor-panel,
.preview-panel {
  margin-top: 63px; /* Adjust for toolbar height */
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-textarea {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
}

.editor-textarea.mobile {
  height: 100%;
}

/* Additional padding for textarea content */
:deep(.v-field__input) {
  height: 100% !important;
  min-height: 100% !important;
  padding-top: 16px !important; /* Extra top padding to avoid toolbar overlap */
}

.preview-panel {
  background: #fafafa;
  overflow-y: auto;
}

.preview-content {
  padding: 24px;
  max-width: none;
  font-family: 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
}

.help-content pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

.help-content h4 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-weight: 600;
}

/* Ensure textarea fills available space */
:deep(.v-field__input) {
  height: 100% !important;
  min-height: 100% !important;
}

:deep(.v-textarea .v-field__field) {
  height: 100%;
}

:deep(.v-textarea textarea) {
  height: 100% !important;
  min-height: 100% !important;
}

/* Preview content styles */
.preview-content :deep(h1),
.preview-content :deep(h2),
.preview-content :deep(h3),
.preview-content :deep(h4),
.preview-content :deep(h5),
.preview-content :deep(h6) {
  margin: 1.5em 0 0.5em 0;
  font-weight: 500;
}

.preview-content :deep(p) {
  margin: 1em 0;
}

.preview-content :deep(blockquote) {
  margin: 1em 0;
  padding-left: 1em;
  border-left: 4px solid #ddd;
  font-style: italic;
  color: #666;
}

.preview-content :deep(code) {
  background: #f0f0f0;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.preview-content :deep(pre) {
  background: #f8f8f8;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
}

.preview-content :deep(mark) {
  background: #ffeb3b;
  padding: 0.1em 0.2em;
}

/* Dropbox File Picker Styles */
.dropbox-file-picker {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dropbox-content-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropbox-explorer-container {
  flex: 1;
  overflow: hidden;
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

/* Action buttons styling */
.dropbox-file-picker .v-card-actions {
  flex-shrink: 0;
  border-top: 1px solid rgba(var(--v-theme-outline), 0.12);
}

/* Ensure dialog has proper dimensions */
.dropbox-file-picker :deep(.v-dialog) {
  max-height: 90vh;
}
</style>
