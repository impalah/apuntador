<template>
  <div
    v-if="tauriComposable.isDesktop.value"
    class="desktop-controls"
  >
    <!-- Desktop-specific controls -->
    <v-btn-group
      variant="outlined"
      density="compact"
    >
      <v-btn
        icon="mdi-window-minimize"
        size="small"
        :title="t('desktop.minimize')"
        @click="tauriComposable.minimizeWindow"
      />
      <v-btn
        :icon="isMaximized ? 'mdi-window-restore' : 'mdi-window-maximize'"
        size="small"
        :title="t('desktop.maximize')"
        @click="toggleMaximize"
      />
      <v-btn
        icon="mdi-close"
        size="small"
        :title="t('desktop.close')"
        @click="tauriComposable.closeWindow"
      />
    </v-btn-group>

    <v-divider
      vertical
      class="mx-2"
    />

    <!-- Always on top toggle -->
    <v-btn
      :icon="alwaysOnTop ? 'mdi-pin' : 'mdi-pin-outline'"
      :variant="alwaysOnTop ? 'flat' : 'outlined'"
      size="small"
      :title="t('desktop.alwaysOnTop')"
      @click="toggleAlwaysOnTop"
    />

    <!-- Fullscreen toggle -->
    <v-btn
      :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
      :variant="isFullscreen ? 'flat' : 'outlined'"
      size="small"
      :title="t('desktop.fullscreen')"
      @click="toggleFullscreen"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTauri } from '@/utils/tauri'
import { useFullscreen } from '@/utils/display/fullscreen'

// I18n
const { t } = useI18n()

// Tauri composable
const tauriComposable = useTauri()

// Unified fullscreen
const fullscreenComposable = useFullscreen()

// State
const isMaximized = ref(false)
const alwaysOnTop = ref(false)

// Use reactive fullscreen state from composable
const { isFullscreen } = fullscreenComposable

// Actions
const toggleMaximize = async () => {
  const maximized = await tauriComposable.maximizeWindow()
  if (typeof maximized === 'boolean') {
    isMaximized.value = maximized
  }
}

const toggleFullscreen = async () => {
  await fullscreenComposable.toggleFullscreen()
  // State is automatically updated by the composable
}

const toggleAlwaysOnTop = async () => {
  const newState = !alwaysOnTop.value
  await tauriComposable.setAlwaysOnTop(newState)
  alwaysOnTop.value = newState
}

// Initialize Tauri when component mounts
onMounted(async () => {
  await tauriComposable.init()
})
</script>

<style scoped>
.desktop-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 600px) {
  .desktop-controls {
    display: none;
  }
}
</style>
