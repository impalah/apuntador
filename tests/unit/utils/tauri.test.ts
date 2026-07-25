import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isTauri, useTauri } from '@/utils/tauri'

/**
 * Tauri Integration Tests
 *
 * Vitest's `vi.mock()` DOES intercept dynamic `await import(...)` calls, as long
 * as the mocked specifier matches exactly what the source imports. This suite
 * previously mocked '@tauri-apps/window' while tauri.ts imports
 * '@tauri-apps/api/window' - the mismatch meant the mock never engaged, so a
 * large chunk of this file was marked `.skip` under the (incorrect) assumption
 * that dynamic imports couldn't be mocked at all.
 */

// Mock Tauri APIs
const mockWindow = {
  listen: vi.fn(),
  isFullscreen: vi.fn(),
  setFullscreen: vi.fn(),
  setAlwaysOnTop: vi.fn(),
  minimize: vi.fn(),
  maximize: vi.fn(),
  unmaximize: vi.fn(),
  isMaximized: vi.fn(),
  close: vi.fn(),
}

const mockGetCurrentWindow = vi.fn(() => mockWindow)
const mockAvailableMonitors = vi.fn(async () => [] as any[])

// Mock dynamic imports (must match the exact specifier tauri.ts imports:
// '@tauri-apps/api/window', not '@tauri-apps/window')
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: mockGetCurrentWindow,
  availableMonitors: mockAvailableMonitors,
}))

const mockInvoke = vi.fn()
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}))

