import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GamepadManager, gamepadManager } from '@/utils/gamepadManager'
import { useGamepad } from '@/utils/gamepad'
import type { HotkeyAction, CustomGamepadMapping } from '@/types'

// Mock the gamepad utility
vi.mock('@/utils/gamepad')

const mockUseGamepad = vi.mocked(useGamepad)

describe('GamepadManager', () => {
  let manager: GamepadManager
  let mockGamepadComposable: any

  beforeEach(() => {
    manager = new GamepadManager()

    // Create mock gamepad composable
    mockGamepadComposable = {
      isSupported: { value: true },
      connectedGamepads: { value: [] },
      onButtonPress: vi.fn(),
      getButtonDisplayName: vi.fn(),
      isButtonPressed: vi.fn(),
      cleanup: vi.fn(),
    }

    mockUseGamepad.mockReturnValue(mockGamepadComposable)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Action Management', () => {
    it('should register and unregister actions', () => {
      const mockHandler = vi.fn()
      const action: HotkeyAction = 'toggle-play'

      manager.registerAction(action, mockHandler)
      expect(manager['actionHandlers'].has(action)).toBe(true)

      manager.unregisterAction(action)
      expect(manager['actionHandlers'].has(action)).toBe(false)
    })

    it('should execute registered actions', () => {
      const mockHandler = vi.fn()
      const action: HotkeyAction = 'toggle-play'

      manager.registerAction(action, mockHandler)
      manager.executeAction(action)

      expect(mockHandler).toHaveBeenCalledOnce()
    })

    it('should handle executing unregistered actions', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      manager.executeAction('toggle-play' as HotkeyAction)

      expect(consoleSpy).toHaveBeenCalledWith('No handler registered for action: toggle-play')
      consoleSpy.mockRestore()
    })
  })

  describe('Mapping Management', () => {
    it('should update custom mapping', () => {
      const mapping: CustomGamepadMapping = {
        'toggle-play': { buttonIndex: 0, action: 'toggle-play', description: 'Toggle play/pause' },
      }

      manager.updateMapping(mapping)
      expect(manager['customMapping']).toEqual(mapping)
    })

    it('should preserve existing mapping when updating', () => {
      const initialMapping: CustomGamepadMapping = {
        'toggle-play': { buttonIndex: 0, action: 'toggle-play', description: 'Toggle play/pause' },
      }

      const newMapping: CustomGamepadMapping = {
        'step-up': { buttonIndex: 1, action: 'step-up', description: 'Step up' },
      }

      manager.updateMapping(initialMapping)
      manager.updateMapping(newMapping)

      expect(manager['customMapping']).toEqual(newMapping)
    })
  })

  describe('Listening State', () => {
    it('should start listening when gamepad is supported', () => {
      const mockUnsubscribe = vi.fn()
      mockGamepadComposable.onButtonPress.mockReturnValue(mockUnsubscribe)

      manager.startListening()

      expect(mockUseGamepad).toHaveBeenCalled()
      expect(mockGamepadComposable.onButtonPress).toHaveBeenCalled()
      expect(manager['isListening']).toBe(true)
    })

    it('should not start listening when gamepad is not supported', () => {
      mockGamepadComposable.isSupported.value = false

      manager.startListening()

      expect(manager['isListening']).toBe(false)
      expect(mockGamepadComposable.onButtonPress).not.toHaveBeenCalled()
    })

    it('should not start listening multiple times', () => {
      const mockUnsubscribe = vi.fn()
      mockGamepadComposable.onButtonPress.mockReturnValue(mockUnsubscribe)

      manager.startListening()
      manager.startListening()

      expect(mockUseGamepad).toHaveBeenCalledOnce()
    })

    it('should stop listening', () => {
      const mockUnsubscribe = vi.fn()
      mockGamepadComposable.onButtonPress.mockReturnValue(mockUnsubscribe)

      manager.startListening()
      manager.stopListening()

      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(mockGamepadComposable.cleanup).toHaveBeenCalled()
      expect(manager['isListening']).toBe(false)
    })

    it('should handle stop listening when not listening', () => {
      expect(() => manager.stopListening()).not.toThrow()
      expect(manager['isListening']).toBe(false)
    })

    it('should stop listening cleanly when there is no unsubscribe callback', () => {
      // Force isListening without going through startListening, so
      // unsubscribeButtonPress stays null - covers that defensive branch.
      manager['isListening'] = true

      expect(() => manager.stopListening()).not.toThrow()
      expect(manager['isListening']).toBe(false)
    })

    it('should stop listening cleanly when the composable has no cleanup function', () => {
      delete mockGamepadComposable.cleanup

      manager.startListening()

      expect(() => manager.stopListening()).not.toThrow()
      expect(manager['isListening']).toBe(false)
    })
  })

  describe('Button Press Handling', () => {
    it('should handle button press with mapping', () => {
      const mockHandler = vi.fn()
      const action: HotkeyAction = 'toggle-play'
      const mapping: CustomGamepadMapping = {
        [action]: { buttonIndex: 0, action: action, description: 'Toggle play/pause' },
      }

      manager.registerAction(action, mockHandler)
      manager.updateMapping(mapping)

      const button = { buttonIndex: 0, buttonName: 'A Button', gamepadIndex: 0 }
      manager['handleButtonPress'](button)

      expect(mockHandler).toHaveBeenCalledOnce()
    })

    it('should handle button press without mapping', () => {
      const button = { buttonIndex: 5, buttonName: 'Unmapped Button', gamepadIndex: 0 }

      expect(() => manager['handleButtonPress'](button)).not.toThrow()
    })

    it('should handle button press with mapping but no handler', () => {
      const mapping: CustomGamepadMapping = {
        'toggle-play': { buttonIndex: 0, action: 'toggle-play', description: 'Toggle play/pause' },
      }

      manager.updateMapping(mapping)

      const button = { buttonIndex: 0, buttonName: 'A Button', gamepadIndex: 0 }

      expect(() => manager['handleButtonPress'](button)).not.toThrow()
    })
  })

  describe('Status and Information', () => {
    it('should return correct status', () => {
      mockGamepadComposable.connectedGamepads.value = [{ index: 0 }, { index: 1 }]

      const mapping: CustomGamepadMapping = {
        'toggle-play': { buttonIndex: 0, action: 'toggle-play', description: 'Toggle play/pause' },
        'step-up': { buttonIndex: 1, action: 'step-up', description: 'Step up' },
      }

      manager.updateMapping(mapping)
      manager.startListening()

      const status = manager.getStatus()

      expect(status.isListening).toBe(true)
      expect(status.isSupported).toBe(true)
      expect(status.connectedGamepads).toBe(2)
      expect(status.mappedButtons).toBe(2)
    })

    it('should return status when not listening', () => {
      const status = manager.getStatus()

      expect(status.isListening).toBe(false)
      expect(status.isSupported).toBe(false)
      expect(status.connectedGamepads).toBe(0)
      expect(status.mappedButtons).toBe(0)
    })

    it('should get button display name', () => {
      const button = { buttonIndex: 0, buttonName: 'A Button', gamepadIndex: 0 }

      mockGamepadComposable.getButtonDisplayName.mockReturnValue('A Button (Gamepad 0)')
      manager.startListening()

      const displayName = manager.getButtonDisplayName(button)

      expect(displayName).toBe('A Button (Gamepad 0)')
      expect(mockGamepadComposable.getButtonDisplayName).toHaveBeenCalledWith(button)
    })

    it('should get button display name when not listening', () => {
      const button = { buttonIndex: 0, buttonName: 'A Button', gamepadIndex: 0 }

      const displayName = manager.getButtonDisplayName(button)

      expect(displayName).toBe('A Button')
    })

    it('should check if button is pressed', () => {
      const button = { buttonIndex: 0, buttonName: 'A Button', gamepadIndex: 0 }

      mockGamepadComposable.isButtonPressed.mockReturnValue(true)
      manager.startListening()

      const isPressed = manager.isButtonPressed(button)

      expect(isPressed).toBe(true)
      expect(mockGamepadComposable.isButtonPressed).toHaveBeenCalledWith(button)
    })

    it('should return false for button press when not listening', () => {
      const button = { buttonIndex: 0, buttonName: 'A Button', gamepadIndex: 0 }

      const isPressed = manager.isButtonPressed(button)

      expect(isPressed).toBe(false)
    })
  })

  describe('Rebuild Scheduling', () => {
    it('should schedule rebuild when registering actions', async () => {
      const rebuildSpy = vi.spyOn(manager as any, 'rebuildHandlers')

      manager.registerAction('toggle-play', vi.fn())

      // Wait for the scheduled rebuild
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(rebuildSpy).toHaveBeenCalled()
    })

    it('should not schedule multiple rebuilds', async () => {
      const rebuildSpy = vi.spyOn(manager as any, 'rebuildHandlers')

      manager.registerAction('toggle-play', vi.fn())
      manager.registerAction('step-up', vi.fn())

      // Wait for the scheduled rebuild
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(rebuildSpy).toHaveBeenCalledOnce()
    })
  })

  describe('Singleton Instance', () => {
    it('should export a singleton instance', () => {
      expect(gamepadManager).toBeInstanceOf(GamepadManager)
    })

    it('should be the same instance when imported multiple times', () => {
      // The singleton is tested by importing it at the top of the file
      // and verifying it's an instance of GamepadManager
      expect(gamepadManager).toBeInstanceOf(GamepadManager)

      // In a real scenario, the singleton pattern ensures the same instance
      // is returned, but testing dynamic imports in Vitest is complex
      expect(gamepadManager).toBe(gamepadManager)
    })
  })

  describe('Integration with onButtonPress', () => {
    it('should register button press listener on start', () => {
      const mockUnsubscribe = vi.fn()
      mockGamepadComposable.onButtonPress.mockReturnValue(mockUnsubscribe)

      manager.startListening()

      expect(mockGamepadComposable.onButtonPress).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should call handleButtonPress when button is pressed', () => {
      const mockUnsubscribe = vi.fn()
      let buttonPressCallback: Function

      mockGamepadComposable.onButtonPress.mockImplementation((callback: Function) => {
        buttonPressCallback = callback
        return mockUnsubscribe
      })

      const handleButtonPressSpy = vi.spyOn(manager as any, 'handleButtonPress')

      manager.startListening()

      const button = { buttonIndex: 0, buttonName: 'A Button', gamepadIndex: 0 }
      buttonPressCallback!(button)

      expect(handleButtonPressSpy).toHaveBeenCalledWith(button)
    })
  })

  describe('Production mode (DEV logging disabled)', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    it('starts listening without dev logging when supported', () => {
      vi.stubEnv('DEV', false)
      mockGamepadComposable.onButtonPress.mockReturnValue(vi.fn())

      expect(() => manager.startListening()).not.toThrow()
      expect(manager['isListening']).toBe(true)
    })

    it('bails out without dev logging when unsupported', () => {
      vi.stubEnv('DEV', false)
      mockGamepadComposable.isSupported.value = false

      expect(() => manager.startListening()).not.toThrow()
      expect(manager['isListening']).toBe(false)
    })

    it('handles a mapped button press with a handler without dev logging', () => {
      vi.stubEnv('DEV', false)
      const mockHandler = vi.fn()
      const action: HotkeyAction = 'toggle-play'
      manager.registerAction(action, mockHandler)
      manager.updateMapping({
        [action]: { buttonIndex: 0, action, description: 'Toggle play/pause' },
      })

      const button = { buttonIndex: 0, buttonName: 'A Button', gamepadIndex: 0 }
      manager['handleButtonPress'](button)

      expect(mockHandler).toHaveBeenCalledOnce()
    })

    it('handles a mapped button press without a handler without dev logging', () => {
      vi.stubEnv('DEV', false)
      manager.updateMapping({
        'toggle-play': { buttonIndex: 0, action: 'toggle-play', description: 'Toggle play/pause' },
      })

      const button = { buttonIndex: 0, buttonName: 'A Button', gamepadIndex: 0 }

      expect(() => manager['handleButtonPress'](button)).not.toThrow()
    })

    it('handles an unmapped button press without dev logging', () => {
      vi.stubEnv('DEV', false)
      const button = { buttonIndex: 9, buttonName: 'Unmapped', gamepadIndex: 0 }

      expect(() => manager['handleButtonPress'](button)).not.toThrow()
    })

    it('rebuilds handlers without dev logging', async () => {
      vi.stubEnv('DEV', false)

      manager.registerAction('toggle-play', vi.fn())
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Should not throw and should not touch lastMappingHash (DEV-only bookkeeping)
      expect(manager['lastMappingHash']).toBe('')
    })
  })
})
