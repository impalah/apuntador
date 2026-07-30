<template>
  <v-bottom-sheet
    :model-value="modelValue"
    :persistent="false"
    :scrim="true"
    :z-index="Z_INDEX.ALWAYS_ON_TOP_NESTED"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card
      class="actions-menu"
      :class="{ 'maximized': isMaximized }"
      rounded="t-xl"
    >
      <!-- Handle bar para indicar que es arrastrable -->
      <div
        class="handle-bar"
        @click="toggleMaximize"
      >
        <div class="handle" />
      </div>

      <v-card-text class="menu-content">
        <!-- Settings View (cuando showSettings es true) -->
        <div
          v-if="showSettings"
          class="settings-container"
        >
          <!-- Header con título y botón volver -->
          <div class="settings-header">
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              size="small"
              data-testid="close-settings-btn"
              @click="showSettings = false"
            />
            <h2 class="settings-title">
              {{ t('settings.title') }}
            </h2>
            <div style="width: 40px" />
          </div>

          <!-- Settings tabs y contenido -->
          <div class="settings-content">
            <v-tabs
              v-model="activeTab"
              show-arrows
              density="compact"
            >
              <v-tab value="appearance">
                {{ t('settings.appearance') }}
              </v-tab>
              <v-tab value="controls">
                {{ t('settings.controls') }}
              </v-tab>
              <v-tab value="cloud">
                {{ t('settings.cloud') }}
              </v-tab>
              <v-tab value="about">
                {{ t('settings.about') }}
              </v-tab>
            </v-tabs>

            <v-tabs-window
              v-model="activeTab"
              class="mt-4"
            >
              <!-- Appearance Tab -->
              <v-tabs-window-item value="appearance">
                <v-form>
                  <!-- Language Settings -->
                  <div class="mb-6">
                    <h3 class="text-subtitle-1 mb-3">
                      {{ t('settings.language') }}
                    </h3>
                    <v-select
                      :model-value="i18nStore.isAutoDetect ? 'auto' : i18nStore.currentLanguage"
                      :label="t('settings.language')"
                      :items="i18nStore.availableLanguages"
                      item-title="label"
                      item-value="value"
                      @update:model-value="i18nStore.changeLanguage"
                    />
                  </div>

                  <!-- Which frame's appearance is being edited -->
                  <v-alert
                    type="info"
                    variant="tonal"
                    density="compact"
                    class="mb-4"
                    data-testid="appearance-editing-frame"
                  >
                    {{
                      activeAppearance.isMono.value
                        ? t('settings.editingFrameMonospace')
                        : t('settings.editingFrameMarkdown')
                    }}
                  </v-alert>

                  <!-- Font Settings -->
                  <div class="mb-6">
                    <h3 class="text-subtitle-1 mb-3">
                      {{ t('settings.fontFamily') }}
                    </h3>
                    <v-select
                      :model-value="activeAppearance.fontFamily.value"
                      :label="t('settings.fontFamily')"
                      :items="activeAppearance.fontFamilyOptions.value"
                      @update:model-value="activeAppearance.setFontFamily"
                    />

                    <SliderControl
                      :model-value="activeAppearance.fontSizePx.value"
                      :label="t('settings.fontSize')"
                      :min="12"
                      :max="200"
                      :step="2"
                      show-input
                      input-suffix="px"
                      @update:model-value="activeAppearance.setFontSizePx"
                    />

                    <SliderControl
                      :model-value="activeAppearance.lineHeight.value"
                      :label="t('settings.lineHeight')"
                      :min="1"
                      :max="3"
                      :step="0.1"
                      @update:model-value="activeAppearance.setLineHeight"
                    />
                  </div>

                  <!-- Colors -->
                  <div class="mb-6">
                    <h3 class="text-subtitle-1 mb-3">
                      {{ t('settings.foregroundColor') }}
                    </h3>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          :model-value="activeAppearance.fgColor.value"
                          :label="t('settings.foregroundColor')"
                          type="color"
                          @update:model-value="activeAppearance.setFgColor"
                        />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          :model-value="activeAppearance.bgColor.value"
                          :label="t('settings.backgroundColor')"
                          type="color"
                          @update:model-value="activeAppearance.setBgColor"
                        />
                      </v-col>
                    </v-row>
                  </div>

                  <!-- Highlight Band -->
                  <div class="mb-6">
                    <h3 class="text-subtitle-1 mb-3">
                      {{ t('settings.highlightBandHeight') }}
                    </h3>
                    <v-select
                      v-model="prefsStore.highlightBandLines"
                      :label="t('settings.highlightBandHeight')"
                      :items="[
                        { title: '1 ' + t('common.line'), value: 1 },
                        { title: '2 ' + t('common.lines'), value: 2 },
                      ]"
                      @update:model-value="savePrefs"
                    />

                    <SliderControl
                      v-model="prefsStore.highlightBandPosPct"
                      :label="t('settings.highlightBandPosition')"
                      :min="10"
                      :max="90"
                      :step="5"
                      suffix="%"
                      @change="savePrefs"
                    />

                    <SliderControl
                      v-model="prefsStore.dimmingIntensity"
                      :label="t('settings.dimmingIntensity')"
                      :min="0"
                      :max="1"
                      :step="0.1"
                      @change="savePrefs"
                    />
                  </div>
                </v-form>
              </v-tabs-window-item>

              <!-- Controls Tab -->
              <v-tabs-window-item value="controls">
                <v-form>
                  <!-- Hotkeys Settings -->
                  <div class="mb-6">
                    <h3 class="text-subtitle-1 mb-3">
                      {{ t('hotkeys.title') }}
                    </h3>
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
                      <v-btn
                        color="warning"
                        prepend-icon="mdi-refresh"
                        @click="onResetHotkeys"
                      >
                        {{ t('hotkeys.resetToDefaults') }}
                      </v-btn>
                    </div>
                  </div>

                  <!-- Gamepad Status -->
                  <div class="mb-6">
                    <h3 class="text-subtitle-1 mb-3">
                      {{ t('gamepad.status') }}
                    </h3>
                    <v-alert
                      v-if="!gamepadSupported"
                      type="warning"
                      variant="tonal"
                      class="mb-4"
                    >
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

                    <v-alert
                      v-else
                      type="success"
                      variant="tonal"
                      class="mb-4"
                    >
                      {{ t('gamepad.connected', { count: connectedGamepads }) }}
                    </v-alert>
                  </div>

                  <!-- Gamepad Button Mappings -->
                  <div class="mb-6">
                    <h3 class="text-subtitle-1 mb-3">
                      {{ t('gamepad.buttonAssignments') }}
                    </h3>
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
                      <v-btn
                        color="warning"
                        prepend-icon="mdi-refresh"
                        @click="onResetGamepadMappings"
                      >
                        {{ t('gamepad.resetToDefaults') }}
                      </v-btn>
                    </div>
                  </div>
                </v-form>
              </v-tabs-window-item>

              <!-- Cloud Tab -->
              <v-tabs-window-item value="cloud">
                <div>
                  <!-- Cloud Storage Providers -->
                  <div class="mb-6">
                    <h3 class="text-subtitle-1 mb-3">
                      {{ t('settings.cloudProviders') }}
                    </h3>
                    <CloudProviderSelector />
                  </div>
                </div>
              </v-tabs-window-item>

              <!-- About Tab -->
              <v-tabs-window-item value="about">
                <div class="text-center">
                  <!-- App Title and Subtitle -->
                  <div class="mb-6">
                    <h2 class="text-h4 mb-2">
                      {{ versionInfo.name }} - {{ t('settings.subtitle') }}
                    </h2>
                    <p class="text-body-1 text-medium-emphasis">
                      {{ t('settings.version') }}: {{ versionInfo.version }}
                    </p>
                  </div>

                  <!-- Copyright -->
                  <div class="mb-4">
                    <p class="text-body-2 text-medium-emphasis">
                      {{ versionInfo.copyright }}
                    </p>
                  </div>

                  <!-- Repository Link -->
                  <div class="mb-6">
                    <v-btn
                      :href="versionInfo.repositoryUrl"
                      target="_blank"
                      variant="outlined"
                      prepend-icon="mdi-github"
                    >
                      GitHub Repository
                    </v-btn>
                  </div>

                  <!-- Divider -->
                  <v-divider class="my-6" />

                  <!-- Data Management -->
                  <div>
                    <h3 class="text-subtitle-1 mb-4">
                      {{ t('settings.dataManagement') }}
                    </h3>
                    <div class="d-flex flex-column gap-2">
                      <v-btn
                        color="warning"
                        prepend-icon="mdi-refresh"
                        block
                        @click="onResetSettings"
                      >
                        {{ t('settings.resetSettings') }}
                      </v-btn>

                      <v-btn
                        color="error"
                        prepend-icon="mdi-delete"
                        block
                        @click="onClearAllData"
                      >
                        {{ t('settings.clearAllData') }}
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-tabs-window-item>
            </v-tabs-window>
          </div>
        </div>

        <!-- Actions View (cuando showSettings es false) -->
        <div v-else>
          <!-- Navegación Section -->
          <div class="menu-section">
            <h3 class="section-title">
              {{ t('common.navigation') }}
            </h3>
          
            <!-- Primera fila: Retroceder 5, Home, Avanzar 5 -->
            <div class="button-grid">
              <button 
                class="action-btn-frequent" 
                data-testid="rewind-button"
                @click="handleAction('stepLines', -5)"
              >
                <v-icon
                  icon="mdi-skip-backward"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.rewind') }} 5</span>
              </button>
              <button
                class="action-btn-frequent"
                @click="handleAction('goHome')"
              >
                <v-icon
                  icon="mdi-home"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.home') }}</span>
              </button>
              <button 
                class="action-btn-frequent" 
                data-testid="forward-button"
                @click="handleAction('stepLines', 5)"
              >
                <v-icon
                  icon="mdi-skip-forward"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.forward') }} 5</span>
              </button>
            </div>

            <!-- Segunda fila: Retroceder 1, Fin, Avanzar 1 -->
            <div class="button-grid">
              <button
                class="action-btn-frequent"
                @click="handleAction('stepLines', -1)"
              >
                <v-icon
                  icon="mdi-chevron-up"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.rewindLine') }}</span>
              </button>
              <button
                class="action-btn-frequent"
                @click="handleAction('goEnd')"
              >
                <v-icon
                  icon="mdi-format-vertical-align-bottom"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.end') }}</span>
              </button>
              <button
                class="action-btn-frequent"
                @click="handleAction('stepLines', 1)"
              >
                <v-icon
                  icon="mdi-chevron-down"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.forwardLine') }}</span>
              </button>
            </div>
          </div>

          <v-divider class="section-divider" />

          <!-- Apariencia Section -->
          <div class="menu-section">
            <h3 class="section-title">
              {{ t('settings.appearance') }}
            </h3>
          
            <!-- Primera fila: Espejo H, Modo Teatro, Espejo V -->
            <div class="button-grid">
              <button 
                class="action-btn-frequent" 
                :class="{ active: mirrorH }"
                data-testid="mirror-h-button"
                @click="handleAction('mirrorToggle', 'h')"
              >
                <v-icon
                  icon="mdi-flip-horizontal"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.mirrorH') }}</span>
              </button>
              <button 
                class="action-btn-frequent"
                :class="{ active: isTheaterMode }"
                @click="handleAction('toggleTheater')"
              >
                <v-icon
                  :icon="isTheaterMode ? 'mdi-fullscreen-exit' : 'mdi-television'"
                  size="32"
                />
                <span class="btn-text">{{ isTheaterMode ? t('toolbar.exitTheater') : t('toolbar.theaterMode') }}</span>
              </button>
              <button 
                class="action-btn-frequent"
                :class="{ active: mirrorV }"
                data-testid="mirror-v-button"
                @click="handleAction('mirrorToggle', 'v')"
              >
                <v-icon
                  icon="mdi-flip-vertical"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.mirrorV') }}</span>
              </button>
            </div>

            <!-- Segunda fila: Alinear izquierda, centro, derecha -->
            <div class="button-grid">
              <button
                class="action-btn-frequent"
                :class="{ active: activeAppearance.textAlignment.value === 'left' }"
                data-testid="align-left-button"
                @click="handleTextAlign('left')"
              >
                <v-icon
                  icon="mdi-format-align-left"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.alignLeft') }}</span>
              </button>
              <button
                class="action-btn-frequent"
                :class="{ active: activeAppearance.textAlignment.value === 'center' }"
                data-testid="align-center-button"
                @click="handleTextAlign('center')"
              >
                <v-icon
                  icon="mdi-format-align-center"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.alignCenter') }}</span>
              </button>
              <button
                class="action-btn-frequent"
                :class="{ active: activeAppearance.textAlignment.value === 'right' }"
                data-testid="align-right-button"
                @click="handleTextAlign('right')"
              >
                <v-icon
                  icon="mdi-format-align-right"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.alignRight') }}</span>
              </button>
            </div>
          </div>

          <v-divider class="section-divider" />

          <!-- Modo de avance Section -->
          <div class="menu-section">
            <h3 class="section-title">
              {{ t('settings.scrollMode') }}
            </h3>

            <div class="button-grid-2">
              <button
                class="action-btn-frequent"
                :class="{ active: prefsStore.scrollMode === 'auto' }"
                data-testid="scroll-mode-auto-quick-button"
                @click="handleScrollModeChange('auto')"
              >
                <v-icon
                  icon="mdi-play-speed"
                  size="32"
                />
                <span class="btn-text">{{ t('settings.scrollModeAuto') }}</span>
              </button>
              <button
                class="action-btn-frequent"
                :class="{ active: prefsStore.scrollMode === 'voice' }"
                data-testid="scroll-mode-voice-quick-button"
                @click="handleScrollModeChange('voice')"
              >
                <v-icon
                  icon="mdi-microphone"
                  size="32"
                />
                <span class="btn-text">{{ t('settings.scrollModeVoice') }}</span>
              </button>
            </div>
          </div>

          <v-divider class="section-divider" />

          <!-- Opciones Section -->
          <div class="menu-section">
            <h3 class="section-title">
              {{ t('settings.options') }}
            </h3>
          
            <!-- Botones opciones (grid 3 columnas con espacio en medio) -->
            <div class="options-grid">
              <button 
                class="action-btn-frequent" 
                data-testid="editor-button"
                @click="handleAction('openEditor')"
              >
                <v-icon
                  icon="mdi-pencil"
                  size="32"
                />
                <span class="btn-text">{{ t('toolbar.openEditor') }}</span>
              </button>
            
              <!-- Espacio vacío en el centro -->
              <div />
            
              <button 
                class="action-btn-frequent" 
                data-testid="settings-button"
                @click="handleAction('openSettings')"
              >
                <v-icon
                  icon="mdi-tune-variant"
                  size="32"
                />
                <span class="btn-text">{{ t('settings.title') }}</span>
              </button>
            </div>
          </div>
        </div> <!-- Cierre de v-else (Actions View) -->
      </v-card-text>
    </v-card>
  </v-bottom-sheet>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsActions } from '@/composables/useSettingsActions'
