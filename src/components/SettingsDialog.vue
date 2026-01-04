<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="700"
    scrollable
    data-testid="settings-dialog"
  >
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>{{ t('settings.title') }}</span>
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-divider />

      <v-card-text style="height: 500px">
        <v-tabs v-model="activeTab" show-arrows density="compact">
          <v-tab value="appearance" data-testid="appearance-tab">{{
            t('settings.appearance')
          }}</v-tab>
          <v-tab value="behavior" data-testid="behavior-tab">{{ t('settings.behavior') }}</v-tab>
          <v-tab value="controls" data-testid="controls-tab">{{ t('settings.controls') }}</v-tab>
          <v-tab value="cloud" data-testid="cloud-tab">{{ t('settings.cloud') }}</v-tab>
          <v-tab value="data" data-testid="data-tab">{{ t('settings.data') }}</v-tab>
          <v-tab value="about" data-testid="about-tab">{{ t('settings.about') }}</v-tab>
        </v-tabs>

        <v-tabs-window v-model="activeTab">
          <!-- Appearance Tab -->
          <v-tabs-window-item value="appearance">
            <v-form class="mt-4">
              <!-- Language Settings -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">{{ t('settings.language') }}</h3>

                <v-select
                  :model-value="i18nStore.isAutoDetect ? 'auto' : i18nStore.currentLanguage"
                  :label="t('settings.language')"
                  :items="i18nStore.availableLanguages"
                  item-title="label"
                  item-value="value"
                  @update:model-value="i18nStore.changeLanguage"
                />
              </div>

              <!-- Font Settings -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">{{ t('settings.fontFamily') }}</h3>

                <v-select
                  v-model="prefsStore.fontFamily"
                  :label="t('settings.fontFamily')"
                  :items="fontFamilies"
                  @update:model-value="savePrefs"
                />

                <v-slider
                  v-model="prefsStore.fontSizePx"
                  :label="t('settings.fontSize')"
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
                  :label="t('settings.lineHeight')"
                  :min="1"
                  :max="3"
                  :step="0.1"
                  thumb-label
                  @end="savePrefs"
                />
              </div>

              <!-- Colors -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">{{ t('settings.foregroundColor') }}</h3>

                <v-row>
                  <v-col cols="6">
                    <v-text-field
                      v-model="prefsStore.fgColor"
                      :label="t('settings.foregroundColor')"
                      type="color"
                      @change="savePrefs"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="prefsStore.bgColor"
                      :label="t('settings.backgroundColor')"
                      type="color"
                      @change="savePrefs"
                    />
                  </v-col>
                </v-row>
              </div>

              <!-- Highlight Band -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">{{ t('settings.highlightBandHeight') }}</h3>

                <v-select
                  v-model="prefsStore.highlightBandLines"
                  :label="t('settings.highlightBandHeight')"
                  :items="[
                    { title: '1 ' + t('common.line'), value: 1 },
                    { title: '2 ' + t('common.lines'), value: 2 },
                  ]"
                  @update:model-value="savePrefs"
                />

                <v-slider
                  v-model="prefsStore.highlightBandPosPct"
                  :label="t('settings.highlightBandPosition')"
                  :min="10"
                  :max="90"
                  :step="5"
                  thumb-label
                  suffix="%"
                  @end="savePrefs"
                />

                <v-slider
                  v-model="prefsStore.dimmingIntensity"
                  :label="t('settings.dimmingIntensity')"
                  :min="0"
                  :max="1"
                  :step="0.1"
                  thumb-label
                  @end="savePrefs"
                />
              </div>

              <!-- Mirror Settings -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">{{ t('settings.mirrorHorizontal') }}</h3>

                <v-row>
                  <v-col cols="6">
                    <v-switch
                      v-model="prefsStore.mirrorH"
                      :label="t('settings.mirrorHorizontal')"
                      @change="savePrefs"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-switch
                      v-model="prefsStore.mirrorV"
                      :label="t('settings.mirrorVertical')"
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
                <h3 class="text-subtitle-1 mb-3">{{ t('settings.scrollSpeed') }}</h3>

                <v-slider
                  v-model="prefsStore.speedPxPerSec"
                  :label="t('settings.scrollSpeed')"
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
                      :label="t('settings.speedMin')"
                      type="number"
                      suffix="px/s"
                      @change="savePrefs"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model.number="prefsStore.speedMax"
                      :label="t('settings.speedMax')"
                      type="number"
                      suffix="px/s"
                      @change="savePrefs"
                    />
                  </v-col>
                </v-row>
              </div>
            </v-form>
          </v-tabs-window-item>

          <!-- Controls Tab (Hotkeys + Gamepad) -->
          <v-tabs-window-item value="controls">
            <v-form class="mt-4">
              <!-- Hotkeys Settings -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">{{ t('hotkeys.title') }}</h3>

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
                    {{ t('hotkeys.resetToDefaults') }}
                  </v-btn>
                </div>
              </div>

              <!-- Gamepad Status -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">{{ t('gamepad.status') }}</h3>

                <v-alert v-if="!gamepadSupported" type="warning" variant="tonal" class="mb-4">
                  {{ t('gamepad.notSupported') }}
                </v-alert>

                <v-alert
                  v-else-if="connectedGamepads === 0"
                  type="info"
                  variant="tonal"
                  class="mb-4"
                >
                  {{ t('gamepad.noGamepads') }}
                </v-alert>

                <v-alert v-else type="success" variant="tonal" class="mb-4">
                  {{ t('gamepad.connected', { count: connectedGamepads }) }}
                </v-alert>
              </div>

              <!-- Gamepad Button Mappings -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">{{ t('gamepad.buttonAssignments') }}</h3>
                <p class="text-caption text-medium-emphasis mb-4">
                  {{ t('gamepad.assignmentInstructions') }}
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
                    {{ t('gamepad.resetToDefaults') }}
                  </v-btn>
                </div>
              </div>
            </v-form>
          </v-tabs-window-item>

          <!-- Cloud Tab -->
          <v-tabs-window-item value="cloud">
            <div class="mt-4">
              <!-- Cloud Storage Providers -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">{{ t('settings.cloudProviders') }}</h3>

                <!-- Cloud Provider Selector -->
                <CloudProviderSelector />
              </div>
            </div>
          </v-tabs-window-item>

          <!-- Data Tab -->
          <v-tabs-window-item value="data">
            <div class="mt-4">
              <!-- Data Management -->
              <div class="mb-6">
                <h3 class="text-subtitle-1 mb-3">{{ t('settings.dataManagement') }}</h3>

                <v-btn color="warning" prepend-icon="mdi-refresh" @click="onResetSettings">
                  {{ t('settings.resetSettings') }}
                </v-btn>

                <v-btn color="error" prepend-icon="mdi-delete" class="ml-2" @click="onClearAllData">
                  {{ t('settings.clearAllData') }}
                </v-btn>
              </div>

              <!-- Storage Info -->
              <div>
                <h3 class="text-subtitle-1 mb-3">{{ t('settings.storageInfo') }}</h3>
                <v-alert type="info" variant="outlined">
                  {{ t('settings.localStorageNote') }}
                </v-alert>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- About Tab -->
          <v-tabs-window-item value="about">
            <div class="mt-4 text-center">
              <!-- App Title and Subtitle -->
              <div class="mb-6">
                <h2 class="text-h4 mb-2">{{ versionInfo.name }} - {{ t('settings.subtitle') }}</h2>
                <p class="text-body-1 text-medium-emphasis">
                  {{ t('settings.version') }}: {{ versionInfo.version }}
                </p>
              </div>

              <!-- Copyright -->
              <div class="mb-4">
                <p class="text-body-2 text-medium-emphasis">{{ versionInfo.copyright }}</p>
              </div>

              <!-- Repository Link -->
              <div>
                <v-btn
                  :href="versionInfo.repositoryUrl"
                  target="_blank"
                  variant="outlined"
                  prepend-icon="mdi-github"
                >
                  GitHub Repository
                </v-btn>
              </div>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn
          v-if="isNativePlatform"
          color="secondary"
          variant="text"
          @click="goToEnrollmentTest"
          prepend-icon="mdi-shield-check"
        >
          Device Enrollment Test
        </v-btn>
        <v-btn
          v-if="isNativePlatform"
          color="info"
          variant="text"
          @click="goToMTLSTest"
          prepend-icon="mdi-lock-check"
        >
          mTLS Client Test
        </v-btn>
        <v-btn
          v-if="isTauriPlatform"
          color="success"
          variant="text"
          @click="goToDesktopMTLSTest"
          prepend-icon="mdi-desktop-mac"
        >
          Desktop mTLS Test
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          data-testid="close-settings-btn"
          @click="$emit('update:modelValue', false)"
        >
          {{ t('common.close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Capacitor } from '@capacitor/core'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useI18nStore } from '@/stores/useI18nStore'
import { storage } from '@/utils/persistence'
import type { HotkeyDefinition } from '@/types'
import { useGamepad } from '@/utils/gamepad'
import { getVersionInfo } from '@/utils/version'
import HotkeyControl from './HotkeyControl.vue'
import GamepadControl from './GamepadControl.vue'
import CloudProviderSelector from './cloud/CloudProviderSelector.vue'
import { isTauri } from '@/utils/tauri'

// I18n
const { t } = useI18n()

// Router
const router = useRouter()

// Props
interface Props {
  modelValue: boolean
  initialTab?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialTab: 'appearance',
})

// Watch for prop changes to update active tab
watch(
  () => props.initialTab,
  (newTab) => {
    if (newTab && props.modelValue) {
      activeTab.value = newTab
    }
  }
)

// Watch for dialog opening to set initial tab
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && props.initialTab) {
      activeTab.value = props.initialTab
    }
  }
)

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// Stores
const prefsStore = usePrefsStore()
const i18nStore = useI18nStore()

