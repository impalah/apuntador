<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="600"
    scrollable
    data-testid="settings-dialog"
  >
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Settings</span>
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-divider />

      <v-card-text style="height: 500px">
        <v-tabs v-model="activeTab">
          <v-tab value="appearance" data-testid="appearance-tab">Appearance</v-tab>
          <v-tab value="behavior" data-testid="behavior-tab">Behavior</v-tab>
          <v-tab value="gamepad" data-testid="gamepad-tab">Gamepad</v-tab>
          <v-tab value="data" data-testid="data-tab">Data</v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab">
          <!-- Appearance Tab -->
          <v-tabs-window-item value="appearance">
            <v-form class="mt-4">
              <!-- Font Settings -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">Font</h3>

                <v-select
                  v-model="prefsStore.fontFamily"
                  label="Font Family"
                  :items="fontFamilies"
                  @update:model-value="savePrefs"
                />

                <v-slider
                  v-model="prefsStore.fontSizePx"
                  label="Font Size"
                  :min="12"
                  :max="200"
                  :step="2"
                  thumb-label
                  @end="savePrefs"
                >
                  <template #append>
                    <v-text-field
                      v-model.number="prefsStore.fontSizePx"
                      type="number"
                      style="width: 80px"
                      density="compact"
                      suffix="px"
                      @change="savePrefs"
                    />
                  </template>
                </v-slider>

                <v-slider
                  v-model="prefsStore.lineHeight"
                  label="Line Height"
                  :min="1"
                  :max="3"
                  :step="0.1"
                  thumb-label
                  @end="savePrefs"
                />
              </div>

              <!-- Colors -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">Colors</h3>

                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model="prefsStore.fgColor"
                      label="Text Color"
                      type="color"
                      @change="savePrefs"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="prefsStore.bgColor"
                      label="Background Color"
                      type="color"
                      @change="savePrefs"
                    />
                  </v-col>
                </v-row>
              </div>

              <!-- Highlight Band -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">Highlight Band</h3>

                <v-select
                  v-model="prefsStore.highlightBandLines"
                  label="Band Height"
                  :items="[
                    { title: '1 line', value: 1 },
                    { title: '2 lines', value: 2 },
                  ]"
                  @update:model-value="savePrefs"
                />

                <v-slider
                  v-model="prefsStore.highlightBandPosPct"
                  label="Vertical Position"
                  :min="10"
                  :max="90"
                  :step="5"
                  thumb-label
                  suffix="%"
                  @end="savePrefs"
                />

                <v-slider
                  v-model="prefsStore.dimmingIntensity"
                  label="Dimming Intensity"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  thumb-label
                  @end="savePrefs"
                />
              </div>

              <!-- Mirror Settings -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">Mirror</h3>

                <v-row>
                  <v-col cols="6">
                    <v-switch
                      v-model="prefsStore.mirrorH"
                      label="Mirror Horizontal"
                      @change="savePrefs"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-switch
                      v-model="prefsStore.mirrorV"
                      label="Mirror Vertical"
                      @change="savePrefs"
                    />
                  </v-col>
                </v-row>
              </div>
            </v-form>
          </v-tabs-window-item>

          <!-- Behavior Tab -->
          <v-tabs-window-item value="behavior">
            <v-form class="mt-4">
              <!-- Speed Settings -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">Scroll Speed</h3>

                <v-slider
                  v-model="prefsStore.speedPxPerSec"
                  label="Default Speed"
                  :min="prefsStore.speedMin"
                  :max="prefsStore.speedMax"
                  :step="5"
                  thumb-label
                  suffix=" px/s"
                  @end="savePrefs"
                />

                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model.number="prefsStore.speedMin"
                      label="Minimum Speed"
                      type="number"
                      suffix="px/s"
                      @change="savePrefs"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model.number="prefsStore.speedMax"
                      label="Maximum Speed"
                      type="number"
                      suffix="px/s"
                      @change="savePrefs"
                    />
                  </v-col>
                </v-row>
              </div>

              <!-- Hotkeys Settings -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">Hotkeys</h3>

                <div class="hotkeys-container">
                  <HotkeyControl
                    v-for="(hotkey, action) in prefsStore.customHotkeys"
                    :key="action"
                    :hotkey="hotkey"
                    :action="action as string"
                    @change="onHotkeyChange"
                  />
                </div>

                <div class="mt-4">
                  <v-btn color="warning" prepend-icon="mdi-refresh" @click="onResetHotkeys">
                    Reset to Defaults
                  </v-btn>
                </div>
              </div>
            </v-form>
          </v-tabs-window-item>

          <!-- Gamepad Tab -->
          <v-tabs-window-item value="gamepad">
            <v-form class="mt-4">
              <!-- Gamepad Status -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">Gamepad Status</h3>

                <v-alert v-if="!gamepadSupported" type="warning" variant="tonal" class="mb-4">
                  Gamepad API is not supported in this browser.
                </v-alert>

                <v-alert
                  v-else-if="connectedGamepads === 0"
                  type="info"
                  variant="tonal"
                  class="mb-4"
                >
                  No gamepads connected. Connect a gamepad and press any button to get started.
                </v-alert>

                <v-alert v-else type="success" variant="tonal" class="mb-4">
                  {{ connectedGamepads }} gamepad(s) connected and ready to use.
                </v-alert>
              </div>

              <!-- Gamepad Button Mappings -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">Button Assignments</h3>
                <p class="text-caption text-medium-emphasis mb-4">
                  Assign gamepad buttons to teleprompter actions. Click on an input field and press
                  any gamepad button to assign it.
                </p>

                <div class="gamepad-mappings-container">
                  <GamepadControl
                    v-for="(mapping, action) in prefsStore.customGamepadMappings"
                    :key="action"
                    :gamepad-mapping="mapping"
                    :action="action as string"
                    @change="onGamepadMappingChange"
                  />
                </div>

                <div class="mt-4">
                  <v-btn color="warning" prepend-icon="mdi-refresh" @click="onResetGamepadMappings">
                    Reset to Defaults (All None)
                  </v-btn>
                </div>
              </div>
            </v-form>
          </v-tabs-window-item>

          <!-- Data Tab -->
          <v-tabs-window-item value="data">
            <div class="mt-4">
              <!-- Import File -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">Import Content</h3>

                <v-file-input
                  ref="fileInputRef"
                  v-model="selectedFiles"
                  label="Select markdown or text file"
                  accept=".md,.txt,.markdown"
                  prepend-icon="mdi-file-import"
                  @change="onFileSelect"
                />

                <v-btn prepend-icon="mdi-file-import" @click="triggerFileInput">
                  Import File
                </v-btn>
              </div>

              <!-- Data Management -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">Data Management</h3>

                <v-btn color="warning" prepend-icon="mdi-refresh" @click="onResetSettings">
                  Reset Settings
                </v-btn>

                <v-btn color="error" prepend-icon="mdi-delete" class="ml-2" @click="onClearAllData">
                  Clear All Data
                </v-btn>
              </div>

              <!-- Storage Info -->
              <div>
                <h3 class="text-subtitle-1 mb-3">Storage Information</h3>
                <v-alert type="info" variant="outlined">
                  All your data is stored locally in your browser. No information is sent to
                  external servers.
                </v-alert>
              </div>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="$emit('update:modelValue', false)"> Done </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { storage } from '@/utils/persistence'
