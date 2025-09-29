<template>
  <div class="teleprompter-page">
    <TeleprompterFrameV2
      ref="teleprompterRef"
      v-bind="teleprompterFrameProps"
      @content-height-changed="onContentHeightChanged"
      @viewport-height-changed="onViewportHeightChanged"
      @highlight-band-position-change="onHighlightBandPositionChange"
      @tap="onTeleprompterTap"
    />

    <FloatingToolbar
      @play="onPlay"
      @pause="onPause"
      @step-lines="onStepLines"
      @go-home="onGoHome"
      @go-end="onGoEnd"
      @speed-change="onSpeedChange"
      @font-size-change="onFontSizeChange"
      @mirror-toggle="onMirrorToggle"
      @open-editor="onOpenEditor"
      @open-settings="onOpenSettings"
      @open-file="onOpenFile"
    />

    <!-- Settings Dialog -->
    <SettingsDialog v-model="settingsOpen" @file-imported="onFileImported" />

    <!-- Markdown Editor -->
    <MarkdownEditor
      v-model="editorOpen"
      :content="teleprompterStore.contentRaw"
      :display-prefs="{
        textAlignment: prefsStore.textAlignment,
        bgColor: prefsStore.bgColor,
        fgColor: prefsStore.fgColor,
      }"
      :file-state="{
        displayName: fileStore.displayName,
        originalContent: fileStore.originalContent,
        hasUnsavedChanges: fileStore.hasUnsavedChanges,
        canSave: fileStore.canSave,
        canSaveAsNewCopy: fileStore.canSaveAsNewCopy,
        isNewFile: fileStore.isNewFile,
        fileName: fileStore.fileName,
      }"
      :file-actions="{
        createNew: fileStore.createNew,
        markAsModified: fileStore.markAsModified,
        markAsSaved: fileStore.markAsSaved,
        setContent: fileStore.setContent,
        setFileHandle: fileStore.setFileHandle,
      }"
      @save="onEditorSave"
      @open-file="onOpenFile"
    />

    <!-- File Loader -->
    <FileLoader v-model="fileLoaderOpen" auto-import @file-imported="onFileImported" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useI18nStore } from '@/stores/useI18nStore'
import { useFileStore } from '@/stores/useFileStore'
import { useTeleprompterFrameProps } from '@/adapters/storeToComponent'
import {
  hotkeyManager,
  DEFAULT_HOTKEYS,
  updateDescriptionsInMapping,
  updateDescriptionsInGamepadMapping,
} from '@/utils/hotkeys'
import { gamepadManager } from '@/utils/gamepadManager'
import { isTouchDevice } from '@/utils/dom'
import { TOOLBAR_HIDE_DELAY } from '@/utils/constants'

// Components
import TeleprompterFrameV2 from '@/components/TeleprompterFrameV2.vue'
import FloatingToolbar from '@/components/FloatingToolbar.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import FileLoader from '@/components/FileLoader.vue'
import { isMobile, getCurrentOrientation } from '@/utils/capacitor'

// Stores
const teleprompterStore = useTeleprompterStore()
const prefsStore = usePrefsStore()
const i18nStore = useI18nStore()
const fileStore = useFileStore()

// Composables
const { locale } = useI18n()

// Modular component props
const teleprompterFrameProps = useTeleprompterFrameProps()

// Component refs
const teleprompterRef = ref<InstanceType<typeof TeleprompterFrameV2>>()

// UI state
const settingsOpen = ref(false)
const editorOpen = ref(false)
const fileLoaderOpen = ref(false)
const currentOrientation = ref<'portrait' | 'landscape'>('landscape')

// Touch device detection
const isTouch = isTouchDevice()

// Handle orientation changes
const handleOrientationChange = async () => {
  if (isMobile()) {
    currentOrientation.value = await getCurrentOrientation()
    console.log('Orientation changed to:', currentOrientation.value)

    // Trigger layout recalculation after orientation change
    nextTick(() => {
      if (teleprompterRef.value) {
        teleprompterRef.value.measureDimensions()
      }
    })
  }
}

// Lifecycle
onMounted(async () => {
  // Initialize stores
  await Promise.all([teleprompterStore.initialize(), prefsStore.load()])

  // Apply CSS variables
  prefsStore.applyCSSVariables()

  // Get initial orientation on mobile
  if (isMobile()) {
    currentOrientation.value = await getCurrentOrientation()

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)
  }

  // Setup hotkeys for non-touch devices
  if (!isTouch) {
    setupHotkeys()
    hotkeyManager.startListening()
  }

  // Setup gamepad support (always available, regardless of device type)
  setupGamepad()
  gamepadManager.startListening()

  // Load sample content if no content exists
  if (!teleprompterStore.contentRaw) {
    await loadSampleContent()
  }
})

