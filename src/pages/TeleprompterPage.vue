<template>
  <div class="teleprompter-page">
    <TeleprompterFrameV2
      ref="teleprompterRef"
      v-bind="teleprompterFrameProps"
      @content-height-changed="onContentHeightChanged"
      @viewport-height-changed="onViewportHeightChanged"
      @highlight-band-position-change="onHighlightBandPositionChange"
      @manual-scroll="onManualScroll"
      @tap="onTeleprompterTap"
    />

    <!-- Voice-tracking status: always visible while voice mode is selected -->
    <VoiceStatusOverlay
      v-if="prefsStore.scrollMode === 'voice'"
      :status="voiceStatus"
      :error-code="voiceError?.code"
    />

    <!-- Modular FloatingToolbar - Using component interfaces -->
    <FloatingToolbar
      :scroll-state="{
        offset: teleprompterStore.scrollOffset,
        isPlaying: teleprompterStore.isPlaying,
        canScrollUp: teleprompterStore.scrollOffset > 0,
        canScrollDown: teleprompterStore.scrollOffset < teleprompterStore.maxOffset,
        progress:
          teleprompterStore.maxOffset > 0
            ? (teleprompterStore.scrollOffset / teleprompterStore.maxOffset) * 100
            : 0,
      }"
      :speed-config="{
        current: prefsStore.speedPxPerSec,
        min: prefsStore.speedMin,
        max: prefsStore.speedMax,
      }"
      :display-prefs="{
        fontFamily: prefsStore.fontFamily,
        fontSizePx: prefsStore.fontSizePx,
        lineHeight: prefsStore.lineHeight,
        fgColor: prefsStore.fgColor,
        bgColor: prefsStore.bgColor,
        mirrorH: prefsStore.mirrorH,
        mirrorV: prefsStore.mirrorV,
        textAlignment: prefsStore.textAlignment,
      }"
      :is-visible="toolbarVisible"
      :is-minimal="isMinimalLayout"
      @play="onPlay"
      @pause="onPause"
      @toggle-play="teleprompterStore.toggle"
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

    <!-- iOS Back Button (floating) -->
    <v-btn
      v-if="showIOSBackButton"
      icon="mdi-arrow-left"
      color="primary"
      size="small"
      class="ios-back-button"
      @click="router.push('/')"
    />

    <!-- Settings Dialog -->
    <SettingsDialog
      v-model="settingsOpen"
      :initial-tab="settingsInitialTab"
      @file-imported="onFileImported"
    />

    <!-- File Loader -->
    <FileLoader
      v-model="fileLoaderOpen"
      auto-import
      @file-imported="onFileImported"
    />

    <!-- Android Exit Confirmation Snackbar -->
    <v-snackbar
      v-model="showExitSnackbar"
      :timeout="2000"
      color="info"
      location="top"
    >
      {{ t('teleprompter.pressBackAgainToExit') }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useI18nStore } from '@/stores/useI18nStore'
import { useFileStore } from '@/stores/useFileStore'
import type { TeleprompterFrameProps } from '@/types/component-interfaces'
import {
  hotkeyManager,
  updateDescriptionsInMapping,
  updateDescriptionsInGamepadMapping,
} from '@/utils/input/hotkeys'
import { gamepadManager } from '@/utils/input/gamepadManager'
import { SmoothScroller, clampScrollOffset } from '@/utils/scrolling'
import { useSpeechTracking } from '@/composables/speech/useSpeechTracking'
import { resolveSpeechLanguage } from '@/utils/speech/resolveSpeechLanguage'
import { SPEECH_SCROLL_ANIMATION_DURATION_MS } from '@/utils/constants'
// Components
import TeleprompterFrameV2 from '@/components/TeleprompterFrameV2.vue'
import FloatingToolbar from '@/components/FloatingToolbar.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import FileLoader from '@/components/FileLoader.vue'
import VoiceStatusOverlay from '@/components/VoiceStatusOverlay.vue'
import { isMobile, getCurrentOrientation } from '@/utils/capacitor'

// Stores
const teleprompterStore = useTeleprompterStore()
const prefsStore = usePrefsStore()
const i18nStore = useI18nStore()
const fileStore = useFileStore()

// Composables
const { locale, t } = useI18n()
const { xs, sm } = useDisplay()
const router = useRouter()

// Voice-tracking mode: alternative scroll driver, isolated from AutoScroller.
// See docs/voice-tracking-design.md - TeleprompterFrameV2 stays untouched,
// this only feeds teleprompterStore.updateScrollOffset via SmoothScroller.
const scriptText = computed(() => teleprompterStore.contentRaw)
const speechLanguage = computed(() => resolveSpeechLanguage(i18nStore.currentLanguage))
const {
  isSupported: isVoiceTrackingSupported,
  status: voiceStatus,
  error: voiceError,
  progressRatio: voiceProgressRatio,
  start: startSpeechTracking,
  stop: stopSpeechTracking,
  seekToRatio: seekVoiceCursorToRatio,
} = useSpeechTracking(scriptText, speechLanguage)

