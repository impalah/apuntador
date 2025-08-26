<template>
  <v-bottom-navigation
    v-model="activeTab"
    class="floating-toolbar"
    color="primary"
    bg-color="rgba(0, 0, 0, 0.8)"
    height="80"
    grow
  >
    <!-- Minimal mode for mobile and small tablets (xs and sm screens) -->
    <template v-if="$vuetify.display.xs || $vuetify.display.sm">
      <!-- Play/Pause -->
      <v-btn
        :icon="teleprompterStore.isPlaying ? 'mdi-pause' : 'mdi-play'"
        :aria-label="teleprompterStore.isPlaying ? 'Pause' : 'Play'"
        size="large"
        data-testid="play-pause-button"
        @click="togglePlay"
      />

      <!-- Speed Control -->
      <SpeedControl
        :speed="prefsStore.speedPxPerSec"
        :min="prefsStore.speedMin"
        :max="prefsStore.speedMax"
        @change="onSpeedChange"
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

        <v-card min-width="280">
          <v-card-text>
            <v-row dense>
              <!-- Navigation Controls -->
              <v-col cols="12">
                <div class="d-flex justify-space-between mb-2">
                  <v-btn icon="mdi-skip-previous" variant="text" @click="$emit('stepLines', -5)" />
                  <v-btn icon="mdi-chevron-up" variant="text" @click="$emit('stepLines', -1)" />
                  <v-btn icon="mdi-chevron-down" variant="text" @click="$emit('stepLines', 1)" />
                  <v-btn icon="mdi-skip-next" variant="text" @click="$emit('stepLines', 5)" />
                </div>
              </v-col>

              <!-- Home/End -->
              <v-col cols="6">
                <v-btn block variant="outlined" prepend-icon="mdi-home" @click="$emit('goHome')">
                  Home
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  block
                  variant="outlined"
                  prepend-icon="mdi-arrow-down-bold"
                  @click="$emit('goEnd')"
                >
                  End
                </v-btn>
              </v-col>

              <!-- Font Size Control -->
              <v-col cols="12">
                <FontSizeControl :size="prefsStore.fontSizePx" @change="onFontSizeChange" />
              </v-col>

              <!-- Mirror Controls -->
              <v-col cols="6">
                <v-btn
                  block
                  :variant="prefsStore.mirrorH ? 'flat' : 'outlined'"
                  prepend-icon="mdi-flip-horizontal"
                  data-testid="mirror-h-button"
                  @click="$emit('mirrorToggle', 'h')"
                >
                  Mirror H
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  block
                  :variant="prefsStore.mirrorV ? 'flat' : 'outlined'"
                  prepend-icon="mdi-flip-vertical"
                  data-testid="mirror-v-button"
                  @click="$emit('mirrorToggle', 'v')"
                >
                  Mirror V
                </v-btn>
              </v-col>

              <!-- Action Buttons -->
              <v-col cols="4">
                <v-btn
                  block
                  variant="outlined"
                  icon="mdi-pencil"
                  data-testid="editor-button"
                  @click="$emit('openEditor')"
                />
              </v-col>
              <v-col cols="4">
                <v-btn
                  block
                  variant="outlined"
                  icon="mdi-cog"
                  data-testid="settings-button"
                  @click="$emit('openSettings')"
                />
              </v-col>
              <v-col cols="4">
                <v-btn
                  block
                  variant="outlined"
                  icon="mdi-file-import"
                  data-testid="file-button"
                  @click="$emit('openFile')"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-menu>
    </template>

    <!-- Compact mode for medium tablets (md screens) -->
    <template v-else-if="$vuetify.display.md">
      <!-- Play/Pause -->
      <v-btn
        :icon="teleprompterStore.isPlaying ? 'mdi-pause' : 'mdi-play'"
        :aria-label="teleprompterStore.isPlaying ? 'Pause' : 'Play'"
        size="large"
        data-testid="play-pause-button"
        @click="togglePlay"
      />

      <!-- Speed Control -->
      <SpeedControl
        :speed="prefsStore.speedPxPerSec"
        :min="prefsStore.speedMin"
        :max="prefsStore.speedMax"
        @change="onSpeedChange"
      />

      <!-- Navigation (condensed) -->
      <v-btn icon="mdi-chevron-up" @click="$emit('stepLines', -1)" />
      <v-btn icon="mdi-chevron-down" @click="$emit('stepLines', 1)" />

      <!-- Font Size Control -->
      <FontSizeControl :size="prefsStore.fontSizePx" @change="onFontSizeChange" />

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

        <v-card min-width="280">
          <v-card-text>
            <v-row dense>
              <!-- Extended Navigation Controls -->
              <v-col cols="12">
                <div class="d-flex justify-space-between mb-2">
                  <v-btn icon="mdi-skip-previous" variant="text" @click="$emit('stepLines', -5)" />
                  <v-btn icon="mdi-home" variant="text" @click="$emit('goHome')" />
                  <v-btn icon="mdi-arrow-down-bold" variant="text" @click="$emit('goEnd')" />
                  <v-btn icon="mdi-skip-next" variant="text" @click="$emit('stepLines', 5)" />
                </div>
              </v-col>

              <!-- Mirror Controls -->
              <v-col cols="6">
                <v-btn
                  block
                  :variant="prefsStore.mirrorH ? 'flat' : 'outlined'"
                  prepend-icon="mdi-flip-horizontal"
                  data-testid="mirror-h-button"
                  @click="$emit('mirrorToggle', 'h')"
                >
                  Mirror H
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  block
                  :variant="prefsStore.mirrorV ? 'flat' : 'outlined'"
                  prepend-icon="mdi-flip-vertical"
                  data-testid="mirror-v-button"
                  @click="$emit('mirrorToggle', 'v')"
                >
                  Mirror V
                </v-btn>
              </v-col>

              <!-- Action Buttons -->
              <v-col cols="4">
                <v-btn
                  block
                  variant="outlined"
                  icon="mdi-pencil"
                  data-testid="editor-button"
                  @click="$emit('openEditor')"
                />
              </v-col>
              <v-col cols="4">
                <v-btn
                  block
                  variant="outlined"
                  icon="mdi-cog"
                  data-testid="settings-button"
                  @click="$emit('openSettings')"
                />
              </v-col>
              <v-col cols="4">
                <v-btn
                  block
                  variant="outlined"
                  icon="mdi-file-import"
                  data-testid="file-button"
                  @click="$emit('openFile')"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-menu>
    </template>

    <!-- Full mode for large screens (lg and xl) -->
    <template v-else>
      <!-- Play/Pause -->
      <v-btn
        :icon="teleprompterStore.isPlaying ? 'mdi-pause' : 'mdi-play'"
        :aria-label="teleprompterStore.isPlaying ? 'Pause' : 'Play'"
        size="large"
        data-testid="play-pause-button"
        @click="togglePlay"
      />

      <!-- Navigation -->
      <v-btn icon="mdi-skip-previous" @click="$emit('stepLines', -5)" />
      <v-btn icon="mdi-chevron-up" @click="$emit('stepLines', -1)" />
      <v-btn icon="mdi-chevron-down" @click="$emit('stepLines', 1)" />
      <v-btn icon="mdi-skip-next" @click="$emit('stepLines', 5)" />

      <!-- Home/End -->
      <v-btn icon="mdi-home" @click="$emit('goHome')" />
      <v-btn icon="mdi-arrow-down-bold" @click="$emit('goEnd')" />

      <!-- Speed Control -->
      <SpeedControl
        :speed="prefsStore.speedPxPerSec"
        :min="prefsStore.speedMin"
        :max="prefsStore.speedMax"
        @change="onSpeedChange"
      />

      <!-- Font Size Control -->
      <FontSizeControl :size="prefsStore.fontSizePx" @change="onFontSizeChange" />

      <!-- Mirror Controls -->
      <v-btn
        :icon="prefsStore.mirrorH ? 'mdi-flip-horizontal' : 'mdi-flip-horizontal'"
        :variant="prefsStore.mirrorH ? 'flat' : 'outlined'"
        data-testid="mirror-h-button"
        @click="$emit('mirrorToggle', 'h')"
      />
      <v-btn
        :icon="prefsStore.mirrorV ? 'mdi-flip-vertical' : 'mdi-flip-vertical'"
        :variant="prefsStore.mirrorV ? 'flat' : 'outlined'"
        data-testid="mirror-v-button"
        @click="$emit('mirrorToggle', 'v')"
      />

      <!-- Actions -->
      <v-btn icon="mdi-pencil" data-testid="editor-button" @click="$emit('openEditor')" />
      <v-btn icon="mdi-cog" data-testid="settings-button" @click="$emit('openSettings')" />
      <v-btn icon="mdi-file-import" data-testid="file-button" @click="$emit('openFile')" />
    </template>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import SpeedControl from './SpeedControl.vue'
import FontSizeControl from './FontSizeControl.vue'

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
  openSettings: []
  openFile: []
}>()

// Stores
const teleprompterStore = useTeleprompterStore()
const prefsStore = usePrefsStore()

// State
const activeTab = ref(0)
const moreMenuOpen = ref(false)

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

function onFontSizeChange(delta: number) {
  emit('fontSizeChange', delta)
}
</script>

<style scoped>
.floating-toolbar {
  position: fixed !important;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  width: auto !important;
  min-width: 400px !important; /* Ensure enough space for fixed-width controls */
  max-width: calc(100vw - 40px);
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
  transform: translateX(-50%) translateZ(0);

  &.hidden {
    opacity: 0;
    transform: translateX(-50%) translateY(20px) translateZ(0);
    pointer-events: none;
  }
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
    border-radius: 16px !important;
    min-height: 64px; /* Ensure adequate height on mobile */
  }

  :deep(.v-bottom-navigation__content) {
    padding: 10px 8px; /* Adequate padding for mobile */
    min-height: 56px;
  }

  .floating-toolbar.hidden {
    transform: translateY(20px);
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
</style>
