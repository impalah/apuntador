<!--
  FloatingToolbar v2 - Decoupled Implementation
  
  This version uses service abstractions and pure props/events,
  making it completely swappable with other toolbar implementations.
-->
<template>
  <v-bottom-navigation
    v-show="isVisible"
    class="floating-toolbar"
    color="primary"
    bg-color="rgba(0, 0, 0, 0.8)"
    height="80"
    grow
    data-testid="floating-toolbar"
  >
    <!-- Minimal mode for mobile and small tablets (xs and sm screens) -->
    <template v-if="isMinimal">
      <!-- Play/Pause -->
      <v-btn
        :icon="scrollState.isPlaying ? 'mdi-pause' : 'mdi-play'"
        :aria-label="scrollState.isPlaying ? 'Pause' : 'Play'"
        size="large"
        data-testid="play-pause-button"
        @click="handleTogglePlay"
      />

      <!-- Speed Control -->
      <SpeedControl
        :speed="speedConfig.current"
        :min="speedConfig.min"
        :max="speedConfig.max"
        @change="handleSpeedChange"
      />

      <!-- More Menu -->
      <v-menu v-model="moreMenuOpen" :close-on-content-click="false" location="top" offset="16">
        <template #activator="{ props }">
          <v-btn
            icon="mdi-dots-vertical"
            size="large"
            data-testid="more-menu-button"
            v-bind="props"
          />
        </template>

        <v-card min-width="320" max-width="360" class="more-menu-card">
          <v-card-text class="pa-3">
            <div class="more-menu-content">
              <!-- Navigation Controls Row -->
              <div class="menu-section navigation-controls">
                <div class="control-group-horizontal">
                  <v-btn
                    icon="mdi-skip-previous"
                    variant="text"
                    size="small"
                    class="nav-btn"
                    @click="handleStepLines(-5)"
                  />
                  <v-btn
                    icon="mdi-chevron-up"
                    variant="text"
                    size="small"
                    class="nav-btn"
                    @click="handleStepLines(-1)"
                  />
                  <v-btn
                    icon="mdi-chevron-down"
                    variant="text"
                    size="small"
                    class="nav-btn"
                    @click="handleStepLines(1)"
                  />
                  <v-btn
                    icon="mdi-skip-next"
                    variant="text"
                    size="small"
                    class="nav-btn"
                    @click="handleStepLines(5)"
                  />
                </div>
              </div>

              <!-- Home/End Controls -->
              <div class="menu-section home-end-controls">
                <div class="control-group-horizontal">
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-home"
                    size="small"
                    class="flex-btn"
                    @click="handleGoHome"
                  >
                    Home
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-arrow-down-bold"
                    size="small"
                    class="flex-btn"
                    @click="handleGoEnd"
                  >
                    End
                  </v-btn>
                </div>
              </div>

              <!-- Font Size Control -->
              <div class="menu-section font-controls">
                <FontSizeControl :size="displayPrefs.fontSizePx" @change="handleFontSizeChange" />
              </div>

              <!-- Mirror Controls -->
              <div class="menu-section mirror-controls">
                <div class="control-group-horizontal">
                  <v-btn
                    :icon="displayPrefs.mirrorH ? 'mdi-flip-horizontal' : 'mdi-flip-horizontal'"
                    :variant="displayPrefs.mirrorH ? 'flat' : 'outlined'"
                    size="small"
                    class="flex-btn"
                    data-testid="mirror-h-button"
                    @click="handleMirrorToggle('h')"
                  >
                    Mirror H
                  </v-btn>
                  <v-btn
                    :icon="displayPrefs.mirrorV ? 'mdi-flip-vertical' : 'mdi-flip-vertical'"
                    :variant="displayPrefs.mirrorV ? 'flat' : 'outlined'"
                    size="small"
                    class="flex-btn"
                    data-testid="mirror-v-button"
                    @click="handleMirrorToggle('v')"
                  >
                    Mirror V
                  </v-btn>
                </div>
              </div>

              <!-- Actions -->
              <div class="menu-section action-controls">
                <div class="control-group-horizontal">
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-pencil"
                    size="small"
                    class="flex-btn"
                    data-testid="editor-button"
                    @click="handleOpenEditor"
                  >
                    Editor
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-cog"
                    size="small"
                    class="flex-btn"
                    data-testid="settings-button"
                    @click="handleOpenSettings"
                  >
                    Settings
                  </v-btn>
                </div>
                <div class="control-group-horizontal mt-2">
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-file-import"
                    size="small"
                    class="flex-btn"
                    data-testid="file-button"
                    @click="handleOpenFile"
                  >
                    Import File
                  </v-btn>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-menu>
    </template>

    <!-- Full desktop mode -->
    <template v-else>
      <!-- Play/Pause -->
      <v-btn
        :icon="scrollState.isPlaying ? 'mdi-pause' : 'mdi-play'"
        :aria-label="scrollState.isPlaying ? 'Pause' : 'Play'"
        data-testid="play-pause-button"
        @click="handleTogglePlay"
      />

      <!-- Navigation -->
      <v-btn icon="mdi-skip-previous" data-testid="step-back-button" @click="handleStepLines(-5)" />
      <v-btn icon="mdi-chevron-up" data-testid="line-up-button" @click="handleStepLines(-1)" />
      <v-btn icon="mdi-chevron-down" data-testid="line-down-button" @click="handleStepLines(1)" />
      <v-btn icon="mdi-skip-next" data-testid="step-forward-button" @click="handleStepLines(5)" />

      <!-- Home/End -->
      <v-btn icon="mdi-home" data-testid="home-button" @click="handleGoHome" />
      <v-btn icon="mdi-arrow-down-bold" data-testid="end-button" @click="handleGoEnd" />

      <!-- Speed Control -->
      <SpeedControl
        :speed="speedConfig.current"
        :min="speedConfig.min"
        :max="speedConfig.max"
        @change="handleSpeedChange"
      />

      <!-- Font Size Control -->
      <FontSizeControl :size="displayPrefs.fontSizePx" @change="handleFontSizeChange" />

      <!-- Mirror Controls -->
      <v-btn
        :icon="displayPrefs.mirrorH ? 'mdi-flip-horizontal' : 'mdi-flip-horizontal'"
        :variant="displayPrefs.mirrorH ? 'flat' : 'outlined'"
        data-testid="mirror-h-button"
        @click="handleMirrorToggle('h')"
      />
      <v-btn
        :icon="displayPrefs.mirrorV ? 'mdi-flip-vertical' : 'mdi-flip-vertical'"
        :variant="displayPrefs.mirrorV ? 'flat' : 'outlined'"
        data-testid="mirror-v-button"
        @click="handleMirrorToggle('v')"
      />

      <!-- Actions -->
      <v-btn icon="mdi-pencil" data-testid="editor-button" @click="handleOpenEditor" />
      <v-btn icon="mdi-cog" data-testid="settings-button" @click="handleOpenSettings" />
      <v-btn icon="mdi-file-import" data-testid="file-button" @click="handleOpenFile" />
    </template>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SpeedControl from './SpeedControl.vue'
