<template>
  <div class="editor-page">
    <!-- Editor Toolbar -->
    <EditorToolbar
      :file-display-name="fileStore.displayName"
      :can-save="fileStore.canSave"
      :can-save-as-new-copy="fileStore.canSaveAsNewCopy"
      :saving="saving"
      :refreshing="refreshing"
      :dropbox-connected="dropboxStore.isConnected"
      :show-preview="showPreview"
      :mobile-view="mobileView"
      @close="onClose"
      @new="onNew"
      @save="onSave"
      @save-copy="onSaveCopy"
      @open-file="onOpenFile"
      @open-cloud="onOpenCloud"
      @save-to-cloud="onSaveToCloud"
      @toggle-preview="onTogglePreview"
      @toggle-mobile-view="onToggleMobileView"
      @markdown-help="onMarkdownHelp"
      @apply="onApply"
    />

    <!-- Editor Content Area -->
    <v-container 
      fluid 
      class="editor-container pa-0"
    >
      <!-- Desktop: Side-by-side layout -->
      <v-row 
        v-if="!$vuetify.display.mobile" 
        no-gutters 
        class="editor-content"
      >
        <v-col :cols="showPreview ? 6 : 12">
          <div class="editor-panel">
            <TextEditor
              ref="textEditorRef"
              :content="localContent"
              @update:content="onContentChange"
            />
          </div>
        </v-col>

        <v-divider 
          v-if="showPreview" 
          vertical 
        />

        <v-col 
          v-if="showPreview" 
          cols="6"
        >
          <MarkdownPreviewer
            :content="localContent"
            :display-prefs="displayPrefs"
          />
        </v-col>
      </v-row>

      <!-- Mobile: Single view with toggle -->
      <div 
        v-else 
        class="editor-content mobile"
      >
        <div 
          v-if="mobileView === 'edit'" 
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

    <!-- File Loader -->
    <FileLoader 
      v-model="fileLoaderOpen" 
      auto-import 
      @file-imported="onFileImported" 
    />

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
        
        <!-- Cloud content area -->
        <div class="dropbox-content-container">
          <!-- Show connection if not connected -->
          <div
            v-if="!dropboxStore.isConnected"
            class="pa-6 text-center"
          >
            <DropboxConnection />
          </div>
          
          <!-- Show file explorer if connected -->
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
            :disabled="!suggestedFileName.trim()"
            @click="onAcceptCloudSave"
          >
            {{ t('common.save', 'Guardar') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
import DropboxConnection from '@/components/cloud/DropboxConnection.vue'
import DropboxFileExplorer from '@/components/cloud/DropboxFileExplorer.vue'

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
const localContent = ref('# Mi Script\n\nEscribe tu contenido aquí...')
const showPreview = ref(true)
const mobileView = ref<'edit' | 'preview'>('edit')
const showHelp = ref(false)
const fileLoaderOpen = ref(false)
const saving = ref(false)
const refreshing = ref(false)

// Cloud dialog state
const showCloudDialog = ref(false)
const showCloudSaveDialog = ref(false)
const selectedCloudFile = ref<string | null>(null)
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

async function onSave() {
  if (!fileStore.canSave) return
  
  saving.value = true
  try {
    await teleprompterStore.setContent(localContent.value)
    fileStore.markAsSaved()
  } catch (error) {
    console.error('Error saving file:', error)
  } finally {
    saving.value = false
  }
}

function onSaveCopy() {
  // Open file loader to save as new file
  fileLoaderOpen.value = true
}

function onOpenFile() {
  fileLoaderOpen.value = true
}

function onOpenCloud() {
  showCloudDialog.value = true
  selectedCloudFile.value = null
}

async function onSaveToCloud() {
  suggestedFileName.value = fileStore.fileName || 'script.md'
  showCloudSaveDialog.value = true
}

function onTogglePreview() {
  showPreview.value = !showPreview.value
}

function onToggleMobileView() {
  mobileView.value = mobileView.value === 'edit' ? 'preview' : 'edit'
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

// Cloud dialog handlers
function onCancelCloud() {
  showCloudDialog.value = false
  selectedCloudFile.value = null
}

function onCloudFileSelected(file: CloudFile) {
  selectedCloudFile.value = file.path
}

async function onAcceptCloud() {
  if (!selectedCloudFile.value) return
  
  try {
    const content = await dropboxStore.downloadFile(selectedCloudFile.value)
    if (typeof content === 'string') {
      localContent.value = content
      await teleprompterStore.setContent(content)
      
      // Update file store - cloud files are treated as new files that need to be saved locally
      fileStore.setContent(content)
      fileStore.createNew()
      
      // Extract filename from path and set it
      const fileName = selectedCloudFile.value.split('/').pop() || 'cloud-file.md'
      fileStore.setFileHandle(null, fileName)
      
      showCloudDialog.value = false
      selectedCloudFile.value = null
    }
  } catch (error) {
    console.error('Error loading cloud file:', error)
  }
}

// Cloud save handlers
function onCancelCloudSave() {
  showCloudSaveDialog.value = false
  suggestedFileName.value = ''
}

function onSaveLocationSelected(file: CloudFile) {
  // This handler could be used if we want to navigate to specific folders
  console.log('Selected folder:', file.path)
}

async function onAcceptCloudSave() {
  if (!suggestedFileName.value.trim()) return
  
  try {
    saving.value = true
    
    // Construct full path using dropbox store current path
    const fileName = suggestedFileName.value.trim()
    const currentPath = dropboxStore.currentPath
    const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName
    
    console.log('💾 Saving file to cloud:', fullPath)
    
    // Upload file to cloud
    await dropboxStore.uploadFile(fullPath, localContent.value)
    
    // Close dialog after successful save
    showCloudSaveDialog.value = false
    suggestedFileName.value = ''
    
    console.log('✅ File saved successfully to cloud')
    
  } catch (error) {
    console.error('Error saving to cloud:', error)
  } finally {
    saving.value = false
  }
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