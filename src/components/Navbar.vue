<template>
  <div class="navbar">
    <div class="control">
      <label for="fontSize">Font Size</label>
      <select id="fontSize" v-model="fontSize" @change="updateFontSize">
        <option v-for="size in fontSizes" :key="size" :value="size">{{ size }} px</option>
      </select>
    </div>
    <div class="control">
      <label for="textColor">Text Color</label>
      <input type="color" id="textColor" v-model="textColor" />
    </div>
    <div class="control">
      <label for="scrollSpeed">Speed</label>
      <input
        type="range"
        id="scrollSpeed"
        min="1"
        max="30"
        v-model="scrollSpeed"
        @input="updateScrollSpeed"
      />
    </div>

    <div class="control">
      <label for="lateralMargin">Lateral Margin</label>
      <input
        type="range"
        id="lateralMargin"
        min="0"
        max="50"
        v-model="lateralMargin"
        @input="updateLateralMargin"
      />
    </div>

    <div class="control">
      <label for="editButton">Edit</label>

      <button class="edit-btn" id="editButton" @click="toggleEditMode">
        <span v-if="!isEditing">✏️</span>
        <span v-else>❌</span>
      </button>
    </div>

    <div class="control play-stop-group">
      <button class="play-btn" @click="togglePlay">
        <span v-if="!isPlayingComputed">▶️</span>
        <span v-else>⏸️</span>
      </button>

      <button class="stop-btn" @click="stopScrolling">⏹️</button>
    </div>

    <div class="control scroll-group">
      <button class="scroll-btn" @click="store.scrollUp">⬆️</button>
      <button class="scroll-btn" @click="store.scrollDown">⬇️</button>
    </div>

    <div class="control align-group">
      <button id="alignLeftButton" class="align-btn" @click="alignLeft">⬅️</button>
      <button id="alignCenterButton" class="align-btn" @click="alignCenter">🔲</button>
      <button id="alignRightButton" class="align-btn" @click="alignRight">➡️</button>
    </div>

    <div class="control mirror-reverse-group">
      <label>Mirror/Reverse Mode</label>
      <button id="mirrorButton" class="mirror-btn" @click="toggleMirror">
        <span v-if="!isMirrored">🔄</span>
        <span v-else>🔁</span>
      </button>
      <button id="reverseButton" class="reverse-btn" @click="toggleReverse">
        <span v-if="!isReversed">⤵️</span>
        <span v-else>⤴️</span>
      </button>
    </div>

    <div class="control">
      <label for="highlightPosition">Highlight Position</label>
      <input
        type="range"
        id="highlightPosition"
        min="0"
        max="100"
        v-model="highlightPosition"
        @input="updateHighlightPosition"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
</script>

<style lang="scss" scoped>
$navbar-height: 40px;
$navbar-bg-color: #191818;
$button-gap: 1px;
$label-margin-right: 3px;
$input-padding: 5px;
$input-font-size: 14px;
$button-font-size: 18px;

.navbar {
  width: 100%;
  height: $navbar-height;
  background-color: $navbar-bg-color;
  display: flex;
  align-items: center;
  justify-content: space-around;
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

.edit-btn,
.play-btn,
.stop-btn,
.mirror-btn,
.reverse-btn,
.align-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: $button-font-size;
}
</style>
