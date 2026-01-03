/**
 * Tauri utilities and composables for desktop-specific functionality
 */

import { ref, computed } from 'vue'

/**
 * Check if the app is running in Tauri (desktop mode)
 */
export function isTauri(): boolean {
  try {
    // In dev mode, Tauri serves from http://localhost
    // We need to check if Tauri APIs are available by trying to import them
    // The most reliable way is to check if window.__TAURI_INTERNALS__ exists
    const hasTauriInternals = '__TAURI_INTERNALS__' in window
    const hasTauriMetadata = '__TAURI_METADATA__' in window
    
    // console.log('[SEARCH] Tauri detection:', { 
    //   hasTauriInternals,
    //   hasTauriMetadata,
    //   windowKeys: Object.keys(window).filter(k => k.includes('TAURI'))
    // })
    
    return hasTauriInternals || hasTauriMetadata
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
        currentMonitor = await (globalThis as any).currentMonitor()
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
    
    // Check if current monitor is primary (first monitor in array or has position 0,0)
    let isPrimary = true
    if (currentMonitor) {
      isPrimary = currentMonitor.position?.x === 0 && currentMonitor.position?.y === 0
    } else if (allMonitors.length > 0) {
      isPrimary = allMonitors[0] === currentMonitor
    }

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
      // Set up window event listeners
      await setupWindowListeners()

      // Initialize screen information
      screenInfo.value = await getDesktopScreenInfo()

      // Initialize fullscreen state
      await updateFullscreenState()

      isReady.value = true
      console.log('[OK] Tauri initialized successfully')
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

      console.log('[OK] Window listeners set up successfully')
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
      // Try using our custom Rust command first (more reliable)
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('minimize_window')
      console.log('[OK] Window minimized via Rust command')
    } catch (error) {
      console.warn('Rust command failed, trying API fallback:', error)
      // Fallback to Tauri API
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const window = getCurrentWindow()
        await window.minimize()
        console.log('[OK] Window minimized via API')
      } catch (apiError) {
        console.error('Failed to minimize window:', apiError)
      }
    }
  }

  const maximizeWindow = async () => {
    if (!isDesktop.value) return

    try {
      // Try using our custom Rust command first (more reliable)
      const { invoke } = await import('@tauri-apps/api/core')
      const newState = await invoke<boolean>('maximize_window')
      console.log('[OK] Window maximize toggled via Rust command')
      return newState
    } catch (error) {
      console.warn('Rust command failed, trying API fallback:', error)
      // Fallback to Tauri API
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const window = getCurrentWindow()
        const isMaximized = await window.isMaximized()
        if (isMaximized) {
          await window.unmaximize()
        } else {
          await window.maximize()
        }
        console.log('[OK] Window maximize toggled via API')
        return !isMaximized
      } catch (apiError) {
        console.error('Failed to toggle maximize:', apiError)
        return false
      }
    }
  }

  const closeWindow = async () => {
    if (!isDesktop.value) return

    try {
      // Try using our custom Rust command first (more reliable)
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('close_window')
      console.log('[OK] Window closed via Rust command')
    } catch (error) {
      console.warn('Rust command failed, trying API fallback:', error)
      // Fallback to Tauri API
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const window = getCurrentWindow()
        await window.close()
        console.log('[OK] Window closed via API')
      } catch (apiError) {
        console.error('Failed to close window:', apiError)
      }
    }
  }

  // Desktop-specific file operations (to be implemented)
  // Expected signature: async (content: string, filename?: string): Promise<string | null>
  const saveFileNative = async (): Promise<string | null> => {
    if (!isDesktop.value) {
      throw new Error('saveFileNative is only available in desktop mode')
    }

    // TODO: Implement native Tauri file save dialog
    // For now, use the existing web-based file system API
    throw new Error('saveFileNative not yet implemented. Use web file system API instead.')
  }

  // Expected signature: async (): Promise<{ content: string; filename: string } | null>
  const openFileNative = async (): Promise<{ content: string; filename: string } | null> => {
    if (!isDesktop.value) {
      throw new Error('openFileNative is only available in desktop mode')
    }

    // TODO: Implement native Tauri file open dialog
    // For now, use the existing web-based file system API
    throw new Error('openFileNative not yet implemented. Use web file system API instead.')
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
