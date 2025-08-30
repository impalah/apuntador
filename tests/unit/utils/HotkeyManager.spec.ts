import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HotkeyManager } from '@/utils/hotkeys'
import type { HotkeyAction, CustomHotkeyMapping, HotkeyDefinition } from '@/types'

describe('HotkeyManager', () => {
  let hotkeyManager: HotkeyManager
  let mockCallback: ReturnType<typeof vi.fn>

  beforeEach(() => {
    hotkeyManager = new HotkeyManager()
    mockCallback = vi.fn()

    // Clear all handlers and stop listening
    hotkeyManager.clear()
    hotkeyManager.stopListening()
  })

  describe('registerAction', () => {
    it('registers a new action', () => {
      hotkeyManager.registerAction('toggle-play', mockCallback)

      // Test by registering a mapping and checking if it triggers
      const mapping: CustomHotkeyMapping = {
        'toggle-play': {
          key: ' ',
          action: 'toggle-play',
          description: 'Play/Pause',
        },
      }

      hotkeyManager.updateMapping(mapping)

      // Verify the action is registered by checking internal state
      expect(hotkeyManager['actionHandlers'].has('toggle-play')).toBe(true)
    })

    it('updates mapping when action is registered', () => {
      const mapping: CustomHotkeyMapping = {
        'toggle-play': {
          key: ' ',
          action: 'toggle-play',
          description: 'Play/Pause',
        },
      }

      hotkeyManager.updateMapping(mapping)
      hotkeyManager.registerAction('toggle-play', mockCallback)

      expect(hotkeyManager['actionHandlers'].has('toggle-play')).toBe(true)
    })
  })

  describe('updateMapping', () => {
    beforeEach(() => {
      hotkeyManager.registerAction('toggle-play', mockCallback)
    })

    it('updates hotkey mapping for registered action', () => {
      const mapping: CustomHotkeyMapping = {
        'toggle-play': {
          key: ' ',
          action: 'toggle-play',
          description: 'Play/Pause',
        },
      }

      hotkeyManager.updateMapping(mapping)

      // Check that the mapping is stored
      expect(hotkeyManager['customMapping']['toggle-play']).toEqual(mapping['toggle-play'])
    })

    it('handles multiple mappings', () => {
      hotkeyManager.registerAction('speed-up', vi.fn())

      const mapping: CustomHotkeyMapping = {
        'toggle-play': {
          key: ' ',
          action: 'toggle-play',
          description: 'Play/Pause',
        },
        'speed-up': {
          key: 'ArrowRight',
          action: 'speed-up',
          description: 'Increase Speed',
        },
      }

      hotkeyManager.updateMapping(mapping)

      expect(hotkeyManager['customMapping']['toggle-play']).toEqual(mapping['toggle-play'])
      expect(hotkeyManager['customMapping']['speed-up']).toEqual(mapping['speed-up'])
    })

    it('replaces previous mappings', () => {
      // Set initial mapping
      hotkeyManager.updateMapping({
        'toggle-play': {
          key: ' ',
          action: 'toggle-play',
          description: 'Play/Pause',
        },
      })

      // Update with new mapping
      hotkeyManager.updateMapping({
        'toggle-play': {
          key: 'p',
          action: 'toggle-play',
          description: 'Play/Pause',
        },
      })

      expect(hotkeyManager['customMapping']['toggle-play'].key).toBe('p')
    })
  })

  describe('key event handling', () => {
    beforeEach(() => {
      hotkeyManager.registerAction('toggle-play', mockCallback)
      hotkeyManager.updateMapping({
        'toggle-play': {
          key: ' ',
          action: 'toggle-play',
          description: 'Play/Pause',
        },
      })
      hotkeyManager.startListening()
    })

    it('triggers callback for matching key', () => {
      const event = new KeyboardEvent('keydown', {
        key: ' ',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      })

      document.dispatchEvent(event)

      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('respects modifier keys', () => {
      hotkeyManager.updateMapping({
        'toggle-play': {
          key: ' ',
          ctrlKey: true,
          action: 'toggle-play',
          description: 'Play/Pause',
        },
      })

      // Event without Ctrl should not trigger
      let event = new KeyboardEvent('keydown', {
        key: ' ',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
      })
      document.dispatchEvent(event)
      expect(mockCallback).not.toHaveBeenCalled()

      // Event with Ctrl should trigger
      event = new KeyboardEvent('keydown', {
        key: ' ',
        ctrlKey: true,
        altKey: false,
        shiftKey: false,
      })
      document.dispatchEvent(event)
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('does not trigger on input elements', () => {
      // Create an input element and focus it
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        bubbles: true,
      })

      Object.defineProperty(event, 'target', { value: input })
      document.dispatchEvent(event)

      expect(mockCallback).not.toHaveBeenCalled()

      document.body.removeChild(input)
    })
  })

  describe('isKeyInUse', () => {
    beforeEach(() => {
      hotkeyManager.registerAction('toggle-play', mockCallback)
      hotkeyManager.updateMapping({
        'toggle-play': {
          key: ' ',
          action: 'toggle-play',
          description: 'Play/Pause',
        },
      })
    })

    it('returns false for same action', () => {
      const hotkey: HotkeyDefinition = {
        key: ' ',
        action: 'toggle-play',
        description: 'Play/Pause',
      }

      const result = hotkeyManager.isKeyInUse(hotkey, 'toggle-play')
      expect(result).toBe(false)
    })

    it('returns true for conflicting keys', () => {
      const hotkey: HotkeyDefinition = {
        key: ' ',
        action: 'speed-up',
        description: 'Increase Speed',
      }

      const result = hotkeyManager.isKeyInUse(hotkey, 'speed-up')
      expect(result).toBe(true)
    })

    it('returns false for unused keys', () => {
      const hotkey: HotkeyDefinition = {
        key: 'x',
        action: 'speed-up',
        description: 'Increase Speed',
      }

      const result = hotkeyManager.isKeyInUse(hotkey, 'speed-up')
      expect(result).toBe(false)
    })

    it('considers modifier keys', () => {
      hotkeyManager.updateMapping({
        'toggle-play': {
          key: ' ',
          ctrlKey: true,
          action: 'toggle-play',
          description: 'Play/Pause',
        },
      })

      // Same key without Ctrl should not conflict
      const hotkey1: HotkeyDefinition = {
        key: ' ',
        action: 'speed-up',
        description: 'Increase Speed',
      }
      const result1 = hotkeyManager.isKeyInUse(hotkey1, 'speed-up')
      expect(result1).toBe(false)

      // Same key with Ctrl should conflict
      const hotkey2: HotkeyDefinition = {
        key: ' ',
        ctrlKey: true,
        action: 'speed-up',
        description: 'Increase Speed',
      }
      const result2 = hotkeyManager.isKeyInUse(hotkey2, 'speed-up')
      expect(result2).toBe(true)
    })
  })

  describe('getKeyDisplayName', () => {
    it('formats simple keys', () => {
      const hotkey: HotkeyDefinition = {
        key: 'a',
        action: 'toggle-play',
        description: 'Test',
      }
      const result = hotkeyManager.getKeyDisplayName(hotkey)
      expect(result).toBe('A')
    })

    it('formats keys with modifiers', () => {
      const hotkey: HotkeyDefinition = {
        key: 'a',
        ctrlKey: true,
        altKey: true,
        shiftKey: true,
        action: 'toggle-play',
        description: 'Test',
      }
      const result = hotkeyManager.getKeyDisplayName(hotkey)
      expect(result).toBe('Ctrl + Alt + Shift + A')
    })

    it('formats special keys', () => {
      const hotkey: HotkeyDefinition = {
        key: ' ',
        action: 'toggle-play',
        description: 'Test',
      }
      const result = hotkeyManager.getKeyDisplayName(hotkey)
      expect(result).toBe('Space')
    })

    it('formats arrow keys', () => {
      const hotkey: HotkeyDefinition = {
        key: 'ArrowUp',
        action: 'toggle-play',
        description: 'Test',
      }
      const result = hotkeyManager.getKeyDisplayName(hotkey)
      expect(result).toBe('↑')
    })

    it('formats function keys', () => {
      const hotkey: HotkeyDefinition = {
        key: 'F1',
        action: 'toggle-play',
        description: 'Test',
      }
      const result = hotkeyManager.getKeyDisplayName(hotkey)
      expect(result).toBe('F1')
    })
  })

  describe('cleanup', () => {
    it('stops listening and clears state', () => {
      hotkeyManager.registerAction('toggle-play', mockCallback)
      hotkeyManager.startListening()

      hotkeyManager.stopListening()
      hotkeyManager.clear()

      expect(hotkeyManager['actionHandlers'].size).toBe(0)
      expect(hotkeyManager['handlers'].size).toBe(0)
    })
  })
})
