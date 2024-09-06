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

        <!-- <div class="control">
          <div>
            <p>Press a button on your gamepad to see the output:</p>
            <p>{{ message }}</p>
          </div>          

        </div> -->


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
            @click="invoker.addCommand(new ToggleFullScreenCommand()); invoker.executeCommands();"
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
          <font-awesome-icon icon="angles-left" class="icon-color" />
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

        <button class="scroll-btn" @click="store.scrollDown" title="Scroll Down" tabindex="-1">
          <font-awesome-icon icon="angles-right" class="icon-color" />
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
    <Sidebar :isSidebarVisible="isSidebarVisible" />


  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useDefaultsStore } from '@/stores/defaults'

import { CommandInvoker } from '@/commands/CommandInvoker'
import { UpdateScrollSpeedCommand } from '@/commands/UpdateScrollSpeedCommand'
import { UpdateHighlightPositionCommand } from '@/commands/UpdateHighlightPositionCommand'
import { ToggleEditModeCommand } from '@/commands/ToggleEditModeCommand'
import { TogglePlayCommand } from '@/commands/TogglePlayCommand'
import { BeginningScrollingCommand } from '@/commands/BeginningScrollingCommand'
import { EndingScrollingCommand } from '@/commands/EndingScrollingCommand'
import { ToggleFullScreenCommand } from '@/commands/ToggleFullScreenCommand'

import Sidebar from '@/components/Sidebar.vue';

import logger from '@/core/logger'


const message = ref('')
const gamepadIndex = ref<number | null>(null)


const store = useSettingsStore()
const defaults = useDefaultsStore()

const invoker = new CommandInvoker();

const scrollSpeed = ref(defaults.scrollSpeed.maxConstant - store.scrollSpeed)
const isEditing = ref(store.isEditing)
const highlightPosition = ref(store.highlightPosition)
const isSidebarVisible = ref(false)



const toggleSidebar = () => {
  logger.info('Toggling sidebar visibility: ', isSidebarVisible.value)
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
    case ' ':
    case 'Space':
      logger.debug('Space key pressed')
      event.preventDefault()
      invoker.addCommand(new TogglePlayCommand(store))
      invoker.executeCommands()
      break
    case 'Home':
      invoker.addCommand(new BeginningScrollingCommand(store))
      invoker.executeCommands()
      break
    case 'End':
      invoker.addCommand(new EndingScrollingCommand(store))
      invoker.executeCommands()
      break

  }
}


// Gamepad API

const onGamepadConnected = (event: GamepadEvent) => {
  gamepadIndex.value = event.gamepad.index;
  message.value = `Gamepad connected at index ${gamepadIndex.value}`;
}

const onGamepadDisconnected = () => {
  gamepadIndex.value = null;
  message.value = 'Gamepad disconnected';
}

const pollGamepad = () => {
  const checkGamepad = () => {
    if (gamepadIndex.value !== null) {
      const gamepad = navigator.getGamepads()[gamepadIndex.value];
      if (gamepad) {
        handleGamepadInput(gamepad);
      }
    }
    requestAnimationFrame(checkGamepad);
  };
  checkGamepad();
}


const handleGamepadInput = (gamepad: Gamepad) => {

  const pressedButtonIndices: number[] = [];

  gamepad.buttons.forEach((button, index) => {
    if (button.pressed) {
      pressedButtonIndices.push(index);
    }
  });

  message.value = pressedButtonIndices.join(', ');
  


  // if (gamepad.buttons[0].pressed) {
  //   message.value = 'Button A Pressed!';
  // }
  // if (gamepad.buttons[12].pressed) {
  //   message.value = 'DPAD UP Pressed!';
  // }
  // if (gamepad.buttons[13].pressed) {
  //   message.value = 'DPAD DOWN Pressed!';
  // }

  // const buttonNames = [
  //   'Button A', 'Button B', 'Button X', 'Button Y',
  //   'Left Bumper', 'Right Bumper', 'Left Trigger', 'Right Trigger',
  //   'Back', 'Start', 'Left Stick', 'Right Stick',
  //   'DPAD UP', 'DPAD DOWN', 'DPAD LEFT', 'DPAD RIGHT',
  //   'Home', 'Touchpad', 'Left Stick Press', 'Right Stick Press',
  //   'Left Trigger Press', 'Right Trigger Press', 'Select', 'Mode',
  //   'Thumbstick Left', 'Thumbstick Right', 'Thumbstick Up', 'Thumbstick Down',
  //   'Left Stick Horizontal', 'Left Stick Vertical',
  //   'Right Stick Horizontal', 'Right Stick Vertical',
  //   'Touchpad X', 'Touchpad Y',
  //   'Touchpad Press', 'Touchpad Touch',
  //   'Touchpad Back', 'Touchpad Forward',
  //   'Touchpad Left', 'Touchpad Right',
  //   'Touchpad Up', 'Touchpad Down',

  // ];

  // buttonNames.forEach((name, index) => {
  //   if (gamepad.buttons[index] && gamepad.buttons[index].pressed) {
  //     message.value = `${name} Pressed!`;
  //   }
  // });


  // const axesNames = [
  //   'Left Stick Horizontal', 'Left Stick Vertical',
  //   'Right Stick Horizontal', 'Right Stick Vertical'
  // ];

  // axesNames.forEach((name, index) => {
  //   const value = gamepad.axes[index];
  //   if (value > 0.1 || value < -0.1) {
  //     message.value = `${name} moved to ${value.toFixed(2)}`;
  //   }
  // });




}


onMounted(() => {
  document.addEventListener('keydown', handleKeydown)

  // window.addEventListener('gamepadconnected', onGamepadConnected);
  // window.addEventListener('gamepaddisconnected', onGamepadDisconnected);
  // pollGamepad();


})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)

  // window.removeEventListener('gamepadconnected', onGamepadConnected);
  // window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);

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
    // background-color: $navbar-bg-color;
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


</style>