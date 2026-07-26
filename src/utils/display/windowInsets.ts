import { ref, onMounted, onUnmounted } from 'vue'
import {
  ANDROID_STATUS_BAR_MIN_HEIGHT,
  ANDROID_STATUS_BAR_SCREEN_RATIO,
  ANDROID_NAV_BAR_MIN_HEIGHT,
  ANDROID_NAV_BAR_SCREEN_RATIO,
  INSET_UPDATE_DELAY,
  INSET_QUICK_UPDATE_DELAY,
} from '../constants'
// import { debugEdgeToEdge } from './debug' // Debug utility - disabled for production

/**
 * Try to get safe area insets from CSS environment variables
 */
function getInsetsFromCssEnv(): { top: number; bottom: number; left: number; right: number } {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }

  const computedStyle = getComputedStyle(document.documentElement)

  const topEnv = computedStyle.getPropertyValue('env(safe-area-inset-top)')
  const bottomEnv = computedStyle.getPropertyValue('env(safe-area-inset-bottom)')
  const leftEnv = computedStyle.getPropertyValue('env(safe-area-inset-left)')
  const rightEnv = computedStyle.getPropertyValue('env(safe-area-inset-right)')

  return {
    top: Number.parseInt(topEnv) || 0,
    bottom: Number.parseInt(bottomEnv) || 0,
    left: Number.parseInt(leftEnv) || 0,
    right: Number.parseInt(rightEnv) || 0,
  }
}

/**
 * Calculate Android navigation bar height
 */
function calculateNavBarHeight(
  screenHeight: number,
  viewportHeight: number,
  availableHeight: number,
  estimatedStatusBarHeight: number
): number {
  let navBarHeight = 0

  // If viewport is smaller than screen, there's likely a navigation bar
  if (screenHeight > viewportHeight) {
    navBarHeight = Math.max(
      ANDROID_NAV_BAR_MIN_HEIGHT,
      Math.round(screenHeight * ANDROID_NAV_BAR_SCREEN_RATIO)
    )
  }

  // Also check available height difference
  if (screenHeight > availableHeight) {
    const systemBarsHeight = screenHeight - availableHeight
    navBarHeight = Math.max(navBarHeight, systemBarsHeight - estimatedStatusBarHeight)
  }

  return navBarHeight
}

/**
 * Composable for handling Android edge-to-edge window insets
 * Provides safe area insets to avoid system UI overlap
 */
export function useWindowInsets() {
  const safeAreaInsets = ref({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  })

  const isEdgeToEdge = ref(false)

  /**
   * Detect Android-specific insets
   */
  function detectAndroidInsets(): { top: number; bottom: number } {
    const screenHeight = window.screen.height
    const viewportHeight = window.innerHeight
    const availableHeight = window.screen.availHeight

    // Estimate status bar height (usually 24-48px)
    const statusBarHeight = Math.max(
      ANDROID_STATUS_BAR_MIN_HEIGHT,
      Math.round(screenHeight * ANDROID_STATUS_BAR_SCREEN_RATIO)
    )

    // Calculate navigation bar height
    const navBarHeight = calculateNavBarHeight(
      screenHeight,
      viewportHeight,
      availableHeight,
      statusBarHeight
    )

    return {
      top: statusBarHeight,
      bottom: navBarHeight,
    }
  }

  /**
   * Apply insets as CSS custom properties
   */
  function applyCssCustomProperties() {
    if (typeof document === 'undefined') return

    document.documentElement.style.setProperty('--safe-area-inset-top', `${safeAreaInsets.value.top}px`)
    document.documentElement.style.setProperty('--safe-area-inset-bottom', `${safeAreaInsets.value.bottom}px`)
    document.documentElement.style.setProperty('--safe-area-inset-left', `${safeAreaInsets.value.left}px`)
    document.documentElement.style.setProperty('--safe-area-inset-right', `${safeAreaInsets.value.right}px`)
  }

  function updateInsets() {
    // Method 1: Try CSS environment variables first
    const cssInsets = getInsetsFromCssEnv()
    let detectedTopInset = cssInsets.top
    let detectedBottomInset = cssInsets.bottom

    safeAreaInsets.value = cssInsets

    // Method 2: Android-specific detection
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const isAndroid = /Android/i.test(navigator.userAgent)

      if (isAndroid) {
        isEdgeToEdge.value = true

        const androidInsets = detectAndroidInsets()

        // Apply detected insets, but prefer CSS env() values if available
        detectedTopInset = Math.max(detectedTopInset, androidInsets.top)
        detectedBottomInset = Math.max(detectedBottomInset, androidInsets.bottom)

        safeAreaInsets.value = {
          top: detectedTopInset,
          bottom: detectedBottomInset,
          left: safeAreaInsets.value.left,
          right: safeAreaInsets.value.right,
        }
      }
    }

    // Set edge-to-edge if any insets are detected
    if (detectedTopInset > 0 || detectedBottomInset > 0) {
      isEdgeToEdge.value = true
    }

    // Apply CSS custom properties for use in components
    applyCssCustomProperties()
  }

  function handleResize() {
    updateInsets()
  }

  function handleViewportChange() {
    updateInsets()
  }

  onMounted(() => {
    updateInsets()

    globalThis.addEventListener('resize', handleResize)
    globalThis.addEventListener('orientationchange', handleResize)

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange)
    }

    // Update insets after a short delay to catch late-loading viewport info
    setTimeout(updateInsets, INSET_QUICK_UPDATE_DELAY)
    setTimeout(updateInsets, INSET_UPDATE_DELAY)

    // Debug info - disabled for production
    // setTimeout(() => {
    //   debugEdgeToEdge()
    // }, 1000)
  })

  onUnmounted(() => {
    globalThis.removeEventListener('resize', handleResize)
    globalThis.removeEventListener('orientationchange', handleResize)

    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', handleViewportChange)
    }
  })

  return {
    safeAreaInsets,
    isEdgeToEdge,
    updateInsets,
  }
}