import FontSizeControl from './FontSizeControl.vue'
import type { FloatingToolbarProps, ToolbarEvents } from '@/types/component-interfaces'

// ========================================
// Props & Events (Pure Interface)
// ========================================

interface Props {
  scrollState: FloatingToolbarProps['scrollState']
  speedConfig: FloatingToolbarProps['speedConfig']
  displayPrefs: FloatingToolbarProps['displayPrefs']
  isVisible: FloatingToolbarProps['isVisible']
  isMinimal?: FloatingToolbarProps['isMinimal']
}

const props = withDefaults(defineProps<Props>(), {
  isMinimal: false,
})

const emit = defineEmits<ToolbarEvents>()

// ========================================
// Local State
// ========================================

const moreMenuOpen = ref(false)

// ========================================
// Event Handlers (Pure functions)
// ========================================

function handlePlay() {
  emit('play')
}

function handlePause() {
  emit('pause')
}

function handleTogglePlay() {
  emit('toggle-play')
}

function handleStepLines(count: number) {
  emit('step-lines', count)
}

function handleGoHome() {
  emit('go-home')
}

function handleGoEnd() {
  emit('go-end')
}

function handleSpeedChange(speed: number) {
  emit('speed-change', speed)
}

function handleFontSizeChange(size: number) {
  emit('font-size-change', size)
}

function handleMirrorToggle(axis: 'h' | 'v') {
  emit('mirror-toggle', axis)
}

function handleOpenEditor() {
  emit('open-editor')
  moreMenuOpen.value = false
}

function handleOpenSettings() {
  emit('open-settings')
  moreMenuOpen.value = false
}

function handleOpenFile() {
  emit('open-file')
  moreMenuOpen.value = false
}
</script>

<style scoped>
.floating-toolbar {
  position: fixed !important;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  border-radius: 0 !important;
  backdrop-filter: blur(10px);
  transition:
    transform 0.3s ease-in-out,
    opacity 0.3s ease-in-out;
}

.floating-toolbar.v-bottom-navigation--grow .v-btn {
  max-width: none;
  flex: 1;
}

.more-menu-card {
  backdrop-filter: blur(20px);
  background: rgba(0, 0, 0, 0.9) !important;
}

.more-menu-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group-horizontal {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.nav-btn {
  min-width: 40px !important;
  flex: 1;
}

.flex-btn {
  flex: 1;
  min-width: 0;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .floating-toolbar {
    height: 72px;
  }
}

@media (max-width: 600px) {
  .floating-toolbar {
    height: 64px;
  }
}

/* Animation for show/hide */
.toolbar-enter-active,
.toolbar-leave-active {
  transition:
    transform 0.3s ease-in-out,
    opacity 0.3s ease-in-out;
}

.toolbar-enter-from,
.toolbar-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .floating-toolbar {
    background: rgba(0, 0, 0, 0.95) !important;
    border-top: 2px solid rgba(255, 255, 255, 0.3);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .floating-toolbar,
  .toolbar-enter-active,
  .toolbar-leave-active {
    transition: none;
  }
}

/* Safe area insets for mobile */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .floating-toolbar {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
