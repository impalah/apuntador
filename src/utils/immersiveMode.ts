import { ref, onMounted, onUnmounted } from 'vue'
import { StatusBar } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'

/**
 * Composable for managing Android immersive mode (fullscreen)
 * Hides system navigation and status bars for maximum screen usage
 */
export function useImmersiveMode() {
  const isImmersive = ref(false)
  const isSupported = ref(false)

  onMounted(() => {
    // Only supported on Android
    isSupported.value = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
  })

  /**
   * Enable immersive mode - hide system bars
   */
  async function enableImmersiveMode() {
    if (!isSupported.value) {
      console.log('Immersive mode not supported on this platform')
      return
    }

    try {
      // Hide status bar
      await StatusBar.hide()

      // Set immersive mode via native Android flags
      if (Capacitor.isNativePlatform()) {
        // This will be handled by native Android code
        await setImmersiveFlags(true)
      }

      isImmersive.value = true
      console.log('✅ Immersive mode enabled')
    } catch (error) {
      console.error('❌ Failed to enable immersive mode:', error)
    }
  }

  /**
   * Disable immersive mode - show system bars
   */
  async function disableImmersiveMode() {
    if (!isSupported.value) {
      return
    }

    try {
      // Show status bar
      await StatusBar.show()

      // Clear immersive flags
      if (Capacitor.isNativePlatform()) {
        await setImmersiveFlags(false)
      }

      isImmersive.value = false
      console.log('✅ Immersive mode disabled')
    } catch (error) {
      console.error('❌ Failed to disable immersive mode:', error)
    }
  }

  /**
   * Toggle immersive mode on/off
   */
  async function toggleImmersiveMode() {
    if (isImmersive.value) {
      await disableImmersiveMode()
    } else {
      await enableImmersiveMode()
    }
  }

  /**
   * Set Android immersive flags via native bridge
   */
  async function setImmersiveFlags(enable: boolean) {
    if (!Capacitor.isNativePlatform()) return

    try {
      // Use our custom native plugin
      const { registerPlugin } = await import('@capacitor/core')
      const ImmersiveMode = registerPlugin('ImmersiveMode') as any

      await ImmersiveMode.setImmersiveMode({ enable })

      console.log(`✅ Native immersive mode ${enable ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.warn('Native immersive mode plugin not available, using fallback:', error)
      setImmersiveFallback(enable)
    }
  }

  /**
   * Fallback immersive mode using CSS and viewport
   */
  function setImmersiveFallback(enable: boolean) {
    const metaViewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
    const html = document.documentElement

    if (enable) {
      // Make app fullscreen using CSS
      html.style.setProperty('--safe-area-inset-top', '0px')
      html.style.setProperty('--safe-area-inset-bottom', '0px')
      html.classList.add('immersive-mode')

      // Update viewport for fullscreen
      if (metaViewport) {
        metaViewport.content =
          'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no'
      }
    } else {
      // Restore normal mode
      html.classList.remove('immersive-mode')

      // Restore viewport
      if (metaViewport) {
        metaViewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover'
      }
    }
  }

  /**
   * Handle system UI visibility changes (Android)
   */
  function handleSystemUIVisibilityChange() {
    // Re-enable immersive mode if it was interrupted
    if (isImmersive.value && isSupported.value) {
      setTimeout(() => {
        enableImmersiveMode()
      }, 100)
    }
  }

  onMounted(() => {
    // Listen for system UI visibility changes on Android
    if (Capacitor.getPlatform() === 'android') {
      window.addEventListener('resize', handleSystemUIVisibilityChange)
    }
  })

  onUnmounted(() => {
    // Clean up and restore normal mode
    if (isImmersive.value) {
      disableImmersiveMode()
    }

    window.removeEventListener('resize', handleSystemUIVisibilityChange)
  })

  return {
    isImmersive,
    isSupported,
    enableImmersiveMode,
    disableImmersiveMode,
    toggleImmersiveMode,
  }
}
