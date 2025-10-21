<!--
  FloatingToolbar - Modular Implementation
  
  This version implements the modular design using pure props/events interfaces,
  making it completely swappable with other toolbar implementations while
  maintaining all the styles and functionality of the original.
-->
<template>
  <v-bottom-navigation
    v-model="activeTab"
    class="floating-toolbar"
    :class="{ hidden: !isVisible }"
    color="primary"
    bg-color="rgba(0, 0, 0, 0.8)"
    height="80"
    grow
    data-testid="floating-toolbar"
  >
    <!-- Minimal mode for mobile and small tablets -->
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
                    {{ t('common.home') }}
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    prepend-icon="mdi-arrow-down-bold"
                    size="small"
                    class="flex-btn"
                    @click="handleGoEnd"
                  >
                    {{ t('common.end') }}
                  </v-btn>
                </div>
              </div>

              <!-- Font Size Control -->
              <div class="menu-section font-control">
                <FontSizeControl :size="displayPrefs.fontSizePx" @change="handleFontSizeChange" />
              </div>

              <!-- Text Alignment Controls -->
              <div class="menu-section alignment-controls">
                <TextAlignmentControls :is-menu-layout="true" />
              </div>

              <!-- Mirror Controls -->
              <div class="menu-section mirror-controls">
                <div class="control-group-horizontal">
                  <v-btn
                    :variant="displayPrefs.mirrorH ? 'flat' : 'outlined'"
                    prepend-icon="mdi-flip-horizontal"
                    size="small"
                    class="flex-btn"
                    data-testid="mirror-h-button"
                    @click="handleMirrorToggle('h')"
                  >
                    {{ t('toolbar.mirrorHorizontal') }}
                  </v-btn>
                  <v-btn
                    :variant="displayPrefs.mirrorV ? 'flat' : 'outlined'"
                    prepend-icon="mdi-flip-vertical"
                    size="small"
                    class="flex-btn"
                    data-testid="mirror-v-button"
                    @click="handleMirrorToggle('v')"
                  >
                    {{ t('toolbar.mirrorVertical') }}
                  </v-btn>
                </div>

                <!-- Immersive Mode for Android -->
                <div v-if="isImmersiveSupported" class="control-group-horizontal">
                  <v-btn
                    :variant="isImmersive ? 'flat' : 'outlined'"
                    :prepend-icon="isImmersive ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
                    size="small"
                    class="flex-btn"
                    data-testid="immersive-mode-button"
                    @click="toggleImmersiveMode"
                  >
                    {{ isImmersive ? t('toolbar.exitFullscreen') : t('toolbar.fullscreen') }}
                  </v-btn>
                </div>
              </div>

              <!-- Desktop Window Controls -->
              <div v-if="isDesktop" class="menu-section desktop-controls">
                <v-divider class="mb-2" />
                <div class="control-group-horizontal">
                  <v-btn
                    variant="outlined"
                    icon="mdi-fullscreen"
                    size="small"
                    class="action-btn"
                    data-testid="desktop-fullscreen-button"
                    @click="toggleFullscreen"
                  />
                  <v-btn
                    variant="outlined"
                    icon="mdi-window-minimize"
                    size="small"
                    class="action-btn"
                    data-testid="desktop-minimize-button"
                    @click="minimizeWindow"
                  />
                  <v-btn
                    variant="outlined"
                    icon="mdi-window-maximize"
                    size="small"
                    class="action-btn"
                    data-testid="desktop-maximize-button"
                    @click="maximizeWindow"
                  />
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="menu-section action-controls">
                <div class="control-group-horizontal">
                  <v-btn
                    variant="outlined"
                    icon="mdi-pencil"
                    size="small"
                    class="action-btn"
                    data-testid="editor-button"
                    @click="handleOpenEditor"
                  />
                  <v-btn
                    variant="outlined"
                    icon="mdi-folder-open"
                    size="small"
                    class="action-btn"
                    data-testid="file-button"
                    @click="handleOpenFile"
                  />
                  <v-btn
                    variant="outlined"
                    icon="mdi-cog"
                    size="small"
                    class="action-btn"
                    data-testid="settings-button"
                    @click="handleOpenSettings"
                  />
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-menu>
    </template>

    <!-- Compact mode for medium tablets and small/medium desktops -->
    <template
      v-else-if="
        $vuetify.display.md ||
        ($vuetify.display.lg && $vuetify.display.width < 1500) ||
        ($vuetify.display.xl && $vuetify.display.width < 1500)
      "
    >
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

      <!-- Navigation (condensed) -->
      <v-btn icon="mdi-chevron-up" @click="handleStepLines(-1)" />
      <v-btn icon="mdi-chevron-down" @click="handleStepLines(1)" />

      <!-- Font Size Control -->
      <FontSizeControl :size="displayPrefs.fontSizePx" @change="handleFontSizeChange" />

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
                    icon="mdi-home"
                    variant="text"
                    size="small"
                    class="nav-btn"
                    @click="handleGoHome"
                  />
                  <v-btn
                    icon="mdi-arrow-down-bold"
                    variant="text"
                    size="small"
                    class="nav-btn"
                    @click="handleGoEnd"
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

              <!-- Text Alignment Controls -->
              <div class="menu-section alignment-controls">
                <TextAlignmentControls :is-menu-layout="true" />
              </div>

              <!-- Mirror Controls -->
              <div class="menu-section mirror-controls">
                <div class="control-group-horizontal">
                  <v-btn
                    :variant="displayPrefs.mirrorH ? 'flat' : 'outlined'"
                    prepend-icon="mdi-flip-horizontal"
                    size="small"
                    class="flex-btn"
                    data-testid="mirror-h-button"
                    @click="handleMirrorToggle('h')"
                  >
                    {{ t('toolbar.mirrorHorizontal') }}
                  </v-btn>
                  <v-btn
                    :variant="displayPrefs.mirrorV ? 'flat' : 'outlined'"
                    prepend-icon="mdi-flip-vertical"
                    size="small"
                    class="flex-btn"
                    data-testid="mirror-v-button"
                    @click="handleMirrorToggle('v')"
                  >
                    {{ t('toolbar.mirrorVertical') }}
                  </v-btn>
                </div>
              </div>

              <!-- Fullscreen Button -->
              <div class="menu-section fullscreen-controls">
                <v-btn
                  v-if="isFullscreenSupported"
                  :variant="isFullscreen ? 'flat' : 'outlined'"
                  :prepend-icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
                  size="small"
                  class="fullscreen-btn"
                  data-testid="fullscreen-menu-button"
                  @click="toggleFullscreen"
                >
                  {{ isFullscreen ? t('toolbar.exitFullscreen') : t('toolbar.fullscreen') }}
                </v-btn>
              </div>

              <!-- Action Buttons -->
              <div class="menu-section action-controls">
                <div class="control-group-horizontal">
                  <v-btn
                    variant="outlined"
                    icon="mdi-pencil"
                    size="small"
                    class="action-btn"
                    data-testid="editor-button"
                    @click="handleOpenEditor"
                  />
                  <v-btn
                    variant="outlined"
                    icon="mdi-folder-open"
                    size="small"
                    class="action-btn"
                    data-testid="file-button"
                    @click="handleOpenFile"
                  />
                  <v-btn
                    variant="outlined"
                    icon="mdi-cog"
                    size="small"
                    class="action-btn"
                    data-testid="settings-button"
                    @click="handleOpenSettings"
                  />
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-menu>
    </template>

    <!-- Full mode for large screens with enough width -->
    <template v-else>
      <!-- Play/Pause -->
      <v-btn
        :icon="scrollState.isPlaying ? 'mdi-pause' : 'mdi-play'"
        :aria-label="scrollState.isPlaying ? 'Pause' : 'Play'"
        size="large"
        data-testid="play-pause-button"
        @click="handleTogglePlay"
      />

      <!-- Navigation -->
      <v-btn icon="mdi-skip-previous" @click="handleStepLines(-5)" />
      <v-btn icon="mdi-chevron-up" @click="handleStepLines(-1)" />
      <v-btn icon="mdi-chevron-down" @click="handleStepLines(1)" />
      <v-btn icon="mdi-skip-next" @click="handleStepLines(5)" />

      <!-- Home/End -->
      <v-btn icon="mdi-home" @click="handleGoHome" />
      <v-btn icon="mdi-arrow-down-bold" @click="handleGoEnd" />

      <!-- Speed Control -->
      <SpeedControl
        :speed="speedConfig.current"
        :min="speedConfig.min"
        :max="speedConfig.max"
        @change="handleSpeedChange"
      />

      <!-- Font Size Control -->
      <FontSizeControl :size="displayPrefs.fontSizePx" @change="handleFontSizeChange" />

      <!-- Text Alignment Controls -->
      <TextAlignmentControls />

      <!-- Mirror Controls -->
      <v-btn
        :variant="displayPrefs.mirrorH ? 'flat' : 'outlined'"
        icon="mdi-flip-horizontal"
        data-testid="mirror-h-button"
        @click="handleMirrorToggle('h')"
      />
      <v-btn
        :variant="displayPrefs.mirrorV ? 'flat' : 'outlined'"
        icon="mdi-flip-vertical"
        data-testid="mirror-v-button"
        @click="handleMirrorToggle('v')"
      />

      <!-- Fullscreen Button -->
      <v-btn
        v-if="isFullscreenSupported"
        :icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
        :variant="isFullscreen ? 'flat' : 'outlined'"
        data-testid="fullscreen-button"
        @click="toggleFullscreen"
      />

      <!-- Desktop Window Controls (Non-fullscreen) -->
      <v-btn
        v-if="isDesktop"
        icon="mdi-window-minimize"
        variant="outlined"
        data-testid="desktop-minimize-button"
        @click="minimizeWindow"
      />

      <!-- Actions -->
      <v-btn icon="mdi-pencil" data-testid="editor-button" @click="handleOpenEditor" />
      <v-btn icon="mdi-cog" data-testid="settings-button" @click="handleOpenSettings" />
    </template>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFullscreen } from '@/utils/fullscreen'