import { useActiveFrameAppearance } from '@/composables/useActiveFrameAppearance'
import { Z_INDEX, type ScrollMode } from '@/utils/constants'
import HotkeyControl from './HotkeyControl.vue'
import GamepadControl from './GamepadControl.vue'
import CloudProviderSelector from './cloud/CloudProviderSelector.vue'
import SliderControl from './SliderControl.vue'

const { t } = useI18n()

// Per-frame appearance (font/size/colors/alignment) - see useActiveFrameAppearance.ts
const activeAppearance = useActiveFrameAppearance()

// Shared preferences/hotkeys/gamepad/data-management actions (also used by SettingsDialog)
const {
  prefsStore,
  i18nStore,
  versionInfo,
  gamepadSupported,
  connectedGamepads,
  savePrefs,
  onResetSettings,
  onResetHotkeys,
  onHotkeyChange,
  onResetGamepadMappings,
  onGamepadMappingChange,
  onClearAllData: clearAllData,
} = useSettingsActions()

function onClearAllData() {
  return clearAllData(t('settings.clearDataConfirm'))
}

// Estado local para controlar vista de settings (moved after props declaration)
const activeTab = ref('appearance')
const isMaximized = ref(false)

// Toggle maximize/minimize
function toggleMaximize() {
  isMaximized.value = !isMaximized.value
}