import type { HotkeyDefinition } from '@/types'
import { useGamepad } from '@/utils/gamepad'
import HotkeyControl from './HotkeyControl.vue'
import GamepadControl from './GamepadControl.vue'

// Props
interface Props {
  modelValue: boolean
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  fileImported: [content: string]
}>()

// Stores
const prefsStore = usePrefsStore()

// Gamepad composable
const gamepadComposable = useGamepad()

// Computed
const gamepadSupported = computed(() => gamepadComposable.isSupported.value)
const connectedGamepads = computed(() => gamepadComposable.connectedGamepads.value.length)

// State
const activeTab = ref('appearance')
const selectedFiles = ref<File[]>([])
const fileInputRef = ref()

// Font families available
const fontFamilies = [
  'Roboto, sans-serif',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Monaco, monospace',
  'system-ui, sans-serif',
]

// Actions
async function savePrefs() {
  await prefsStore.save()
  prefsStore.applyCSSVariables()
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

async function onFileSelect() {
  if (selectedFiles.value.length === 0) return

  const file = selectedFiles.value[0]

  try {
    const content = await readFileAsText(file)
    emit('fileImported', content)
    selectedFiles.value = []
  } catch (error) {
    console.error('Error reading file:', error)
    // TODO: Show error toast
  }
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'UTF-8')
  })
}

async function onResetSettings() {
  prefsStore.reset()
  await prefsStore.save()
  prefsStore.applyCSSVariables()
}

async function onResetHotkeys() {
  prefsStore.resetHotkeys()
  await prefsStore.save()
}

function onHotkeyChange(action: string, hotkey: HotkeyDefinition) {
  prefsStore.updateHotkey(action, hotkey)
}

async function onResetGamepadMappings() {
  prefsStore.resetGamepadMappings()
  await prefsStore.save()
}

function onGamepadMappingChange(action: string, buttonIndex: number | null) {
  prefsStore.updateGamepadMapping(action, buttonIndex)
}

async function onClearAllData() {
  // Show confirmation dialog first
  if (confirm('This will delete all your data including settings and content. Are you sure?')) {
    await storage.clear()
    prefsStore.reset()
    prefsStore.applyCSSVariables()
    // Reload the page to reset everything
    window.location.reload()
  }
}
</script>

<style scoped>
.v-tabs-window-item {
  padding: 0 !important;
}

.hotkeys-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  padding: 12px;
}

.gamepad-mappings-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  padding: 12px;
}
</style>
