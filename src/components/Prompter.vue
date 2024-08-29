<template>
  <div
    class="prompter"
    :style="{
      fontSize: `${store.fontSize}px`,
      color: store.textColor,
      backgroundColor: store.backgroundColor,
      transform: `${store.isMirrored ? 'scaleX(-1)' : 'scaleX(1)'} ${store.isReversed ? 'scaleY(-1)' : 'scaleY(1)'}`,
      marginLeft: `${store.lateralMargin}%`,
      marginRight: `${store.lateralMargin}%`,
      width: `calc(100% - ${2 * store.lateralMargin}%)`
    }"
  >
    <div
      v-if="!store.isEditing"
      ref="scrollContainer"
      class="text-display"
      :class="{
        'text-align-left': store.textAlign === 'left',
        'text-align-center': store.textAlign === 'center',
        'text-align-right': store.textAlign === 'right'
      }"
    >
      <div
        class="highlight-overlay"
        :style="{
          top: `${store.highlightPosition}%`,
          backgroundColor: store.highlightBackgroundColor.default
        }"
        >
        <font-awesome-icon
          icon="caret-right"
          class="left-arrow"
          :style="{
            color: store.highlightArrowColor,
            fontSize: store.highlightArrowSize
          }"
        />
        <font-awesome-icon
          icon="caret-left"
          class="right-arrow"
          :style="{
            color: store.highlightArrowColor,
            fontSize: store.highlightArrowSize
          }"
        />
      </div>

      <div class="text-content" v-html="formattedTextContent"></div>
    </div>
    <textarea
      v-else
      v-model="editedContent"
      @input="updateTextContent"
      class="text-area"
    ></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useDefaultsStore } from '@/stores/defaults'
import showdown from 'showdown'

const store = useSettingsStore()
const defaults = useDefaultsStore()

const scrollContainer = ref<HTMLElement | null>(null)
let scrollInterval: number | undefined = undefined

const editedContent = ref(store.textContent)
const textAlign = ref(store.textAlign)

const formattedTextContent = computed(() => {
  const converter = new showdown.Converter()
  const textLines = defaults.prompter.textLinesExtra || 0
  const blankLines = '<br>'.repeat(textLines)
  const formattedText = converter.makeHtml(store.textContent)
  return `${blankLines}${formattedText}${blankLines}`
})

watch(
  () => store.isEditing,
  (newVal) => {
    if (!newVal) {
      store.setTextContent(editedContent.value)
    }
  }
)

watch(textAlign, (newAlign) => {
  store.setTextAlign(newAlign)
})

const updateTextContent = () => {
  store.setTextContent(editedContent.value)
}

const scrollText = () => {
  if (scrollContainer.value) {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value

    if (scrollTop + 2 >= store.maxTop) {
      store.togglePlay()
      clearInterval(scrollInterval)
    } else {
      store.scrollPosition = scrollContainer.value.scrollTop + 2
    }
  }
}

// Update scrollTop when scrollPosition changes
watch(
  () => store.scrollPosition,
  (newVal) => {
    if (scrollContainer.value) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
      const maxTop = scrollHeight - clientHeight - 2

      // Check if the scroll is at the end
      if (newVal < maxTop) {
        scrollContainer.value.scrollTop = newVal
      }
    }
  }
)

watch(
  () => store.isPlaying,
  (newVal) => {
    if (newVal) {
      // Reduce the scroll speed by 10% to avoid reaching the end of the text
      scrollInterval = window.setInterval(scrollText, store.scrollSpeed)
    } else {
      if (scrollInterval !== undefined) {
        clearInterval(scrollInterval)
      }
    }
  }
)

watch(
  () => store.scrollSpeed,
  (newSpeed) => {
    if (store.isPlaying) {
      if (scrollInterval !== undefined) {
        clearInterval(scrollInterval)
      }
      scrollInterval = window.setInterval(scrollText, newSpeed)
    }
  }
)

const updateMaxTop = () => {
  if (scrollContainer.value) {
    const { scrollHeight, clientHeight } = scrollContainer.value
    const maxTop = scrollHeight - clientHeight - 2
    store.setMaxTop(maxTop)
  }
}

watch(
  () => store.textContent,
  () => {
    updateMaxTop()
  }
)

watch(
  () => store.fontSize,
  () => {
    updateMaxTop()
  }
)

onMounted(() => {
  if (store.isPlaying) {
    scrollInterval = window.setInterval(scrollText, store.scrollSpeed)
  }

  // Initialize ResizeObserver
  const resizeObserver = new ResizeObserver(() => {
    updateMaxTop()
  })

  if (scrollContainer.value) {
    resizeObserver.observe(scrollContainer.value)
  }

  onUnmounted(() => {
    if (scrollInterval !== undefined) {
      clearInterval(scrollInterval)
    }
    resizeObserver.disconnect()
  })
})
</script>


<style lang="scss" scoped>
$text-color: inherit;
$line-height: 1.4;
$blur-opacity: 0.5;
$blur-amount: 2px;
$text-content-margin: 1em;

.prompter {
  height: calc(100vh - 60px);
  margin: 20px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
}

.text-display {
  white-space: pre-wrap;
  width: 100%;
  height: 100%;
  overflow-y: hidden;
  color: $text-color; /* Inherits color from parent div */
  line-height: $line-height; /* Ajusta el interlineado */
}

.text-area {
  width: 100%;
  height: 100%;
  font-size: inherit;
  color: $text-color; /* Inherits color from parent div */
  padding: 10px;
  box-sizing: border-box;
  background-color: inherit;
}

.text-align-left {
  text-align: left;
}

.text-align-center {
  text-align: center;
}

.text-align-right {
  text-align: right;
}

.highlight-overlay {
  position: absolute;
  left: 0;
  width: 100%;
  height: calc(3 * 1em); /* Altura de tres líneas de texto */
  transform: translateY(-50%); /* Centrar verticalmente */
  pointer-events: none; /* Permitir clics a través de la overlay */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px; /* Pequeña separación de los bordes verticales */
}

.left-arrow {
  margin-right: 0;
}

.right-arrow {
  margin-left: 0;
}

.text-content {
  margin: $text-content-margin; /* Fixed margins around the div */
}

/* Nueva clase para el texto difuminado */
.blurred-text {
  filter: blur($blur-amount) opacity($blur-opacity); /* Aplica desenfoque y reduce opacidad */
}

/* Estilo para el texto bajo la highlight-overlay */
.highlight-overlay ~ .text-content {
  filter: none; /* Remueve el desenfoque y la opacidad reducida */
}
</style>