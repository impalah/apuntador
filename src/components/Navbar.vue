<template>
  <div>
    <div class="navbar" @keydown="handleKeydown" tabindex="0">
      <div class="logo-container">
        <a href="https://apuntador.io" target="_blank" rel="noopener noreferrer">
          <img src="@/assets/logo.png" alt="Logo" class="app-logo" />
          <span class="app-name">apuntador</span>
        </a>
      </div>

      <div class="control">
        <button
          class="fullscreen-btn"
          @click="toggleFullScreen"
          title="Toggle Full Screen"
          tabindex="-1"
        >
          <font-awesome-icon icon="expand" class="icon-color" />
        </button>
      </div>

      <div class="control">
        <font-awesome-icon icon="gauge" class="icon-label icon-color" title="Scroll speed" />
        <input
          type="range"
          id="scrollSpeed"
          :min="defaults.scrollSpeed.min"
          :max="defaults.scrollSpeed.max"
          v-model="scrollSpeed"
          @input="invoker.addCommand(new UpdateScrollSpeedCommand(store, scrollSpeed, defaults.scrollSpeed.maxConstant)); invoker.executeCommands();"
          tabindex="-1"
        />
      </div>

      <div class="control play-stop-group">
        <button
          class="play-btn"
          @click="invoker.addCommand(new TogglePlayCommand(store)); invoker.executeCommands();"
          title="Play/Pause"
          tabindex="-1">
          <font-awesome-icon :icon="isPlaying ? 'pause' : 'play'" class="icon-color" />
        </button>
        <button
          class="stop-btn"
          @click="invoker.addCommand(new StopScrollingCommand(store)); invoker.executeCommands();"
          title="Stop"
          tabindex="-1">
          <font-awesome-icon icon="stop" class="icon-color" />
        </button>
      </div>

      <div class="control scroll-group">
        <button class="scroll-btn" @click="store.scrollUp" title="Scroll Up" tabindex="-1">
          <font-awesome-icon icon="arrow-up" class="icon-color" />
        </button>
        <button class="scroll-btn" @click="store.scrollDown" title="Scroll Down" tabindex="-1">
          <font-awesome-icon icon="arrow-down" class="icon-color" />
        </button>
      </div>

      <div class="control">
        <button
          class="advanced-btn"
          @click="toggleAdvanced"
          title="Toggle Advanced Options"
          tabindex="-1"
        >
          <font-awesome-icon icon="cogs" class="icon-color" />
        </button>
        <span v-if="showAdvanced" class="advanced-mode-label">Advanced Mode. Click to close</span>
      </div>
    </div>

    <div v-if="showAdvanced" class="advanced-options">
      <div class="control">
        <font-awesome-icon icon="palette" class="icon-label icon-color" title="Text color" />
        <input
          type="color"
          id="textColor"
          v-model="textColor"
          @change="invoker.addCommand(new UpdateTextColorCommand(store, textColor)); invoker.executeCommands();"
          tabindex="-1"
        >
      </div>

      <div class="control">
        <font-awesome-icon icon="text-height" class="icon-label icon-color" title="Text size" />
        <select
          id="fontSize"
          v-model="fontSize"
          @change="invoker.addCommand(new UpdateFontSizeCommand(store, fontSize)); invoker.executeCommands();"
          tabindex="-1">
          <option v-for="size in fontSizes" :key="size" :value="size">{{ size }} px</option>
        </select>
      </div>

      <div class="control">
        <button
          class="edit-btn"
          id="editButton"
          @click="invoker.addCommand(new ToggleEditModeCommand(store, isEditing)); invoker.executeCommands();"
          title="Toggle Edit Mode"
          tabindex="-1"
        >
          <font-awesome-icon :icon="isEditing ? 'times' : 'pen'" class="icon-color" />
        </button>
        <span v-if="isEditing" class="edit-mode-label">Edit mode</span>
      </div>

      <div class="control">
        <button
          id="alignLeftButton"
          class="align-btn"
          @click="invoker.addCommand(new SetTextAlignCommand(store, 'left')); invoker.executeCommands();"
          title="Align Left"
          tabindex="-1"
        >
          <font-awesome-icon icon="align-left" class="icon-color" />
        </button>
        <button
          id="alignCenterButton"
          class="align-btn"
          @click="invoker.addCommand(new SetTextAlignCommand(store, 'center')); invoker.executeCommands();"
          title="Align Center"
          tabindex="-1"
        >
          <font-awesome-icon icon="align-center" class="icon-color" />
        </button>
        <button
          id="alignRightButton"
          class="align-btn"
          @click="invoker.addCommand(new SetTextAlignCommand(store, 'right')); invoker.executeCommands();"
          title="Align Right"
          tabindex="-1"
        >
          <font-awesome-icon icon="align-right" class="icon-color" />
        </button>
      </div>

      <div class="control">
        <button
          id="mirrorButton"
          class="mirror-btn"
          @click="invoker.addCommand(new ToggleMirrorCommand(store)); invoker.executeCommands();"
          title="Toggle Mirror Mode"
          tabindex="-1"
        >
          <font-awesome-icon :icon="isMirrored ? 'redo' : 'sync'" class="icon-color" />
        </button>
        <button
          id="reverseButton"
          class="reverse-btn"
          @click="invoker.addCommand(new ToggleReverseCommand(store)); invoker.executeCommands();"
          title="Toggle Reverse Mode"
          tabindex="-1"
        >
          <font-awesome-icon :icon="isReversed ? 'angles-up' : 'angles-down'" class="icon-color" />
        </button>
      </div>

      <div class="control">
        <font-awesome-icon
          icon="highlighter"
          class="icon-label icon-color"
          title="Highlight position"
        />
        <input
          type="range"
          id="highlightPosition"
          :min="defaults.highlightPosition.min"
          :max="defaults.highlightPosition.max"
          v-model="highlightPosition"
          @input="invoker.addCommand(new UpdateHighlightPositionCommand(store, highlightPosition)); invoker.executeCommands();"
          tabindex="-1"
        />
      </div>

      <div class="control">
        <font-awesome-icon
          icon="arrows-alt-h"
          class="icon-label icon-color"
          title="Margin"
        />
        <input
          type="range"
          id="margin"
          :min="defaults.margin.min"
          :max="defaults.margin.max"
          v-model="lateralMargin"
          @input="invoker.addCommand(new UpdateLateralMarginCommand(store, lateralMargin)); invoker.executeCommands();"
          tabindex="-1"
        />      
      </div>



    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useDefaultsStore } from '@/stores/defaults'

