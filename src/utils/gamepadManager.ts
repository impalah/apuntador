import type { CustomGamepadMapping, HotkeyAction } from '@/types'
import { useGamepad, type GamepadButton } from '@/utils/gamepad'

/**
 * Gamepad manager that bridges gamepad inputs to teleprompter actions
 */
export class GamepadManager {
  private actionHandlers = new Map<HotkeyAction, () => void>()
  private customMapping: CustomGamepadMapping = {}
  private isListening = false
  private gamepadComposable: ReturnType<typeof useGamepad> | null = null
  private unsubscribeButtonPress: (() => void) | null = null

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
    this.rebuildHandlers()
  }

  /**
   * Unregister action handler
   */
  unregisterAction(action: HotkeyAction): void {
    this.actionHandlers.delete(action)
    this.rebuildHandlers()
  }

  /**
   * Start listening for gamepad input
   */
  startListening(): void {
    if (this.isListening) return

    console.log('Starting gamepad manager...')

    this.gamepadComposable = useGamepad()

    // Check if gamepad API is supported
    if (!this.gamepadComposable.isSupported.value) {
      console.warn('Gamepad API not supported in this environment')
      return
    }

    console.log('Gamepad API supported, setting up button listener...')

    // Listen for button press events
    this.unsubscribeButtonPress = this.gamepadComposable.onButtonPress((button: GamepadButton) => {
      console.log('Button press received in gamepad manager:', button)
      this.handleButtonPress(button)
    })

    this.isListening = true
    console.log('Gamepad manager started listening')
    console.log('Current mappings:', this.customMapping)
    console.log('Registered actions:', Array.from(this.actionHandlers.keys()))
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

    this.gamepadComposable = null
    this.isListening = false
    console.log('Gamepad manager stopped listening')
  }

  /**
   * Handle gamepad button press
   */
  private handleButtonPress(button: GamepadButton): void {
    console.log(`Handling button press: Button ${button.buttonIndex} (${button.buttonName})`)
    console.log('Current mappings:', this.customMapping)

    // Find action mapped to this button
    const mappedAction = Object.entries(this.customMapping).find(
      ([_, mapping]) => mapping.buttonIndex === button.buttonIndex
    )

    console.log('Found mapped action:', mappedAction)

    if (mappedAction) {
      const [action] = mappedAction
      const handler = this.actionHandlers.get(action as HotkeyAction)

      if (handler) {
        console.log(
          `Gamepad button ${button.buttonIndex} (${button.buttonName}) pressed - executing action: ${action}`
        )
        handler()
      } else {
        console.warn(`No handler registered for action: ${action}`)
        console.warn('Available handlers:', Array.from(this.actionHandlers.keys()))
      }
    } else {
      console.log(`No mapping found for button ${button.buttonIndex}`)
    }
  }

  /**
   * Rebuild internal handlers after mapping changes
   */
  private rebuildHandlers(): void {
    // No specific rebuilding needed for gamepad unlike keyboard
    // The button press handler dynamically looks up the mapping
    console.log('Gamepad mappings updated:', this.customMapping)
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
