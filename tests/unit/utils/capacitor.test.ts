import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Keyboard } from '@capacitor/keyboard'
import {
  initMobileApp,
  vibrate,
  forceLandscape,
  allowAllOrientations,
  allowPortrait,
  getCurrentOrientation,
  isLandscape,
  isMobile,
  getPlatform
} from '@/utils/capacitor'

// Mock Capacitor modules
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn()
  }
}))

vi.mock('@capacitor/status-bar', () => ({
  StatusBar: {
    setStyle: vi.fn(),
    setBackgroundColor: vi.fn()
  },
  Style: {
    Dark: 'DARK',
    Light: 'LIGHT'
  }
}))

vi.mock('@capacitor/screen-orientation', () => ({
  ScreenOrientation: {
    lock: vi.fn(),
    unlock: vi.fn(),
    orientation: vi.fn(),
    addListener: vi.fn()
  },
  OrientationType: {
    LANDSCAPE: 'landscape'
  }
}))

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn()
  },
  ImpactStyle: {
    Heavy: 'HEAVY',
    Medium: 'MEDIUM',
    Light: 'LIGHT'
  }
}))

vi.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    addListener: vi.fn()
  }
}))

describe('Capacitor Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset console.warn mock
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    
    // Set up default mock return values
    vi.mocked(StatusBar.setStyle).mockResolvedValue()
    vi.mocked(StatusBar.setBackgroundColor).mockResolvedValue()
    vi.mocked(ScreenOrientation.lock).mockResolvedValue()
    vi.mocked(ScreenOrientation.unlock).mockResolvedValue()
    vi.mocked(ScreenOrientation.orientation).mockResolvedValue({ type: 'portrait-primary' } as any)
    vi.mocked(ScreenOrientation.addListener).mockResolvedValue({ remove: vi.fn() } as any)
    vi.mocked(Haptics.impact).mockResolvedValue()
    vi.mocked(Keyboard.addListener).mockResolvedValue({ remove: vi.fn() } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initMobileApp', () => {
    it('should return early if not on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

      await initMobileApp()

      expect(StatusBar.setStyle).not.toHaveBeenCalled()
      expect(ScreenOrientation.unlock).not.toHaveBeenCalled()
    })

    it('should configure mobile app when on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(StatusBar.setStyle).mockResolvedValue()
      vi.mocked(StatusBar.setBackgroundColor).mockResolvedValue()
      vi.mocked(ScreenOrientation.unlock).mockResolvedValue()
      vi.mocked(ScreenOrientation.addListener).mockResolvedValue({ remove: vi.fn() })
      vi.mocked(Keyboard.addListener).mockResolvedValue({ remove: vi.fn() })

      await initMobileApp()

      expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: Style.Dark })
      expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: '#1E1E1E' })
      expect(ScreenOrientation.unlock).toHaveBeenCalled()
      expect(ScreenOrientation.addListener).toHaveBeenCalledWith('screenOrientationChange', expect.any(Function))
      expect(Keyboard.addListener).toHaveBeenCalledWith('keyboardWillShow', expect.any(Function))
      expect(Keyboard.addListener).toHaveBeenCalledWith('keyboardWillHide', expect.any(Function))
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(StatusBar.setStyle).mockRejectedValue(new Error('Status bar error'))

      await initMobileApp()

      expect(console.warn).toHaveBeenCalledWith('Mobile initialization failed:', expect.any(Error))
    })

    it('should handle orientation change listener', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(StatusBar.setStyle).mockResolvedValue()
      vi.mocked(StatusBar.setBackgroundColor).mockResolvedValue()
      vi.mocked(ScreenOrientation.unlock).mockResolvedValue()
      
      let orientationCallback: any
      vi.mocked(ScreenOrientation.addListener).mockImplementation((event, callback) => {
        if (event === 'screenOrientationChange') {
          orientationCallback = callback
        }
        return Promise.resolve({ remove: vi.fn() })
      })
      vi.mocked(Keyboard.addListener).mockResolvedValue({ remove: vi.fn() })

      // Mock window.dispatchEvent
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true)

      await initMobileApp()

      // Trigger orientation change
      orientationCallback({ type: 'landscape-primary' })

      expect(console.log).toHaveBeenCalledWith('Orientation changed:', { type: 'landscape-primary' })
      expect(dispatchEventSpy).toHaveBeenCalledWith(new Event('resize'))

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150))
      expect(dispatchEventSpy).toHaveBeenCalledWith(new Event('orientationchange'))
    })

    it('should handle keyboard listeners', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(StatusBar.setStyle).mockResolvedValue()
      vi.mocked(StatusBar.setBackgroundColor).mockResolvedValue()
      vi.mocked(ScreenOrientation.unlock).mockResolvedValue()
      vi.mocked(ScreenOrientation.addListener).mockResolvedValue({ remove: vi.fn() })
      
      let keyboardShowCallback: any
      let keyboardHideCallback: any
      vi.mocked(Keyboard.addListener).mockImplementation((event: any, callback: any) => {
        if (event === 'keyboardWillShow') {
          keyboardShowCallback = callback
        } else if (event === 'keyboardWillHide') {
          keyboardHideCallback = callback
        }
        return Promise.resolve({ remove: vi.fn() })
      })

      await initMobileApp()

      // Test keyboard show
      keyboardShowCallback()
      expect(document.body.classList.contains('keyboard-open')).toBe(true)

      // Test keyboard hide
      keyboardHideCallback()
      expect(document.body.classList.contains('keyboard-open')).toBe(false)
    })
  })

  describe('vibrate', () => {
    it('should return early if not on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

      await vibrate()

      expect(Haptics.impact).not.toHaveBeenCalled()
    })

    it('should trigger haptic feedback with default style', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Haptics.impact).mockResolvedValue()

      await vibrate()

      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Light })
    })

    it('should trigger haptic feedback with custom style', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Haptics.impact).mockResolvedValue()

      await vibrate(ImpactStyle.Heavy)

      expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Heavy })
    })

    it('should handle haptic errors gracefully', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(Haptics.impact).mockRejectedValue(new Error('Haptic error'))

      await vibrate()

      expect(console.warn).toHaveBeenCalledWith('Haptic feedback failed:', expect.any(Error))
    })
  })

  describe('forceLandscape', () => {
    it('should return early if not on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

      await forceLandscape()

      expect(ScreenOrientation.lock).not.toHaveBeenCalled()
    })

    it('should lock to landscape orientation', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(ScreenOrientation.lock).mockResolvedValue()

      await forceLandscape()

      expect(ScreenOrientation.lock).toHaveBeenCalledWith({ orientation: 'landscape' })
    })

    it('should handle orientation lock errors', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(ScreenOrientation.lock).mockRejectedValue(new Error('Lock error'))

      await forceLandscape()

      expect(console.warn).toHaveBeenCalledWith('Screen orientation lock failed:', expect.any(Error))
    })
  })

  describe('allowAllOrientations', () => {
    it('should return early if not on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

      await allowAllOrientations()

      expect(ScreenOrientation.unlock).not.toHaveBeenCalled()
    })

    it('should unlock screen orientation', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(ScreenOrientation.unlock).mockResolvedValue()

      await allowAllOrientations()

      expect(ScreenOrientation.unlock).toHaveBeenCalled()
    })

    it('should handle unlock errors', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(ScreenOrientation.unlock).mockRejectedValue(new Error('Unlock error'))

      await allowAllOrientations()

      expect(console.warn).toHaveBeenCalledWith('Screen orientation unlock failed:', expect.any(Error))
    })
  })

  describe('allowPortrait', () => {
    it('should return early if not on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

      await allowPortrait()

      expect(ScreenOrientation.unlock).not.toHaveBeenCalled()
    })

    it('should unlock screen orientation for portrait', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(ScreenOrientation.unlock).mockResolvedValue()

      await allowPortrait()

      expect(ScreenOrientation.unlock).toHaveBeenCalled()
    })
  })

  describe('getCurrentOrientation', () => {
    it('should return web-based orientation if not on native platform', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
      
      // Mock window dimensions for landscape
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })

      const result = await getCurrentOrientation()

      expect(result).toBe('landscape')
    })

    it('should return portrait for web when height > width', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
      
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true })

      const result = await getCurrentOrientation()

      expect(result).toBe('portrait')
    })

    it('should get orientation from native API', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(ScreenOrientation.orientation).mockResolvedValue({ 
        type: 'landscape-primary' as any
      })

      const result = await getCurrentOrientation()

      expect(result).toBe('landscape')
      expect(ScreenOrientation.orientation).toHaveBeenCalled()
    })

    it('should return portrait for native portrait orientation', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(ScreenOrientation.orientation).mockResolvedValue({ 
        type: 'portrait-primary' as any
      })

      const result = await getCurrentOrientation()

      expect(result).toBe('portrait')
    })

    it('should fallback to web orientation on native error', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
      vi.mocked(ScreenOrientation.orientation).mockRejectedValue(new Error('Orientation error'))
      
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })

      const result = await getCurrentOrientation()

      expect(result).toBe('landscape')
      expect(console.warn).toHaveBeenCalledWith('Failed to get orientation:', expect.any(Error))
    })
  })

  describe('isLandscape', () => {
    it('should return true for landscape orientation', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 768, writable: true })

      const result = await isLandscape()

      expect(result).toBe(true)
    })

    it('should return false for portrait orientation', async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true })
      Object.defineProperty(window, 'innerHeight', { value: 1024, writable: true })

      const result = await isLandscape()

      expect(result).toBe(false)
    })
  })

  describe('isMobile', () => {
    it('should return true when on native platform', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)

      const result = isMobile()

      expect(result).toBe(true)
    })

    it('should return false when not on native platform', () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

      const result = isMobile()

      expect(result).toBe(false)
    })
  })

  describe('getPlatform', () => {
    it('should return platform from Capacitor', () => {
      vi.mocked(Capacitor.getPlatform).mockReturnValue('android')

      const result = getPlatform()

      expect(result).toBe('android')
      expect(Capacitor.getPlatform).toHaveBeenCalled()
    })
  })
})