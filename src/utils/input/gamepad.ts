import { ref, onMounted, onUnmounted, readonly, getCurrentInstance } from 'vue'

export interface GamepadButton {
  gamepadIndex: number
  buttonIndex: number
  buttonName: string
}

export interface GamepadMapping {
  [key: string]: GamepadButton | null
}

// Common gamepad button names - extended to cover more buttons
const GAMEPAD_BUTTON_NAMES: { [key: number]: string } = {
  0: 'A/X Button',
  1: 'B/Circle Button',
  2: 'X/Square Button',
  3: 'Y/Triangle Button',
  4: 'Left Bumper',
  5: 'Right Bumper',
  6: 'Left Trigger',
  7: 'Right Trigger',
  8: 'Select/Share',
  9: 'Start/Options',
  10: 'Left Stick Click',
  11: 'Right Stick Click',
  12: 'D-pad Up',
  13: 'D-pad Down',
  14: 'D-pad Left',
  15: 'D-pad Right',
  16: 'Home/PS Button',
  17: 'Touchpad Click',
  18: 'Special Button 1',
  19: 'Special Button 2',
  20: 'Special Button 3',
  21: 'Special Button 4',
  22: 'Special Button 5',
  23: 'Special Button 6',
}

export function useGamepad() {
  const connectedGamepads = ref<Gamepad[]>([])
  const isSupported = ref(false)
  const lastGamepadState = new Map<number, { buttons: boolean[]; axes: number[] }>()

  // Button press detection
  const buttonPressCallbacks = new Set<(button: GamepadButton) => void>()
  let animationFrameId: number | null = null

  // Initialize gamepad support
  const init = () => {
    isSupported.value = 'getGamepads' in navigator

    if (!isSupported.value) {
      if (import.meta.env.DEV) {
        console.debug('Gamepad API not supported in this browser')
      }
      return
    }

    if (import.meta.env.DEV) {
      console.log('Gamepad API initialized')
    }

    // Start polling for gamepad state
    pollGamepads()

    // Listen for gamepad connection events
    globalThis.addEventListener('gamepadconnected', handleGamepadConnected)
    globalThis.addEventListener('gamepaddisconnected', handleGamepadDisconnected)
  }

  const cleanup = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    globalThis.removeEventListener('gamepadconnected', handleGamepadConnected)
    globalThis.removeEventListener('gamepaddisconnected', handleGamepadDisconnected)
    buttonPressCallbacks.clear()
  }

  const handleGamepadConnected = (event: GamepadEvent) => {
    console.log('Gamepad connected:', event.gamepad.id)
    updateConnectedGamepads()
  }

  const handleGamepadDisconnected = (event: GamepadEvent) => {
    console.log('Gamepad disconnected:', event.gamepad.id)
    lastGamepadState.delete(event.gamepad.index)
    updateConnectedGamepads()
  }

  const updateConnectedGamepads = () => {
    if (!isSupported.value) return

    const gamepads = navigator.getGamepads()
    connectedGamepads.value = Array.from(gamepads).filter(Boolean) as Gamepad[]
  }

  /**
   * Notify all button press listeners
   */
  const notifyButtonPress = (button: GamepadButton) => {
    console.log(
      `🎮 Gamepad button detected: ${button.buttonName} (${button.buttonIndex}) on gamepad ${button.gamepadIndex}`
    )

    buttonPressCallbacks.forEach((callback) => {
      try {
        callback(button)
      } catch (error) {
        console.error('Error in gamepad button callback:', error)
      }
    })
  }

  /**
   * Map Activity Sensor value to virtual button
   */
  const mapActivitySensorValue = (value: number): { buttonIndex: number; buttonName: string } => {
    const roundedValue = Math.round(value * 100) / 100

    const sensorMappings = [
      { value: 0.71, index: 2001, name: 'Activity Sensor Button 1' },
      { value: -1, index: 2002, name: 'Activity Sensor Button 2' },
      { value: -0.43, index: 2003, name: 'Activity Sensor Button 3' },
      { value: 0.14, index: 2004, name: 'Activity Sensor Button 4' },
    ]

    for (const mapping of sensorMappings) {
      if (Math.abs(roundedValue - mapping.value) < 0.05) {
        return { buttonIndex: mapping.index, buttonName: mapping.name }
      }
    }

    // Unknown value - create dynamic button
    return {
      buttonIndex: 2000 + Math.floor(Math.abs(roundedValue * 100)),
      buttonName: `Activity Sensor (${roundedValue.toFixed(2)})`,
    }
  }

  /**
   * Process Activity Sensor (Axis 9) special handling
   */
  const processActivitySensor = (
    gamepadIndex: number,
    currentValue: number,
    previousValue: number
  ) => {
    const isRestValue = Math.abs(currentValue - 3.29) < 0.1
    const wasRestValue = Math.abs(previousValue - 3.29) < 0.1

    // Only trigger when transitioning FROM rest TO a specific value
    if (wasRestValue && !isRestValue) {
      const { buttonIndex, buttonName } = mapActivitySensorValue(currentValue)

      notifyButtonPress({
        gamepadIndex,
        buttonIndex,
        buttonName,
      })
    }
  }

  /**
   * Process standard axis activation
   */
  const processStandardAxis = (
    gamepadIndex: number,
    axisIndex: number,
    currentValue: number,
    previousValue: number
  ) => {
    const threshold = 0.5
    const wasActivated = Math.abs(previousValue) > threshold
    const isActivated = Math.abs(currentValue) > threshold

    // Only trigger on activation, not deactivation
    if (!wasActivated && isActivated) {
      const axisNames: Record<number, string> = {
        0: 'Left Stick X',
        1: 'Left Stick Y',
        2: 'Right Stick X',
        3: 'Right Stick Y',
        4: 'Activity Sensor',
        5: 'Axis 5',
        6: 'Axis 6',
        7: 'Axis 7',
        8: 'Axis 8',
      }

      const axisName = axisNames[axisIndex] || `Axis ${axisIndex}`
      const direction = currentValue > 0 ? 'Positive' : 'Negative'
      const virtualButtonIndex = 1000 + axisIndex

      notifyButtonPress({
        gamepadIndex,
        buttonIndex: virtualButtonIndex,
        buttonName: `${axisName} ${direction}`,
      })
    }
  }

  /**
   * Check button presses for a gamepad
   */
  const checkButtons = (gamepad: Gamepad, prevState: { buttons: boolean[]; axes: number[] }) => {
    for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++) {
      const button = gamepad.buttons[buttonIndex]
      const wasPressed = prevState.buttons[buttonIndex] || false
      if (!button) continue
      const isPressed = button.pressed

      // Detect button press (not release, to avoid double triggers)
      if (!wasPressed && isPressed) {
        notifyButtonPress({
          gamepadIndex: gamepad.index,
          buttonIndex,
          buttonName: GAMEPAD_BUTTON_NAMES[buttonIndex] || `Button ${buttonIndex}`,
        })
      }
    }
  }

  /**
   * Check axis movements for a gamepad
   */
  const checkAxes = (gamepad: Gamepad, prevState: { buttons: boolean[]; axes: number[] }) => {
    for (let axisIndex = 0; axisIndex < gamepad.axes.length; axisIndex++) {
      const currentValue = gamepad.axes[axisIndex]
      if (currentValue === undefined) continue
      const previousValue = prevState.axes[axisIndex] || 0

      if (axisIndex === 9) {
        // Special handling for Activity Sensor
        processActivitySensor(gamepad.index, currentValue, previousValue)
      } else {
        // Standard axis handling
        processStandardAxis(gamepad.index, axisIndex, currentValue, previousValue)
      }
    }
  }

  const pollGamepads = () => {
    if (!isSupported.value) return

    updateConnectedGamepads()

    // Check for button state changes
    connectedGamepads.value.forEach((gamepad) => {
      const prevState = lastGamepadState.get(gamepad.index) || { buttons: [], axes: [] }

      // Check buttons and axes
      checkButtons(gamepad, prevState)
      checkAxes(gamepad, prevState)

      // Update state
      lastGamepadState.set(gamepad.index, {
        buttons: gamepad.buttons.map((btn) => btn.pressed),
        axes: [...gamepad.axes],
      })
    })

    // Continue polling at 60fps
    animationFrameId = requestAnimationFrame(pollGamepads)
  }

  // Add listener for button presses
  const onButtonPress = (callback: (button: GamepadButton) => void) => {
    buttonPressCallbacks.add(callback)

    // Return cleanup function
    return () => {
      buttonPressCallbacks.delete(callback)
    }
  }

  // Get button display name
  const getButtonDisplayName = (button: GamepadButton): string => {
    const gamepad = connectedGamepads.value.find((gp) => gp.index === button.gamepadIndex)
    const gamepadName = gamepad
      ? `${gamepad.id.substring(0, 20)}...`
      : `Gamepad ${button.gamepadIndex}`
    return `${button.buttonName} (${gamepadName})`
  }

  // Check if a specific button is currently pressed
  const isButtonPressed = (button: GamepadButton): boolean => {
    const gamepad = connectedGamepads.value.find((gp) => gp.index === button.gamepadIndex)
    return gamepad?.buttons[button.buttonIndex]?.pressed || false
  }

  // Execute gamepad action (for testing)
  const executeGamepadAction = (button: GamepadButton, actionMap: GamepadMapping) => {
    const actionKey = Object.keys(actionMap).find((key) => {
      const mapped = actionMap[key]
      return (
        mapped &&
        mapped.gamepadIndex === button.gamepadIndex &&
        mapped.buttonIndex === button.buttonIndex
      )
    })

    return actionKey || null
  }

  // Only register lifecycle hooks if we're in a Vue component context
  const instance = getCurrentInstance()

  if (instance) {
    // We're in a component context, use lifecycle hooks
    onMounted(init)
    onUnmounted(cleanup)
  } else if (typeof window !== 'undefined') {
    // We're not in a component context (e.g., called from gamepadManager)
    // Initialize directly
    init()
  }

  return {
    // State
    connectedGamepads: readonly(connectedGamepads),
    isSupported: readonly(isSupported),

    // Methods
    onButtonPress,
    getButtonDisplayName,
    isButtonPressed,
    executeGamepadAction,

    // Utils
    GAMEPAD_BUTTON_NAMES,

    // Manual cleanup for non-component usage
    cleanup,
  }
}
