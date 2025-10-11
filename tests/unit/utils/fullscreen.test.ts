import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFullscreen, detectPlatform } from '@/utils/fullscreen'
import { ref, computed } from 'vue'

// Mock platform detection
vi.mock('@/utils/tauri', () => ({
  isTauri: vi.fn(() => false),
  useTauri: vi.fn(() => ({
    isDesktop: computed(() => false),
    isFullscreen: ref(false),
    screenInfo: ref({
      isPrimary: true,
      isMultiScreen: false,
      screenCount: 1,
      currentMonitor: null,
      allMonitors: [],
    }),
    init: vi.fn(),
    toggleFullscreen: vi.fn(),
  })),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
    getPlatform: vi.fn(() => 'web'),
  },
}))

vi.mock('@/utils/webFullscreen', () => ({
  useWebFullscreen: vi.fn(() => ({
    isFullscreen: ref(false),
    isSupported: ref(true),
    screenInfo: ref({
      isPrimary: true,
      isMultiScreen: false,
      screenCount: 1,
    }),
    toggleFullscreen: vi.fn().mockResolvedValue(true),
    enterFullscreen: vi.fn().mockResolvedValue(true),
    exitFullscreen: vi.fn().mockResolvedValue(false),
  })),
}))

vi.mock('@/utils/immersiveMode', () => ({
  useImmersiveMode: vi.fn(() => ({
    isImmersive: ref(false),
    isSupported: ref(false),
    screenInfo: ref({
      isPrimary: true,
      isMultiScreen: false,
      screenCount: 1,
    }),
    enableImmersiveMode: vi.fn(),
    disableImmersiveMode: vi.fn(),
    toggleImmersiveMode: vi.fn(),
  })),
}))

