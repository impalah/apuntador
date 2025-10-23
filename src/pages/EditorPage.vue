<template>
  <div class="editor-page">
    <!-- Editor Toolbar -->
    <EditorToolbar
      :file-display-name="fileStore.displayName"
      :saving="saving"
      :refreshing="refreshing"
      :show-preview="showPreview"
      @close="onClose"
      @new="onNew"
      @save="onOpenSaveDialog"
      @open-file="onOpenFileDialog"
      @toggle-preview="onTogglePreview"
      @markdown-help="onMarkdownHelp"
      @apply="onApply"
    />

    <!-- Editor Content Area -->
    <v-container 
      fluid 
      class="editor-container pa-0"
    >
      <!-- Single view for all resolutions -->
      <div class="editor-content">
        <div 
          v-if="!showPreview" 
          class="editor-panel"
        >
          <TextEditor
            ref="textEditorRef"
            :content="localContent"
            @update:content="onContentChange"
          />
        </div>

        <div 
          v-else 
          class="preview-panel"
        >
          <MarkdownPreviewer
            :content="localContent"
            :display-prefs="displayPrefs"
          />
        </div>
      </div>
    </v-container>


    <!-- Help Dialog -->
    <v-dialog 
      v-model="showHelp" 
      max-width="500"
    >
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
          <v-btn @click="showHelp = false">
            {{ t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- File Loader (for backward compatibility, can be removed later) -->
    <FileLoader 
      v-model="fileLoaderOpen" 
      auto-import 
      @file-imported="onFileImported" 
    />

    <!-- Unified File Dialog for Open -->
    <UnifiedFileDialog
      v-model="showUnifiedOpenDialog"
      mode="open"
      @file-selected-local="onLocalFileSelected"
      @file-selected-cloud="onCloudFileSelected"
      @open-settings="onOpenSettings"
    />

    <!-- Unified File Dialog for Save -->
    <UnifiedFileDialog
      v-model="showUnifiedSaveDialog"
      mode="save"
      :suggested-file-name="suggestedFileName"
      @save-local="onSaveLocal"
      @save-cloud="onSaveCloudFile"
      @open-settings="onOpenSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { useFileStore } from '@/stores/useFileStore'
import { useDropboxStore } from '@/stores/useDropboxStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import type { CloudFile } from '@/types/cloud'

// Components
import EditorToolbar from '@/components/editor/EditorToolbar.vue'
import TextEditor from '@/components/editor/TextEditor.vue'
import MarkdownPreviewer from '@/components/editor/MarkdownPreviewer.vue'
import FileLoader from '@/components/FileLoader.vue'
import UnifiedFileDialog from '@/components/dialogs/UnifiedFileDialog.vue'

// Composables
const router = useRouter()
const { t } = useI18n()

// Stores
const teleprompterStore = useTeleprompterStore()
const fileStore = useFileStore()
const dropboxStore = useDropboxStore()
const prefsStore = usePrefsStore()

// Refs
const textEditorRef = ref()
const localContent = ref(t('editor.defaultContent'))
const showPreview = ref(false)
const showHelp = ref(false)
const fileLoaderOpen = ref(false)
const saving = ref(false)
const refreshing = ref(false)

// Unified file dialog state
const showUnifiedOpenDialog = ref(false)
const showUnifiedSaveDialog = ref(false)
const suggestedFileName = ref('')

// Computed
const displayPrefs = computed(() => ({
  textAlignment: prefsStore.textAlignment,
  bgColor: prefsStore.bgColor,
  fgColor: prefsStore.fgColor,
}))

// Initialize content from teleprompter store
onMounted(() => {
  // Only update if there's content in the store
  if (teleprompterStore.contentRaw && teleprompterStore.contentRaw.trim()) {
    localContent.value = teleprompterStore.contentRaw
  }
  
  // Focus editor on mobile
  if (window.innerWidth < 768) {
    showPreview.value = false
    nextTick(() => {
      textEditorRef.value?.focus()
    })
  }
})

// Watch for changes in teleprompter store content
watch(
  () => teleprompterStore.contentRaw,
  (newContent) => {
    if (newContent !== localContent.value) {
      localContent.value = newContent
    }
  }
)

// Watch for changes in teleprompter store content
watch(
  () => teleprompterStore.contentRaw,
  (newContent) => {
    if (newContent !== localContent.value) {
      localContent.value = newContent
    }
  }
)

// Event Handlers
function onContentChange(content: string) {
  localContent.value = content
  fileStore.markAsModified()
}

function onClose() {
  // Navigate back to teleprompter without saving
  router.push('/')
}

function onApply() {
  // Save content to teleprompter store and navigate back
  teleprompterStore.setContent(localContent.value)
  fileStore.markAsSaved()
  router.push('/')
}

function onNew() {
  localContent.value = ''
  fileStore.createNew()
  textEditorRef.value?.focus()
}

// Unified dialog handlers
function onOpenFileDialog() {
  showUnifiedOpenDialog.value = true
}

function onOpenSaveDialog() {
  // Suggest current file name or default
  suggestedFileName.value = fileStore.fileName || 'script.md'
  showUnifiedSaveDialog.value = true
}

async function onLocalFileSelected(file: File) {
  try {
    const content = await file.text()
    localContent.value = content
    await teleprompterStore.setContent(content)
    fileStore.setContent(content)
    fileStore.createNew()
    fileStore.setFileHandle(null, file.name)
    showUnifiedOpenDialog.value = false
  } catch (error) {
    console.error('Error loading local file:', error)
  }
}

async function onCloudFileSelected(path: string) {
  try {
    const content = await dropboxStore.downloadFile(path)
    if (typeof content === 'string') {
      localContent.value = content
      await teleprompterStore.setContent(content)
      fileStore.setContent(content)
      fileStore.createNew()
      
      const fileName = path.split('/').pop() || 'cloud-file.md'
      fileStore.setFileHandle(null, fileName)
      showUnifiedOpenDialog.value = false
    }
  } catch (error) {
    console.error('Error loading cloud file:', error)
  }
}

async function onSaveLocal() {
  saving.value = true
  try {
    // For now, trigger browser's native save dialog
    const blob = new Blob([localContent.value], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = suggestedFileName.value || 'script.md'
    a.click()
    URL.revokeObjectURL(url)
    
    await teleprompterStore.setContent(localContent.value)
    fileStore.markAsSaved()
    showUnifiedSaveDialog.value = false
  } catch (error) {
    console.error('Error saving file locally:', error)
  } finally {
    saving.value = false
  }
}

async function onSaveCloudFile(fileName: string) {
  saving.value = true
  try {
    const currentPath = dropboxStore.currentPath
    const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName
    
    await dropboxStore.uploadFile(fullPath, localContent.value)
    await teleprompterStore.setContent(localContent.value)
    fileStore.markAsSaved()
    showUnifiedSaveDialog.value = false
  } catch (error) {
    console.error('Error saving to cloud:', error)
  } finally {
    saving.value = false
  }
}

function onOpenSettings() {
  router.push('/#options/cloud')
}

function onTogglePreview() {
  showPreview.value = !showPreview.value
}

function onMarkdownHelp() {
  showHelp.value = true
}

async function onFileImported(content: string, fileInfo?: { name: string; handle?: any }) {
  localContent.value = content
  await teleprompterStore.setContent(content)

  // Update FileStore with file information if provided
  if (fileInfo) {
    if (fileInfo.handle) {
      fileStore.setFileHandle(fileInfo.handle, fileInfo.name)
      fileStore.setContent(content)
    } else {
      fileStore.setFileHandle(null, fileInfo.name)
      fileStore.setContent(content)
    }
  } else {
    fileStore.createNew()
  }

  fileLoaderOpen.value = false
}


</script>

<style scoped>
.editor-page {
  height: 100vh;
  height: 100dvh; /* Use dynamic viewport height when available */
  display: flex;
  flex-direction: column;
  background: #ffffff; /* Light background for editor */
  color: #000000; /* Dark text for editor */
  /* Safe area padding to avoid system UI overlap */
  padding-top: max(44px, env(safe-area-inset-top, 0px));
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.editor-content {
  height: 100%;
}

.editor-panel {
  height: 100%;
  background: #fafafa;
}

.preview-panel {
  height: 100%;
  background: white;
}

.mobile .editor-panel,
.mobile .preview-panel {
  height: calc(100vh - 64px - max(44px, env(safe-area-inset-top, 0px))); /* Account for toolbar and safe area */
}

.help-content {
  max-height: 400px;
  overflow-y: auto;
}

.help-content pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9em;
}

.help-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

/* Override Vuetify dialog styles for fullscreen feel */
:deep(.v-overlay__content) {
  margin: 0;
  height: 100%;
  max-height: 100%;
  width: 100%;
  max-width: 100%;
}

/* Additional safe area support for left, right and bottom */
.editor-page {
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@supports (padding: max(0px)) {
  .editor-page {
    padding-left: max(0px, env(safe-area-inset-left, 0px));
    padding-right: max(0px, env(safe-area-inset-right, 0px));
    padding-bottom: max(0px, env(safe-area-inset-bottom, 0px));
  }
}
</style>