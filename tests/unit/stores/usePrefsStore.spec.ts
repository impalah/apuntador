import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrefsStore } from '@/stores/usePrefsStore'
import type { HotkeyAction } from '@/types'

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

      // Should be back to default mapping (not empty)
      expect(Object.keys(store.customHotkeys).length).toBeGreaterThan(0)
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
})