import { CommandInvoker } from '@/commands/CommandInvoker'
import { UpdateFontSizeCommand } from '@/commands/UpdateFontSizeCommand'
import { UpdateTextColorCommand } from '@/commands/UpdateTextColorCommand'
import { UpdateScrollSpeedCommand } from '@/commands/UpdateScrollSpeedCommand'
import { SetTextAlignCommand } from '@/commands/SetTextAlignCommand'
import { UpdateLateralMarginCommand } from '@/commands/UpdateLateralMarginCommand'
import { UpdateHighlightPositionCommand } from '@/commands/UpdateHighlightPositionCommand'
import { ToggleEditModeCommand } from '@/commands/ToggleEditModeCommand'
import { TogglePlayCommand } from '@/commands/TogglePlayCommand'
import { StopScrollingCommand } from '@/commands/StopScrollingCommand'
import { ToggleMirrorCommand } from '@/commands/ToggleMirrorCommand'
import { ToggleReverseCommand } from '@/commands/ToggleReverseCommand'



const store = useSettingsStore()
const defaults = useDefaultsStore()

const invoker = new CommandInvoker();


const fontSize = ref(store.fontSize)
const textColor = ref(store.textColor)
const scrollSpeed = ref(defaults.scrollSpeed.maxConstant - store.scrollSpeed)
const isEditing = ref(store.isEditing)
const isMirrored = ref(store.isMirrored)
const isReversed = ref(store.isReversed)
const lateralMargin = ref(store.lateralMargin)
const highlightPosition = ref(store.highlightPosition)
const showAdvanced = ref(false)

const fontSizes = defaults.fontSize.values




const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
    })
  } else {
    document.exitFullscreen()
  }
}

const toggleAdvanced = () => {
  showAdvanced.value = !showAdvanced.value
}




const isPlaying = computed(() => store.isPlaying)

