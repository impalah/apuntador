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

        <v-toolbar-title>{{ fileStore.displayName }}</v-toolbar-title>

        <v-spacer />

        <!-- File Operations -->
        <v-btn icon="mdi-file-plus" @click="onNew" :title="t('fileLoader.newFile')" />

        <!-- Save button - only show if can save directly -->
        <v-btn
          v-if="fileStore.canSave"
          icon="mdi-content-save"
          @click="onSave"
          :disabled="saving"
          :title="t('fileLoader.save')"
        />

        <!-- Save Copy button - always available, more prominent if can't save directly -->
        <v-btn
          :icon="fileStore.canSaveAsNewCopy ? 'mdi-content-save' : 'mdi-content-save-outline'"
          @click="onSaveCopy"
          :disabled="saving"
          :title="fileStore.canSaveAsNewCopy ? t('fileLoader.save') : t('fileLoader.saveCopy')"
          :color="fileStore.canSaveAsNewCopy ? 'primary' : undefined"
        />

        <!-- Open File button -->
        <v-btn
          icon="mdi-folder-open"
          @click="onOpenFile"
          :disabled="refreshing"
          :title="t('fileLoader.openFile')"
          data-testid="open-file-button"
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
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { compileMarkdown } from '@/utils/markdown'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useFileStore } from '@/stores/useFileStore'
import {
  saveFile,
  saveToFileHandle,
  isFileSystemAccessSupported,
  ensureMarkdownExtension,
} from '@/utils/fileSystem'
import {
  refreshFromSource,
  readSourceContent,
  saveWithConflictCheck,
  compareWithSource,
} from '@/utils/fileSync'

// I18n
const { t } = useI18n()

// Props
interface Props {
  modelValue: boolean
  content: string
}

const props = defineProps<Props>()

// Stores
const prefsStore = usePrefsStore()
const fileStore = useFileStore()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [content: string]
  fileLoaded: [content: string]
}>()

// State
const localContent = ref('')
const showPreview = ref(true)
const mobileView = ref<'edit' | 'preview'>('edit')
const showHelp = ref(false)
const textareaRef = ref()
const saving = ref(false)
const refreshing = ref(false)

// Computed
const compiledPreview = computed(() => {
  try {
    return compileMarkdown(localContent.value)
  } catch (error) {
    return `<p style="color: red;">Error compiling markdown: ${error}</p>`
  }
})

const previewStyle = computed(() => {
  return {
    textAlign: prefsStore.textAlignment,
    backgroundColor: prefsStore.bgColor,
    color: prefsStore.fgColor,
  }
})

const previewPanelStyle = computed(() => {
  return {
    backgroundColor: prefsStore.bgColor,
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
      fileStore.setContent(props.content)
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
    if (newContent !== fileStore.originalContent) {
      fileStore.markAsModified()
    }
  }
)

// Actions
async function onNew() {
  // Check for unsaved changes
  if (fileStore.hasUnsavedChanges) {
    if (!confirm(t('editor.discardChanges'))) {
      return
    }
  }

  fileStore.createNew()
  localContent.value = ''
  emit('save', '')
}

async function onSave() {
  if (!fileStore.canSave) return

  saving.value = true
  try {
    // Check for conflicts before saving
    const result = await saveWithConflictCheck(
      fileStore.currentFile?.handle,
      fileStore.sourceContent,
      localContent.value,
      fileStore.originalContent
    )

    if (result.hasConflict && result.sourceContent) {
      // Source file has been modified, ask user what to do
      const shouldOverwrite = confirm(t('editor.confirmOverwriteChangedSource'))

      if (!shouldOverwrite) {
        return
      }

      // Force save (overwrite)
      const success = await saveToFileHandle(fileStore.currentFile?.handle, localContent.value)
      if (success) {
        fileStore.markAsSaved(localContent.value)
        fileStore.setContent(localContent.value)
        emit('save', localContent.value)
      }
    } else if (result.success) {
      // Normal save successful
      fileStore.markAsSaved(localContent.value)
      fileStore.setContent(localContent.value)
      emit('save', localContent.value)
    } else {
      throw new Error(result.error || 'Save failed')
    }
  } catch (error) {
    console.error('Save failed:', error)
    alert(t('editor.saveError'))
  } finally {
    saving.value = false
  }
}

async function onSaveCopy() {
  saving.value = true
  try {
    const suggestedName = fileStore.isNewFile
      ? 'script.md'
      : ensureMarkdownExtension(fileStore.fileName)

    const handle = await saveFile(localContent.value, { suggestedName })

    if (handle) {
      // Update file store with new handle
      fileStore.setFileHandle(handle, handle.name || suggestedName)
      fileStore.markAsSaved(localContent.value)
      fileStore.setContent(localContent.value)
      emit('save', localContent.value)
    }
  } catch (error) {
    console.error('Save copy failed:', error)
    alert('Failed to save file.')
  } finally {
    saving.value = false
  }
}

async function onOpenFile() {
  refreshing.value = true
  try {
    let sourceContent: string = ''

    // Always use file dialog for consistent experience
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.txt'

    await new Promise<void>((resolve, reject) => {
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) {
          reject(new Error('No file selected'))
          return
        }

        try {
          sourceContent = await file.text()
          // Update file store with new file information
          fileStore.setFileHandle(null, file.name)
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      input.oncancel = () => {
        reject(new Error('User cancelled'))
      }

      input.click()
    })

    // Load source content into editor directly without confirmations
    localContent.value = sourceContent
    fileStore.setContent(sourceContent)
    fileStore.updateSourceContent(sourceContent)
    emit('fileLoaded', sourceContent)
  } catch (error) {
    console.error('Open file failed:', error)
    if (error instanceof Error && error.message !== 'User cancelled') {
      alert(t('editor.refreshFromSourceError'))
    }
  } finally {
    refreshing.value = false
  }
}

function onApply() {
  emit('save', localContent.value)
}

function onCancel() {
  // Ask for confirmation if content changed
  if (fileStore.hasUnsavedChanges) {
    if (confirm(t('editor.discardChanges'))) {
      localContent.value = fileStore.originalContent
      emit('update:modelValue', false)
    }
  } else {
    emit('update:modelValue', false)
  }
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
  padding-top: 64px; /* Space for fixed toolbar */
}

.editor-content {
  height: calc(100vh - 64px);
}

.editor-content.mobile {
  height: calc(100vh - 64px);
}

.editor-panel,
.preview-panel {
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
</style>