// Props
interface Props {
  modelValue: boolean
  fontSize: number
  mirrorH: boolean
  mirrorV: boolean
  isImmersive?: boolean
  isImmersiveSupported?: boolean
  isTheaterMode?: boolean
  isTheaterLoading?: boolean
  isDesktop?: boolean
  initialSettingsView?: boolean
}

const props = defineProps<Props>()

// Estado local para controlar vista de settings (initialized after props)
const showSettings = ref(props.initialSettingsView || false)

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'stepLines': [lines: number]
  'goHome': []
  'goEnd': []
  'fontSizeChange': [size: number]
  'mirrorToggle': [axis: 'h' | 'v']
  'toggleImmersive': []
  'toggleTheater': []
  'openFile': []
  'openEditor': []
  'openSettings': []
  'minimizeWindow': []
  'maximizeWindow': []
  'toggleFullscreen': []
}>()

// Handle action and optionally close menu
const handleAction = (action: string, ...args: any[]) => {
  // Emit the action
  switch (action) {
    case 'stepLines':
      emit('stepLines', args[0])
      break
    case 'goHome':
      emit('goHome')
      break
    case 'goEnd':
      emit('goEnd')
      break
    case 'mirrorToggle':
      emit('mirrorToggle', args[0])
      break
    case 'toggleImmersive':
      emit('toggleImmersive')
      break
    case 'toggleTheater':
      emit('toggleTheater')
      break
    case 'openFile':
      emit('openFile')
      break
    case 'openEditor':
      emit('openEditor')
      // Close menu only for openEditor
      emit('update:modelValue', false)
      break
    case 'openSettings':
      // Show settings view inside ActionsMenu instead of emitting
      showSettings.value = true
      break
    case 'minimizeWindow':
      emit('minimizeWindow')
      break
    case 'maximizeWindow':
      emit('maximizeWindow')
      break
    case 'toggleFullscreen':
      emit('toggleFullscreen')
      break
  }
  
  // Don't close menu by default (only openEditor and openSettings close it)
}

