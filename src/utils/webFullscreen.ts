/**
 * Web Fullscreen API utilities
 * Handles HTML5 Fullscreen API with cross-browser compatibility
 */

import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Check if the browser supports Fullscreen API
 */
export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false

  return !!(
    document.documentElement.requestFullscreen ||
    (document.documentElement as any).webkitRequestFullscreen ||
    (document.documentElement as any).mozRequestFullScreen ||
    (document.documentElement as any).msRequestFullscreen
  )
}

/**
 * Get the current fullscreen element
 */
function getFullscreenElement(): Element | null {
  return (
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement ||
    null
  )
}

/**
 * Request fullscreen on an element (or document.documentElement by default)
 */
async function requestFullscreen(element?: Element): Promise<void> {
  const targetElement = element || document.documentElement

  if (targetElement.requestFullscreen) {
    await targetElement.requestFullscreen()
  } else if ((targetElement as any).webkitRequestFullscreen) {
    await (targetElement as any).webkitRequestFullscreen()
  } else if ((targetElement as any).mozRequestFullScreen) {
    await (targetElement as any).mozRequestFullScreen()
  } else if ((targetElement as any).msRequestFullscreen) {
    await (targetElement as any).msRequestFullscreen()
  } else {
    throw new Error('Fullscreen API not supported')
  }
}

/**
 * Exit fullscreen mode
 */
async function exitFullscreen(): Promise<void> {
  if (document.exitFullscreen) {
    await document.exitFullscreen()
  } else if ((document as any).webkitExitFullscreen) {
    await (document as any).webkitExitFullscreen()
  } else if ((document as any).mozCancelFullScreen) {
    await (document as any).mozCancelFullScreen()
  } else if ((document as any).msExitFullscreen) {
    await (document as any).msExitFullscreen()
  } else {
    throw new Error('Exit fullscreen not supported')
  }
}

/**
 * Get information about available screens (for multi-monitor setups)
 */
async function getScreenInfo(): Promise<{
  isPrimary: boolean
  isMultiScreen: boolean
  screenCount: number
}> {
  try {
    // Use Screen API if available (experimental)
    if ('screen' in window && 'isExtended' in (window.screen as any)) {
      const screenDetails = await (window.screen as any).getScreenDetails?.()
      if (screenDetails) {
        return {
          isPrimary: true, // Current screen is always considered primary for web
          isMultiScreen: screenDetails.screens?.length > 1,
          screenCount: screenDetails.screens?.length || 1,
        }
      }
    }

    // Fallback: detect multi-monitor using screen dimensions
    const availWidth = window.screen.availWidth
    const width = window.screen.width
    const isExtended = availWidth > width

    return {
      isPrimary: true, // Always consider current window's screen as primary
      isMultiScreen: isExtended,
      screenCount: isExtended ? 2 : 1, // Rough estimate
    }
  } catch (error) {
    console.warn('Failed to get screen info:', error)
    return {
      isPrimary: true,
      isMultiScreen: false,
      screenCount: 1,
    }
  }
}

/**
 * Composable for Web Fullscreen functionality
 */
export function useWebFullscreen(options: {
  element?: Element
  autoDetectPrimaryScreen?: boolean
} = {}) {
  const isFullscreen = ref(false)
  const isSupported = ref(false)
  const screenInfo = ref({
    isPrimary: true,
    isMultiScreen: false,
    screenCount: 1,
  })

  // Update fullscreen state
  const updateFullscreenState = () => {
    isFullscreen.value = !!getFullscreenElement()
  }

  // Toggle fullscreen mode
  const toggleFullscreen = async (): Promise<boolean> => {
    if (!isSupported.value) {
      console.warn('Fullscreen API not supported')
      return false
    }

    try {
      if (isFullscreen.value) {
        await exitFullscreen()
        return false
      } else {
        await requestFullscreen(options.element)
        return true
      }
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error)
      return isFullscreen.value
    }
  }

  // Enter fullscreen mode
  const enterFullscreen = async (): Promise<boolean> => {
    if (!isSupported.value || isFullscreen.value) {
      return isFullscreen.value
    }

    try {
      await requestFullscreen(options.element)
      return true
    } catch (error) {
      console.error('Failed to enter fullscreen:', error)
      return false
    }
  }

  // Exit fullscreen mode
  const exitFullscreenMode = async (): Promise<boolean> => {
    if (!isSupported.value || !isFullscreen.value) {
      return isFullscreen.value
    }

    try {
      await exitFullscreen()
      return false
    } catch (error) {
      console.error('Failed to exit fullscreen:', error)
      return true
    }
  }

  // Initialize screen detection
  const initializeScreenDetection = async () => {
    if (options.autoDetectPrimaryScreen !== false) {
      try {
        screenInfo.value = await getScreenInfo()
      } catch (error) {
        console.warn('Failed to detect screen info:', error)
      }
    }
  }

  onMounted(async () => {
    // Check support
    isSupported.value = isFullscreenSupported()

    if (isSupported.value) {
      // Initialize state
      updateFullscreenState()

      // Listen for fullscreen changes
      const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange']
      events.forEach(event => {
        document.addEventListener(event, updateFullscreenState)
      })

      // Initialize screen detection
      await initializeScreenDetection()
    }
  })

  onUnmounted(() => {
    if (isSupported.value) {
      // Clean up event listeners
      const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'msfullscreenchange']
      events.forEach(event => {
        document.removeEventListener(event, updateFullscreenState)
      })

      // Exit fullscreen if active
      if (isFullscreen.value) {
        exitFullscreen().catch(console.error)
      }
    }
  })

  return {
    isFullscreen,
    isSupported,
    screenInfo,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen: exitFullscreenMode,
  }
}