/**
 * Component Communication Composable
 *
 * Provides a clean API for component-to-component communication
 * using services as intermediaries instead of direct store access
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import type {
  TeleprompterFrameProps,
  FloatingToolbarProps,
  HighlightBandProps,
  TeleprompterEvents,
  ToolbarEvents,
  HighlightBandEvents,
} from '@/types/component-interfaces'
import { useServices } from '@/services/component-services'

// ========================================
// Teleprompter Frame Composable
// ========================================

export function useTeleprompterFrame() {
  const { scrollService, contentService, preferencesService } = useServices()

  // Reactive props
  const props = computed<TeleprompterFrameProps>(() => ({
    content: contentService.getContent(),
    scrollState: scrollService.getState(),
    displayPrefs: preferencesService.getDisplayPrefs(),
    highlightBand: preferencesService.getHighlightBandConfig(),
  }))

  // Event handlers that components can use
  const events = {
    onContentHeightChanged: (height: number) => {
      // Could update viewport calculations if needed
      console.log('Content height changed:', height)
    },

    onViewportHeightChanged: (height: number) => {
      // Could update viewport calculations if needed
      console.log('Viewport height changed:', height)
    },

    onTap: () => {
      // Handle tap events (e.g., show/hide toolbar)
      console.log('Teleprompter tapped')
    },

    onSwipeUp: () => {
      scrollService.stepLines(-1)
    },

    onSwipeDown: () => {
      scrollService.stepLines(1)
    },

    onPressHold: () => {
      // Could show context menu or other actions
      console.log('Press and hold detected')
    },
  }

  return {
    props,
    events,
    // Direct service access for advanced use cases
    scrollService,
    contentService,
    preferencesService,
  }
}

// ========================================
// Floating Toolbar Composable
// ========================================

export function useFloatingToolbar() {
  const { scrollService, contentService, preferencesService } = useServices()

  // UI State
  const isVisible = ref(true)
  const isMinimal = ref(false)

  // Reactive props
  const props = computed<FloatingToolbarProps>(() => ({
    scrollState: scrollService.getState(),
    speedConfig: preferencesService.getSpeedConfig(),
    displayPrefs: preferencesService.getDisplayPrefs(),
    isVisible: isVisible.value,
    isMinimal: isMinimal.value,
  }))

  // Event handlers
  const events = {
    onPlay: () => {
      scrollService.play()
    },

    onPause: () => {
      scrollService.pause()
    },

    onTogglePlay: () => {
      scrollService.toggle()
    },

    onStepLines: (count: number) => {
      scrollService.stepLines(count)
    },

    onGoHome: () => {
      scrollService.goToHome()
    },

    onGoEnd: () => {
      scrollService.goToEnd()
    },

    onSpeedChange: async (speed: number) => {
      await preferencesService.updateSpeedConfig({ current: speed })
    },

    onFontSizeChange: async (size: number) => {
      await preferencesService.updateDisplayPrefs({ fontSizePx: size })
    },

    onMirrorToggle: async (axis: 'h' | 'v') => {
      const currentPrefs = preferencesService.getDisplayPrefs()
      if (axis === 'h') {
        await preferencesService.updateDisplayPrefs({ mirrorH: !currentPrefs.mirrorH })
      } else {
        await preferencesService.updateDisplayPrefs({ mirrorV: !currentPrefs.mirrorV })
      }
    },

    onOpenEditor: () => {
      // Emit to parent component to handle modal opening
      console.log('Open editor requested')
    },

    onOpenSettings: () => {
      // Emit to parent component to handle modal opening
      console.log('Open settings requested')
    },

    onOpenFile: () => {
      // Emit to parent component to handle modal opening
      console.log('Open file requested')
    },
  }

  // UI Control methods
  const showToolbar = () => {
    isVisible.value = true
  }

  const hideToolbar = () => {
    isVisible.value = false
  }

  const toggleMinimal = () => {
    isMinimal.value = !isMinimal.value
  }

  const setMinimal = (minimal: boolean) => {
    isMinimal.value = minimal
  }

  return {
    props,
    events,
    // UI Controls
    showToolbar,
    hideToolbar,
    toggleMinimal,
    setMinimal,
    isVisible,
    isMinimal,
    // Service access
    scrollService,
    preferencesService,
  }
}

// ========================================
// Highlight Band Composable
// ========================================

export function useHighlightBand() {
  const { preferencesService } = useServices()

  // Additional state for calculations
  const viewportHeight = ref(600) // Will be updated by parent
  const lineHeight = ref(24) // Will be updated by parent

  // Reactive props
  const props = computed<HighlightBandProps>(() => ({
    config: preferencesService.getHighlightBandConfig(),
    viewportHeight: viewportHeight.value,
    lineHeight: lineHeight.value,
  }))

  // Event handlers
  const events = {
    onPositionChange: async (positionPct: number) => {
      await preferencesService.updateHighlightBandConfig({ positionPct })
    },

    onConfigChange: async (config: Partial<any>) => {
      await preferencesService.updateHighlightBandConfig(config)
    },
  }

  // Methods to update external state
  const updateViewportHeight = (height: number) => {
    viewportHeight.value = height
  }

  const updateLineHeight = (height: number) => {
    lineHeight.value = height
  }

  return {
    props,
    events,
    updateViewportHeight,
    updateLineHeight,
    preferencesService,
  }
}

// ========================================
// Application Coordinator Composable
// ========================================

export function useAppCoordinator() {
  const teleprompterFrame = useTeleprompterFrame()
  const floatingToolbar = useFloatingToolbar()
  const highlightBand = useHighlightBand()

  // Auto-hide toolbar during playback
  let hideToolbarTimeout: NodeJS.Timeout | null = null

  const handlePlay = () => {
    floatingToolbar.events.onPlay()

    // Auto-hide toolbar after a delay
    hideToolbarTimeout = setTimeout(() => {
      floatingToolbar.hideToolbar()
    }, 2000) // 2 seconds delay
  }

  const handlePause = () => {
    floatingToolbar.events.onPause()

    // Clear hide timeout and show toolbar
    if (hideToolbarTimeout) {
      clearTimeout(hideToolbarTimeout)
      hideToolbarTimeout = null
    }
    floatingToolbar.showToolbar()
  }

  const handleTap = () => {
    // Toggle toolbar visibility when content is tapped
    if (floatingToolbar.props.value.scrollState.isPlaying) {
      // During playback, tapping pauses and shows toolbar
      handlePause()
    } else {
      // When paused, tapping toggles toolbar
      if (floatingToolbar.isVisible.value) {
        floatingToolbar.hideToolbar()
      } else {
        floatingToolbar.showToolbar()
      }
    }
  }

  // Coordinate highlight band updates
  const updateHighlightBandDimensions = (viewportHeight: number, lineHeight: number) => {
    highlightBand.updateViewportHeight(viewportHeight)
    highlightBand.updateLineHeight(lineHeight)
  }

  // Cleanup
  onUnmounted(() => {
    if (hideToolbarTimeout) {
      clearTimeout(hideToolbarTimeout)
    }
  })

  return {
    teleprompterFrame,
    floatingToolbar,
    highlightBand,

    // Coordinated actions
    handlePlay,
    handlePause,
    handleTap,
    updateHighlightBandDimensions,
  }
}

// ========================================
// Component Registration Helper
// ========================================

interface ComponentRegistration {
  name: string
  component: any
  props: any
  events: any
}

export function createComponentRegistry() {
  const components = new Map<string, ComponentRegistration>()

  const register = (name: string, component: any, props: any, events: any) => {
    components.set(name, { name, component, props, events })
  }

  const get = (name: string): ComponentRegistration | undefined => {
    return components.get(name)
  }

  const list = (): ComponentRegistration[] => {
    return Array.from(components.values())
  }

  return {
    register,
    get,
    list,
  }
}
