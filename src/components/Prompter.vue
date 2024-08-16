<template>
  <div
    class="prompter"
    :style="{
      fontSize: `${store.fontSize}px`,
      color: store.textColor,
      transform: `${store.isMirrored ? 'scaleX(-1)' : 'scaleX(1)'} ${store.isReversed ? 'scaleY(-1)' : 'scaleY(1)'}`
    }"
  >
    <div
      v-if="!store.isEditing"
      ref="scrollContainer"
      class="text-display"
      :style="{ textAlign: store.textAlign }"
    >
      <p v-html="formattedTextContent"></p>
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
import { usePrompterStore } from '@/stores/prompterStore'

const store = usePrompterStore()
const scrollContainer = ref<HTMLElement | null>(null)
let scrollInterval: number | undefined = undefined

const editedContent = ref(store.textContent)
const textAlign = ref(store.textAlign)

const formattedTextContent = computed(() => {
  return store.textContent.replace(/\n/g, '<br>')
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

    if (scrollTop + clientHeight + 2 >= scrollHeight) {
      store.togglePlay()
      clearInterval(scrollInterval)
      console.log('Reached the end, stopping play')
    } else {
      store.scrollPosition = scrollContainer.value.scrollTop + 2
    }
  }
}

// Update scrollTop when scrollPosition changes
watch(
  () => store.scrollPosition,
  (newVal) => {
    console.log('scrollPosition changed to:', newVal)
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = newVal
      console.log('scrollPosition updated to:', newVal)
    }
  }
)

watch(
  () => store.isPlaying,
  (newVal) => {
    console.log('isPlaying changed to:', newVal)
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

onMounted(() => {
  if (store.isPlaying) {
    scrollInterval = window.setInterval(scrollText, store.scrollSpeed)
  }
})

onUnmounted(() => {
  if (scrollInterval !== undefined) {
    clearInterval(scrollInterval)
  }
})
</script>

<style scoped>
.prompter {
  width: calc(100% - 40px);
  height: calc(100vh - 60px);
  margin: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  background-color: #000000;
  overflow: hidden;
}

.text-display {
  white-space: pre-wrap;
  width: 100%;
  height: 100%;
  overflow-y: hidden;
  color: inherit; /* Inherits color from parent div */
}

.text-area {
  width: 100%;
  height: 100%;
  font-size: inherit;
  color: inherit; /* Inherits color from parent div */
  padding: 10px;
  box-sizing: border-box;
  background-color: #000000;
  border: none;
}
</style>