// Handle text alignment - routes to whichever frame's appearance store is active
const handleTextAlign = (alignment: 'left' | 'center' | 'right') => {
  activeAppearance.setTextAlignment(alignment)
  // Don't close menu for text alignment changes
}

// Handle scroll mode (auto/voice) - don't close menu, same as other quick toggles
function handleScrollModeChange(mode: ScrollMode) {
  prefsStore.setScrollMode(mode)
}
</script>

<style scoped lang="scss">
.actions-menu {
  background-color: #1a1a1a; /* Gris oscuro como Instagram */
  border: none;
  max-height: 33vh;
  display: flex;
  flex-direction: column;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  transition: max-height 0.3s ease;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  
  &.maximized {
    max-height: calc(100vh - 100px);
  }
}

.handle-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #1a1a1a; /* Mismo color que el fondo del menú */
  display: flex;
  justify-content: center;
  padding: 12px 0 8px 0;
  cursor: pointer;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }
  
  &:active {
    background: rgba(255, 255, 255, 0.08);
  }
}

.handle {
  width: 40px;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.4); /* Más visible en gris oscuro */
  border-radius: 2px;
}

.menu-content {
  padding: 16px 24px calc(180px + env(safe-area-inset-bottom)) 24px;
  max-width: 500px;
  margin: 0 auto;
  overflow-y: auto;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

.menu-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6); /* Más visible en gris oscuro */
  letter-spacing: 1px;
  margin-bottom: 16px;
  text-align: center;
}

