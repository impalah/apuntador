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
      console.warn('Gamepad API not supported in this browser')
      return
    }

    console.log('Gamepad API initialized')

    // Start polling for gamepad state
    pollGamepads()

    // Listen for gamepad connection events
    window.addEventListener('gamepadconnected', handleGamepadConnected)
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected)
  }

  const cleanup = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }

    window.removeEventListener('gamepadconnected', handleGamepadConnected)
    window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected)
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

  const pollGamepads = () => {
    if (!isSupported.value) return

    updateConnectedGamepads()

    // Check for button state changes
    connectedGamepads.value.forEach((gamepad) => {
      const gamepadIndex = gamepad.index
      const prevState = lastGamepadState.get(gamepadIndex) || { buttons: [], axes: [] }

      // Check button presses - check ALL buttons available on the gamepad
      for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++) {
        const button = gamepad.buttons[buttonIndex]
        const wasPressed = prevState.buttons[buttonIndex] || false
        const isPressed = button.pressed

        // Detect button press (not release, to avoid double triggers)
        if (!wasPressed && isPressed) {
          const gamepadButton: GamepadButton = {
            gamepadIndex,
            buttonIndex,
            buttonName: GAMEPAD_BUTTON_NAMES[buttonIndex] || `Button ${buttonIndex}`,
          }

          console.log(
            `🎮 Gamepad button detected: ${gamepadButton.buttonName} (${buttonIndex}) on gamepad ${gamepadIndex}`
          )

          // Notify all listeners
          buttonPressCallbacks.forEach((callback) => {
            try {
              callback(gamepadButton)
            } catch (error) {
              console.error('Error in gamepad button callback:', error)
            }
          })
        }
      }

      // Check axes as potential buttons (for analog triggers, stick clicks, etc.)
      for (let axisIndex = 0; axisIndex < gamepad.axes.length; axisIndex++) {
        const axisValue = gamepad.axes[axisIndex]
        const prevAxisValue = prevState.axes[axisIndex] || 0

        // Special handling for Activity Sensor (Axis 9) - detect specific values
        if (axisIndex === 9) {
          // Ignore the "rest" value of 3.29 (button released state)
          const isRestValue = Math.abs(axisValue - 3.29) < 0.1
          const wasRestValue = Math.abs(prevAxisValue - 3.29) < 0.1

          // Only trigger when transitioning FROM rest TO a specific value
          if (wasRestValue && !isRestValue) {
            // Map specific Activity Sensor values to virtual buttons
            let virtualButtonIndex: number
            let buttonName: string

            // Round to nearest 0.01 for value matching
            const roundedValue = Math.round(axisValue * 100) / 100

            if (Math.abs(roundedValue - 0.71) < 0.05) {
              virtualButtonIndex = 2001 // Activity Sensor Button 1
              buttonName = 'Activity Sensor Button 1'
            } else if (Math.abs(roundedValue - -1.0) < 0.05) {
              virtualButtonIndex = 2002 // Activity Sensor Button 2
              buttonName = 'Activity Sensor Button 2'
            } else if (Math.abs(roundedValue - -0.43) < 0.05) {
              virtualButtonIndex = 2003 // Activity Sensor Button 3
              buttonName = 'Activity Sensor Button 3'
            } else if (Math.abs(roundedValue - 0.14) < 0.05) {
              virtualButtonIndex = 2004 // Activity Sensor Button 4
              buttonName = 'Activity Sensor Button 4'
            } else {
              // Unknown Activity Sensor value - create dynamic button
              virtualButtonIndex = 2000 + Math.floor(Math.abs(roundedValue * 100))
              buttonName = `Activity Sensor (${roundedValue.toFixed(2)})`
            }

            const gamepadButton: GamepadButton = {
              gamepadIndex,
              buttonIndex: virtualButtonIndex,
              buttonName,
            }

            console.log(
              `🎮 Activity Sensor activated: ${gamepadButton.buttonName} (virtual button ${virtualButtonIndex}, value: ${axisValue.toFixed(2)}) on gamepad ${gamepadIndex}`
            )

            // Notify all listeners
            buttonPressCallbacks.forEach((callback) => {
              try {
                callback(gamepadButton)
              } catch (error) {
                console.error('Error in gamepad Activity Sensor callback:', error)
              }
            })
          }
        } else {
          // Standard axis handling for other axes (sticks, triggers)
          const threshold = 0.5
          const wasActivated = Math.abs(prevAxisValue) > threshold
          const isActivated = Math.abs(axisValue) > threshold

          // Only trigger on activation, not deactivation
          if (!wasActivated && isActivated) {
            // Create virtual button for axis
            const virtualButtonIndex = 1000 + axisIndex

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
            const direction = axisValue > 0 ? 'Positive' : 'Negative'

            const gamepadButton: GamepadButton = {
              gamepadIndex,
              buttonIndex: virtualButtonIndex,
              buttonName: `${axisName} ${direction}`,
            }

            console.log(
              `🎮 Gamepad axis activated: ${gamepadButton.buttonName} (virtual button ${virtualButtonIndex}, value: ${axisValue.toFixed(2)}) on gamepad ${gamepadIndex}`
            )

            // Notify all listeners
            buttonPressCallbacks.forEach((callback) => {
              try {
                callback(gamepadButton)
              } catch (error) {
                console.error('Error in gamepad axis callback:', error)
              }
            })
          }
        }
      }

      // Update state
      lastGamepadState.set(gamepadIndex, {
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

  onMounted(init)
  onUnmounted(cleanup)

  // Auto-initialize if not in Vue component context (for manager usage)
  if (typeof window !== 'undefined') {
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
  }
}
