/**
 * Unified Fullscreen Composable
 * Provides a single interface for fullscreen functionality across all platforms:
 * - Web: HTML5 Fullscreen API
 * - Android: Immersive Mode (hides system UI)
 * - Desktop: Tauri Window API
 */

import { ref, computed, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useWebFullscreen } from './webFullscreen'
import { useImmersiveMode } from './immersiveMode'
import { useTauri, isTauri } from '../tauri'

/**
 * Platform detection
 */
function detectPlatform(): 'web' | 'android' | 'desktop' {
  if (isTauri()) {
    return 'desktop'
  } else if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    return 'android'
  } else {
    return 'web'
  }
}

/**
 * Unified Fullscreen Composable
 * Automatically selects the appropriate implementation based on platform
 */
export function useFullscreen(options: {
  /**
   * Element to make fullscreen (web only)
   * Defaults to document.documentElement
   */
  element?: Element
  /**
   * Whether to detect primary screen automatically
   * @default true
   */
  autoDetectPrimaryScreen?: boolean
} = {}) {
  // Platform detection
  const platform = detectPlatform()

  // Initialize platform-specific composables
  const webFullscreen = useWebFullscreen({
    element: options.element,
    autoDetectPrimaryScreen: options.autoDetectPrimaryScreen,
  })
  
  const androidImmersive = useImmersiveMode()
  const tauriDesktop = useTauri()

  // Unified state
  const isFullscreen = computed(() => {
    switch (platform) {
      case 'web':
        return webFullscreen.isFullscreen.value
      case 'android':
        return androidImmersive.isImmersive.value
      case 'desktop':
        return tauriDesktop.isFullscreen.value
      default:
        return false
    }
  })

  const isSupported = computed(() => {
    switch (platform) {
      case 'web':
        return webFullscreen.isSupported.value
      case 'android':
        return androidImmersive.isSupported.value
      case 'desktop':
        return tauriDesktop.isDesktop.value
      default:
        return false
    }
  })

  const screenInfo = computed(() => {
    switch (platform) {
      case 'web':
        return webFullscreen.screenInfo.value
      case 'android':
        return androidImmersive.screenInfo.value
      case 'desktop':
        return tauriDesktop.screenInfo.value
      default:
        return {
          isPrimary: true,
          isMultiScreen: false,
          screenCount: 1,
        }
    }
  })

  // Unified actions
  const toggleFullscreen = async (): Promise<boolean> => {
    if (!isSupported.value) {
      console.warn(`Fullscreen not supported on platform: ${platform}`)
      return false
    }

    try {
      switch (platform) {
        case 'web':
          return await webFullscreen.toggleFullscreen()
        case 'android':
          await androidImmersive.toggleImmersiveMode()
          return androidImmersive.isImmersive.value
        case 'desktop': {
          const result = await tauriDesktop.toggleFullscreen()
          return result ?? false
        }
        default:
          return false
      }
    } catch (error) {
      console.error(`Failed to toggle fullscreen on ${platform}:`, error)
      return isFullscreen.value
    }
  }

  const enterFullscreen = async (): Promise<boolean> => {
    if (!isSupported.value || isFullscreen.value) {
      return isFullscreen.value
    }

    try {
      switch (platform) {
        case 'web':
          return await webFullscreen.enterFullscreen()
        case 'android':
          await androidImmersive.enableImmersiveMode()
          return androidImmersive.isImmersive.value
        case 'desktop': {
          // For desktop, we need to check current state and toggle if not fullscreen
          const result = await tauriDesktop.toggleFullscreen()
          return result ?? false
        }
        default:
          return false
      }
    } catch (error) {
      console.error(`Failed to enter fullscreen on ${platform}:`, error)
      return isFullscreen.value
    }
  }

  const exitFullscreen = async (): Promise<boolean> => {
    if (!isSupported.value || !isFullscreen.value) {
      return isFullscreen.value
    }

    try {
      switch (platform) {
        case 'web':
          return await webFullscreen.exitFullscreen()
        case 'android':
          await androidImmersive.disableImmersiveMode()
          return androidImmersive.isImmersive.value
        case 'desktop': {
          // For desktop, we need to check current state and toggle if fullscreen
          const result = await tauriDesktop.toggleFullscreen()
          return !(result ?? true)
        }
        default:
          return false
      }
    } catch (error) {
      console.error(`Failed to exit fullscreen on ${platform}:`, error)
      return isFullscreen.value
    }
  }

  // Initialize platform-specific composables
  onMounted(async () => {
    if (platform === 'desktop') {
      await tauriDesktop.init()
    }
  })

  return {
    // State
    isFullscreen,
    isSupported,
    screenInfo,
    platform: ref(platform),
    
    // Actions
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
    
    // Platform-specific composables (for advanced usage)
    webFullscreen,
    androidImmersive,
    tauriDesktop,
  }
}

/**
 * Export individual functions for convenience
 */
export { detectPlatform }
export default useFullscreen