.section-divider {
  margin: 24px 0;
  opacity: 0.3;
}

/* Botones frecuentes (3 por fila, icono + texto) */
.button-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

/* Botones frecuentes (2 por fila, e.g. modo de avance auto/voz) */
.button-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.action-btn-frequent {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #000; /* Fondo negro para contraste */
  border: none;
  color: white;
  cursor: pointer;
  padding: 16px 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
  min-height: 90px;
  
  &:hover {
    background: #111; /* Negro más claro al hover */
  }
  
  &:active {
    transform: scale(0.95);
    background: #222;
  }
  
  &.active {
    background: rgba(var(--v-theme-primary), 0.3);
    
    &:hover {
      background: rgba(var(--v-theme-primary), 0.4);
    }
  }
  
  .btn-text {
    font-size: 12px;
    text-align: center;
    line-height: 1.2;
    max-width: 100%;
    word-wrap: break-word;
  }
}

/* Botones extra (lista, icono a la izquierda + texto) */
.action-btn-extra {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #000; /* Fondo negro para contraste */
  border: none;
  color: white;
  cursor: pointer;
  padding: 16px 20px;
  border-radius: 12px;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  margin-bottom: 8px;
  
  &:hover {
    background: #111; /* Negro más claro al hover */
  }
  
  &:active {
    transform: scale(0.98);
    background: #222;
  }
  
  .extra-icon {
    flex-shrink: 0;
  }
  
  .extra-text {
    font-size: 15px;
    font-weight: 500;
    flex: 1;
  }
}

