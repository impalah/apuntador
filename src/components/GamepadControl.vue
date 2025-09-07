<template>
  <div class="gamepad-control" :data-testid="`gamepad-control-${gamepadMapping.action}`">
    <div class="gamepad-row">
      <div class="gamepad-function">
        <span class="function-label">{{ gamepadMapping.description }}</span>
      </div>
      <div class="gamepad-input">
        <v-text-field
          :model-value="displayButton"
          :placeholder="isListening ? 'Press any gamepad button...' : 'Click to assign button'"
          :error="hasError"
          :error-messages="errorMessage"
          readonly
          density="compact"
          variant="outlined"
          class="button-input"
          :class="{ listening: isListening, 'has-button': displayButton !== 'None' }"
          :data-testid="`gamepad-input-${gamepadMapping.action}`"
          @click="startListening"
          @blur="stopListening"
        >
          <template #prepend-inner>
            <v-icon
              :icon="isListening ? 'mdi-record' : 'mdi-gamepad'"
              :color="isListening ? 'error' : 'primary'"
              size="small"
            />
          </template>
          <template #append-inner>
            <v-btn
              v-if="displayButton !== 'None'"
              icon="mdi-close"
              size="x-small"
              variant="text"
              :data-testid="`gamepad-clear-${gamepadMapping.action}`"
              @click.stop="clearButton"
            />
          </template>
        </v-text-field>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { GamepadMapping } from '@/types'
import { useGamepad, type GamepadButton } from '@/utils/gamepad'

interface Props {
  gamepadMapping: GamepadMapping
  action: string
}

interface Emits {
  change: [action: string, buttonIndex: number | null]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const isListening = ref(false)
const errorMessage = ref('')
const gamepadComposable = useGamepad()
let unsubscribeButtonPress: (() => void) | null = null

// Computed
const displayButton = computed(() => {
  if (props.gamepadMapping.buttonIndex === null) {
    return 'None'
  }

  // Create a mock GamepadButton for display purposes
  const mockButton: GamepadButton = {
    gamepadIndex: 0,
    buttonIndex: props.gamepadMapping.buttonIndex,
    buttonName:
      gamepadComposable.GAMEPAD_BUTTON_NAMES[props.gamepadMapping.buttonIndex] ||
      `Button ${props.gamepadMapping.buttonIndex}`,
  }

  return mockButton.buttonName
})

const hasError = computed(() => !!errorMessage.value)

// Methods
function startListening() {
  if (!gamepadComposable.isSupported.value) {
    errorMessage.value = 'Gamepad API not supported in this browser'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  if (gamepadComposable.connectedGamepads.value.length === 0) {
    errorMessage.value = 'No gamepads connected. Please connect a gamepad and try again.'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  isListening.value = true
  errorMessage.value = ''

  // Subscribe to button presses
  unsubscribeButtonPress = gamepadComposable.onButtonPress((button: GamepadButton) => {
    if (isListening.value) {
      handleButtonPress(button)
    }
  })
}

function stopListening() {
  isListening.value = false
  if (unsubscribeButtonPress) {
    unsubscribeButtonPress()
    unsubscribeButtonPress = null
  }
}

function clearButton() {
  emit('change', props.action, null)
}

function handleButtonPress(button: GamepadButton) {
  if (!isListening.value) return

  // Check if button is already in use by checking all existing mappings
  // This would need to be passed from parent or accessed from store
  // For now, we'll emit the change and let the parent handle validation

  console.log(
    `Gamepad button ${button.buttonIndex} (${button.buttonName}) assigned to action: ${props.action}`
  )
  emit('change', props.action, button.buttonIndex)
  stopListening()
}

// Lifecycle
onMounted(() => {
  // Component mounted
})

onUnmounted(() => {
  stopListening()
})
</script>

<style scoped>
.gamepad-control {
  margin-bottom: 12px;
}

.gamepad-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.gamepad-function {
  flex: 1;
  min-width: 200px;
}

.function-label {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.gamepad-input {
  flex: 1;
  max-width: 250px;
}

:deep(.button-input) {
  .v-field {
    cursor: pointer;
  }

  &.listening .v-field {
    background-color: rgba(var(--v-theme-error), 0.05);
    border-color: rgb(var(--v-theme-error));
  }

  &.has-button .v-field {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }

  .v-field__input {
    cursor: pointer;
    font-weight: 500;
  }
}

:deep(.v-text-field--disabled) {
  opacity: 0.6;
}
</style>
