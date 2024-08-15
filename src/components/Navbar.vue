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
        max="50"
        v-model="scrollSpeed"
        @input="updateScrollSpeed"
      />
    </div>

    <div class="control">
      <label for="editButton">Edit</label>

      <button class="edit-btn" id="editButton" @click="toggleEditMode">
        <span v-if="!isEditing">✏️</span>
        <span v-else>❌</span>
      </button>
    </div>

    <button class="play-btn" @click="togglePlay">
      <span v-if="!isPlayingComputed">▶️</span>
      <span v-else>⏸️</span>
    </button>

    <button class="stop-btn" @click="stopScrolling">⏹️</button>

    <div class="control">
      <label for="mirrorButton">Mirror Mode</label>
      <button id="mirrorButton" class="mirror-btn" @click="toggleMirror">
        <span v-if="!isMirrored">🔄</span>
        <span v-else>🔁</span>
      </button>
    </div>

    <div class="control">
      <label for="reverseButton">Reverse Mode</label>
      <button id="reverseButton" class="reverse-btn" @click="toggleReverse">
        <span v-if="!isReversed">⤵️</span>
        <span v-else>⤴️</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePrompterStore } from '@/stores/prompterStore'

const store = usePrompterStore()

const fontSize = ref(store.fontSize)
const textColor = ref(store.textColor)
const scrollSpeed = ref(store.scrollSpeed)
const isEditing = ref(store.isEditing)
const isPlaying = ref(store.isPlaying)
const isMirrored = ref(store.isMirrored)
const isReversed = ref(store.isReversed)

const fontSizes = [40, 60, 80, 100, 120, 150, 200]

const updateFontSize = () => {
  store.setFontSize(fontSize.value)
}

watch(textColor, (newColor) => {
  console.log('newColor', newColor)
  store.setTextColor(newColor)
})

const updateScrollSpeed = () => {
  store.setScrollSpeed(scrollSpeed.value)
}

const toggleEditMode = () => {
  isEditing.value = !isEditing.value
  store.setEditingMode(isEditing.value)
}

const togglePlay = () => {
  store.togglePlay()
}

const stopScrolling = () => {
  if (store.isPlaying) {
    store.togglePlay() // Detener el scrolling si está en ejecución
  }
  store.resetScrollPosition() // Reiniciar la posición del texto
}

const toggleMirror = () => {
  store.toggleMirror()
  isMirrored.value = store.isMirrored
}

const toggleReverse = () => {
  store.toggleReverse()
  isReversed.value = store.isReversed
}

const isPlayingComputed = computed(() => store.isPlaying)
</script>

<style scoped>
.navbar {
  width: 100%;
  height: 40px;
  background-color: #191818;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.control {
  display: flex;
  align-items: center;
}

label {
  margin-right: 10px;
}

select,
input[type='range'],
input[type='color'] {
  padding: 5px;
  font-size: 14px;
}

.edit-btn,
.play-btn,
.stop-btn,
.mirror-btn,
.reverse-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
}
</style>