onUnmounted(() => {
  hotkeyManager.stopListening()
  gamepadManager.stopListening()

  // Clean up orientation listeners on mobile
  if (isMobile()) {
    window.removeEventListener('orientationchange', handleOrientationChange)
    window.removeEventListener('resize', handleOrientationChange)
  }
})

// Watch for preference changes
watch(
  () => prefsStore.speedPxPerSec,
  (newSpeed) => {
    teleprompterStore.updateSpeed(newSpeed)
  }
)

watch(
  () => [prefsStore.fontSizePx, prefsStore.lineHeight, prefsStore.fontFamily],
  () => {
    prefsStore.applyCSSVariables()
  }
)

// Watch for hotkey changes
watch(
  () => prefsStore.customHotkeys,
  (newHotkeys) => {
    if (!isTouch) {
      hotkeyManager.updateMapping(newHotkeys)
    }
  },
  { deep: true }
)

// Watch for gamepad mapping changes
watch(
  () => prefsStore.customGamepadMappings,
  (newMappings) => {
    gamepadManager.updateMapping(newMappings)
  },
  { deep: true }
)

// Watch for language changes to update hotkey descriptions
watch(
  () => i18nStore.currentLanguage,
  () => {
    // Update hotkey descriptions with new language
    const updatedHotkeys = updateDescriptionsInMapping(prefsStore.customHotkeys)
    prefsStore.customHotkeys = updatedHotkeys

    // Update gamepad mapping descriptions
    const updatedGamepad = updateDescriptionsInGamepadMapping(prefsStore.customGamepadMappings)
    prefsStore.customGamepadMappings = updatedGamepad

    // Update managers with new descriptions
    if (!isTouch) {
      hotkeyManager.updateMapping(updatedHotkeys)
    }
    gamepadManager.updateMapping(updatedGamepad)
  }
)

// Teleprompter actions
function onPlay() {
  teleprompterStore.play()
}

function onPause() {
  teleprompterStore.pause()
}

function onStepLines(lines: number) {
  teleprompterStore.stepLines(lines)
}

function onGoHome() {
  teleprompterStore.toHome()
}

function onGoEnd() {
  teleprompterStore.toEnd()
}

function onSpeedChange(delta: number) {
  if (delta > 0) {
    prefsStore.increaseSpeed()
  } else {
    prefsStore.decreaseSpeed()
  }
}

function onFontSizeChange(delta: number) {
  if (delta > 0) {
    prefsStore.increaseFontSize()
  } else {
    prefsStore.decreaseFontSize()
  }
}

function onMirrorToggle(axis: 'h' | 'v') {
  if (axis === 'h') {
    prefsStore.toggleMirrorH()
  } else {
    prefsStore.toggleMirrorV()
  }
}

function onOpenEditor() {
  editorOpen.value = true
}

function onOpenSettings() {
  settingsOpen.value = true
}

function onOpenFile() {
  fileLoaderOpen.value = true
}

// Content management
function onContentHeightChanged(height: number) {
  teleprompterStore.setContentHeight(height)
}

function onViewportHeightChanged(height: number) {
  teleprompterStore.setViewportHeight(height)
}

function onHighlightBandPositionChange(positionPct: number) {
  prefsStore.highlightBandPosPct = positionPct
}

function onTeleprompterTap() {
  // Emit custom event for toolbar to listen
  const event = new CustomEvent('teleprompter-tap')
  window.dispatchEvent(event)
}

async function onEditorSave(content: string) {
  await teleprompterStore.setContent(content)
  editorOpen.value = false
}

async function onFileImported(content: string, fileInfo?: { name: string; handle?: any }) {
  await teleprompterStore.setContent(content)

  // Update FileStore with file information if provided
  if (fileInfo) {
    if (fileInfo.handle) {
      // File opened with File System Access API
      fileStore.setFileHandle(fileInfo.handle, fileInfo.name)
      fileStore.setContent(content)
    } else {
      // File opened with traditional file input - create a pseudo file reference
      fileStore.setFileHandle(null, fileInfo.name)
      fileStore.setContent(content)
    }
  } else {
    // No file info - treat as new file
    fileStore.createNew()
  }

  settingsOpen.value = false
  fileLoaderOpen.value = false
}