const handleKeydown = (event: KeyboardEvent) => {
  if (isEditing.value) {
    return
  }

  switch (event.key) {
    case 'ArrowUp':
      store.scrollUp()
      break
    case 'ArrowDown':
      store.scrollDown()
      break
    case 'ArrowLeft':
      if (scrollSpeed.value > 1) {
        scrollSpeed.value -= 1
        invoker.addCommand(new UpdateScrollSpeedCommand(store, scrollSpeed.value, defaults.scrollSpeed.maxConstant))
        invoker.executeCommands();
      }
      break
    case 'ArrowRight':
      if (scrollSpeed.value < 30) {
        scrollSpeed.value += 1
        invoker.addCommand(new UpdateScrollSpeedCommand(store, scrollSpeed.value, defaults.scrollSpeed.maxConstant))
        invoker.executeCommands();
      }
      break
    case 'PageDown':
      if (highlightPosition.value < 100) {
        highlightPosition.value += 1
        invoker.addCommand(new UpdateHighlightPositionCommand(store, highlightPosition.value))
        invoker.executeCommands()
      }
      break
    case 'PageUp':
      if (highlightPosition.value > 0) {
        highlightPosition.value -= 1
        invoker.addCommand(new UpdateHighlightPositionCommand(store, highlightPosition.value))
        invoker.executeCommands()
      }
      break
    case 'End':
      invoker.addCommand(new TogglePlayCommand(store))
      invoker.executeCommands()
      break
    case 'Home':
      invoker.addCommand(new StopScrollingCommand(store))
      invoker.executeCommands()
      break
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
$navbar-height: 45px;
$navbar-bg-color: #191818;
$button-gap: 1px;
$label-margin-right: 3px;
$input-padding: 5px;
$input-font-size: 14px;
$button-font-size: 24px; /* Aumenta el tamaño de la fuente de los botones */
$button-padding: 10px; /* Añade padding a los botones para hacerlos más grandes */
$icon-color: #ffffff; /* Cambia este valor al color deseado */
$border-color: #ffffff; /* Color del borde */

.icon-color {
  color: $icon-color;
}

html,
body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* Evita scrollbars */
}

.navbar {
  width: 100%;
  height: $navbar-height;
  background-color: $navbar-bg-color;
  display: flex;
  align-items: center;
  justify-content: space-between; /* Cambiado de space-around a space-between */
  outline: none; /* Para evitar el borde de enfoque */
  z-index: 1000; /* Asegura que el navbar esté por encima de otros elementos */
  border-bottom: 2px solid $border-color; /* Añade un borde al navbar */
  padding: 0 10px; /* Añade padding a los lados del navbar */
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-container a {
  display: flex;
  align-items: center;
  text-decoration: none;
}

.app-logo {
  width: 32px;
  height: 32px;
  margin-right: 10px;
}

.app-name {
  color: $icon-color;
  font-size: 24px;
  font-weight: bold;
}

.control {
  display: flex;
  align-items: center;
}

.align-group,
.mirror-reverse-group,
.play-stop-group,
.scroll-group {
  display: flex;
  gap: $button-gap; /* Ajusta el espacio entre los botones */
}

label {
  margin-right: $label-margin-right;
}

select,
input[type='range'],
input[type='color'] {
  padding: $input-padding;
  font-size: $input-font-size;
}

.icon-label {
  background: none;
  border: none;
  font-size: $button-font-size;
  padding: $button-padding;
}

.edit-btn,
.play-btn,
.stop-btn,
.mirror-btn,
.reverse-btn,
.scroll-btn,
.align-btn,
.fullscreen-btn,
.advanced-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: $button-font-size;
  padding: $button-padding;
}

.advanced-options {
  position: absolute;
  top: $navbar-height;
  width: 90%; /* Hace que el div de opciones avanzadas sea más estrecho que el navbar */
  background-color: $navbar-bg-color;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  padding: 10px;
  z-index: 1001; /* Asegura que las opciones avanzadas estén por encima del navbar */
  border: 2px solid $border-color; /* Añade un borde al div de opciones avanzadas */
  left: 50%;
  transform: translateX(-50%); /* Centra horizontalmente el div */
}

.edit-mode-label {
  color: $icon-color;
  font-size: $input-font-size;
  margin-left: 10px;
  font-weight: bold;
}

.advanced-mode-label {
  color: $icon-color;
  font-size: $input-font-size;
  margin-left: 10px;
  font-weight: bold;
}
</style>
