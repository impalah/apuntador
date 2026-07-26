import type { CustomGamepadMapping, HotkeyAction } from '@/types'
import { useGamepad, type GamepadButton } from '@/utils/input/gamepad'

/**
 * Gamepad manager that bridges gamepad inputs to teleprompter actions
 */
export class GamepadManager {
  private readonly actionHandlers = new Map<HotkeyAction, () => void>()
  private customMapping: CustomGamepadMapping = {}
  private isListening = false
  private gamepadComposable: ReturnType<typeof useGamepad> | null = null
  private unsubscribeButtonPress: (() => void) | null = null
  private lastMappingHash = ''
  private rebuildScheduled = false

  /**
   * Update custom gamepad mapping
   */
  updateMapping(mapping: CustomGamepadMapping): void {
    this.customMapping = { ...mapping }
    this.rebuildHandlers()
  }

  /**
   * Register action handler
   */
  registerAction(action: HotkeyAction, handler: () => void): void {
    this.actionHandlers.set(action, handler)
    this.scheduleRebuild()
  }

  /**
   * Unregister action handler
   */
  unregisterAction(action: HotkeyAction): void {
    this.actionHandlers.delete(action)
    this.scheduleRebuild()
  }

  /**
   * Schedule a rebuild to avoid multiple calls
   */
  private scheduleRebuild(): void {
    if (this.rebuildScheduled) return

    this.rebuildScheduled = true
    Promise.resolve().then(() => {
      this.rebuildScheduled = false
      this.rebuildHandlers()
    })
  }

  /**
   * Start listening for gamepad input
   */
  startListening(): void {
    if (this.isListening) return

    if (import.meta.env.DEV) {
      console.log('Starting gamepad manager...')
    }

    this.gamepadComposable = useGamepad()

    // Check if gamepad API is supported
    if (!this.gamepadComposable.isSupported.value) {
      // Only warn if development mode, no need to spam in production
      if (import.meta.env.DEV) {
        console.debug('Gamepad API not supported in this environment')
      }
      return
    }

    if (import.meta.env.DEV) {
      console.log('Gamepad API supported, setting up button listener...')
    }

    // Listen for button press events
    this.unsubscribeButtonPress = this.gamepadComposable.onButtonPress((button: GamepadButton) => {
      if (import.meta.env.DEV) {
        console.log('Button press received in gamepad manager:', button)
      }
      this.handleButtonPress(button)
    })

    this.isListening = true
    if (import.meta.env.DEV) {
      console.log('Gamepad manager started listening')
      console.debug('Current mappings:', Object.keys(this.customMapping))
      console.debug('Registered actions:', Array.from(this.actionHandlers.keys()))
    }
  }

  /**
   * Stop listening for gamepad input
   */
  stopListening(): void {
    if (!this.isListening) return

    if (this.unsubscribeButtonPress) {
      this.unsubscribeButtonPress()
      this.unsubscribeButtonPress = null
    }

    // Call manual cleanup if available (for non-component usage)
    if (this.gamepadComposable && typeof this.gamepadComposable.cleanup === 'function') {
      this.gamepadComposable.cleanup()
    }

    this.gamepadComposable = null
    this.isListening = false
    console.log('Gamepad manager stopped listening')
  }

  /**
   * Handle gamepad button press
   */
  private handleButtonPress(button: GamepadButton): void {
    console.log(`Handling button press: Button ${button.buttonIndex} (${button.buttonName})`)
    if (import.meta.env.DEV) {
      console.log('Current mappings:', this.customMapping)
    }

    // Find action mapped to this button
    const mappedAction = Object.entries(this.customMapping).find(
      ([_, mapping]) => mapping.buttonIndex === button.buttonIndex
    )

    if (import.meta.env.DEV) {
      console.log('Found mapped action:', mappedAction)
    }

    if (mappedAction) {
      const [action] = mappedAction
      const handler = this.actionHandlers.get(action as HotkeyAction)

      if (handler) {
        if (import.meta.env.DEV) {
          console.log(
            `Gamepad button ${button.buttonIndex} (${button.buttonName}) pressed - executing action: ${action}`
          )
        }
        handler()
      } else if (import.meta.env.DEV) {
        console.warn(`No handler registered for action: ${action}`)
        console.warn('Available handlers:', Array.from(this.actionHandlers.keys()))
      }
    } else if (import.meta.env.DEV) {
      console.debug(`No mapping found for button ${button.buttonIndex}`)
    }
  }

  /**
   * Rebuild internal handlers after mapping changes
   */
  private rebuildHandlers(): void {
    // No specific rebuilding needed for gamepad unlike keyboard
    // The button press handler dynamically looks up the mapping

    // Only log when the actual mapping changes, not on every call
    if (import.meta.env.DEV) {
      const currentMappingHash = JSON.stringify(this.customMapping)
      if (currentMappingHash !== this.lastMappingHash) {
        console.debug(
          'Gamepad mappings updated:',
          Object.keys(this.customMapping).length,
          'mappings'
        )
        this.lastMappingHash = currentMappingHash
      }
    }
  }

  /**
   * Get current gamepad status
   */
  getStatus(): {
    isListening: boolean
    isSupported: boolean
    connectedGamepads: number
    mappedButtons: number
  } {
    const gamepad = this.gamepadComposable
    const connectedGamepads = gamepad?.connectedGamepads.value.length || 0
    const mappedButtons = Object.values(this.customMapping).filter(
      (mapping) => mapping.buttonIndex !== null
    ).length

    return {
      isListening: this.isListening,
      isSupported: gamepad?.isSupported.value || false,
      connectedGamepads,
      mappedButtons,
    }
  }

  /**
   * Get gamepad display name for a button
   */
  getButtonDisplayName(button: GamepadButton): string {
    return this.gamepadComposable?.getButtonDisplayName(button) || `${button.buttonName}`
  }

  /**
   * Check if a button is currently pressed
   */
  isButtonPressed(button: GamepadButton): boolean {
    return this.gamepadComposable?.isButtonPressed(button) || false
  }

  /**
   * Execute action by name (for testing/debugging)
   */
  executeAction(action: HotkeyAction): void {
    const handler = this.actionHandlers.get(action)
    if (handler) {
      console.log(`Manually executing gamepad action: ${action}`)
      handler()
    } else {
      console.warn(`No handler registered for action: ${action}`)
    }
  }
}

// Export singleton instance
export const gamepadManager = new GamepadManager()