import { useTauri } from '@/utils/tauri'
import SpeedControl from './SpeedControl.vue'
import FontSizeControl from './FontSizeControl.vue'
import TextAlignmentControls from './TextAlignmentControls.vue'
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
// Composables
// ========================================

const { t } = useI18n()

// ========================================
// Local State (UI only, no business logic)
// ========================================

const activeTab = ref(0)
const moreMenuOpen = ref(false)

// ========================================
// External Services (Platform-specific features)
// ========================================

// Unified fullscreen functionality
const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen, platform } = useFullscreen()

// Desktop/Tauri functionality (for window controls only)
const { isDesktop, minimizeWindow, maximizeWindow } = useTauri()

// Legacy support - keep for backward compatibility
const isImmersive = isFullscreen
const isImmersiveSupported = isFullscreenSupported
const toggleImmersiveMode = toggleFullscreen



// ========================================
// Event Handlers (Pure functions - no side effects)
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
  moreMenuOpen.value = false
}

function handleGoEnd() {
  emit('go-end')
  moreMenuOpen.value = false
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
  bottom: 0 !important;
  left: 50% !important;
  right: auto !important;
  transform: translateX(-50%) translateZ(0) !important;
  width: auto !important;
  min-width: 320px !important; /* Reduced min-width for better mobile compatibility */
  max-width: calc(100vw - 40px) !important;
  border-radius: 28px 28px 0 0 !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
  z-index: 100;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
  overflow: visible !important; /* Key fix: allow content to overflow */
  /* Create isolated stacking context for child elements */
  isolation: isolate;

  /* Android edge-to-edge support - Multiple fallback approaches */
  margin-bottom: max(var(--safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px), 48px);

  /* Additional padding for Android devices */
  padding-bottom: max(var(--safe-area-inset-bottom, 0px), env(safe-area-inset-bottom, 0px), 12px);

  &.hidden {
    opacity: 0;
    transform: translateX(-50%) translateY(20px) translateZ(0) !important;
    pointer-events: none;
  }
}

