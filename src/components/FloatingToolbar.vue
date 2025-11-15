<template>
  <!-- Simplified Bottom Toolbar - Always 3 buttons -->
  <div
    v-if="props.isVisible"
    class="floating-toolbar"
    data-testid="floating-toolbar"
  >
    <!-- Play/Pause Button -->
    <button
      class="toolbar-btn"
      :aria-label="teleprompterStore.isPlaying ? t('toolbar.pause') : t('toolbar.play')"
      data-testid="play-pause-button"
      @click="togglePlay"
    >
      <v-icon 
        :icon="teleprompterStore.isPlaying ? 'mdi-pause' : 'mdi-play'" 
        size="32"
      />
    </button>

    <!-- Speed Control -->
    <SpeedControl
      :speed="prefsStore.speedPxPerSec"
      :min="prefsStore.speedMin"
      :max="prefsStore.speedMax"
      @change="onSpeedChange"
    />

    <!-- More Button (opens ActionsMenu) -->
    <button
      class="toolbar-btn"
      :aria-label="t('toolbar.more')"
      data-testid="more-menu-button"
      @click="actionsMenuOpen = true"
    >
      <v-icon 
        icon="mdi-dots-vertical" 
        size="32"
      />
    </button>
  </div>

  <!-- Instagram-style Actions Menu -->
  <ActionsMenu
    v-model="actionsMenuOpen"
    :font-size="prefsStore.fontSizePx"
    :mirror-h="prefsStore.mirrorH"
    :mirror-v="prefsStore.mirrorV"
    :is-immersive="isImmersive"
    :is-immersive-supported="isImmersiveSupported"
    :is-theater-mode="isTheaterMode"
    :is-theater-loading="isTheaterLoading"
    :is-desktop="isDesktop"
    @step-lines="$emit('stepLines', $event)"
    @go-home="$emit('goHome')"
    @go-end="$emit('goEnd')"
    @font-size-change="onFontSizeChange"
    @mirror-toggle="$emit('mirrorToggle', $event)"
    @toggle-immersive="toggleImmersiveMode"
    @toggle-theater="toggleTheaterMode"
    @open-file="$emit('openFile')"
    @open-editor="$emit('openEditor')"
    @open-settings="$emit('openSettings')"
    @minimize-window="minimizeWindow"
    @maximize-window="maximizeWindow"
    @toggle-fullscreen="toggleFullscreen"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { Capacitor } from '@capacitor/core'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useFullscreen } from '@/utils/fullscreen'
import { useTauri } from '@/utils/tauri'
import { useTheaterMode } from '@/composables/useTheaterMode'
import SpeedControl from './SpeedControl.vue'
import ActionsMenu from './ActionsMenu.vue'

// I18n
const { t } = useI18n()

// Display (for responsive logic)
const { xs, sm } = useDisplay()

// Props
interface Props {
  scrollState: {
    offset: number
    isPlaying: boolean
    canScrollUp: boolean
    canScrollDown: boolean
    progress: number
  }
  speedConfig: {
    current: number
    min: number
    max: number
  }
  displayPrefs: {
    fontFamily: string
    fontSizePx: number
    lineHeight: number
    fgColor: string
    bgColor: string
    mirrorH: boolean
    mirrorV: boolean
    textAlignment: string
  }
  isVisible: boolean
  isMinimal?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isMinimal: false,
})

console.log('[FloatingToolbar] Component mounted, isVisible:', props.isVisible)
console.log('[FloatingToolbar] Props:', JSON.stringify(props, null, 2))

// Emits
const emit = defineEmits<{
  play: []
  pause: []
  togglePlay: []
  stepLines: [lines: number]
  goHome: []
  goEnd: []
  speedChange: [delta: number]
  fontSizeChange: [delta: number]
  mirrorToggle: [axis: 'h' | 'v']
  openEditor: []
  openSettings: []
  openFile: []
}>()

// Stores
const teleprompterStore = useTeleprompterStore()
const prefsStore = usePrefsStore()

// Platform detection
const isAndroid = Capacitor.getPlatform() === 'android'
const isNative = Capacitor.isNativePlatform()
const isDesktop = !isNative