/* Responsive: móviles pequeños */
@media (max-width: 360px) {
  .menu-content {
    padding: 12px 16px calc(160px + env(safe-area-inset-bottom)) 16px;
  }
  
  .button-grid,
  .button-grid-2 {
    gap: 8px;
  }
  
  .action-btn-frequent {
    padding: 12px 6px;
    min-height: 80px;
    
    .btn-text {
      font-size: 11px;
    }
  }
  
  .action-btn-extra {
    padding: 14px 16px;
    
    .extra-text {
      font-size: 14px;
    }
  }
}

/* Tablets y desktop */
@media (min-width: 600px) {
  .menu-content {
    padding: 20px 32px calc(180px + env(safe-area-inset-bottom)) 32px;
    max-width: 600px;
  }
  
  .button-grid,
  .button-grid-2 {
    gap: 16px;
  }
  
  .action-btn-frequent {
    padding: 20px 12px;
    min-height: 100px;
    
    .btn-text {
      font-size: 13px;
    }
  }
  
  .action-btn-extra {
    padding: 18px 24px;
    
    .extra-text {
      font-size: 16px;
    }
  }
}

/* Custom scrollbar */
.actions-menu::-webkit-scrollbar {
  width: 6px;
}

.actions-menu::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.actions-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.actions-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Settings container */
.settings-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 0 8px;
}

.settings-title {
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  flex: 1;
}

.settings-content {
  padding: 0;
  max-height: calc(33vh - 100px);
  overflow-y: auto;
  transition: max-height 0.3s ease;
}

.actions-menu.maximized .settings-content {
  max-height: calc(100vh - 200px);
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
