<!--
  TeleprompterPageModular - Example of Modular Design Usage

  This demonstrates how to use the coordinator pattern to dynamically
  switch between different toolbar implementations.
-->
<template>
  <div class="teleprompter-page">
    <TeleprompterFrameV2
      ref="teleprompterRef"
      :content="coordinator.teleprompterFrameProps.value.content"
      :scroll-state="coordinator.teleprompterFrameProps.value.scrollState"
      :display-prefs="coordinator.teleprompterFrameProps.value.displayPrefs"
      :highlight-band="coordinator.teleprompterFrameProps.value.highlightBand"
      @content-height-changed="coordinator.teleprompterFrameHandlers.onContentHeightChanged"
      @viewport-height-changed="coordinator.teleprompterFrameHandlers.onViewportHeightChanged"
      @highlight-band-position-change="coordinator.highlightBandHandlers.onPositionChange"
      @manual-scroll="coordinator.teleprompterFrameHandlers.onManualScroll"
      @tap="coordinator.teleprompterFrameHandlers.onTap"
    />

    <!-- Dynamic Toolbar Selection -->
    <component
      :is="currentToolbarComponent"
      :scroll-state="coordinator.toolbarProps.value.scrollState"
      :speed-config="coordinator.toolbarProps.value.speedConfig"
      :display-prefs="coordinator.toolbarProps.value.displayPrefs"
      :is-visible="coordinator.toolbarProps.value.isVisible"
      :is-minimal="coordinator.toolbarProps.value.isMinimal"
      @play="coordinator.toolbarHandlers.onPlay"
      @pause="coordinator.toolbarHandlers.onPause"
      @toggle-play="coordinator.toolbarHandlers.onTogglePlay"
      @step-lines="coordinator.toolbarHandlers.onStepLines"
      @go-home="coordinator.toolbarHandlers.onGoHome"
      @go-end="coordinator.toolbarHandlers.onGoEnd"
      @speed-change="coordinator.toolbarHandlers.onSpeedChange"
      @font-size-change="coordinator.toolbarHandlers.onFontSizeChange"
      @mirror-toggle="coordinator.toolbarHandlers.onMirrorToggle"
      @open-editor="coordinator.toolbarHandlers.onOpenEditor"
      @open-settings="coordinator.toolbarHandlers.onOpenSettings"
      @open-file="coordinator.toolbarHandlers.onOpenFile"
    />

    <!-- Toolbar Switcher (Development/Demo purposes) -->
    <v-card
      v-if="showToolbarSwitcher"
      class="toolbar-switcher"
      elevation="8"
    >
      <v-card-title>Toolbar Selector</v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedToolbar"
          :items="availableToolbars"
          item-title="name"
          item-value="component"
          label="Select Toolbar"
          @update:model-value="switchToolbar"
        />
        <v-switch
          v-model="showToolbarSwitcher"
          label="Show Toolbar Switcher"
          hide-details
        />
      </v-card-text>
    </v-card>

    <!-- Settings Dialog -->
    <SettingsDialog 
      v-model="settingsOpen" 
      @file-imported="onFileImported" 
    />

    <!-- Markdown Editor -->
    <MarkdownEditor
      v-model="editorOpen"
      :content="teleprompterStore.contentRaw"
      :display-prefs="{
        textAlignment: prefsStore.textAlignment,
        bgColor: prefsStore.bgColor,
        fgColor: prefsStore.fgColor,
      }"
      :file-state="fileState"
      :file-actions="fileActions"
      @save="onEditorSave"
      @open-file="onOpenFile"
    />

    <!-- File Loader -->
    <FileLoader 
      v-model="fileLoaderOpen" 
      auto-import 
      @file-imported="onFileImported" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, shallowRef, watch } from 'vue'
import { useTeleprompterCoordinator } from '@/coordinators/teleprompterCoordinator'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useFileStore } from '@/stores/useFileStore'

// Components
import TeleprompterFrameV2 from '@/components/TeleprompterFrameV2.vue'
import FloatingToolbar from '@/components/FloatingToolbar.vue' // Original
import FloatingToolbarModular from '@/components/FloatingToolbarModular.vue' // New modular
import FloatingToolbarV2 from '@/components/FloatingToolbarV2.vue' // Previous modular attempt
import SettingsDialog from '@/components/SettingsDialog.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import FileLoader from '@/components/FileLoader.vue'

// Stores
const teleprompterStore = useTeleprompterStore()
const prefsStore = usePrefsStore()
const fileStore = useFileStore()