// Gamepad composable
const gamepadComposable = useGamepad()

// Version info
const versionInfo = getVersionInfo()

// Computed
const gamepadSupported = computed(() => gamepadComposable.isSupported.value)
const connectedGamepads = computed(() => gamepadComposable.connectedGamepads.value.length)

// State
const activeTab = ref(props.initialTab)

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

async function onResetSettings() {
  prefsStore.reset()
  i18nStore.changeLanguage('auto') // Reset language to auto-detect
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
  if (confirm(t('settings.clearDataConfirm'))) {
    await storage.clear()
    prefsStore.reset()
    prefsStore.applyCSSVariables()
    // Reload the page to reset everything
    globalThis.location.reload()
  }
}

// Platform detection
const isNativePlatform = computed(() => Capacitor.isNativePlatform())

// Check if running in Tauri (Desktop) - use the utility function
const isTauriPlatform = computed(() => {
  const result = isTauri()
  console.log('isTauriPlatform check:', result)
  return result
})

// Navigate to device enrollment test
function goToEnrollmentTest() {
  emit('update:modelValue', false)
  router.push({ name: 'device-enrollment-test' })
}

// Navigate to mTLS client test
function goToMTLSTest() {
  emit('update:modelValue', false)
  router.push({ name: 'mtls-client-test' })
}

// Navigate to Desktop mTLS test
function goToDesktopMTLSTest() {
  emit('update:modelValue', false)
  router.push({ name: 'desktop-mtls-test' })
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
