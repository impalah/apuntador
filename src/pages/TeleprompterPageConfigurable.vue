<!--
  TeleprompterPageConfigurable - Example using component configurations
  
  This page demonstrates how to use different component configurations
  in a real application setting.
-->
<template>
  <div class="teleprompter-page">
    <!-- Development configuration selector (remove in production) -->
    <v-fab
      v-if="showConfigSelector"
      class="config-selector"
      icon="mdi-cog-outline"
      size="small"
      color="secondary"
      @click="configSelectorOpen = true"
    />

    <!-- Dynamic Component Rendering based on configuration -->
    <component
      :is="currentConfig.teleprompterFrame.component"
      ref="teleprompterRef"
      v-bind="teleprompterFrameProps"
      @content-height-changed="onContentHeightChanged"
      @viewport-height-changed="onViewportHeightChanged"
      @tap="onTeleprompterTap"
      @swipe-up="onSwipeUp"
      @swipe-down="onSwipeDown"
      @press-hold="onPressHold"
    />

    <component
      :is="currentConfig.floatingToolbar.component"
      v-show="toolbarVisible"
      v-bind="floatingToolbarProps"
      @play="onPlay"
      @pause="onPause"
      @toggle-play="onTogglePlay"
      @step-lines="onStepLines"
      @go-home="onGoHome"
      @go-end="onGoEnd"
      @speed-change="onSpeedChange"
      @font-size-change="onFontSizeChange"
      @mirror-toggle="onMirrorToggle"
      @open-editor="() => (editorOpen = true)"
      @open-settings="() => (settingsOpen = true)"
      @open-file="() => (fileLoaderOpen = true)"
    />

    <!-- Shared Modal Components -->
    <SettingsDialog v-model="settingsOpen" @file-imported="onFileImported" />
    <MarkdownEditor v-model="editorOpen" :content="contentRaw" @save="onEditorSave" />
    <FileLoader v-model="fileLoaderOpen" auto-import @file-imported="onFileImported" />

    <!-- Configuration Selector Dialog -->
    <v-dialog v-model="configSelectorOpen" max-width="500">
      <v-card>
        <v-card-title>Select Component Configuration</v-card-title>
        <v-card-text>
          <v-radio-group
            v-model="selectedConfigName"
            @update:model-value="(value) => value && changeConfiguration(value)"
          >
            <v-radio
              v-for="example in availableConfigurations"
              :key="example.name"
              :label="example.label"
              :value="example.name"
            >
              <template #label>
                <div>
                  <div class="font-weight-medium">{{ example.label }}</div>
                  <div class="text-caption text-medium-emphasis">{{ example.description }}</div>
                </div>
              </template>
            </v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="configSelectorOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Configuration Info Snackbar -->
    <v-snackbar v-model="showConfigInfo" :timeout="3000" color="info" location="top">
      Using {{ currentConfig.teleprompterFrame.description }}
      <template #actions>
        <v-btn size="small" @click="showConfigInfo = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useServices } from '@/services/component-services'
import type { AppComponentConfig } from '@/types/component-interfaces'

// Import configurations
import {
  originalComponentConfig,
  decoupledComponentConfig,
  mixedComponentConfig,
  usageExamples,
  ComponentFactory,
  compactFloatingToolbar,
  minimalTeleprompterFrame,
  standardHighlightBand,
} from '@/config/component-configurations'

// Shared Components
import SettingsDialog from '@/components/SettingsDialog.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import FileLoader from '@/components/FileLoader.vue'

// ========================================
// Services
// ========================================

const { scrollService, contentService, preferencesService } = useServices()

// ========================================
// Configuration Management
// ========================================

type ConfigurationName = 'original' | 'decoupled' | 'mixed' | 'minimal' | 'custom'

const availableConfigurations = [
  {
    name: 'decoupled' as ConfigurationName,
    label: 'Standard (Decoupled)',
    description: 'Modern decoupled components with full features',
    config: decoupledComponentConfig,
  },
  {
    name: 'original' as ConfigurationName,
    label: 'Legacy (Original)',
    description: 'Original components with direct store access',
    config: originalComponentConfig,
  },
  {
    name: 'mixed' as ConfigurationName,
    label: 'Mixed (Migration)',
    description: 'Mixed old and new components for gradual migration',
    config: mixedComponentConfig,
  },
  {
    name: 'minimal' as ConfigurationName,
    label: 'Minimal UI',
    description: 'Compact interface for embedded use cases',
    config: usageExamples.minimal.config,
  },
  {
    name: 'custom' as ConfigurationName,
    label: 'Custom Configuration',
    description: 'Decoupled frame with compact toolbar',
    config: ComponentFactory.createCustomConfiguration(
      decoupledComponentConfig.teleprompterFrame,
      compactFloatingToolbar,
      standardHighlightBand
    ),
  },
]

// Default configuration (change this to set your preferred default)
const selectedConfigName = ref<ConfigurationName>('mixed') // 👈 CHANGE DEFAULT CONFIGURATION HERE

const currentConfig = computed(() => {
  const selected = availableConfigurations.find((c) => c.name === selectedConfigName.value)
  return selected?.config || decoupledComponentConfig
})