async function loadSampleContent() {
  try {
    // Load sample content based on current locale
    const sampleFile = locale.value === 'es-ES' ? '/sample-es.md' : '/sample.md'
    const response = await fetch(sampleFile)
    const content = await response.text()
    await teleprompterStore.setContent(content)
  } catch (error) {
    console.warn('Failed to load sample content:', error)
    // Fallback content based on locale
    const fallbackContent =
      locale.value === 'es-ES'
        ? '# Bienvenido a Apuntador\n\nComienza importando tu guión o usando el editor para crear nuevo contenido.'
        : '# Welcome to Apuntador\n\nStart by importing your script or using the editor to create new content.'
    await teleprompterStore.setContent(fallbackContent)
  }
}

// Hotkey setup
function setupHotkeys() {
  const actions = {
    'toggle-play': () => teleprompterStore.toggle(),
    'step-up': () => onStepLines(-1),
    'step-down': () => onStepLines(1),
    'step-up-5': () => onStepLines(-5),
    'step-down-5': () => onStepLines(5),
    'go-home': onGoHome,
    'go-end': onGoEnd,
    'speed-down': () => onSpeedChange(-1),
    'speed-up': () => onSpeedChange(1),
    'font-down': () => onFontSizeChange(-1),
    'font-up': () => onFontSizeChange(1),
    'mirror-h': () => onMirrorToggle('h'),
    'mirror-v': () => onMirrorToggle('v'),
    'open-editor': onOpenEditor,
    'open-settings': onOpenSettings,
    'open-file': onOpenFile,
    'align-left': () => prefsStore.setTextAlignment('left'),
    'align-center': () => prefsStore.setTextAlignment('center'),
    'align-right': () => prefsStore.setTextAlignment('right'),
    'close-modal': () => {
      settingsOpen.value = false
      editorOpen.value = false
      fileLoaderOpen.value = false
    },
  }

  // Register actions with the hotkey manager
  Object.entries(actions).forEach(([action, handler]) => {
    hotkeyManager.registerAction(action as any, handler)
  })

  // Update hotkey manager with custom mapping
  hotkeyManager.updateMapping(prefsStore.customHotkeys)
}

// Gamepad setup - same actions as hotkeys for consistent experience
function setupGamepad() {
  const actions = {
    'toggle-play': () => teleprompterStore.toggle(),
    'step-up': () => onStepLines(-1),
    'step-down': () => onStepLines(1),
    'step-up-5': () => onStepLines(-5),
    'step-down-5': () => onStepLines(5),
    'go-home': onGoHome,
    'go-end': onGoEnd,
    'speed-down': () => onSpeedChange(-1),
    'speed-up': () => onSpeedChange(1),
    'font-down': () => onFontSizeChange(-1),
    'font-up': () => onFontSizeChange(1),
    'mirror-h': () => onMirrorToggle('h'),
    'mirror-v': () => onMirrorToggle('v'),
    'open-editor': onOpenEditor,
    'open-settings': onOpenSettings,
    'open-file': onOpenFile,
    'align-left': () => prefsStore.setTextAlignment('left'),
    'align-center': () => prefsStore.setTextAlignment('center'),
    'align-right': () => prefsStore.setTextAlignment('right'),
    'close-modal': () => {
      settingsOpen.value = false
      editorOpen.value = false
      fileLoaderOpen.value = false
    },
  }

  // Register actions with the gamepad manager
  Object.entries(actions).forEach(([action, handler]) => {
    gamepadManager.registerAction(action as any, handler)
  })

  // Update gamepad manager with custom mapping
  gamepadManager.updateMapping(prefsStore.customGamepadMappings)
}
</script>

<style scoped>
.teleprompter-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh; /* Use dynamic viewport height when available */
  overflow: hidden;
  background: var(--teleprompter-bg, #000000);
  color: var(--teleprompter-fg, #ffffff);

  /* Android edge-to-edge support */
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  /* Don't add bottom padding here - let FloatingToolbar handle it */
}

/* Ensure content area respects safe areas on Android */
@supports (padding: max(0px)) {
  .teleprompter-page {
    padding-top: max(0px, env(safe-area-inset-top, 0px));
    padding-left: max(0px, env(safe-area-inset-left, 0px));
    padding-right: max(0px, env(safe-area-inset-right, 0px));
  }
}
</style>
