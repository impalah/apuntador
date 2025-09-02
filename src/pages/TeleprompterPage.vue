<template>
  <div class="teleprompter-page">
    <TeleprompterFrame
      ref="teleprompterRef"
      @content-height-changed="onContentHeightChanged"
      @viewport-height-changed="onViewportHeightChanged"
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
      @save="onEditorSave"
    />

    <!-- File Loader -->
    <FileLoader v-model="fileLoaderOpen" auto-import @file-imported="onFileImported" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { hotkeyManager, DEFAULT_HOTKEYS } from '@/utils/hotkeys'
import { isTouchDevice } from '@/utils/dom'
import { TOOLBAR_HIDE_DELAY } from '@/utils/constants'

// Components
import TeleprompterFrame from '@/components/TeleprompterFrame.vue'
import FloatingToolbar from '@/components/FloatingToolbar.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import FileLoader from '@/components/FileLoader.vue'
import { isMobile, getCurrentOrientation } from '@/utils/capacitor'

// Stores
const teleprompterStore = useTeleprompterStore()
const prefsStore = usePrefsStore()

// Component refs
const teleprompterRef = ref<InstanceType<typeof TeleprompterFrame>>()

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

  // Load sample content if no content exists
  if (!teleprompterStore.contentRaw) {
    await loadSampleContent()
  }
})

onUnmounted(() => {
  hotkeyManager.stopListening()

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

function onTeleprompterTap() {
  // Toolbar stays always visible, no action needed
}

async function onEditorSave(content: string) {
  await teleprompterStore.setContent(content)
  editorOpen.value = false
}

async function onFileImported(content: string) {
  await teleprompterStore.setContent(content)
  settingsOpen.value = false
  fileLoaderOpen.value = false
}

async function loadSampleContent() {
  try {
    const response = await fetch('/sample.md')
    const content = await response.text()
    await teleprompterStore.setContent(content)
  } catch (error) {
    console.warn('Failed to load sample content:', error)
    await teleprompterStore.setContent(
      '# Welcome to Apuntador\n\nStart by importing your script or using the editor to create new content.'
    )
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