// ========================================
// Component Props (Reactive)
// ========================================

const contentRaw = ref('')
const toolbarVisible = ref(true)
const showConfigSelector = ref(true) // Set to false in production
const configSelectorOpen = ref(false)
const showConfigInfo = ref(false)

// Teleprompter Frame Props
const teleprompterFrameProps = computed(() => {
  if (selectedConfigName.value === 'original') {
    // Original component doesn't use props, accesses stores directly
    return {}
  }

  // For decoupled components, provide props
  return {
    content: contentService.getContent(),
    scrollState: scrollService.getState(),
    displayPrefs: preferencesService.getDisplayPrefs(),
    highlightBand: preferencesService.getHighlightBandConfig(),
  }
})

// Floating Toolbar Props
const floatingToolbarProps = computed(() => {
  if (selectedConfigName.value === 'original') {
    // Original component doesn't use props
    return {}
  }

  const baseProps = {
    scrollState: scrollService.getState(),
    speedConfig: preferencesService.getSpeedConfig(),
    displayPrefs: preferencesService.getDisplayPrefs(),
    isVisible: toolbarVisible.value,
  }

  // For compact toolbar, add minimal mode
  if (selectedConfigName.value === 'custom') {
    return { ...baseProps, isMinimal: true }
  }

  return baseProps
})

// ========================================
// Event Handlers
// ========================================

function onContentHeightChanged(height: number) {
  console.log('Content height changed:', height)
}

function onViewportHeightChanged(height: number) {
  console.log('Viewport height changed:', height)
}

function onTeleprompterTap() {
  // Toggle toolbar visibility on tap
  if (scrollService.getState().isPlaying) {
    scrollService.pause()
    toolbarVisible.value = true
  } else {
    toolbarVisible.value = !toolbarVisible.value
  }
}

function onSwipeUp() {
  scrollService.stepLines(-1)
}

function onSwipeDown() {
  scrollService.stepLines(1)
}

function onPressHold() {
  console.log('Press and hold detected')
}

// Toolbar events
function onPlay() {
  scrollService.play()
  // Auto-hide toolbar after a delay
  setTimeout(() => {
    toolbarVisible.value = false
  }, 2000)
}

function onPause() {
  scrollService.pause()
  toolbarVisible.value = true
}

function onTogglePlay() {
  if (scrollService.getState().isPlaying) {
    onPause()
  } else {
    onPlay()
  }
}

function onStepLines(count: number) {
  scrollService.stepLines(count)
}

function onGoHome() {
  scrollService.goToHome()
}

function onGoEnd() {
  scrollService.goToEnd()
}

async function onSpeedChange(speed: number) {
  await preferencesService.updateSpeedConfig({ current: speed })
}

async function onFontSizeChange(size: number) {
  await preferencesService.updateDisplayPrefs({ fontSizePx: size })
}

async function onMirrorToggle(axis: 'h' | 'v') {
  const currentPrefs = preferencesService.getDisplayPrefs()
  if (axis === 'h') {
    await preferencesService.updateDisplayPrefs({ mirrorH: !currentPrefs.mirrorH })
  } else {
    await preferencesService.updateDisplayPrefs({ mirrorV: !currentPrefs.mirrorV })
  }
}

// Modal state
const settingsOpen = ref(false)
const editorOpen = ref(false)
const fileLoaderOpen = ref(false)

function onFileImported(content: string) {
  contentService.setContent(content)
  settingsOpen.value = false
  fileLoaderOpen.value = false
}

function onEditorSave(content: string) {
  contentService.setContent(content)
  editorOpen.value = false
}

// Configuration changes
function changeConfiguration(configName: ConfigurationName) {
  selectedConfigName.value = configName
  showConfigInfo.value = true
  configSelectorOpen.value = false

  // Re-measure after component change
  nextTick(() => {
    // Trigger re-measurement if the component supports it
    const teleprompterRef = ref()
    if (teleprompterRef.value?.measureDimensions) {
      teleprompterRef.value.measureDimensions()
    }
  })
}

// ========================================
// Lifecycle
// ========================================

onMounted(async () => {
  // Initialize with demo content
  await contentService.setContent(`
# Component Configuration Demo

Current configuration: **${selectedConfigName.value}**

## Available Configurations

- **Standard (Decoupled)**: Modern architecture with full features
- **Legacy (Original)**: Original components for compatibility  
- **Mixed (Migration)**: Combination for gradual migration
- **Minimal UI**: Compact interface for embedded use
- **Custom**: Your own component combinations

## How to Change Configuration

1. **Development**: Use the gear icon to test different configurations
2. **Production**: Set \`selectedConfigName\` in the code to your preferred default
3. **Runtime**: Call \`changeConfiguration()\` programmatically

## Example Usage

\`\`\`typescript
// Set configuration at startup
const selectedConfigName = ref('mixed') // Uses mixed configuration

// Or change programmatically
changeConfiguration('minimal') // Switch to minimal UI
\`\`\`

Try the different configurations and see how the UI changes!
  `)

  // Show initial configuration info
  showConfigInfo.value = true
})
</script>

<style scoped>
.teleprompter-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.config-selector {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .config-selector {
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style>
