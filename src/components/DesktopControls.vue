<template>
  <div v-if="tauriComposable.isDesktop.value" class="desktop-controls">
    <!-- Desktop-specific controls -->
    <v-btn-group variant="outlined" density="compact">
      <v-btn
        icon="mdi-window-minimize"
        size="small"
        @click="tauriComposable.minimizeWindow"
        :title="t('desktop.minimize')"
      />
      <v-btn
        :icon="isMaximized ? 'mdi-window-restore' : 'mdi-window-maximize'"
        size="small"
        @click="toggleMaximize"
        :title="t('desktop.maximize')"
      />
      <v-btn
        icon="mdi-close"
        size="small"
        @click="tauriComposable.closeWindow"
        :title="t('desktop.close')"
      />
    </v-btn-group>

    <v-divider vertical class="mx-2" />

    <!-- Always on top toggle -->
    <v-btn
      :icon="alwaysOnTop ? 'mdi-pin' : 'mdi-pin-outline'"
      :variant="alwaysOnTop ? 'flat' : 'outlined'"
      size="small"
      @click="toggleAlwaysOnTop"
      :title="t('desktop.alwaysOnTop')"
    />

    <!-- Fullscreen toggle -->
    <v-btn
      :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
      :variant="isFullscreen ? 'flat' : 'outlined'"
      size="small"
      @click="toggleFullscreen"
      :title="t('desktop.fullscreen')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTauri } from '@/utils/tauri'

// I18n
const { t } = useI18n()

// Tauri composable
const tauriComposable = useTauri()

// State
const isMaximized = ref(false)
const isFullscreen = ref(false)
const alwaysOnTop = ref(false)

// Actions
const toggleMaximize = async () => {
  const maximized = await tauriComposable.maximizeWindow()
  if (typeof maximized === 'boolean') {
    isMaximized.value = maximized
  }
}

const toggleFullscreen = async () => {
  const fullscreen = await tauriComposable.toggleFullscreen()
  if (typeof fullscreen === 'boolean') {
    isFullscreen.value = fullscreen
  }
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