// Coordinator (handles all the modular communication)
const coordinator = useTeleprompterCoordinator()

// Component refs
const teleprompterRef = ref<InstanceType<typeof TeleprompterFrameV2>>()

// Local UI state
const settingsOpen = ref(false)
const editorOpen = ref(false)
const fileLoaderOpen = ref(false)

// Watch for coordinator state changes
watch(() => coordinator.settingsOpen.value, (value: boolean) => { settingsOpen.value = value })
watch(() => coordinator.editorOpen.value, (value: boolean) => { editorOpen.value = value })
watch(() => coordinator.fileLoaderOpen.value, (value: boolean) => { fileLoaderOpen.value = value })

// Update coordinator when local state changes
watch(settingsOpen, (value: boolean) => { coordinator.settingsOpen.value = value })
watch(editorOpen, (value: boolean) => { coordinator.editorOpen.value = value })
watch(fileLoaderOpen, (value: boolean) => { coordinator.fileLoaderOpen.value = value })

// ========================================
// Dynamic Toolbar System
// ========================================

const availableToolbars = [
  {
    name: 'Original Toolbar (Non-modular)',
    component: FloatingToolbar,
    description: 'The original toolbar with direct store access'
  },
  {
    name: 'Modular Toolbar (Full)',
    component: FloatingToolbarModular,
    description: 'New fully modular toolbar with all features'
  },
  {
    name: 'Simple Modular (V2)',
    component: FloatingToolbarV2,
    description: 'Previous attempt at modular design'
  }
] as const

const selectedToolbar = ref('FloatingToolbarModular')
const currentToolbarComponent = shallowRef(FloatingToolbarModular)
const showToolbarSwitcher = ref(false)

function switchToolbar(componentName: string) {
  const toolbar = availableToolbars.find(t => t.component.__name === componentName || t.component.name === componentName)
  if (toolbar) {
    currentToolbarComponent.value = toolbar.component as any
    console.log(`Switched to: ${toolbar.name}`)
  }
}

// Enable toolbar switcher in development mode
if (import.meta.env.DEV) {
  showToolbarSwitcher.value = true
}

// ========================================
// File Management (from original)
// ========================================

const fileState = computed(() => ({
  displayName: fileStore.displayName,
  originalContent: fileStore.originalContent,
  hasUnsavedChanges: fileStore.hasUnsavedChanges,
  canSave: fileStore.canSave,
  canSaveAsNewCopy: fileStore.canSaveAsNewCopy,
  isNewFile: fileStore.isNewFile,
  fileName: fileStore.fileName,
}))

const fileActions = computed(() => ({
  createNew: fileStore.createNew,
  markAsModified: fileStore.markAsModified,
  markAsSaved: fileStore.markAsSaved,
  setContent: fileStore.setContent,
  setFileHandle: fileStore.setFileHandle,
}))

async function onFileImported(content: string, fileInfo?: { name: string; handle?: any }) {
  await teleprompterStore.setContent(content)
  if (fileInfo) {
    fileStore.setContent(content)
    // File name is handled internally by the store
  }
}

async function onEditorSave(content: string) {
  await teleprompterStore.setContent(content)
  fileStore.markAsSaved()
}

function onOpenFile() {
  coordinator.fileLoaderOpen.value = true
}

// ========================================
// Initialization
// ========================================

onMounted(async () => {
  // Initialize stores
  await Promise.all([
    teleprompterStore.initialize(),
    prefsStore.load(),
  ])

  // Apply CSS variables
  prefsStore.applyCSSVariables()

  // Load sample content if needed
  if (!teleprompterStore.contentRaw) {
    const sampleResponse = await fetch('/sample.md')
    if (sampleResponse.ok) {
      const sampleContent = await sampleResponse.text()
      await teleprompterStore.setContent(sampleContent)
    }
  }
})
</script>

<style scoped>
.teleprompter-page {
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.toolbar-switcher {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1001;
  min-width: 300px;
  backdrop-filter: blur(10px);
  background: rgba(0, 0, 0, 0.8) !important;
}

.toolbar-switcher :deep(.v-card-title) {
  color: white;
  font-size: 1rem;
  padding-bottom: 8px;
}

.toolbar-switcher :deep(.v-card-text) {
  color: white;
}

/* Hide switcher on small screens */
@media (max-width: 768px) {
  .toolbar-switcher {
    display: none;
  }
}
</style>