import { ref, onMounted, onUnmounted } from 'vue'
import {
  ANDROID_STATUS_BAR_MIN_HEIGHT,
  ANDROID_STATUS_BAR_SCREEN_RATIO,
  ANDROID_NAV_BAR_MIN_HEIGHT,
  ANDROID_NAV_BAR_SCREEN_RATIO,
  INSET_UPDATE_DELAY,
  INSET_QUICK_UPDATE_DELAY,
} from './constants'
// import { debugEdgeToEdge } from './debug' // Debug utility - disabled for production

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

  function updateInsets() {
    let detectedBottomInset = 0
    let detectedTopInset = 0

    // Method 1: Try CSS environment variables first
    if (typeof window !== 'undefined') {
      const computedStyle = getComputedStyle(document.documentElement)

      const topEnv = computedStyle.getPropertyValue('env(safe-area-inset-top)')
      const bottomEnv = computedStyle.getPropertyValue('env(safe-area-inset-bottom)')
      const leftEnv = computedStyle.getPropertyValue('env(safe-area-inset-left)')
      const rightEnv = computedStyle.getPropertyValue('env(safe-area-inset-right)')

      if (topEnv) detectedTopInset = Math.max(detectedTopInset, Number.parseInt(topEnv) || 0)
      if (bottomEnv) detectedBottomInset = Math.max(detectedBottomInset, Number.parseInt(bottomEnv) || 0)

      safeAreaInsets.value = {
        top: detectedTopInset,
        bottom: detectedBottomInset,
        left: Number.parseInt(leftEnv) || 0,
        right: Number.parseInt(rightEnv) || 0,
      }
    }

    // Method 2: Android-specific detection
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      const isAndroid = /Android/i.test(navigator.userAgent)

      if (isAndroid) {
        // Force edge-to-edge mode for Android
        isEdgeToEdge.value = true

        // Calculate navigation bar height based on screen properties
        const screenHeight = window.screen.height
        const viewportHeight = window.innerHeight
        const availableHeight = window.screen.availHeight

        // Estimate status bar height (usually 24-48px)
        const estimatedStatusBarHeight = Math.max(
          ANDROID_STATUS_BAR_MIN_HEIGHT,
          Math.round(screenHeight * ANDROID_STATUS_BAR_SCREEN_RATIO)
        )

        // Estimate navigation bar height
        let estimatedNavBarHeight = 0

        // If viewport is smaller than screen, there's likely a navigation bar
        if (screenHeight > viewportHeight) {
          estimatedNavBarHeight = Math.max(
            ANDROID_NAV_BAR_MIN_HEIGHT,
            Math.round(screenHeight * ANDROID_NAV_BAR_SCREEN_RATIO)
          )
        }

        // Also check available height difference
        if (screenHeight > availableHeight) {
          const systemBarsHeight = screenHeight - availableHeight
          estimatedNavBarHeight = Math.max(
            estimatedNavBarHeight,
            systemBarsHeight - estimatedStatusBarHeight
          )
        }

        // Apply detected insets, but prefer CSS env() values if available
        detectedTopInset = Math.max(detectedTopInset, estimatedStatusBarHeight)
        detectedBottomInset = Math.max(detectedBottomInset, estimatedNavBarHeight)

        safeAreaInsets.value = {
          top: detectedTopInset,
          bottom: detectedBottomInset,
          left: safeAreaInsets.value.left,
          right: safeAreaInsets.value.right,
        }

        // Debug logging - disabled for production
        // console.log('Android edge-to-edge detected:', {
        //   screenHeight,
        //   viewportHeight,
        //   availableHeight,
        //   estimatedNavBarHeight,
        //   detectedBottomInset,
        // })
      }
    }

    // Set edge-to-edge if any insets are detected
    if (detectedTopInset > 0 || detectedBottomInset > 0) {
      isEdgeToEdge.value = true
    }

    // Apply CSS custom properties for use in components
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(
        '--safe-area-inset-top',
        `${safeAreaInsets.value.top}px`
      )
      document.documentElement.style.setProperty(
        '--safe-area-inset-bottom',
        `${safeAreaInsets.value.bottom}px`
      )
      document.documentElement.style.setProperty(
        '--safe-area-inset-left',
        `${safeAreaInsets.value.left}px`
      )
      document.documentElement.style.setProperty(
        '--safe-area-inset-right',
        `${safeAreaInsets.value.right}px`
      )
    }
  }

  function handleResize() {
    updateInsets()
  }

  function handleViewportChange() {
    updateInsets()
  }

  onMounted(() => {
    updateInsets()

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

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
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('orientationchange', handleResize)

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
