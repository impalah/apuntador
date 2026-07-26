<template>
  <div
    class="hotkey-control"
    :data-testid="`hotkey-control-${hotkey.action}`"
  >
    <div class="hotkey-row">
      <div class="hotkey-function">
        <span class="function-label">{{ hotkey.description }}</span>
      </div>
      <div class="hotkey-input">
        <v-text-field
          :model-value="displayKey"
          :placeholder="isRecording ? $t('hotkeys.pressAnyKey') : $t('hotkeys.clickToSet')"
          :error="hasError"
          :error-messages="errorMessage"
          readonly
          density="compact"
          variant="outlined"
          class="key-input"
          :class="{ recording: isRecording, 'has-key': displayKey }"
          :data-testid="`hotkey-input-${hotkey.action}`"
          @click="startRecording"
          @keydown="handleKeyDown"
          @blur="stopRecording"
        >
          <template #prepend-inner>
            <v-icon
              :icon="isRecording ? 'mdi-record' : 'mdi-keyboard'"
              :color="isRecording ? 'error' : 'primary'"
              size="small"
            />
          </template>
          <template #append-inner>
            <v-btn
              v-if="displayKey && !isRecording"
              icon="mdi-close"
              size="x-small"
              variant="text"
              :data-testid="`hotkey-clear-${hotkey.action}`"
              @click.stop="clearKey"
            />
          </template>
        </v-text-field>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HotkeyDefinition } from '@/types'
import { hotkeyManager } from '@/utils/input/hotkeys'

interface Props {
  hotkey: HotkeyDefinition
  action: string
}

interface Emits {
  change: [action: string, hotkey: HotkeyDefinition]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const isRecording = ref(false)
const errorMessage = ref('')

// Computed
const displayKey = computed(() => {
  if (!props.hotkey.key) return ''
  return hotkeyManager.getKeyDisplayName(props.hotkey)
})

const hasError = computed(() => !!errorMessage.value)

// Methods
function startRecording() {
  isRecording.value = true
  errorMessage.value = ''
}

function stopRecording() {
  isRecording.value = false
}

function clearKey() {
  const clearedHotkey: HotkeyDefinition = {
    key: '',
    action: props.action,
    description: props.hotkey.description,
  }
  emit('change', props.action, clearedHotkey)
}

function handleKeyDown(event: KeyboardEvent) {
  if (!isRecording.value) return

  event.preventDefault()
  event.stopPropagation()

  // Skip modifier-only keys
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
    return
  }

  const newHotkey: HotkeyDefinition = {
    key: event.key,
    ctrlKey: event.ctrlKey || event.metaKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    action: props.action,
    description: props.hotkey.description,
  }

  // Check if key is already in use
  if (hotkeyManager.isKeyInUse(newHotkey, props.action as any)) {
    errorMessage.value = 'This key combination is already in use'
    setTimeout(() => {
      errorMessage.value = ''
    }, 3000)
    return
  }

  // Valid key combination
  emit('change', props.action, newHotkey)
  stopRecording()
}
</script>

<style scoped>
.hotkey-control {
  margin-bottom: 12px;
}

.hotkey-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.hotkey-function {
  flex: 1;
  min-width: 200px;
}

.function-label {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
}

.hotkey-input {
  flex: 1;
  max-width: 250px;
}

:deep(.key-input) {
  .v-field {
    cursor: pointer;
  }

  &.recording .v-field {
    background-color: rgba(var(--v-theme-error), 0.05);
    border-color: rgb(var(--v-theme-error)) !important;
  }

  &.has-key .v-field {
    background-color: rgba(var(--v-theme-primary), 0.05);
  }

  .v-field__input {
    cursor: pointer;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    text-align: center;
  }
}

@media (max-width: 599px) {
  .hotkey-row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .hotkey-input {
    max-width: none;
  }
}
</style>
