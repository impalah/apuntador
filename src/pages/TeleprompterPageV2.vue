<!--
  TeleprompterPage v2 - Component Architecture Demonstration
  
  This version demonstrates how components can be swapped using
  the new decoupled architecture with service abstractions.
-->
<template>
  <div class="teleprompter-page">
    <!-- Toggle between component implementations -->
    <v-fab
      v-if="showImplementationToggle"
      class="implementation-toggle"
      icon="mdi-swap-horizontal"
      size="small"
      color="secondary"
      @click="toggleImplementation"
    />

    <!-- Current Implementation: {{ currentImplementation }} -->

    <!-- Original Implementation -->
    <template v-if="currentImplementation === 'original'">
      <TeleprompterFrame
        ref="teleprompterRef"
        @content-height-changed="
          (height) => coordinator.updateHighlightBandDimensions(height, LINE_HEIGHT_FALLBACK)
        "
        @viewport-height-changed="
          (height) => coordinator.updateHighlightBandDimensions(height, LINE_HEIGHT_FALLBACK)
        "
        @tap="coordinator.handleTap"
      />

      <FloatingToolbar
        v-show="floatingToolbar.isVisible.value"
        @play="coordinator.handlePlay"
        @pause="coordinator.handlePause"
        @step-lines="floatingToolbar.events.onStepLines"
        @go-home="floatingToolbar.events.onGoHome"
        @go-end="floatingToolbar.events.onGoEnd"
        @speed-change="floatingToolbar.events.onSpeedChange"
        @font-size-change="floatingToolbar.events.onFontSizeChange"
        @mirror-toggle="floatingToolbar.events.onMirrorToggle"
        @open-editor="() => (editorOpen = true)"
        @open-settings="() => (settingsOpen = true)"
        @open-file="() => (fileLoaderOpen = true)"
      />
    </template>

    <!-- New Decoupled Implementation -->
    <template v-else>
      <TeleprompterFrameV2
        ref="teleprompterRefV2"
        :content="teleprompterFrame.props.value.content"
        :scroll-state="teleprompterFrame.props.value.scrollState"
        :display-prefs="teleprompterFrame.props.value.displayPrefs"
        :highlight-band="teleprompterFrame.props.value.highlightBand"
        @content-height-changed="onContentHeightChanged"
        @viewport-height-changed="onViewportHeightChanged"
        @tap="coordinator.handleTap"
        @swipe-up="teleprompterFrame.events.onSwipeUp"
        @swipe-down="teleprompterFrame.events.onSwipeDown"
        @press-hold="teleprompterFrame.events.onPressHold"
      />

      <FloatingToolbarV2
        v-show="floatingToolbar.isVisible.value"
        :scroll-state="floatingToolbar.props.value.scrollState"
        :speed-config="floatingToolbar.props.value.speedConfig"
        :display-prefs="floatingToolbar.props.value.displayPrefs"
        :is-visible="floatingToolbar.props.value.isVisible"
        :is-minimal="$vuetify.display.xs || $vuetify.display.sm"
        @play="floatingToolbar.events.onPlay"
        @pause="floatingToolbar.events.onPause"
        @toggle-play="floatingToolbar.events.onTogglePlay"
        @step-lines="floatingToolbar.events.onStepLines"
        @go-home="floatingToolbar.events.onGoHome"
        @go-end="floatingToolbar.events.onGoEnd"
        @speed-change="floatingToolbar.events.onSpeedChange"
        @font-size-change="floatingToolbar.events.onFontSizeChange"
        @mirror-toggle="floatingToolbar.events.onMirrorToggle"
        @open-editor="() => (editorOpen = true)"
        @open-settings="() => (settingsOpen = true)"
        @open-file="() => (fileLoaderOpen = true)"
      />
    </template>

    <!-- Shared Modal Components -->
    <SettingsDialog v-model="settingsOpen" @file-imported="onFileImported" />
    <MarkdownEditor
      v-model="editorOpen"
      :content="teleprompterFrame.props.value.content.raw"
      @save="onEditorSave"
    />
    <FileLoader v-model="fileLoaderOpen" auto-import @file-imported="onFileImported" />

    <!-- Implementation Info (Development Only) -->
    <v-snackbar v-model="showImplementationInfo" :timeout="3000" color="info" location="top">
      Switched to {{ currentImplementation }} implementation
      <template #actions>
        <v-btn size="small" @click="showImplementationInfo = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useAppCoordinator } from '@/composables/useComponentCommunication'
