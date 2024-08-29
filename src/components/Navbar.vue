<template>
  <div>
    <div class="navbar" @keydown="handleKeydown">

      <div class="logo-container">

        <div class="control">
          <button class="sidebar-toggle-btn" @click="toggleSidebar" title="Toggle Sidebar" tabindex="-1">
            <font-awesome-icon icon="bars" class="icon-color" />
          </button>
        </div>

        <a href="https://apuntador.io" class="link-with-margin" target="_blank" rel="noopener noreferrer">
          <img src="@/assets/logo.png" alt="Logo" class="app-logo" />
          <span class="app-name">apuntador</span>
        </a>

        <div class="control">
          <button
            class="edit-btn"
            id="editButton"
            :class="{ 'active-btn': isEditing }"
            @click="isEditing=!isEditing; invoker.addCommand(new ToggleEditModeCommand(store, isEditing)); invoker.executeCommands();"
            title="Toggle Edit Mode"
            tabindex="-1"
          >
            <font-awesome-icon icon="pen" class="icon-color" />
          </button>
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
      </div>

      <div class="control play-stop-group">
        <button
          class="stop-btn"
          @click="invoker.addCommand(new BeginningScrollingCommand(store)); invoker.executeCommands();"
          title="Beginning"
          tabindex="-1">
          <font-awesome-icon icon="backward-step" class="icon-color" />
        </button>

        <button class="scroll-btn" @click="store.scrollUp" title="Scroll Up" tabindex="-1">
          <font-awesome-icon icon="backward" class="icon-color" />
        </button>

        <button
          class="play-btn"
          @click="invoker.addCommand(new TogglePlayCommand(store)); invoker.executeCommands();"
          title="Play/Pause"
          tabindex="-1">
          <font-awesome-icon :icon="isPlaying ? 'pause' : 'play'" class="icon-color" />
        </button>

        <button class="scroll-btn" @click="store.scrollDown" title="Scroll Down" tabindex="-1">
          <font-awesome-icon icon="forward" class="icon-color" />
        </button>

        <button
          class="stop-btn"
          @click="invoker.addCommand(new EndingScrollingCommand(store)); invoker.executeCommands();"
          title="Ending"
          tabindex="-1">
          <font-awesome-icon icon="forward-step" class="icon-color" />
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
    </div> <!-- End of Navbar -->



    <!-- Sidebar -->
    <div :class="['sidebar', { 'sidebar-visible': isSidebarVisible }]">
      <div class="sidebar-content">
        <h2>Configuration</h2>

        <!-- Text Configuration -->
        <h3>Text Configuration</h3>
        <div class="control-group">
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
        </div>

        <hr class="separator">

        <!-- Alignment and Margin -->
        <h3>Alignment and Margin</h3>
        <div class="control-group">
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

        <hr class="separator">

        <!-- Highlight -->
        <h3>Highlight</h3>
        <div class="control-group">
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
        </div>

        <hr class="separator">

        <!-- View Mode -->
        <h3>View Mode</h3>
        <div class="control-group">
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
        </div>

      </div> <!-- End of Sidebar Content -->
    </div> <!-- End of Sidebar -->




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
import { BeginningScrollingCommand } from '@/commands/BeginningScrollingCommand'
import { EndingScrollingCommand } from '@/commands/EndingScrollingCommand'
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
const isSidebarVisible = ref(false)

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

const toggleSidebar = () => {
  isSidebarVisible.value = !isSidebarVisible.value
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
      invoker.addCommand(new BeginningScrollingCommand(store))
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
$navbar-padding: 15px;
$button-gap: 1px;
$label-margin-right: 3px;
$input-padding: 5px;
$input-font-size: 14px;
$button-font-size: 24px; /* Aumenta el tamaño de la fuente de los botones */
$button-padding: 10px; /* Añade padding a los botones para hacerlos más grandes */
$icon-color: #ffffff; /* Cambia este valor al color deseado */
$border-color: #ffffff; /* Color del borde */
$control-margin: 10px;
$icon-hover-color: hsla(160, 100%, 37%, 0.2);
$icon-padding: 5px;
$active-button-color: hsla(160, 100%, 37%, 0.2);
$active-button-text-color: white;
$control-margin-bottom: 10px;
$control-margin-top: 10px;

.icon-color {
  color: $icon-color;
  padding: $button-padding;
}

@media (hover: hover) {
  .icon-color:hover {
    background-color: $icon-hover-color
  }
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
  justify-content: space-between;
  outline: none;
  z-index: 1000;
  border-bottom: 2px solid $border-color;
  padding-left: $navbar-padding;
  padding-right: $navbar-padding;
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
  margin-left: $control-margin;
  margin-right: $control-margin;
  margin-bottom: $control-margin-bottom;
  margin-top: $control-margin-top;

}

.link-with-margin {
  margin-right: $control-margin;
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
.sidebar-toggle-btn {
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

.active-btn {
  background-color: $active-button-color;
  color: $active-button-text-color;
}

/* Estilos para la sidebar */
.sidebar {
  position: fixed;
  top: $navbar-height;
  left: -250px; /* Oculta la sidebar fuera de la vista */
  width: 250px;
  height: 100%;
  background-color: $navbar-bg-color;
  overflow-x: hidden;
  transition: 0.3s;
  z-index: 1002; /* Asegura que la sidebar esté por encima del navbar */
  // padding-top: 60px; /* Añade padding para evitar el navbar */
}

.sidebar-visible {
  left: 0; /* Muestra la sidebar */
}

.sidebar-content {
  padding: 15px;
  color: $icon-color;
}

.sidebar-content h2 {
  margin-bottom: 30px;
}

.control-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px; /* Espacio entre grupos */
}

h3 {
  text-align: left;
  width: 100%;
  padding-left: 15px; /* Alinea el título a la izquierda */
  color: $icon-color;
}

.separator {
  border: 0;
  height: 1px;
  background: $border-color;
  margin: 20px 0; /* Espacio alrededor del separador */
}


</style>