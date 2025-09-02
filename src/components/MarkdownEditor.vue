<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    fullscreen
    transition="dialog-bottom-transition"
  >
    <v-card>
      <v-toolbar color="primary" density="compact">
        <v-btn icon="mdi-close" @click="onCancel" />

        <v-toolbar-title>Markdown Editor</v-toolbar-title>

        <v-spacer />

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

        <v-btn icon="mdi-check" @click="onSave" />
      </v-toolbar>

      <v-container fluid class="editor-container pa-0">
        <!-- Desktop: Side-by-side layout -->
        <v-row v-if="!$vuetify.display.mobile" no-gutters style="height: calc(100vh - 64px)">
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
                placeholder="Start typing your markdown content..."
                @keydown="onKeyDown"
              />
            </div>
          </v-col>

          <v-divider v-if="showPreview" vertical />

          <v-col v-if="showPreview" cols="6">
            <div class="preview-panel">
              <div class="preview-content" :style="previewStyle" v-html="compiledPreview" />
            </div>
          </v-col>
        </v-row>

        <!-- Mobile: Single view with toggle -->
        <div v-else style="height: calc(100vh - 64px)">
          <div v-if="mobileView === 'edit'" class="editor-panel">
            <v-textarea
              ref="textareaRef"
              v-model="localContent"
              variant="solo-filled"
              flat
              hide-details
              no-resize
              class="editor-textarea mobile"
              placeholder="Start typing your markdown content..."
              @keydown="onKeyDown"
            />
          </div>

          <div v-else class="preview-panel">
            <div class="preview-content" :style="previewStyle" v-html="compiledPreview" />
          </div>
        </div>
      </v-container>

      <!-- Help FAB -->
      <v-fab icon="mdi-help" location="bottom end" size="small" @click="showHelp = !showHelp" />

      <!-- Help dialog -->
      <v-dialog v-model="showHelp" max-width="500">
        <v-card>
          <v-card-title>Markdown Help</v-card-title>
          <v-card-text>
            <div class="help-content">
              <h4>Basic Syntax</h4>
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

              <h4>Special Features</h4>
              <ul>
                <li>Superscript: H^2^O</li>
                <li>Subscript: H~2~O</li>
                <li>Footnotes: Text[^1]</li>
              </ul>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="showHelp = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { compileMarkdown } from '@/utils/markdown'
import { usePrefsStore } from '@/stores/usePrefsStore'

// Props
interface Props {
  modelValue: boolean
  content: string
}

const props = defineProps<Props>()

// Stores
const prefsStore = usePrefsStore()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [content: string]
}>()

// State
const localContent = ref('')
const showPreview = ref(true)
const mobileView = ref<'edit' | 'preview'>('edit')
const showHelp = ref(false)
const textareaRef = ref()

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
      nextTick(() => {
        // Focus the textarea when dialog opens
        textareaRef.value?.focus()
      })
    }
  }
)

// Actions
function onSave() {
  emit('save', localContent.value)
}

function onCancel() {
  // Ask for confirmation if content changed
  if (localContent.value !== props.content) {
    if (confirm('Discard changes?')) {
      localContent.value = props.content
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
    onSave()
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
.editor-container {
  height: 100%;
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
