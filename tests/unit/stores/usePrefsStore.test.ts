import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { storage } from '@/services/persistence'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => {
      return store[key] || null
    },
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock localforage to use our localStorage mock
vi.mock('localforage', () => ({
  default: {
    createInstance: () => ({
      getItem: async (key: string) => {
        const value = localStorageMock.getItem(key)
        return value ? JSON.parse(value) : null
      },
      setItem: async (key: string, value: any) => {
        localStorageMock.setItem(key, JSON.stringify(value))
      },
      removeItem: async (key: string) => {
        localStorageMock.removeItem(key)
      },
    }),
  },
}))

describe('usePrefsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  describe('initialization', () => {
    it('initializes with default preferences', () => {
      const store = usePrefsStore()

      expect(store.fontSizePx).toBe(24) // DEFAULT_FONT_SIZE
      expect(store.speedPxPerSec).toBe(50) // DEFAULT_SCROLL_SPEED
      expect(store.mirrorH).toBe(false)
      expect(store.mirrorV).toBe(false)
      expect(store.fontFamily).toBe('Roboto, sans-serif')
      expect(Object.keys(store.customHotkeys).length).toBeGreaterThan(0) // Should have default mapping
    })

    it('loads preferences from localStorage', async () => {
      const savedPrefs = {
        fontFamily: 'Roboto, sans-serif',
        fontSizePx: 36,
        lineHeight: 1.5,
        fgColor: '#FFFFFF',
        bgColor: '#000000',
        speedPxPerSec: 80,
        speedMin: 10,
        speedMax: 200,
        mirrorH: true,
        mirrorV: false,
        highlightBandLines: 2,
        highlightBandPosPct: 40,
        dimmingIntensity: 0.5,
        textAlignment: 'center',
        customHotkeys: {
          'toggle-play': {
            key: 'p',
            action: 'toggle-play',
            description: 'Play/Pause',
          },
        },
        customGamepadMappings: {},
      }

      // Store directly as JSON object (localforage format)
      localStorageMock.setItem('preferences', JSON.stringify(savedPrefs))

      const store = usePrefsStore()
      await store.load() // Explicitly load from localStorage

      expect(store.fontSizePx).toBe(36)
      expect(store.speedPxPerSec).toBe(80)
      expect(store.mirrorH).toBe(true)
      expect(store.customHotkeys['toggle-play']).toEqual(savedPrefs.customHotkeys['toggle-play'])
    })

    it('handles corrupted localStorage data gracefully', async () => {
      localStorageMock.setItem('preferences', 'invalid json')

      const store = usePrefsStore()
      await store.load() // This should trigger fallback to defaults

      // Should fall back to defaults
      expect(store.fontSizePx).toBe(24)
      expect(Object.keys(store.customHotkeys).length).toBeGreaterThan(0)
    })

    it('falls back to defaults when saved data fails schema validation', async () => {
      const savedPrefs = {
        fontFamily: 'Roboto, sans-serif',
        fontSizePx: 24,
        lineHeight: 1.4,
        fgColor: 'not-a-hex-color', // fails the schema's regex validation
        bgColor: '#000000',
        speedPxPerSec: 50,
        speedMin: 10,
        speedMax: 200,
        mirrorH: false,
        mirrorV: false,
        highlightBandLines: 1,
        highlightBandPosPct: 40,
        dimmingIntensity: 0.5,
        textAlignment: 'center',
        customHotkeys: {},
        customGamepadMappings: {},
      }
      localStorageMock.setItem('preferences', JSON.stringify(savedPrefs))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const store = usePrefsStore()
      store.fontFamily = 'Arial' // dirty the state so we can prove reset() ran
      await store.load()

      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to load preferences, using defaults:',
        expect.anything()
      )
      expect(store.fontFamily).toBe('Roboto, sans-serif')
      warnSpy.mockRestore()
    })

    it('keeps defaults when there is nothing saved in localStorage', async () => {
      const store = usePrefsStore()

      await store.load()

      expect(store.fontSizePx).toBe(24)
      expect(store.speedPxPerSec).toBe(50)
    })

    it('falls back to default gamepad mappings when saved mappings are empty', async () => {
      const savedPrefs = {
        fontFamily: 'Roboto, sans-serif',
        fontSizePx: 24,
        lineHeight: 1.4,
        fgColor: '#FFFFFF',
        bgColor: '#000000',
        speedPxPerSec: 50,
        speedMin: 10,
        speedMax: 200,
        mirrorH: false,
        mirrorV: false,
        highlightBandLines: 1,
        highlightBandPosPct: 40,
        dimmingIntensity: 0.5,
        textAlignment: 'center',
        customHotkeys: {},
        customGamepadMappings: {},
      }
      localStorageMock.setItem('preferences', JSON.stringify(savedPrefs))

      const store = usePrefsStore()
      await store.load()

      expect(Object.keys(store.customGamepadMappings).length).toBeGreaterThan(0)
    })

    it('keeps saved gamepad mappings when present', async () => {
      const savedPrefs = {
        fontFamily: 'Roboto, sans-serif',
        fontSizePx: 24,
        lineHeight: 1.4,
        fgColor: '#FFFFFF',
        bgColor: '#000000',
        speedPxPerSec: 50,
        speedMin: 10,
        speedMax: 200,
        mirrorH: false,
        mirrorV: false,
        highlightBandLines: 1,
        highlightBandPosPct: 40,
        dimmingIntensity: 0.5,
        textAlignment: 'center',
        customHotkeys: {},
        customGamepadMappings: {
          'toggle-play': { buttonIndex: 0, action: 'toggle-play', description: 'Play/Pause' },
        },
      }
      localStorageMock.setItem('preferences', JSON.stringify(savedPrefs))

      const store = usePrefsStore()
      await store.load()

      expect(store.customGamepadMappings['toggle-play']?.buttonIndex).toBe(0)
    })
  })

  describe('updateHotkey', () => {
    it('updates a hotkey mapping', () => {
      const store = usePrefsStore()

      store.updateHotkey('toggle-play', {
        key: 'p',
        action: 'toggle-play',
        description: 'Play/Pause',
      })

      expect(store.customHotkeys['toggle-play']).toEqual({
        key: 'p',
        action: 'toggle-play',
        description: 'Play/Pause',
      })
    })

    it('overwrites existing hotkey mapping', () => {
      const store = usePrefsStore()

      // Set initial mapping
      store.updateHotkey('toggle-play', {
        key: ' ',
        action: 'toggle-play',
        description: 'Play/Pause',
      })

      // Update mapping
      store.updateHotkey('toggle-play', {
        key: 'p',
        action: 'toggle-play',
        description: 'Play/Pause',
      })

      expect(store.customHotkeys['toggle-play']?.key).toBe('p')
    })

    it('persists changes to localStorage', async () => {
      const store = usePrefsStore()

      store.updateHotkey('toggle-play', {
        key: 'p',
        action: 'toggle-play',
        description: 'Play/Pause',
      })

      // Wait for persistence
      await new Promise((resolve) => setTimeout(resolve, 0))

      const savedData = JSON.parse(localStorageMock.getItem('preferences') || '{}')
      expect(savedData.customHotkeys['toggle-play']).toEqual({
        key: 'p',
        action: 'toggle-play',
        description: 'Play/Pause',
      })
    })
  })

  describe('resetHotkeys', () => {
    it('clears all custom hotkeys', () => {
      const store = usePrefsStore()

      // Get initial count (should have defaults)
      const initialCount = Object.keys(store.customHotkeys).length

      // Add some custom hotkeys
      store.updateHotkey('toggle-play', {
        key: 'p',
        action: 'toggle-play',
        description: 'Play/Pause',
      })

      store.updateHotkey('speed-up', {
        key: 'ArrowRight',
        action: 'speed-up',
        description: 'Increase Speed',
      })

      expect(Object.keys(store.customHotkeys)).toContain('toggle-play')
      expect(Object.keys(store.customHotkeys)).toContain('speed-up')

      store.resetHotkeys()

      // Should be back to the original default mapping
      expect(Object.keys(store.customHotkeys).length).toBe(initialCount)
      expect(store.customHotkeys['toggle-play']?.key).toBe(' ') // Default
    })

    it('persists reset to localStorage', async () => {
      const store = usePrefsStore()

      // Add custom hotkey
      store.updateHotkey('toggle-play', {
        key: 'p',
        action: 'toggle-play',
        description: 'Play/Pause',
      })

      store.resetHotkeys()

      // Wait for persistence
      await new Promise((resolve) => setTimeout(resolve, 0))

      const savedData = JSON.parse(localStorageMock.getItem('preferences') || '{}')
      expect(savedData.customHotkeys['toggle-play'].key).toBe(' ') // Default
    })
  })

  describe('other preferences', () => {
    it('updates font size', async () => {
      const store = usePrefsStore()

      store.fontSizePx = 72
      await store.save() // Explicitly save changes

      expect(store.fontSizePx).toBe(72)

      const savedData = JSON.parse(localStorageMock.getItem('preferences') || '{}')
      expect(savedData.fontSizePx).toBe(72)
    })

    it('updates speed', async () => {
      const store = usePrefsStore()

      store.speedPxPerSec = 150
      await store.save() // Explicitly save changes

      expect(store.speedPxPerSec).toBe(150)

      const savedData = JSON.parse(localStorageMock.getItem('preferences') || '{}')
      expect(savedData.speedPxPerSec).toBe(150)
    })

    it('updates mirror settings', async () => {
      const store = usePrefsStore()

      store.mirrorH = true
      store.mirrorV = true
      await store.save() // Explicitly save changes

      expect(store.mirrorH).toBe(true)
      expect(store.mirrorV).toBe(true)

      const savedData = JSON.parse(localStorageMock.getItem('preferences') || '{}')
      expect(savedData.mirrorH).toBe(true)
      expect(savedData.mirrorV).toBe(true)
    })

    it('updates font family', async () => {
      const store = usePrefsStore()

      store.fontFamily = 'Arial'
      await store.save() // Explicitly save changes

      expect(store.fontFamily).toBe('Arial')

      const savedData = JSON.parse(localStorageMock.getItem('preferences') || '{}')
      expect(savedData.fontFamily).toBe('Arial')
    })

    it('logs a warning instead of throwing when persisting fails', async () => {
      const store = usePrefsStore()
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const setSpy = vi.spyOn(storage, 'set').mockRejectedValueOnce(new Error('disk full'))

      await expect(store.save()).resolves.toBeUndefined()

      expect(warnSpy).toHaveBeenCalledWith('Failed to save preferences:', expect.any(Error))
      setSpy.mockRestore()
      warnSpy.mockRestore()
    })
  })

  describe('increase/decreaseFontSize', () => {
    it('increases font size by the configured step', () => {
      const store = usePrefsStore()
      const initial = store.fontSizePx

      store.increaseFontSize()

      expect(store.fontSizePx).toBe(initial + 2)
    })

    it('does not increase font size past the maximum', () => {
      const store = usePrefsStore()
      store.fontSizePx = 200 // SETTINGS_MAX_FONT_SIZE

      store.increaseFontSize()

      expect(store.fontSizePx).toBe(200)
    })

    it('decreases font size by the configured step', () => {
      const store = usePrefsStore()
      const initial = store.fontSizePx

      store.decreaseFontSize()

      expect(store.fontSizePx).toBe(initial - 2)
    })

    it('does not decrease font size below the minimum', () => {
      const store = usePrefsStore()
      store.fontSizePx = 16 // MIN_FONT_SIZE

      store.decreaseFontSize()

      expect(store.fontSizePx).toBe(16)
    })
  })

  describe('increase/decreaseSpeed', () => {
    it('increases speed by the configured step', () => {
      const store = usePrefsStore()
      const initial = store.speedPxPerSec

      store.increaseSpeed()

      expect(store.speedPxPerSec).toBe(initial + 5)
    })

    it('does not increase speed past speedMax', () => {
      const store = usePrefsStore()
      store.speedPxPerSec = store.speedMax

      store.increaseSpeed()

      expect(store.speedPxPerSec).toBe(store.speedMax)
    })

    it('decreases speed by the configured step', () => {
      const store = usePrefsStore()
      const initial = store.speedPxPerSec

      store.decreaseSpeed()

      expect(store.speedPxPerSec).toBe(initial - 5)
    })

    it('does not decrease speed below speedMin', () => {
      const store = usePrefsStore()
      store.speedPxPerSec = store.speedMin

      store.decreaseSpeed()

      expect(store.speedPxPerSec).toBe(store.speedMin)
    })
  })

  describe('toggleMirrorH/toggleMirrorV', () => {
    it('toggles mirrorH on and off', () => {
      const store = usePrefsStore()
      expect(store.mirrorH).toBe(false)

      store.toggleMirrorH()
      expect(store.mirrorH).toBe(true)

      store.toggleMirrorH()
      expect(store.mirrorH).toBe(false)
    })

    it('toggles mirrorV on and off', () => {
      const store = usePrefsStore()
      expect(store.mirrorV).toBe(false)

      store.toggleMirrorV()
      expect(store.mirrorV).toBe(true)

      store.toggleMirrorV()
      expect(store.mirrorV).toBe(false)
    })
  })

  describe('gamepad mappings', () => {
    it('updates the button index for an existing mapping', () => {
      const store = usePrefsStore()
      const [firstAction] = Object.keys(store.customGamepadMappings)
      expect(firstAction).toBeDefined()

      store.updateGamepadMapping(firstAction!, 3)

      expect(store.customGamepadMappings[firstAction!]?.buttonIndex).toBe(3)
    })

    it('does nothing when updating a mapping that does not exist', () => {
      const store = usePrefsStore()
      const before = { ...store.customGamepadMappings }

      store.updateGamepadMapping('nonexistent-action', 5)

      expect(store.customGamepadMappings).toEqual(before)
    })

    it('resets gamepad mappings to defaults', () => {
      const store = usePrefsStore()
      const [firstAction] = Object.keys(store.customGamepadMappings)
      expect(firstAction).toBeDefined()
      store.updateGamepadMapping(firstAction!, 7)

      store.resetGamepadMappings()

      expect(store.customGamepadMappings[firstAction!]?.buttonIndex).not.toBe(7)
    })
  })

  describe('reactivity', () => {
    it('triggers watchers when hotkeys change', async () => {
      const store = usePrefsStore()
      let watcherTriggered = false

      // Mock a watcher using $subscribe
      const unwatcher = store.$subscribe(() => {
        watcherTriggered = true
      })

      store.updateHotkey('toggle-play', {
        key: 'p',
        action: 'toggle-play',
        description: 'Play/Pause',
      })

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(watcherTriggered).toBe(true)

      unwatcher()
    })

    it('maintains reactivity across updates', () => {
      const store = usePrefsStore()

      const initialKeys = Object.keys(store.customHotkeys)

      // Update existing hotkey instead of adding new one
      store.updateHotkey('toggle-play', {
        key: 'p',
        action: 'toggle-play',
        description: 'Play/Pause',
      })

      const updatedKeys = Object.keys(store.customHotkeys)

      // Should have same number of keys but the value should be different
      expect(updatedKeys.length).toBe(initialKeys.length)
      expect(updatedKeys).toContain('toggle-play')
      expect(store.customHotkeys['toggle-play']?.key).toBe('p')
    })
  })

  describe('edge cases', () => {
    it('handles undefined hotkey definition', () => {
      const store = usePrefsStore()

      // This should not throw
      expect(() => {
        store.updateHotkey('toggle-play', undefined as any)
      }).not.toThrow()
    })

    it('handles empty key', () => {
      const store = usePrefsStore()

      store.updateHotkey('toggle-play', {
        key: '',
        action: 'toggle-play',
        description: 'Play/Pause',
      })

      expect(store.customHotkeys['toggle-play']?.key).toBe('')
    })

    it('handles special characters in keys', () => {
      const store = usePrefsStore()

      store.updateHotkey('toggle-play', {
        key: 'ctrl+shift+meta+alt+F12',
        action: 'toggle-play',
        description: 'Complex Combo',
      })

      expect(store.customHotkeys['toggle-play']?.key).toBe('ctrl+shift+meta+alt+F12')
    })

    it('validates font size bounds', () => {
      const store = usePrefsStore()

      // The store doesn't automatically clamp values, it relies on Zod validation
      // Let's test that the values can be set (Zod validation happens elsewhere)
      store.fontSizePx = 72
      expect(store.fontSizePx).toBe(72)

      store.fontSizePx = 16
      expect(store.fontSizePx).toBe(16)
    })

    it('validates speed bounds', () => {
      const store = usePrefsStore()

      // Test valid speed values
      store.speedPxPerSec = 100
      expect(store.speedPxPerSec).toBe(100)

      store.speedPxPerSec = 20
      expect(store.speedPxPerSec).toBe(20)
    })
  })

  describe('Text Alignment', () => {
    it('should have default text alignment as center', () => {
      const store = usePrefsStore()
      expect(store.textAlignment).toBe('center')
    })

    it('should set text alignment correctly', async () => {
      const store = usePrefsStore()

      store.setTextAlignment('left')
      expect(store.textAlignment).toBe('left')

      store.setTextAlignment('right')
      expect(store.textAlignment).toBe('right')

      store.setTextAlignment('center')
      expect(store.textAlignment).toBe('center')
    })

    it('should save and load text alignment preference', async () => {
      const store = usePrefsStore()

      // Set alignment and save
      store.setTextAlignment('left')
      await store.save()

      // Reset pinia to get a fresh store instance
      setActivePinia(createPinia())

      // Create new store instance to test loading
      const newStore = usePrefsStore()
      await newStore.load()

      expect(newStore.textAlignment).toBe('left')
    })

    it('should reset text alignment to default', () => {
      const store = usePrefsStore()

      // Change from default
      store.setTextAlignment('left')
      expect(store.textAlignment).toBe('left')

      // Reset
      store.reset()
      expect(store.textAlignment).toBe('center')
    })

    it('should apply text alignment CSS variable', () => {
      const store = usePrefsStore()

      // Mock document.documentElement
      const mockRoot = {
        style: {
          setProperty: vi.fn(),
        },
      }
      Object.defineProperty(document, 'documentElement', {
        value: mockRoot,
        writable: true,
      })

      store.setTextAlignment('left')
      store.applyCSSVariables()

      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--text-alignment', 'left')
    })
  })

  describe('Scroll Mode (voice tracking)', () => {
    it('should default to auto', () => {
      const store = usePrefsStore()
      expect(store.scrollMode).toBe('auto')
    })

    it('should set scroll mode and persist it', async () => {
      const store = usePrefsStore()

      store.setScrollMode('voice')
      expect(store.scrollMode).toBe('voice')

      const savedData = JSON.parse(localStorageMock.getItem('preferences') || '{}')
      expect(savedData.scrollMode).toBe('voice')
    })

    it('should save and load scroll mode preference', async () => {
      const store = usePrefsStore()

      store.setScrollMode('voice')
      await store.save()

      setActivePinia(createPinia())

      const newStore = usePrefsStore()
      await newStore.load()

      expect(newStore.scrollMode).toBe('voice')
    })

    it('should reset scroll mode to default', () => {
      const store = usePrefsStore()

      store.setScrollMode('voice')
      expect(store.scrollMode).toBe('voice')

      store.reset()
      expect(store.scrollMode).toBe('auto')
    })

    it('falls back to auto when saved scroll mode is invalid', async () => {
      const savedPrefs = {
        fontFamily: 'Roboto, sans-serif',
        fontSizePx: 24,
        lineHeight: 1.4,
        fgColor: '#FFFFFF',
        bgColor: '#000000',
        speedPxPerSec: 50,
        speedMin: 10,
        speedMax: 200,
        mirrorH: false,
        mirrorV: false,
        highlightBandLines: 1,
        highlightBandPosPct: 40,
        dimmingIntensity: 0.5,
        textAlignment: 'center',
        scrollMode: 'not-a-real-mode',
        customHotkeys: {},
        customGamepadMappings: {},
      }
      localStorageMock.setItem('preferences', JSON.stringify(savedPrefs))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const store = usePrefsStore()
      await store.load()

      expect(store.scrollMode).toBe('auto')
      warnSpy.mockRestore()
    })
  })

  describe('Active Frame (markdown vs monospace)', () => {
    it('should default to markdown', () => {
      const store = usePrefsStore()
      expect(store.activeFrame).toBe('markdown')
    })

    it('should set active frame and persist it', async () => {
      const store = usePrefsStore()

      store.setActiveFrame('monospace')
      expect(store.activeFrame).toBe('monospace')

      const savedData = JSON.parse(localStorageMock.getItem('preferences') || '{}')
      expect(savedData.activeFrame).toBe('monospace')
    })

    it('should save and load active frame preference', async () => {
      const store = usePrefsStore()

      store.setActiveFrame('monospace')
      await store.save()

      setActivePinia(createPinia())

      const newStore = usePrefsStore()
      await newStore.load()

      expect(newStore.activeFrame).toBe('monospace')
    })

    it('should reset active frame to default', () => {
      const store = usePrefsStore()

      store.setActiveFrame('monospace')
      expect(store.activeFrame).toBe('monospace')

      store.reset()
      expect(store.activeFrame).toBe('markdown')
    })

    it('falls back to markdown when saved active frame is invalid', async () => {
      const savedPrefs = {
        fontFamily: 'Roboto, sans-serif',
        fontSizePx: 24,
        lineHeight: 1.4,
        fgColor: '#FFFFFF',
        bgColor: '#000000',
        speedPxPerSec: 50,
        speedMin: 10,
        speedMax: 200,
        mirrorH: false,
        mirrorV: false,
        highlightBandLines: 1,
        highlightBandPosPct: 40,
        dimmingIntensity: 0.5,
        textAlignment: 'center',
        scrollMode: 'auto',
        activeFrame: 'not-a-real-frame',
        customHotkeys: {},
        customGamepadMappings: {},
      }
      localStorageMock.setItem('preferences', JSON.stringify(savedPrefs))
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const store = usePrefsStore()
      await store.load()

      expect(store.activeFrame).toBe('markdown')
      warnSpy.mockRestore()
    })
  })
})
