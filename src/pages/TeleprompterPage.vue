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
    <FileLoader v-model="fileLoaderOpen" @file-imported="onFileImported" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
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

// Stores
const teleprompterStore = useTeleprompterStore()
const prefsStore = usePrefsStore()

// Component refs
const teleprompterRef = ref<InstanceType<typeof TeleprompterFrame>>()

// UI state
const settingsOpen = ref(false)
const editorOpen = ref(false)
const fileLoaderOpen = ref(false)

// Touch device detection
const isTouch = isTouchDevice()

// Lifecycle
onMounted(async () => {
  // Initialize stores
  await Promise.all([teleprompterStore.initialize(), prefsStore.load()])

  // Apply CSS variables
  prefsStore.applyCSSVariables()

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
    'close-modal': () => {
      settingsOpen.value = false
      editorOpen.value = false
      fileLoaderOpen.value = false
    },
  }

  DEFAULT_HOTKEYS.forEach((hotkey) => {
    const action = actions[hotkey.action as keyof typeof actions]
    if (action) {
      hotkeyManager.register(hotkey, action)
    }
  })
}
</script>

<style scoped>
.teleprompter-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--teleprompter-bg, #000000);
  color: var(--teleprompter-fg, #ffffff);
}
</style>