describe('Tauri Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset window object - clear all Tauri-related properties
    delete (window as any).__TAURI_INTERNALS__
    delete (window as any).__TAURI_INTERNALS__
    delete (window as any).__TAURI_METADATA__

    // Reset mock implementations
    mockGetCurrentWindow.mockReturnValue(mockWindow)
    mockWindow.listen.mockResolvedValue(() => {})
    mockWindow.isFullscreen.mockResolvedValue(false)
    mockWindow.setFullscreen.mockResolvedValue(undefined)
    mockWindow.setAlwaysOnTop.mockResolvedValue(undefined)
    mockWindow.minimize.mockResolvedValue(undefined)
    mockWindow.maximize.mockResolvedValue(undefined)
    mockWindow.unmaximize.mockResolvedValue(undefined)
    mockWindow.isMaximized.mockResolvedValue(false)
    mockWindow.close.mockResolvedValue(undefined)

    // Default: the Rust invoke() commands aren't available, so
    // minimize/maximize/close fall back to the getCurrentWindow() API.
    mockInvoke.mockRejectedValue(new Error('invoke not available in test env'))
    mockAvailableMonitors.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('isTauri', () => {
    it('should return true when __TAURI_INTERNALS__ is available', () => {
      ;(window as any).__TAURI_INTERNALS__ = {}

      expect(isTauri()).toBe(true)
    })

    it('should return false when __TAURI_INTERNALS__ is not available', () => {
      expect(isTauri()).toBe(false)
    })

    it('should return false when window is not available', () => {
      const originalWindow = globalThis.window
      delete (globalThis as any).window

      expect(isTauri()).toBe(false)

      globalThis.window = originalWindow
    })

    it('should return true when only __TAURI_METADATA__ is available', () => {
      ;(window as any).__TAURI_METADATA__ = {}

      expect(isTauri()).toBe(true)
    })
  })

  describe('useTauri', () => {
    describe('Initialization', () => {
      it('should initialize correctly when not in Tauri', async () => {
        const { isDesktop, isReady, init } = useTauri()

        expect(isDesktop.value).toBe(false)
        expect(isReady.value).toBe(false)

        await init()

        expect(isReady.value).toBe(true)
      })

      it('should initialize correctly in Tauri environment', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const { isDesktop, isReady, init } = useTauri()

        expect(isDesktop.value).toBe(true)
        expect(isReady.value).toBe(false)

        mockWindow.listen.mockResolvedValue(() => {})

        await init()

        expect(isReady.value).toBe(true)
        expect(mockGetCurrentWindow).toHaveBeenCalled()
        expect(mockWindow.listen).toHaveBeenCalledWith('tauri://focus', expect.any(Function))
        expect(mockWindow.listen).toHaveBeenCalledWith('tauri://blur', expect.any(Function))
        expect(mockWindow.listen).toHaveBeenCalledWith(
          'tauri://close-requested',
          expect.any(Function)
        )
      })

      it('should handle initialization errors gracefully', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        mockWindow.listen.mockRejectedValue(new Error('Failed to set up listeners'))

        const { isReady, init } = useTauri()

        await init()

        expect(isReady.value).toBe(true)
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to set up window listeners:',
          expect.any(Error)
        )

        consoleSpy.mockRestore()
      })

      it('should detect multiple monitors and mark the current one as primary', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}
        mockAvailableMonitors.mockResolvedValue([
          { position: { x: 0, y: 0 } },
          { position: { x: 1920, y: 0 } },
        ])

        const { screenInfo, init } = useTauri()

        await init()

        expect(screenInfo.value.isMultiScreen).toBe(true)
        expect(screenInfo.value.screenCount).toBe(2)
      })

      it('should warn and keep single-screen defaults when availableMonitors fails', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}
        mockAvailableMonitors.mockRejectedValue(new Error('monitors API not available'))
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const { screenInfo, init } = useTauri()

        await init()

        expect(screenInfo.value.isMultiScreen).toBe(false)
        expect(screenInfo.value.screenCount).toBe(1)
        expect(consoleSpy).toHaveBeenCalledWith(
          'availableMonitors API not available:',
          expect.any(Error)
        )

        consoleSpy.mockRestore()
      })
    })

    describe('Window Controls', () => {
      it('should toggle fullscreen', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const { toggleFullscreen } = useTauri()

        mockWindow.isFullscreen.mockResolvedValue(false)
        mockWindow.setFullscreen.mockResolvedValue(undefined)

        const result = await toggleFullscreen()

        expect(mockGetCurrentWindow).toHaveBeenCalled()
        expect(mockWindow.isFullscreen).toHaveBeenCalled()
        expect(mockWindow.setFullscreen).toHaveBeenCalledWith(true)
        expect(result).toBe(true)
      })

      it('should toggle fullscreen from true to false', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const { toggleFullscreen } = useTauri()

        mockWindow.isFullscreen.mockResolvedValue(true)
        mockWindow.setFullscreen.mockResolvedValue(undefined)

        const result = await toggleFullscreen()

        expect(mockWindow.setFullscreen).toHaveBeenCalledWith(false)
        expect(result).toBe(false)
      })

      it('should handle fullscreen toggle errors', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockWindow.isFullscreen.mockRejectedValue(new Error('Fullscreen error'))

        const { toggleFullscreen } = useTauri()

        const result = await toggleFullscreen()

        expect(result).toBe(false)
        expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle fullscreen:', expect.any(Error))

        consoleSpy.mockRestore()
      })

      it('should not toggle fullscreen when not in Tauri', async () => {
        const { toggleFullscreen } = useTauri()

        const result = await toggleFullscreen()

        expect(mockGetCurrentWindow).not.toHaveBeenCalled()
        expect(result).toBe(false)
      })

      it('should set always on top', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const { setAlwaysOnTop } = useTauri()

        mockWindow.setAlwaysOnTop.mockResolvedValue(undefined)

        await setAlwaysOnTop(true)

        expect(mockGetCurrentWindow).toHaveBeenCalled()
        expect(mockWindow.setAlwaysOnTop).toHaveBeenCalledWith(true)
      })

      it('should handle set always on top errors', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockWindow.setAlwaysOnTop.mockRejectedValue(new Error('Always on top error'))

        const { setAlwaysOnTop } = useTauri()

        await setAlwaysOnTop(true)

        expect(consoleSpy).toHaveBeenCalledWith('Failed to set always on top:', expect.any(Error))

        consoleSpy.mockRestore()
      })

      it('should minimize window via the Rust command when available', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}
        mockInvoke.mockResolvedValue(undefined)

        const { minimizeWindow } = useTauri()

        await minimizeWindow()

        expect(mockInvoke).toHaveBeenCalledWith('minimize_window')
        expect(mockGetCurrentWindow).not.toHaveBeenCalled()
      })

      it('should minimize window via the API fallback when the Rust command fails', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const { minimizeWindow } = useTauri()

        mockWindow.minimize.mockResolvedValue(undefined)

        await minimizeWindow()

        expect(mockGetCurrentWindow).toHaveBeenCalled()
        expect(mockWindow.minimize).toHaveBeenCalled()
      })

      it('should handle minimize window errors', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockWindow.minimize.mockRejectedValue(new Error('Minimize error'))

        const { minimizeWindow } = useTauri()

        await minimizeWindow()

        expect(consoleSpy).toHaveBeenCalledWith('Failed to minimize window:', expect.any(Error))

        consoleSpy.mockRestore()
      })

      it('should maximize window via the Rust command when available', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}
        mockInvoke.mockResolvedValue(true)

        const { maximizeWindow } = useTauri()

        const result = await maximizeWindow()

        expect(mockInvoke).toHaveBeenCalledWith('maximize_window')
        expect(mockGetCurrentWindow).not.toHaveBeenCalled()
        expect(result).toBe(true)
      })

      it('should maximize window when not maximized', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const { maximizeWindow } = useTauri()

        mockWindow.isMaximized.mockResolvedValue(false)
        mockWindow.maximize.mockResolvedValue(undefined)

        const result = await maximizeWindow()

        expect(mockGetCurrentWindow).toHaveBeenCalled()
        expect(mockWindow.isMaximized).toHaveBeenCalled()
        expect(mockWindow.maximize).toHaveBeenCalled()
        expect(result).toBe(true)
      })

      it('should unmaximize window when maximized', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const { maximizeWindow } = useTauri()

        mockWindow.isMaximized.mockResolvedValue(true)
        mockWindow.unmaximize.mockResolvedValue(undefined)

        const result = await maximizeWindow()

        expect(mockWindow.unmaximize).toHaveBeenCalled()
        expect(result).toBe(false)
      })

      it('should handle maximize window errors', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockWindow.isMaximized.mockRejectedValue(new Error('Maximize error'))

        const { maximizeWindow } = useTauri()

        const result = await maximizeWindow()

        expect(result).toBe(false)
        expect(consoleSpy).toHaveBeenCalledWith('Failed to toggle maximize:', expect.any(Error))

        consoleSpy.mockRestore()
      })

      it('should close window via the Rust command when available', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}
        mockInvoke.mockResolvedValue(undefined)

        const { closeWindow } = useTauri()

        await closeWindow()

        expect(mockInvoke).toHaveBeenCalledWith('close_window')
        expect(mockGetCurrentWindow).not.toHaveBeenCalled()
      })

      it('should close window via the API fallback when the Rust command fails', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const { closeWindow } = useTauri()

        mockWindow.close.mockResolvedValue(undefined)

        await closeWindow()

        expect(mockGetCurrentWindow).toHaveBeenCalled()
        expect(mockWindow.close).toHaveBeenCalled()
      })

      it('should handle close window errors', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        mockWindow.close.mockRejectedValue(new Error('Close error'))

        const { closeWindow } = useTauri()

        await closeWindow()

        expect(consoleSpy).toHaveBeenCalledWith('Failed to close window:', expect.any(Error))

        consoleSpy.mockRestore()
      })
    })

    describe('File Operations', () => {
      it('should save file native (placeholder)', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const { saveFileNative } = useTauri()

        await expect(saveFileNative()).rejects.toThrow('saveFileNative not yet implemented')
      })

      it('should save file native without filename', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const { saveFileNative } = useTauri()

        await expect(saveFileNative()).rejects.toThrow('saveFileNative not yet implemented')
      })

      it('should not save file when not in Tauri', async () => {
        const { saveFileNative } = useTauri()

        await expect(saveFileNative()).rejects.toThrow(
          'saveFileNative is only available in desktop mode'
        )
      })

      it('should open file native (placeholder)', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const { openFileNative } = useTauri()

        await expect(openFileNative()).rejects.toThrow('openFileNative not yet implemented')
      })

      it('should not open file when not in Tauri', async () => {
        const { openFileNative } = useTauri()

        await expect(openFileNative()).rejects.toThrow(
          'openFileNative is only available in desktop mode'
        )
      })
    })

    describe('Window Event Listeners', () => {
      it('should not set up listeners when not in Tauri', async () => {
        const { init } = useTauri()

        await init()

        expect(mockWindow.listen).not.toHaveBeenCalled()
      })

      it('should handle listener setup errors', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        mockWindow.listen.mockRejectedValue(new Error('Listener error'))

        const { init } = useTauri()

        await init()

        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to set up window listeners:',
          expect.any(Error)
        )

        consoleSpy.mockRestore()
      })

      it('should call focus listener callback', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        let focusCallback: Function

        mockWindow.listen.mockImplementation((event: string, callback: Function) => {
          if (event === 'tauri://focus') {
            focusCallback = callback
          }
          return Promise.resolve(() => {})
        })

        const { init } = useTauri()

        await init()

        // Simulate focus event
        focusCallback!()

        expect(consoleSpy).toHaveBeenCalledWith('Window focused')

        consoleSpy.mockRestore()
      })

      it('should call blur listener callback', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        let blurCallback: Function

        mockWindow.listen.mockImplementation((event: string, callback: Function) => {
          if (event === 'tauri://blur') {
            blurCallback = callback
          }
          return Promise.resolve(() => {})
        })

        const { init } = useTauri()

        await init()

        // Simulate blur event
        blurCallback!()

        expect(consoleSpy).toHaveBeenCalledWith('Window blurred')

        consoleSpy.mockRestore()
      })

      it('should call close-requested listener callback', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
        let closeCallback: Function

        mockWindow.listen.mockImplementation((event: string, callback: Function) => {
          if (event === 'tauri://close-requested') {
            closeCallback = callback
          }
          return Promise.resolve(() => {})
        })

        const { init } = useTauri()

        await init()

        // Simulate close requested event
        closeCallback!()

        expect(consoleSpy).toHaveBeenCalledWith('Close requested')

        consoleSpy.mockRestore()
      })
    })

    describe('updateFullscreenState', () => {
      it('should update the fullscreen ref from the window API', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}
        mockWindow.isFullscreen.mockResolvedValue(true)

        const { isFullscreen, updateFullscreenState } = useTauri()

        await updateFullscreenState()

        expect(isFullscreen.value).toBe(true)
      })

      it('should warn and leave state unchanged when the API call fails', async () => {
        ;(window as any).__TAURI_INTERNALS__ = {}
        mockWindow.isFullscreen.mockRejectedValue(new Error('not available'))
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const { isFullscreen, updateFullscreenState } = useTauri()

        await updateFullscreenState()

        expect(isFullscreen.value).toBe(false)
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to update fullscreen state:',
          expect.any(Error)
        )

        consoleSpy.mockRestore()
      })

      it('should do nothing when not in Tauri', async () => {
        const { updateFullscreenState } = useTauri()

        await updateFullscreenState()

        expect(mockGetCurrentWindow).not.toHaveBeenCalled()
      })
    })

    describe('Non-Tauri Environment Behavior', () => {
      it('should not perform window operations when not in Tauri', async () => {
        const { setAlwaysOnTop, minimizeWindow, maximizeWindow, closeWindow } = useTauri()

        await setAlwaysOnTop(true)
        await minimizeWindow()
        const maximizeResult = await maximizeWindow()
        await closeWindow()

        expect(mockGetCurrentWindow).not.toHaveBeenCalled()
        expect(maximizeResult).toBeUndefined()
      })
    })

    describe('Computed Properties', () => {
      it('should have reactive isDesktop computed property', () => {
        // Test without Tauri
        const { isDesktop } = useTauri()
        expect(isDesktop.value).toBe(false)

        // Test with Tauri
        ;(window as any).__TAURI_INTERNALS__ = {}
        const { isDesktop: desktopTauri } = useTauri()
        expect(desktopTauri.value).toBe(true)
      })

      it('should have reactive isReady ref', async () => {
        const { isReady, init } = useTauri()

        expect(isReady.value).toBe(false)

        await init()

        expect(isReady.value).toBe(true)
      })
    })
  })
})
