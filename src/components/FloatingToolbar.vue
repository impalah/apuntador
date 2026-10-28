<template>
  <!-- Simplified Bottom Toolbar - 3 fixed buttons plus the voice-mode quick toggle -->
  <div v-if="props.isVisible" class="floating-toolbar" data-testid="floating-toolbar">
    <!-- Play/Pause Button -->
    <button
      class="toolbar-btn"
      :aria-label="teleprompterStore.isPlaying ? t('toolbar.pause') : t('toolbar.play')"
      data-testid="play-pause-button"
      @click="togglePlay"
    >
      <v-icon :icon="teleprompterStore.isPlaying ? 'mdi-pause' : 'mdi-play'" size="32" />
    </button>

    <!-- Voice-mode quick toggle - hidden where the platform can't support it
    (Android; see isVoiceModeOfferedOnPlatform in capacitorSpeechEngine.ts) -->
    <button
      v-if="isVoiceModeOffered"
      class="toolbar-btn"
      :class="{ active: prefsStore.scrollMode === 'voice' }"
      :aria-label="
        prefsStore.scrollMode === 'voice'
          ? t('toolbar.scrollModeVoiceOn')
          : t('toolbar.scrollModeVoiceOff')
      "
      data-testid="scroll-mode-quick-toggle"
      @click="toggleScrollMode"
    >
      <v-icon
        :icon="prefsStore.scrollMode === 'voice' ? 'mdi-microphone' : 'mdi-microphone-outline'"
        size="28"
      />
    </button>

    <!-- Frame picker: markdown vs monospace -->
    <FramePickerControl />

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
      <v-icon icon="mdi-dots-vertical" size="32" />
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
    @step-lines="$emit('stepLines', $event)"
    @go-home="$emit('goHome')"
    @go-end="$emit('goEnd')"
    @font-size-change="onFontSizeChange"
    @mirror-toggle="$emit('mirrorToggle', $event)"
    @toggle-immersive="toggleImmersiveMode"
    @toggle-theater="toggleTheaterMode"
    @open-file="$emit('openFile')"
    @open-editor="$emit('openEditor')"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Capacitor } from '@capacitor/core'
import { isVoiceModeOfferedOnPlatform } from '@/services/speech/capacitorSpeechEngine'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useTauri } from '@/utils/tauri'
import { useTheaterMode } from '@/composables/useTheaterMode'
import SpeedControl from './SpeedControl.vue'
import ActionsMenu from './ActionsMenu.vue'
import FramePickerControl from './FramePickerControl.vue'

// I18n
const { t } = useI18n()

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

// console.log('[FloatingToolbar] Component mounted, isVisible:', props.isVisible)
// console.log('[FloatingToolbar] Props:', JSON.stringify(props, null, 2))

// Emits
const emit = defineEmits<{
  play: []
  pause: []
  stepLines: [lines: number]
  goHome: []
  goEnd: []
  speedChange: [delta: number]
  fontSizeChange: [delta: number]
  mirrorToggle: [axis: 'h' | 'v']
  openEditor: []
  openFile: []
}>()

// Stores
const teleprompterStore = useTeleprompterStore()
const prefsStore = usePrefsStore()

// Platform detection
const isAndroid = Capacitor.getPlatform() === 'android'
const isVoiceModeOffered = isVoiceModeOfferedOnPlatform()

// Immersive mode state (Android)
const isImmersive = ref(false)
const isImmersiveSupported = isAndroid

// Theater mode (Desktop)
const { isTheaterMode, isLoading: isTheaterLoading, toggleTheaterMode } = useTheaterMode()

// State
const actionsMenuOpen = ref(false)

// Actions
function togglePlay() {
  if (teleprompterStore.isPlaying) {
    emit('pause')
  } else {
    emit('play')
  }
}

function onSpeedChange(delta: number) {
  emit('speedChange', delta)
}

function toggleScrollMode() {
  prefsStore.setScrollMode(prefsStore.scrollMode === 'voice' ? 'auto' : 'voice')
}

function onFontSizeChange(delta: number) {
  emit('fontSizeChange', delta)
}

// Immersive mode toggle (Android) - Using Capacitor StatusBar
async function toggleImmersiveMode() {
  if (!isImmersiveSupported) return

  try {
    const { StatusBar } = await import('@capacitor/status-bar')

    if (isImmersive.value) {
      await StatusBar.show()
      isImmersive.value = false
    } else {
      await StatusBar.hide()
      isImmersive.value = true
    }
  } catch (error) {
    console.error('Error toggling immersive mode:', error)
  }
}

// Initialize Tauri when component mounts
onMounted(async () => {
  const { init } = useTauri()
  await init()
})
</script>

<style scoped>
.floating-toolbar {
  position: fixed !important;
  bottom: calc(16px + env(safe-area-inset-bottom)) !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 9999 !important;

  /* Size to content but never wider than the screen: with five controls the
     old fixed 360px box overflowed and pushed the More button off-screen */
  width: max-content;
  max-width: calc(100vw - 16px);
  border-radius: 28px !important;
  background: #1a1a1a !important; /* Gris oscuro como ActionsMenu */
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgb(0 0 0 / 40%);
  padding: 6px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000; /* Fondo negro para contraste */
  border: none;
  color: white;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}

.toolbar-btn:hover {
  background: #111; /* Negro más claro al hover */
}

.toolbar-btn:active {
  transform: scale(0.95);
  background: #222;
}

.toolbar-btn.active {
  background: rgb(var(--v-theme-primary), 0.3);
}

.toolbar-btn.active:hover {
  background: rgb(var(--v-theme-primary), 0.4);
}

/* Responsive adjustments: phones get the compact layout above; very narrow
   screens (320px) shrink a little more so all five controls still fit */
@media (max-width: 360px) {
  .floating-toolbar {
    bottom: calc(12px + env(safe-area-inset-bottom)) !important;
    gap: 4px;
    padding: 6px;
  }

  .toolbar-btn {
    width: 40px;
    height: 40px;
    padding: 4px;
  }
}

@media (min-width: 600px) {
  .floating-toolbar {
    min-width: 360px;
    max-width: 560px;
    bottom: calc(24px + env(safe-area-inset-bottom)) !important;
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
