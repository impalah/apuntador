<!--
  TeleprompterPageProduction - Production-ready component configuration usage
  
  This is an example of how to use component configurations in a real application.
  This approach is cleaner and more suitable for production use.
-->
<template>
  <div class="teleprompter-page">
    <!-- Dynamic Component Rendering based on configuration -->
    <component
      :is="config.teleprompterFrame.component"
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
      :is="config.floatingToolbar.component"
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
    <FileLoader v-model="fileLoaderOpen" @file-imported="onFileImported" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useServices } from '@/services/component-services'
import { getCurrentAppConfig } from '@/config/app-configuration'

// Shared Components
import SettingsDialog from '@/components/SettingsDialog.vue'
import MarkdownEditor from '@/components/MarkdownEditor.vue'
import FileLoader from '@/components/FileLoader.vue'

// ========================================
// Configuration and Services
// ========================================

// Get the configured component set
const config = getCurrentAppConfig()

// Initialize services
const { scrollService, contentService, preferencesService } = useServices()

// ========================================
// Component State
// ========================================

const contentRaw = ref('')
const toolbarVisible = ref(true)

// Component refs
const teleprompterRef = ref()

// Modal state
const settingsOpen = ref(false)
const editorOpen = ref(false)
const fileLoaderOpen = ref(false)

// ========================================
// Reactive Props for Components
// ========================================

// Determine if we're using original or decoupled components
const isOriginalComponent = computed(() => config.teleprompterFrame.name === 'TeleprompterFrame')

// Teleprompter Frame Props
const teleprompterFrameProps = computed(() => {
  if (isOriginalComponent.value) {
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
  if (config.floatingToolbar.name === 'FloatingToolbar') {
    // Original toolbar component doesn't use props
    return {}
  }

  // For decoupled toolbar components
  return {
    scrollState: scrollService.getState(),
    speedConfig: preferencesService.getSpeedConfig(),
    displayPrefs: preferencesService.getDisplayPrefs(),
    isVisible: toolbarVisible.value,
    isMinimal: false, // Could be dynamic based on screen size
  }
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

// Toolbar event handlers
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

// File and content handlers
function onFileImported(content: string) {
  contentService.setContent(content)
  settingsOpen.value = false
  fileLoaderOpen.value = false
}

function onEditorSave(content: string) {
  contentService.setContent(content)
  editorOpen.value = false
}

// ========================================
// Lifecycle
// ========================================

onMounted(async () => {
  // Initialize with sample content
  await contentService.setContent(`
# Apuntador - Production Configuration

Using component configuration: **${config.teleprompterFrame.description}**

## Current Setup

- **Teleprompter**: ${config.teleprompterFrame.name} v${config.teleprompterFrame.version}
- **Toolbar**: ${config.floatingToolbar.name} v${config.floatingToolbar.version}
- **Highlight Band**: ${config.highlightBand.name} v${config.highlightBand.version}

## Configuration Instructions

To change the component configuration:

1. Edit \`src/config/app-configuration.ts\`
2. Change the \`DEFAULT_APP_CONFIG\` constant
3. Available options: \`'standard'\`, \`'legacy'\`, \`'mixed'\`, \`'minimal'\`, \`'custom'\`

Example:
\`\`\`typescript
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'mixed'
\`\`\`

## Component Descriptions

- **Standard**: Modern decoupled components (recommended)
- **Legacy**: Original components for compatibility
- **Mixed**: Combination for gradual migration
- **Minimal**: Compact UI for embedded use cases  
- **Custom**: Your own component combination

The configuration is loaded automatically when the application starts!
  `)

  contentRaw.value = contentService.getContent().raw
})
</script>

<style scoped>
.teleprompter-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