/* Override Vuetify's default width behavior */
:deep(.v-bottom-navigation) {
  width: auto !important;
  left: 50% !important;
  right: auto !important;
  transform: translateX(-50%) !important;
  overflow: visible !important;
  position: static !important;
}

:deep(.v-bottom-navigation__content) {
  gap: 8px !important; /* More space between controls */
  padding: 12px 16px; /* More padding */
  /* Ensure content area allows child elements to stack properly */
  position: relative;
  z-index: 1;
  min-height: 60px; /* Ensure minimum height for controls */
  align-items: center; /* Center items vertically */
  overflow: visible !important; /* Allow controls to be fully visible */
  flex-wrap: nowrap !important; /* Never wrap controls */
  justify-content: center !important; /* Center all controls */
  display: flex !important; /* Ensure flex display */
  margin: 0 auto; /* Additional centering insurance */
}

/* Override Vuetify's overflow hidden on the navigation wrapper */
:deep(.v-bottom-navigation) {
  overflow: visible !important;
}

:deep(.v-bottom-navigation__wrapper) {
  overflow: visible !important;
}

/* Mobile responsive improvements */
@media (max-width: 599px) {
  .floating-toolbar {
    max-width: calc(100vw - 20px);
    min-width: 280px !important; /* Reduce further for very small screens */
    border-radius: 16px !important;
    min-height: 64px; /* Ensure adequate height on mobile */

    /* More aggressive Android support for mobile */
    margin-bottom: max(
      var(--safe-area-inset-bottom, 0px),
      env(safe-area-inset-bottom, 0px),
      60px
    ) !important;
  }

  :deep(.v-bottom-navigation__content) {
    padding: 10px 8px; /* Adequate padding for mobile */
    min-height: 56px;
    gap: 6px !important; /* Slightly reduce gap on mobile */
  }

  .floating-toolbar.hidden {
    transform: translateX(-50%) translateY(20px) translateZ(0);
  }
}

