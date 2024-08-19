<template>
  <div>
    <div class="navbar" @keydown="handleKeydown" tabindex="0">
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
          min="1"
          max="30"
          v-model="scrollSpeed"
          @input="updateScrollSpeed"
          tabindex="-1"
        />
      </div>

      <div class="control play-stop-group">
        <button class="play-btn" @click="togglePlay" title="Play/Pause" tabindex="-1">
          <font-awesome-icon :icon="isPlayingComputed ? 'pause' : 'play'" class="icon-color" />
        </button>
        <button class="stop-btn" @click="stopScrolling" title="Stop" tabindex="-1">
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
        <input type="color" id="textColor" v-model="textColor" tabindex="-1" />
      </div>

      <div class="control">
        <font-awesome-icon icon="text-height" class="icon-label icon-color" title="Text size" />
        <select id="fontSize" v-model="fontSize" @change="updateFontSize" tabindex="-1">
          <option v-for="size in fontSizes" :key="size" :value="size">{{ size }} px</option>
        </select>
      </div>

      <div class="control">
        <button
          class="edit-btn"
          id="editButton"
          @click="toggleEditMode"
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
          @click="alignLeft"
          title="Align Left"
          tabindex="-1"
        >
          <font-awesome-icon icon="align-left" class="icon-color" />
        </button>
        <button
          id="alignCenterButton"
          class="align-btn"
          @click="alignCenter"
          title="Align Center"
          tabindex="-1"
        >
          <font-awesome-icon icon="align-center" class="icon-color" />
        </button>
        <button
          id="alignRightButton"
          class="align-btn"
          @click="alignRight"
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
          @click="toggleMirror"
          title="Toggle Mirror Mode"
          tabindex="-1"
        >
          <font-awesome-icon :icon="isMirrored ? 'redo' : 'sync'" class="icon-color" />
        </button>
        <button
          id="reverseButton"
          class="reverse-btn"
          @click="toggleReverse"
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
          min="0"
          max="100"
          v-model="highlightPosition"
          @input="updateHighlightPosition"
          tabindex="-1"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { usePrompterStore } from '@/stores/prompterStore'

const store = usePrompterStore()

const fontSize = ref(store.fontSize)
const textColor = ref(store.textColor)
const scrollSpeed = ref(31 - store.scrollSpeed)
const isEditing = ref(store.isEditing)
const isPlaying = ref(store.isPlaying)
const isMirrored = ref(store.isMirrored)
const isReversed = ref(store.isReversed)
const textAlign = ref(store.textAlign)
const lateralMargin = ref(store.lateralMargin)
const highlightPosition = ref(store.highlightPosition)
const showAdvanced = ref(false)

const fontSizes = [40, 60, 80, 100, 120, 150, 200]

const updateFontSize = () => {
  store.setFontSize(fontSize.value)
}

watch(textColor, (newColor) => {
  console.log('newColor', newColor)
  store.setTextColor(newColor)
})

const updateScrollSpeed = () => {
  store.setScrollSpeed(31 - scrollSpeed.value) // Invert value before setting
}

const updateLateralMargin = () => {
  store.setLateralMargin(lateralMargin.value)
}

const updateHighlightPosition = () => {
  store.setHighlightPosition(highlightPosition.value)
}

const toggleEditMode = () => {
  isEditing.value = !isEditing.value
  store.setEditingMode(isEditing.value)
}

const togglePlay = () => {
  store.togglePlay()
}

const stopScrolling = () => {
  store.stopScrolling() // Reset the scroll position
}

const toggleMirror = () => {
  store.toggleMirror()
  isMirrored.value = store.isMirrored
}

const toggleReverse = () => {
  store.toggleReverse()
  isReversed.value = store.isReversed
}

const alignLeft = () => {
  store.setTextAlign('left')
}

const alignCenter = () => {
  store.setTextAlign('center')
}

const alignRight = () => {
  store.setTextAlign('right')
}

const isPlayingComputed = computed(() => store.isPlaying)

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
        updateScrollSpeed()
      }
      break
    case 'ArrowRight':
      if (scrollSpeed.value < 30) {
        scrollSpeed.value += 1
        updateScrollSpeed()
      }
      break
    case 'PageDown':
      if (highlightPosition.value < 100) {
        highlightPosition.value += 1
        updateHighlightPosition()
      }
      break
    case 'PageUp':
      if (highlightPosition.value > 0) {
        highlightPosition.value -= 1
        updateHighlightPosition()
      }
      break
    case 'End':
      togglePlay()
      break
    case 'Home':
      stopScrolling()
      break
  }
}

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
  justify-content: space-around;
  outline: none; /* Para evitar el borde de enfoque */
  z-index: 1000; /* Asegura que el navbar esté por encima de otros elementos */
  border-bottom: 2px solid $border-color; /* Añade un borde al navbar */
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
