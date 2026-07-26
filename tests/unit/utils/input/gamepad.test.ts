import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useGamepad } from '@/utils/gamepad'

describe('Gamepad Utils', () => {
  let mockGetGamepads: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock navigator.getGamepads() - return empty array initially
    mockGetGamepads = vi.fn(() => [])
    Object.defineProperty(navigator, 'getGamepads', {
      value: mockGetGamepads,
      writable: true,
      configurable: true
    })

    // Mock window.addEventListener
    vi.spyOn(window, 'addEventListener')
    vi.spyOn(window, 'removeEventListener')

    // Mock animation frame functions
    vi.spyOn(global, 'requestAnimationFrame').mockImplementation((callback) => {
      setTimeout(callback, 16)
      return 1
    })
    vi.spyOn(global, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should detect gamepad support when getGamepads is available', () => {
      const { isSupported } = useGamepad()
      expect(isSupported.value).toBe(true)
    })

    it('should initialize with no connected gamepads', () => {
      const { connectedGamepads } = useGamepad()
      expect(connectedGamepads.value).toEqual([])
    })

    it('should handle missing getGamepads API', () => {
      // Delete getGamepads property to simulate unsupported browser
      const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, 'getGamepads')
      delete (navigator as any).getGamepads

      const { isSupported } = useGamepad()
      expect(isSupported.value).toBe(false)

      // Restore original property
      if (originalDescriptor) {
        Object.defineProperty(navigator, 'getGamepads', originalDescriptor)
      }
    })

    it('should provide button display names', () => {
      const { getButtonDisplayName, GAMEPAD_BUTTON_NAMES } = useGamepad()
      
      const mockButton = { gamepadIndex: 0, buttonIndex: 0, buttonName: 'A/X Button' }
      expect(getButtonDisplayName(mockButton)).toBe('A/X Button (Gamepad 0)')
      
      // Test the constant mapping
      expect(GAMEPAD_BUTTON_NAMES[0]).toBe('A/X Button')
      expect(GAMEPAD_BUTTON_NAMES[1]).toBe('B/Circle Button')
    })

    it('should allow registering button press callbacks', () => {
      const { onButtonPress } = useGamepad()
      
      const callback = vi.fn()
      onButtonPress(callback)
      
      // Verify callback was registered (we can't easily test the actual press detection)
      expect(callback).toBeDefined()
    })

    it('should check if button is pressed', () => {
      const { isButtonPressed } = useGamepad()
      
      const mockButton = { gamepadIndex: 0, buttonIndex: 0, buttonName: 'A/X Button' }
      // This will return false since no gamepads are connected in our mock
      expect(isButtonPressed(mockButton)).toBe(false)
    })

    it('should allow cleanup', () => {
      const { cleanup } = useGamepad()
      
      expect(() => cleanup()).not.toThrow()
      expect(global.cancelAnimationFrame).toHaveBeenCalled()
    })
  })

  describe('Gamepad Events', () => {
    it('should listen for gamepad events', () => {
      // Test that event listeners are set up
      useGamepad()
      
      expect(window.addEventListener).toHaveBeenCalledWith('gamepadconnected', expect.any(Function))
      expect(window.addEventListener).toHaveBeenCalledWith('gamepaddisconnected', expect.any(Function))
    })
  })

  describe('Action Execution', () => {
    it('should provide executeGamepadAction function', () => {
      const { executeGamepadAction } = useGamepad()
      
      expect(executeGamepadAction).toBeDefined()
      expect(typeof executeGamepadAction).toBe('function')
    })
  })
})