/* Extra small screens (very small phones) */
@media (max-width: 360px) {
  .floating-toolbar {
    max-width: calc(100vw - 16px);
    min-width: 260px !important;
    border-radius: 12px !important;
  }

  :deep(.v-bottom-navigation__content) {
    padding: 8px 6px;
    gap: 4px !important;
  }
}

/* Small tablet adjustments */
@media (min-width: 600px) and (max-width: 959px) {
  .floating-toolbar {
    max-width: calc(100vw - 60px);
    border-radius: 20px !important;
  }
}

/* Medium tablet adjustments */
@media (min-width: 960px) and (max-width: 1263px) {
  .floating-toolbar {
    max-width: calc(100vw - 80px);
    border-radius: 24px !important;
  }
}

/* Large screen adjustments */
@media (min-width: 1264px) {
  .floating-toolbar {
    max-width: 90vw;
  }
}

/* Ensure buttons have minimum touch target size */
:deep(.v-btn) {
  min-width: 44px;
  min-height: 44px;
}

/* Transparent background for the navigation */
:deep(.v-bottom-navigation__content) {
  background: transparent !important;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 4px;
  padding: 0 8px;
}

/* Toolbar content adjustments */
:deep(.v-bottom-navigation .v-btn) {
  flex-shrink: 1;
  min-width: 40px;
}

/* Control components responsiveness */
:deep(.speed-control),
:deep(.font-size-control) {
  /* FIXED WIDTH APPROACH - these cannot be overridden */
  width: 140px !important;
  min-width: 140px !important;
  max-width: 140px !important;
  flex-shrink: 0 !important; /* Never allow shrinking */
  flex-grow: 0 !important; /* Never allow growing */
  flex-basis: 140px !important; /* Fixed basis */
  z-index: 9999 !important;
  position: relative !important;
  overflow: visible !important;
  display: flex !important;
}

:deep(.speed-control .v-btn),
:deep(.font-size-control .v-btn) {
  z-index: 10000 !important; /* Extremely high priority for control buttons */
  position: static !important; /* Keep buttons in normal flow */
  /* Ensure buttons are visible and clickable */
  pointer-events: auto !important;
  opacity: 1 !important;
  visibility: visible !important;
  transform: translateZ(1px) !important; /* Lift buttons even higher */
  overflow: visible !important;
}