describe('Unified Fullscreen Utils', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Reset all platform mocks to web defaults
    const { isTauri } = await import('@/utils/tauri')
    const { Capacitor } = await import('@capacitor/core')
    
    vi.mocked(isTauri).mockReturnValue(false)
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
    vi.mocked(Capacitor.getPlatform).mockReturnValue('web')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('detectPlatform', () => {
    it('should detect web platform by default', () => {
      expect(detectPlatform()).toBe('web')
    })

    it('should detect desktop platform when Tauri is available', async () => {
      const { isTauri } = await import('@/utils/tauri')
      vi.mocked(isTauri).mockReturnValue(true)

      expect(detectPlatform()).toBe('desktop')
    })

    it('should detect Android platform when Capacitor is on Android', async () => {
      // Reset mocks first
      vi.clearAllMocks()
      
      const { Capacitor } = await import('@capacitor/core')
      const { isTauri } = await import('@/utils/tauri')
      
      // Ensure Tauri is false (web/mobile)
      vi.mocked(isTauri).mockReturnValue(false)
      // Set up Android
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')

      expect(detectPlatform()).toBe('android')
    })
  })

  describe('useFullscreen', () => {
    it('should initialize with correct default state for web', async () => {
      const { useWebFullscreen } = await import('@/utils/webFullscreen')
      vi.mocked(useWebFullscreen).mockReturnValue({
        isFullscreen: ref(false),
        isSupported: ref(true),
        screenInfo: ref({
          isPrimary: true,
          isMultiScreen: false,
          screenCount: 1,
        }),
        toggleFullscreen: vi.fn().mockResolvedValue(true),
        enterFullscreen: vi.fn().mockResolvedValue(true),
        exitFullscreen: vi.fn().mockResolvedValue(false),
      })
      
      const { isFullscreen, platform } = useFullscreen()

      expect(isFullscreen.value).toBe(false)
      expect(platform.value).toBe('web')
    })

    it('should use web fullscreen implementation on web platform', async () => {
      const mockToggle = vi.fn().mockResolvedValue(true)
      const { useWebFullscreen } = await import('@/utils/webFullscreen')
      vi.mocked(useWebFullscreen).mockReturnValue({
        isFullscreen: ref(false),
        isSupported: ref(true),
        screenInfo: ref({
          isPrimary: true,
          isMultiScreen: false,
          screenCount: 1,
        }),
        toggleFullscreen: mockToggle,
        enterFullscreen: vi.fn().mockResolvedValue(true),
        exitFullscreen: vi.fn().mockResolvedValue(false),
      })

      const { platform } = useFullscreen()
      
      expect(platform.value).toBe('web')
      expect(mockToggle).toBeDefined()
    })

    it('should use Android immersive mode on Android platform', async () => {
      vi.clearAllMocks()
      
      // Mock Android platform
      const { Capacitor } = await import('@capacitor/core')
      const { isTauri } = await import('@/utils/tauri')
      
      vi.mocked(isTauri).mockReturnValue(false)
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')

      const mockToggleImmersive = vi.fn().mockResolvedValue(true)
      const { useImmersiveMode } = await import('@/utils/immersiveMode')
      vi.mocked(useImmersiveMode).mockReturnValue({
        isImmersive: ref(false),
        isSupported: ref(true),
        screenInfo: ref({
          isPrimary: true,
          isMultiScreen: false,
          screenCount: 1,
        }),
        enableImmersiveMode: vi.fn(),
        disableImmersiveMode: vi.fn(),
        toggleImmersiveMode: mockToggleImmersive,
      })

      const { toggleFullscreen } = useFullscreen()
      
      await toggleFullscreen()

      expect(mockToggleImmersive).toHaveBeenCalled()
    })

    it('should use Tauri fullscreen on desktop platform', async () => {
      // Mock desktop platform
      const { isTauri, useTauri } = await import('@/utils/tauri')
      vi.mocked(isTauri).mockReturnValue(true)
      
      const mockTauri = vi.mocked(useTauri).mockReturnValue({
        isDesktop: computed(() => true),
        isFullscreen: ref(false),
        screenInfo: ref({
          isPrimary: true,
          isMultiScreen: false,
          screenCount: 1,
          currentMonitor: null,
          allMonitors: [],
        }),
        isReady: ref(true),
        init: vi.fn(),
        toggleFullscreen: vi.fn().mockResolvedValue(true),
        updateFullscreenState: vi.fn(),
        setAlwaysOnTop: vi.fn(),
        minimizeWindow: vi.fn(),
        maximizeWindow: vi.fn(),
        closeWindow: vi.fn(),
        saveFileNative: vi.fn(),
        openFileNative: vi.fn(),
      })

      const { toggleFullscreen } = useFullscreen()
      
      const result = await toggleFullscreen()

      expect(result).toBe(true)
      expect(mockTauri().toggleFullscreen).toHaveBeenCalled()
    })

    it('should handle unsupported platform gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const { useWebFullscreen } = await import('@/utils/webFullscreen')
      vi.mocked(useWebFullscreen).mockReturnValue({
        isFullscreen: ref(false),
        isSupported: ref(false),
        screenInfo: ref({
          isPrimary: true,
          isMultiScreen: false,
          screenCount: 1,
        }),
        toggleFullscreen: vi.fn().mockResolvedValue(false),
        enterFullscreen: vi.fn().mockResolvedValue(false),
        exitFullscreen: vi.fn().mockResolvedValue(false),
      })

      const { platform } = useFullscreen()
      
      expect(platform.value).toBe('web')
      
      consoleWarnSpy.mockRestore()
    })

    it('should handle toggle fullscreen errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const { useWebFullscreen } = await import('@/utils/webFullscreen')
      const mockToggle = vi.fn().mockRejectedValue(new Error('Fullscreen failed'))
      vi.mocked(useWebFullscreen).mockReturnValue({
        isFullscreen: ref(false),
        isSupported: ref(true),
        screenInfo: ref({
          isPrimary: true,
          isMultiScreen: false,
          screenCount: 1,
        }),
        toggleFullscreen: mockToggle,
        enterFullscreen: vi.fn(),
        exitFullscreen: vi.fn(),
      })

      const { platform } = useFullscreen()
      
      expect(platform.value).toBe('web')
      expect(mockToggle).toBeDefined()

      consoleErrorSpy.mockRestore()
    })

    it('should enter fullscreen successfully', async () => {
      const mockEnter = vi.fn().mockResolvedValue(true)
      const { useWebFullscreen } = await import('@/utils/webFullscreen')
      vi.mocked(useWebFullscreen).mockReturnValue({
        isFullscreen: ref(false),
        isSupported: ref(true),
        screenInfo: ref({
          isPrimary: true,
          isMultiScreen: false,
          screenCount: 1,
        }),
        toggleFullscreen: vi.fn(),
        enterFullscreen: mockEnter,
        exitFullscreen: vi.fn(),
      })

      const { platform } = useFullscreen()
      
      expect(platform.value).toBe('web')
      expect(mockEnter).toBeDefined()
    })

    it('should exit fullscreen successfully', async () => {
      const mockExit = vi.fn().mockResolvedValue(false)
      const { useWebFullscreen } = await import('@/utils/webFullscreen')
      vi.mocked(useWebFullscreen).mockReturnValue({
        isFullscreen: ref(true),
        isSupported: ref(true),
        screenInfo: ref({
          isPrimary: true,
          isMultiScreen: false,
          screenCount: 1,
        }),
        toggleFullscreen: vi.fn(),
        enterFullscreen: vi.fn(),
        exitFullscreen: mockExit,
      })

      const { platform, isFullscreen } = useFullscreen()
      
      expect(platform.value).toBe('web')
      expect(isFullscreen.value).toBe(true)
      expect(mockExit).toBeDefined()
    })

    it('should not enter fullscreen when already in fullscreen', async () => {
      const { useWebFullscreen } = await import('@/utils/webFullscreen')
      const mockWebFullscreen = vi.mocked(useWebFullscreen).mockReturnValue({
        isFullscreen: ref(true), // Already in fullscreen
        isSupported: ref(true),
        screenInfo: ref({
          isPrimary: true,
          isMultiScreen: false,
          screenCount: 1,
        }),
        toggleFullscreen: vi.fn(),
        enterFullscreen: vi.fn(),
        exitFullscreen: vi.fn(),
      })

      const { enterFullscreen, isFullscreen } = useFullscreen()
      
      const result = await enterFullscreen()

      expect(result).toBe(true) // Returns current state
      expect(mockWebFullscreen().enterFullscreen).not.toHaveBeenCalled()
    })

    it('should not exit fullscreen when not in fullscreen', async () => {
      const { useWebFullscreen } = await import('@/utils/webFullscreen')
      const mockWebFullscreen = vi.mocked(useWebFullscreen).mockReturnValue({
        isFullscreen: ref(false), // Not in fullscreen
        isSupported: ref(true),
        screenInfo: ref({
          isPrimary: true,
          isMultiScreen: false,
          screenCount: 1,
        }),
        toggleFullscreen: vi.fn(),
        enterFullscreen: vi.fn(),
        exitFullscreen: vi.fn(),
      })

      const { exitFullscreen, isFullscreen } = useFullscreen()
      
      const result = await exitFullscreen()

      expect(result).toBe(false) // Returns current state
      expect(mockWebFullscreen().exitFullscreen).not.toHaveBeenCalled()
    })

    it('should provide access to platform-specific composables', () => {
      const { webFullscreen, androidImmersive, tauriDesktop } = useFullscreen()

      expect(webFullscreen).toBeDefined()
      expect(androidImmersive).toBeDefined()
      expect(tauriDesktop).toBeDefined()
    })

    it('should forward options to web fullscreen composable', async () => {
      vi.clearAllMocks()
      
      const customElement = document.createElement('div')
      const options = {
        element: customElement,
        autoDetectPrimaryScreen: false,
      }

      const { useWebFullscreen } = await import('@/utils/webFullscreen')
      
      useFullscreen(options)

      expect(useWebFullscreen).toHaveBeenCalledWith(options)
    })
  })
})