import { LINE_HEIGHT_FALLBACK } from '@/utils/constants'

// Original Components
import TeleprompterFrame from '@/components/TeleprompterFrame.vue'
import FloatingToolbar from '@/components/FloatingToolbar.vue'

// New Decoupled Components
import TeleprompterFrameV2 from '@/components/TeleprompterFrameV2.vue'
import FloatingToolbarV2 from '@/components/FloatingToolbarV2.vue'

// Shared Components
import SettingsDialog from '@/components/SettingsDialog.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import FileLoader from '@/components/FileLoader.vue'

// ========================================
// Component Coordination
// ========================================

const coordinator = useAppCoordinator()
const { teleprompterFrame, floatingToolbar, highlightBand } = coordinator

// ========================================
// Implementation Switching (Demo Feature)
// ========================================

type Implementation = 'original' | 'decoupled'

const currentImplementation = ref<Implementation>('decoupled')
const showImplementationToggle = ref(true) // Set to false in production
const showImplementationInfo = ref(false)

function toggleImplementation() {
  currentImplementation.value =
    currentImplementation.value === 'original' ? 'decoupled' : 'original'
  showImplementationInfo.value = true

  // Trigger re-measurement after component switch
  nextTick(() => {
    measureDimensions()
  })
}

// ========================================
// Component Refs
// ========================================

const teleprompterRef = ref<InstanceType<typeof TeleprompterFrame>>()
const teleprompterRefV2 = ref<InstanceType<typeof TeleprompterFrameV2>>()

// ========================================
// Modal State
// ========================================

const settingsOpen = ref(false)
const editorOpen = ref(false)
const fileLoaderOpen = ref(false)

// ========================================
// Event Handlers
// ========================================

function onContentHeightChanged(height: number) {
  coordinator.updateHighlightBandDimensions(height, LINE_HEIGHT_FALLBACK)
}

function onViewportHeightChanged(height: number) {
  coordinator.updateHighlightBandDimensions(height, LINE_HEIGHT_FALLBACK)
}

function onFileImported(content: string) {
  teleprompterFrame.contentService.setContent(content)

  // Close modals
  settingsOpen.value = false
  fileLoaderOpen.value = false

  // Trigger measurement after content change
  nextTick(measureDimensions)
}

function onEditorSave(content: string) {
  teleprompterFrame.contentService.setContent(content)
  editorOpen.value = false

  // Trigger measurement after content change
  nextTick(measureDimensions)
}

function measureDimensions() {
  if (currentImplementation.value === 'original' && teleprompterRef.value) {
    teleprompterRef.value.measureDimensions()
  } else if (currentImplementation.value === 'decoupled' && teleprompterRefV2.value) {
    teleprompterRefV2.value.measureDimensions()
  }
}

// ========================================
// Lifecycle
// ========================================

onMounted(async () => {
  // Initialize services - this would normally be done at app level
  await teleprompterFrame.contentService.setContent(`
# Component Architecture Demo

This is a demonstration of the new **component architecture** in Apuntador.

## Features

- **Decoupled Components**: Each component communicates through services
- **Swappable Implementations**: Toggle between original and new implementations
- **Clean Interfaces**: Props down, events up pattern
- **Service Abstractions**: Business logic separated from UI logic

## Usage

1. Use the toggle button to switch between implementations
2. Notice that both implementations provide the same functionality
3. The underlying services remain the same regardless of UI components

## Architecture Benefits

- **Maintainability**: Clear separation of concerns
- **Testability**: Components can be tested in isolation  
- **Flexibility**: Easy to swap component implementations
- **Reusability**: Components can be used in different applications

Try the different controls and notice how both implementations behave identically!
  `)

  // Initial measurement
  nextTick(measureDimensions)
})

onUnmounted(() => {
  // Cleanup would happen here if needed
})
</script>

<style scoped>
.teleprompter-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.implementation-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
}

/* Hide toggle in production */
.implementation-toggle.production-hidden {
  display: none;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .implementation-toggle {
    top: 0.5rem;
    right: 0.5rem;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .implementation-toggle {
    transition: none;
  }
}
</style>