/* Button group spacing on tablets */
@media (min-width: 600px) and (max-width: 1263px) {
  :deep(.v-bottom-navigation__content) {
    gap: 2px;
    padding: 16px 4px; /* Increased padding for tablets */
    min-height: 68px; /* Ensure adequate height for controls */
  }

  :deep(.v-btn) {
    min-width: 36px !important;
    min-height: 36px !important;
  }

  :deep(.speed-control),
  :deep(.font-size-control) {
    max-width: 100px;
    z-index: 9999 !important;
    transform: translateZ(0) !important;
    min-height: 40px; /* Ensure controls aren't too short */
  }

  :deep(.speed-control .v-btn),
  :deep(.font-size-control .v-btn) {
    z-index: 10000 !important;
    transform: translateZ(1px) !important;
    pointer-events: auto !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
}

/* Narrow large screens (1264px - 1399px) - edge case handling */
@media (min-width: 1264px) and (max-width: 1399px) {
  :deep(.v-bottom-navigation__content) {
    gap: 4px !important;
    padding: 16px 8px !important;
    justify-content: space-between !important;
    overflow: visible !important;
  }

  :deep(.v-btn) {
    min-width: 40px !important;
    flex-shrink: 1 !important;
  }

  :deep(.speed-control),
  :deep(.font-size-control) {
    max-width: 120px !important;
    min-width: 100px !important;
    flex-shrink: 0 !important;
  }

  /* Ensure buttons at edges don't get cut off */
  .floating-toolbar {
    max-width: calc(100vw - 40px) !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
  }
}

/* More Menu Improvements */
.more-menu-card {
  border-radius: 16px !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
}

.more-menu-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-group-horizontal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 100%;
}

/* Navigation Controls */
.navigation-controls .nav-btn {
  flex: 1;
  min-width: 40px;
  max-width: 48px;
  height: 40px;
}

/* Home/End Controls */
.home-end-controls .flex-btn {
  flex: 1;
  min-height: 36px;
  max-height: 40px;
  text-transform: none;
  font-weight: 500;
}

/* Font Control Section */
.font-control {
  padding: 4px 0;
  align-items: center;
}

/* Mirror Controls */
.mirror-controls .flex-btn {
  flex: 1;
  min-height: 36px;
  max-height: 40px;
  text-transform: none;
  font-weight: 500;
  font-size: 0.875rem;
}

/* Action Controls */
.action-controls .control-group-horizontal {
  justify-content: space-evenly;
}

.action-controls .action-btn {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  min-width: 48px;
}

/* Ensure consistent spacing and alignment */
:deep(.more-menu-card .v-btn) {
  letter-spacing: normal;
  border-radius: 8px;
}

:deep(.more-menu-card .v-btn--variant-outlined) {
  border-color: rgba(255, 255, 255, 0.3);
}

:deep(.more-menu-card .v-btn--variant-flat) {
  background-color: rgba(255, 255, 255, 0.1);
}

/* Responsive adjustments for the more menu */
@media (max-width: 360px) {
  .more-menu-card {
    min-width: 300px !important;
    max-width: 340px !important;
  }

  .mirror-controls .flex-btn {
    font-size: 0.8rem;
  }

  .home-end-controls .flex-btn {
    font-size: 0.85rem;
  }
}

/* Android 15+ edge-to-edge specific fixes */
@supports (padding: max(0px)) {
  /* Capacitor Android detection and edge-to-edge support */
  html.android .floating-toolbar,
  html[data-android] .floating-toolbar,
  .capacitor-android .floating-toolbar {
    /* Force respect for safe area insets on Android */
    margin-bottom: max(
      var(--safe-area-inset-bottom, 0px),
      env(safe-area-inset-bottom, 0px),
      env(keyboard-inset-height, 0px),
      72px
    ) !important;
    
    /* Additional padding for gesture navigation */
    padding-bottom: max(
      var(--safe-area-inset-bottom, 0px),
      env(safe-area-inset-bottom, 0px),
      16px
    ) !important;
  }

  /* Specific fix for Android API 35 (Android 15) */
  html[data-android-version="35"] .floating-toolbar,
  html[data-android-api="35"] .floating-toolbar {
    margin-bottom: max(
      var(--safe-area-inset-bottom, 0px),
      env(safe-area-inset-bottom, 0px),
      env(keyboard-inset-height, 0px),
      88px
    ) !important;
  }
}

/* Alternative approach using CSS custom properties */
.floating-toolbar {
  --android-safe-bottom: max(
    var(--safe-area-inset-bottom, 0px),
    env(safe-area-inset-bottom, 0px),
    48px
  );
}

/* Force toolbar to stay above system UI */
html.android .floating-toolbar,
html[data-android] .floating-toolbar {
  z-index: 9999 !important;
  position: fixed !important;
  bottom: var(--android-safe-bottom) !important;
}
</style>
