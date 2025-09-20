/**
 * Teleprompter Component Coordinator
 *
 * This coordinator manages the communication and state synchronization
 * between different modular components in the teleprompter application.
 */

import { ref, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import type {
  TeleprompterFrameProps,
  FloatingToolbarProps,
  HighlightBandConfig,
} from '@/types/component-interfaces'
import {
  useTeleprompterFrameProps,
  useFloatingToolbarProps,
  useTeleprompterFrameEventHandlers,
  useFloatingToolbarEventHandlers,
  useHighlightBandEventHandlers,
} from '@/adapters/storeToComponent'

export function useTeleprompterCoordinator() {
  const { mobile } = useDisplay()

  // ========================================
  // Component Props (reactive from stores)
  // ========================================

  const teleprompterFrameProps = useTeleprompterFrameProps()
  const floatingToolbarProps = useFloatingToolbarProps()

  // ========================================
  // Component Event Handlers
  // ========================================

  const teleprompterFrameHandlers = useTeleprompterFrameEventHandlers()
  const floatingToolbarHandlers = useFloatingToolbarEventHandlers()
  const highlightBandHandlers = useHighlightBandEventHandlers()

  // ========================================
  // UI State Management
  // ========================================

  const editorOpen = ref(false)
  const settingsOpen = ref(false)
  const fileLoaderOpen = ref(false)

  // Toolbar visibility logic
  const toolbarVisible = ref(false)
  const toolbarTimeout = ref<number | null>(null)

  // Auto-hide toolbar during playback
  watch(
    () => teleprompterFrameProps.value.scrollState.isPlaying,
    (isPlaying) => {
      if (isPlaying) {
        hideToolbar()
      }
    }
  )

  // ========================================
  // Toolbar Visibility Management
  // ========================================

  function showToolbar() {
    toolbarVisible.value = true

    // Clear existing timeout
    if (toolbarTimeout.value) {
      clearTimeout(toolbarTimeout.value)
      toolbarTimeout.value = null
    }

    // Auto-hide after 3 seconds if not playing
    if (!teleprompterFrameProps.value.scrollState.isPlaying) {
      toolbarTimeout.value = window.setTimeout(() => {
        hideToolbar()
      }, 3000)
    }
  }

  function hideToolbar() {
    toolbarVisible.value = false

    if (toolbarTimeout.value) {
      clearTimeout(toolbarTimeout.value)
      toolbarTimeout.value = null
    }
  }

  function toggleToolbar() {
    if (toolbarVisible.value) {
      hideToolbar()
    } else {
      showToolbar()
    }
  }

  // ========================================
  // Enhanced Event Handlers
  // ========================================

  const enhancedTeleprompterHandlers = {
    ...teleprompterFrameHandlers,

    onTap: () => {
      // Show toolbar on tap when paused
      if (!teleprompterFrameProps.value.scrollState.isPlaying) {
        toggleToolbar()
      }
      teleprompterFrameHandlers.onTap()
    },

    onPressHold: () => {
      // Always show toolbar on press and hold
      showToolbar()
      teleprompterFrameHandlers.onPressHold()
    },
  }

  const enhancedToolbarHandlers = {
    ...floatingToolbarHandlers,

    onPlay: () => {
      hideToolbar() // Hide toolbar when starting playback
      floatingToolbarHandlers.onPlay()
    },

    onPause: () => {
      showToolbar() // Show toolbar when pausing
      floatingToolbarHandlers.onPause()
    },

    onOpenEditor: () => {
      editorOpen.value = true
      hideToolbar()
    },

    onOpenSettings: () => {
      settingsOpen.value = true
      hideToolbar()
    },

    onOpenFile: () => {
      fileLoaderOpen.value = true
      hideToolbar()
    },
  }

  // ========================================
  // Computed Properties
  // ========================================

  const toolbarProps = computed<FloatingToolbarProps>(() => ({
    ...floatingToolbarProps.value,
    isVisible: toolbarVisible.value,
    isMinimal: mobile.value,
  }))

  // ========================================
  // Public API
  // ========================================

  return {
    // Component Props
    teleprompterFrameProps,
    toolbarProps,

    // Event Handlers
    teleprompterFrameHandlers: enhancedTeleprompterHandlers,
    toolbarHandlers: enhancedToolbarHandlers,
    highlightBandHandlers,

    // UI State
    editorOpen,
    settingsOpen,
    fileLoaderOpen,
    toolbarVisible,

    // Methods
    showToolbar,
    hideToolbar,
    toggleToolbar,
  }
}

// ========================================
// High-level Application Coordinator
// ========================================

/**
 * Main application coordinator that manages the entire teleprompter page
 */
export function useAppCoordinator() {
  const coordinator = useTeleprompterCoordinator()

  // Additional app-level logic can be added here
  // For example: keyboard shortcuts, global state management, etc.

  return {
    ...coordinator,

    // App-level methods
    handleKeyboardShortcuts: (event: KeyboardEvent) => {
      switch (event.key) {
        case ' ':
          event.preventDefault()
          if (coordinator.teleprompterFrameProps.value.scrollState.isPlaying) {
            coordinator.toolbarHandlers.onPause()
          } else {
            coordinator.toolbarHandlers.onPlay()
          }
          break

        case 'ArrowUp':
          event.preventDefault()
          coordinator.toolbarHandlers.onStepLines(-1)
          break

        case 'ArrowDown':
          event.preventDefault()
          coordinator.toolbarHandlers.onStepLines(1)
          break

        case 'Home':
          event.preventDefault()
          coordinator.toolbarHandlers.onGoHome()
          break

        case 'End':
          event.preventDefault()
          coordinator.toolbarHandlers.onGoEnd()
          break

        case 'e':
        case 'E':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            coordinator.toolbarHandlers.onOpenEditor()
          }
          break

        case 's':
        case 'S':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            coordinator.toolbarHandlers.onOpenSettings()
          }
          break
      }
    },
  }
}