const voiceScrollAnimator = new SmoothScroller(
  (offset) => teleprompterStore.updateScrollOffset(offset),
  () => teleprompterStore.scrollOffset
)

/**
 * Resyncs the voice-tracking cursor to wherever the visible scroll position
 * currently is. Without this, the alignment cursor only ever advances on its
 * own - any manual repositioning (step lines, home/end, manual drag) while in
 * voice mode used to be permanently ignored by the matching logic (it never
 * moves backward), and every pause/resume cycle silently restarted matching
 * from the very beginning of the script regardless of where playback
 * actually was.
 */
function resyncVoiceCursorToScroll() {
  if (prefsStore.scrollMode !== 'voice') return
  const ratio =
    teleprompterStore.maxOffset > 0
      ? teleprompterStore.scrollOffset / teleprompterStore.maxOffset
      : 0
  seekVoiceCursorToRatio(ratio)
}

// Responsive computed
const isMinimalLayout = computed(() => xs.value || sm.value)

// Show iOS back button (iOS doesn't have system back button)
const showIOSBackButton = computed(() => Capacitor.getPlatform() === 'ios')

// Props for TeleprompterFrameV2, grouped from the stores it reads from
const teleprompterFrameProps = computed<TeleprompterFrameProps>(() => ({
  content: {
    raw: teleprompterStore.contentRaw,
    html: teleprompterStore.contentHtml,
  },
  scrollState: {
    offset: teleprompterStore.scrollOffset,
    isPlaying: teleprompterStore.isPlaying,
    canScrollUp: teleprompterStore.scrollOffset > 0,
    canScrollDown: teleprompterStore.scrollOffset < teleprompterStore.maxOffset,
    progress:
      teleprompterStore.maxOffset > 0
        ? (teleprompterStore.scrollOffset / teleprompterStore.maxOffset) * 100
        : 0,
  },
  displayPrefs: {
    fontFamily: prefsStore.fontFamily,
    fontSizePx: prefsStore.fontSizePx,
    lineHeight: prefsStore.lineHeight,
    fgColor: prefsStore.fgColor,
    bgColor: prefsStore.bgColor,
    mirrorH: prefsStore.mirrorH,
    mirrorV: prefsStore.mirrorV,
    textAlignment: prefsStore.textAlignment,
  },
  highlightBand: {
    lines: prefsStore.highlightBandLines,
    positionPct: prefsStore.highlightBandPosPct,
    dimmingIntensity: prefsStore.dimmingIntensity,
    enabled: prefsStore.highlightBandLines > 0,
  },
}))

// Component refs
const teleprompterRef = ref<InstanceType<typeof TeleprompterFrameV2>>()

// UI state
const settingsOpen = ref(false)
const settingsInitialTab = ref('appearance')
const fileLoaderOpen = ref(false)
const currentOrientation = ref<'portrait' | 'landscape'>('landscape')

// Toolbar visibility logic (modular approach)
const toolbarVisible = ref(true)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

// Show toolbar (optionally temporary)
function showToolbar(temporary = false) {
  toolbarVisible.value = true

  // Clear existing timeout
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }

  // If temporary and playing, hide after 10 seconds
  if (temporary && teleprompterStore.isPlaying) {
    hideTimeout = setTimeout(() => {
      if (teleprompterStore.isPlaying) {
        toolbarVisible.value = false
      }
    }, 10000)
  }
}

