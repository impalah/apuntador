/**
 * Tauri utilities and composables for desktop-specific functionality
 */

import { ref, computed } from 'vue'

/**
 * Check if the app is running in Tauri (desktop mode)
 */
export function isTauri(): boolean {
  try {
    return '__TAURI__' in window
  } catch {
    return false
  }
}

/**
 * Get desktop screen/monitor information using Tauri APIs
 */
async function getDesktopScreenInfo(): Promise<{
  isPrimary: boolean
  isMultiScreen: boolean
  screenCount: number
  currentMonitor: any
  allMonitors: any[]
}> {
  try {
    // Dynamic import to avoid loading Tauri APIs in web mode
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    
    // Try to get monitor information
    let currentMonitor: any = null
    let allMonitors: any[] = []
    
    try {
      // Try to get current monitor (API may vary by Tauri version)
      const window = getCurrentWindow()
      // Note: Some Tauri versions may not have currentMonitor method
      // We'll handle this gracefully
      if ('currentMonitor' in window && typeof window.currentMonitor === 'function') {
        currentMonitor = await (window as any).currentMonitor()
      }
    } catch (error) {
      console.warn('currentMonitor API not available:', error)
    }
    
    try {
      // Try to get all available monitors
      const { availableMonitors } = await import('@tauri-apps/api/window')
      if (availableMonitors) {
        allMonitors = await availableMonitors()
      }
    } catch (error) {
      console.warn('availableMonitors API not available:', error)
    }

    const screenCount = allMonitors.length || 1
    const isMultiScreen = screenCount > 1
    
    // Current window's monitor is considered primary for fullscreen purposes
    const isPrimary = true

    return {
      isPrimary,
      isMultiScreen,
      screenCount,
      currentMonitor: currentMonitor || null,
      allMonitors: allMonitors || [],
    }
  } catch (error) {
    console.warn('Failed to get desktop screen info:', error)
    return {
      isPrimary: true,
      isMultiScreen: false,
      screenCount: 1,
      currentMonitor: null,
      allMonitors: [],
    }
  }
}

/**
 * Composable for Tauri-specific functionality
 */
export function useTauri() {
  const isDesktop = computed(() => isTauri())
  const isReady = ref(false)
  const isFullscreen = ref(false)
  const screenInfo = ref({
    isPrimary: true,
    isMultiScreen: false,
    screenCount: 1,
    currentMonitor: null as any,
    allMonitors: [] as any[],
  })

  // Initialize Tauri APIs when available
  const init = async () => {
    if (!isDesktop.value) {
      isReady.value = true
      return
    }

    try {
      // Dynamic import to avoid loading Tauri APIs in web mode
      const { getCurrentWindow } = await import('@tauri-apps/api/window')

      // Set up window event listeners
      await setupWindowListeners()

      // Initialize screen information
      screenInfo.value = await getDesktopScreenInfo()

      // Initialize fullscreen state
      await updateFullscreenState()

      isReady.value = true
      console.log('✅ Tauri initialized successfully')
    } catch (error) {
      console.warn('Failed to initialize Tauri:', error)
      isReady.value = true
    }
  }

  // Set up window event listeners
  const setupWindowListeners = async () => {
    if (!isDesktop.value) return

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')

      const window = getCurrentWindow()

      // Listen for window focus/blur events
      await window.listen('tauri://focus', () => {
        console.log('Window focused')
      })

      await window.listen('tauri://blur', () => {
        console.log('Window blurred')
      })

      // Listen for close requested event
      await window.listen('tauri://close-requested', () => {
        console.log('Close requested')
      })

      console.log('✅ Window listeners set up successfully')
    } catch (error) {
      console.warn('Failed to set up window listeners:', error)
    }
  }

  // Window control functions
  const toggleFullscreen = async () => {
    if (!isDesktop.value) return false

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      const currentFullscreen = await window.isFullscreen()
      await window.setFullscreen(!currentFullscreen)
      isFullscreen.value = !currentFullscreen
      return !currentFullscreen
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error)
      return false
    }
  }

  const updateFullscreenState = async () => {
    if (!isDesktop.value) return

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      isFullscreen.value = await window.isFullscreen()
    } catch (error) {
      console.warn('Failed to update fullscreen state:', error)
    }
  }

  const setAlwaysOnTop = async (onTop: boolean) => {
    if (!isDesktop.value) return

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      await window.setAlwaysOnTop(onTop)
    } catch (error) {
      console.error('Failed to set always on top:', error)
    }
  }

  const minimizeWindow = async () => {
    if (!isDesktop.value) return

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      await window.minimize()
    } catch (error) {
      console.error('Failed to minimize window:', error)
    }
  }

  const maximizeWindow = async () => {
    if (!isDesktop.value) return

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      const isMaximized = await window.isMaximized()
      if (isMaximized) {
        await window.unmaximize()
      } else {
        await window.maximize()
      }
      return !isMaximized
    } catch (error) {
      console.error('Failed to toggle maximize:', error)
      return false
    }
  }

  const closeWindow = async () => {
    if (!isDesktop.value) return

    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const window = getCurrentWindow()
      await window.close()
    } catch (error) {
      console.error('Failed to close window:', error)
    }
  }

  // Desktop-specific file operations (simplified for now)
  const saveFileNative = async (content: string, filename?: string) => {
    if (!isDesktop.value) return null

    // For now, use the existing web-based file system API
    // Can be enhanced later with native Tauri file dialogs
    console.log('Save file native (placeholder):', filename)
    return null
  }

  const openFileNative = async () => {
    if (!isDesktop.value) return null

    // For now, use the existing web-based file system API
    // Can be enhanced later with native Tauri file dialogs
    console.log('Open file native (placeholder)')
    return null
  }

  return {
    isDesktop,
    isReady,
    isFullscreen,
    screenInfo,
    init,
    toggleFullscreen,
    updateFullscreenState,
    setAlwaysOnTop,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    saveFileNative,
    openFileNative,
  }
}

/**
 * Export individual functions for convenience
 */
export { isTauri as default }