// Immersive mode state (Android)
const isImmersive = ref(false)
const isImmersiveSupported = isAndroid

// Fullscreen composables
const fullscreenComposable = useFullscreen()
const toggleFullscreen = fullscreenComposable.toggleFullscreen || (() => Promise.resolve(false))

// Theater mode (Desktop)
const { isTheaterMode, isLoading: isTheaterLoading, toggleTheaterMode } = useTheaterMode()

// Toolbar visibility state (independent from props.isVisible)
const toolbarVisible = ref(true)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

// Show toolbar with optional auto-hide
function showToolbar(autoHide = false) {
  toolbarVisible.value = true

  // Clear any existing timeout
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }

  // Auto-hide after 3 seconds if requested
  if (autoHide) {
    hideTimeout = setTimeout(() => {
      hideToolbar()
    }, 3000)
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

// Watch for isVisible prop changes
watch(
  () => props.isVisible,
  (newVal, oldVal) => {
    console.log('[FloatingToolbar] isVisible changed from', oldVal, 'to', newVal)
  }
)

// Watch for play/pause state changes
watch(
  () => teleprompterStore.isPlaying,
  (isPlaying) => {
    console.log('[FloatingToolbar] isPlaying changed to:', isPlaying)
    if (isPlaying) {
      // On mobile devices, keep toolbar visible during playback for easier control
      if (xs.value || sm.value) {
        showToolbar()
      } else {
        // Hide toolbar on desktop/larger screens for clean reading experience
        hideToolbar()
      }
    } else {
      showToolbar()
    }
  },
  { immediate: true }
)

// State
const actionsMenuOpen = ref(false)

// Actions
function togglePlay() {
  console.log('[FloatingToolbar] togglePlay() called, isPlaying:', teleprompterStore.isPlaying)
  if (teleprompterStore.isPlaying) {
    emit('pause')
  } else {
    emit('play')
  }
}

function onSpeedChange(delta: number) {
  emit('speedChange', delta)
}

function onFontSizeChange(delta: number) {
  emit('fontSizeChange', delta)
}

// Immersive mode toggle (Android) - Using Capacitor StatusBar
async function toggleImmersiveMode() {
  if (!isImmersiveSupported) return

  try {
    const { StatusBar } = await import('@capacitor/status-bar')
    
    if (!isImmersive.value) {
      await StatusBar.hide()
      isImmersive.value = true
    } else {
      await StatusBar.show()
      isImmersive.value = false
    }
  } catch (error) {
    console.error('Error toggling immersive mode:', error)
  }
}

// Desktop window controls - Stubs for now
async function minimizeWindow() {
  console.log('minimizeWindow called - feature not yet implemented')
}

async function maximizeWindow() {
  console.log('maximizeWindow called - feature not yet implemented')
}

// Initialize Tauri when component mounts
onMounted(async () => {
  const { init } = useTauri()
  await init()

  // Listen for screen taps
  window.addEventListener('teleprompter-tap', handleScreenTap)
})

onUnmounted(() => {
  window.removeEventListener('teleprompter-tap', handleScreenTap)
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }
})
</script>

<style scoped>
.floating-toolbar {
  position: fixed !important;
  bottom: 16px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 9999 !important;
  min-width: 320px !important;
  max-width: calc(100vw - 40px) !important;
  border-radius: 28px !important;
  background: rgba(0, 0, 0, 0.9) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  padding: 8px 20px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  gap: 16px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 12px;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 56px;
  height: 56px;
  flex-shrink: 0;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.toolbar-btn:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.2);
}

/* Responsive adjustments */
@media (max-width: 360px) {
  .floating-toolbar {
    min-width: 280px !important;
    bottom: 12px !important;
    gap: 12px;
    padding: 8px 16px;
  }
  
  .toolbar-btn {
    width: 52px;
    height: 52px;
    padding: 10px;
  }
}

@media (min-width: 600px) {
  .floating-toolbar {
    max-width: 500px;
    bottom: 24px !important;
    gap: 20px;
    padding: 10px 24px;
  }
  
  .toolbar-btn {
    width: 60px;
    height: 60px;
    padding: 14px;
  }
}
</style>