// Hide toolbar
function hideToolbar() {
  toolbarVisible.value = false
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

// Handle screen tap during playback
function handleScreenTap() {
  if (teleprompterStore.isPlaying) {
    showToolbar(true)
  }
}

// Watch for play/pause state changes with consistent behavior
watch(
  () => teleprompterStore.isPlaying,
  (isPlaying) => {
    // Always hide toolbar if settings or file loader is open
    if (settingsOpen.value || fileLoaderOpen.value) {
      hideToolbar()
      return
    }

    if (isPlaying) {
      // Hide toolbar during playback for clean reading experience on all devices
      hideToolbar()
    } else {
      // Show toolbar when paused
      showToolbar()
    }
  },
  { immediate: true }
)

// Watch for settings/file loader state changes - always hide toolbar when modals are open
watch(
  () => [settingsOpen.value, fileLoaderOpen.value],
  ([settings, fileLoader]) => {
    if (settings || fileLoader) {
      // Hide toolbar when any modal is open
      hideToolbar()
    } else if (!teleprompterStore.isPlaying) {
      // When modals close, restore toolbar based on play state
      showToolbar()
    }
  },
  { immediate: true }
)

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

// Android back button handler with double-tap to exit
let lastBackPress = 0
let backButtonHandler: any = null
const showExitSnackbar = ref(false)

function setupBackButtonHandler() {
  backButtonHandler = App.addListener('backButton', () => {
    const currentRoute = router.currentRoute.value.path
    const now = Date.now()

    // If we're NOT on the main route (/), go to main route
    if (currentRoute !== '/') {
      router.push('/')
      return
    }

    // We're on main route - check for double tap to exit
    if (now - lastBackPress < 2000) {
      // Double tap detected - exit app
      showExitSnackbar.value = false
      App.exitApp()
    } else {
      // Single tap - show toast message
      lastBackPress = now
      showExitToast()
    }
  })
}

// Toast message for exit confirmation
function showExitToast() {
  showExitSnackbar.value = true

  // Hide snackbar after 2 seconds
  setTimeout(() => {
    showExitSnackbar.value = false
    lastBackPress = 0
  }, 2000)
}

// Lifecycle
onMounted(async () => {
  // Initialize stores
  await Promise.all([teleprompterStore.initialize(), prefsStore.load()])

  // Apply CSS variables
  prefsStore.applyCSSVariables()

  // Check for hash-based navigation (e.g., /#options/cloud)
  parseHashNavigation()

  // Get initial orientation on mobile
  if (isMobile()) {
    currentOrientation.value = await getCurrentOrientation()

    // Listen for orientation changes
    globalThis.addEventListener('orientationchange', handleOrientationChange)
    globalThis.addEventListener('resize', handleOrientationChange)
  }

  // Setup Android back button handler
  if (Capacitor.getPlatform() === 'android') {
    setupBackButtonHandler()
  }

  // Setup hotkeys (always enabled for Bluetooth keyboard support)
  setupHotkeys()
  hotkeyManager.startListening()

  // Setup gamepad support (always available, regardless of device type)
  setupGamepad()
  gamepadManager.startListening()

  // Listen for screen taps
  globalThis.addEventListener('teleprompter-tap', handleScreenTap)

  // Load sample content if no content exists
  if (!teleprompterStore.contentRaw) {
    await loadSampleContent()
  }
})

onUnmounted(() => {
  hotkeyManager.stopListening()
  gamepadManager.stopListening()

  // Clean up back button handler
  if (backButtonHandler) {
    backButtonHandler.remove()
  }

  // Clean up orientation listeners on mobile
  if (isMobile()) {
    globalThis.removeEventListener('orientationchange', handleOrientationChange)
    globalThis.removeEventListener('resize', handleOrientationChange)
  }

  // Clean up screen tap listener and timeout
  globalThis.removeEventListener('teleprompter-tap', handleScreenTap)
  if (hideTimeout) {
    clearTimeout(hideTimeout)
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
    hotkeyManager.updateMapping(newHotkeys)
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
    hotkeyManager.updateMapping(updatedHotkeys)
    gamepadManager.updateMapping(updatedGamepad)
  }
)

// Teleprompter actions
function onPlay() {
  console.log('[ANDROID DEBUG] TeleprompterPage onPlay() called')
  if (prefsStore.scrollMode === 'voice') {
    startVoiceMode()
    return
  }
  teleprompterStore.play()
}

function onPause() {
  console.log('[ANDROID DEBUG] TeleprompterPage onPause() called')
  if (prefsStore.scrollMode === 'voice') {
    voiceScrollAnimator.cancel()
    void stopSpeechTracking()
  }
  teleprompterStore.pause()
}

/**
 * Starts voice-driven playback. If the platform doesn't support speech
 * recognition at all, falls back to automatic scroll immediately and
 * visibly, rather than leaving the script frozen (spec requirement).
 */
function startVoiceMode() {
  if (!isVoiceTrackingSupported) {
    prefsStore.setScrollMode('auto')
    teleprompterStore.play()
    return
  }

  resyncVoiceCursorToScroll()
  teleprompterStore.play({ skipAutoScroller: true })
  void startSpeechTracking()
}

/**
 * Mid-session fallback: a hard engine error (no support / permission denied)
 * while voice mode is active switches back to automatic scroll so the reader
 * is never left stuck with a frozen script.
 */
function fallbackToAutoMode() {
  voiceScrollAnimator.cancel()
  void stopSpeechTracking()
  prefsStore.setScrollMode('auto')

  if (teleprompterStore.isPlaying) {
    teleprompterStore.pause()
    teleprompterStore.play()
  }
}

watch(voiceError, (err) => {
  if (!err || prefsStore.scrollMode !== 'voice') return
  if (err.code === 'not-supported' || err.code === 'permission-denied') {
    fallbackToAutoMode()
  }
})

// Drive the scroll offset from the estimated script position while voice
// mode is active and playing - the presenter itself never knows the source.
watch(voiceProgressRatio, (ratio) => {
  if (prefsStore.scrollMode !== 'voice' || !teleprompterStore.isPlaying) return

  // ratio * maxOffset (the naive version) scrolls the estimated word to the
  // very TOP of the viewport, not to the highlight band - the band sits at
  // highlightBandPosPct% down from the top (see TeleprompterFrameV2's
  // highlightBandStyle), so the target offset must subtract that much
  // viewport height to actually bring the currently-read word up to the
  // band instead of leaving it below the visible/expected reading line.
  const estimatedContentPosition = ratio * teleprompterStore.contentHeightPx
  const bandOffsetPx = teleprompterStore.viewportHeightPx * (prefsStore.highlightBandPosPct / 100)
  const target = clampScrollOffset(
    estimatedContentPosition - bandOffsetPx,
    teleprompterStore.contentHeightPx,
    teleprompterStore.viewportHeightPx
  )

  voiceScrollAnimator.scrollTo(target, SPEECH_SCROLL_ANIMATION_DURATION_MS)
})

// Switching the quick-toggle mid-playback swaps the active driver immediately,
// instead of waiting for the next pause/play.
watch(
  () => prefsStore.scrollMode,
  (mode) => {
    if (!teleprompterStore.isPlaying) return

    if (mode === 'voice') {
      if (!isVoiceTrackingSupported) {
        prefsStore.setScrollMode('auto')
        return
      }
      resyncVoiceCursorToScroll()
      teleprompterStore.pause()
      teleprompterStore.play({ skipAutoScroller: true })
      void startSpeechTracking()
    } else {
      voiceScrollAnimator.cancel()
      void stopSpeechTracking()
      teleprompterStore.pause()
      teleprompterStore.play()
    }
  }
)

function onStepLines(lines: number) {
  teleprompterStore.stepLines(lines)
  resyncVoiceCursorToScroll()
}

function onGoHome() {
  teleprompterStore.toHome()
  resyncVoiceCursorToScroll()
}

function onGoEnd() {
  teleprompterStore.toEnd()
  resyncVoiceCursorToScroll()
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
  router.push('/edit')
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

function onManualScroll(scrollTop: number) {
  teleprompterStore.syncScrollFromDOM(scrollTop)
  resyncVoiceCursorToScroll()
}

function onTeleprompterTap() {
  // Handle toolbar visibility on tap
  if (teleprompterStore.isPlaying) {
    // If playing, show toolbar temporarily (it will auto-hide)
    showToolbar(true)
  } else if (toolbarVisible.value) {
    hideToolbar()
  } else {
    showToolbar()
  }

  // Emit custom event for backward compatibility
  const event = new CustomEvent('teleprompter-tap')
  window.dispatchEvent(event)
}

// Parse hash navigation for deep linking (e.g., /#options/cloud)
function parseHashNavigation() {
  const hash = globalThis.location.hash

  if (!hash || hash === '#' || hash === '#/') {
    return
  }

  // Remove the leading '#' or '#/'
  const path = hash.replace(/^#\/?/, '')

  // Parse the path segments
  const segments = path.split('/')

  // Handle different navigation patterns
  if (segments[0] === 'options' && segments.length > 1) {
    // Open settings dialog with specific tab
    const tab = segments[1]
    if (tab) {
      settingsInitialTab.value = tab
    }

    // Use nextTick to ensure the dialog opens after the tab is set
    nextTick(() => {
      settingsOpen.value = true
    })

    // Clear the hash after processing to avoid re-triggering
    window.history.replaceState(null, '', globalThis.location.pathname)
  }
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
    // Fallback content using i18n
    const fallbackContent = t('messages.welcomeContent')
    await teleprompterStore.setContent(fallbackContent)
  }
}

// Hotkey setup
function setupHotkeys() {
  const actions = {
    'toggle-play': () => {
      console.log('[ANDROID DEBUG] hotkey toggle-play triggered')
      teleprompterStore.toggle()
    },
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

  /* Android edge-to-edge support - no top padding for full immersion */
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  /* Don't add bottom padding here - let FloatingToolbar handle it */
}

/* iOS Back Button - Floating in top-left corner */
.ios-back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  opacity: 0.7;
  transition: opacity 0.3s;
}

.ios-back-button:hover {
  opacity: 1;
}

/* Ensure content area respects safe areas on Android - no top padding for immersive teleprompter */
@supports (padding: max(0px)) {
  .teleprompter-page {
    padding-left: max(0px, env(safe-area-inset-left, 0px));
    padding-right: max(0px, env(safe-area-inset-right, 0px));
  }

  /* iOS Back Button respects safe area */
  .ios-back-button {
    top: max(20px, env(safe-area-inset-top, 20px));
    left: max(20px, env(safe-area-inset-left, 20px));
  }
}
</style>
