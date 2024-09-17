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
    
      <!-- Highlight overlay -->
      <HighlightOverlay
        :highlightPosition="Number(store.highlightPosition)"
        :highlightBackgroundColor="store.highlightBackgroundColor.default"
        :highlightArrowColor="store.highlightArrowColor"
        :highlightArrowSize="store.highlightArrowSize"
      />


      <div
        ref="textContent"
        class="text-content"
        v-html="formattedTextContent"
      >
      </div>
    </div> <!-- text-display -->

    <textarea
      v-else
      v-model="editedContent"
      @input="updateTextContent"
      class="text-area"
    ></textarea>

  </div> <!-- prompter -->

</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { usePrompterSettingsStore } from '@/stores/prompterSettings'
import { useDefaultsStore } from '@/stores/defaults'
import showdown from 'showdown'
import logger from '@/core/logger'
import HighlightOverlay from '@/components/HighlightOverlay.vue'

const store = usePrompterSettingsStore()
const defaults = useDefaultsStore()

const scrollContainer = ref<HTMLElement | null>(null)
let scrollInterval: number | undefined = undefined

const editedContent = ref(store.textContent)
const textAlign = ref(store.textAlign)



const textContent = ref<HTMLElement | null>(null)


const scrollToElement = (tagName: string) => {
  const elements = (textContent.value as HTMLElement | null)?.querySelectorAll(tagName)
  if (elements && elements.length > 0) {
    logger.debug(`scrollToElement called for ${tagName}`)
    const firstElement = elements[0]
    const scrollContainerTop = scrollContainer.value?.getBoundingClientRect().top || 0
    const elementTop = firstElement.getBoundingClientRect().top
    const offset = elementTop - scrollContainerTop
    if (scrollContainer.value) {
      store.scrollPosition = scrollContainer.value.scrollTop + offset
      scrollContainer.value.scrollTop += offset
    }
  }
}






const formattedTextContent = computed(() => {

  logger.info('formattedTextContent called')

  const converter = new showdown.Converter()
  const textLines = defaults.prompter.textLinesExtra || 0
  const blankLines = '<br>'.repeat(textLines)
  const formattedText = converter.makeHtml(store.textContent)
  return `${blankLines}${formattedText}${blankLines}`

})

watch(
  () => store.isEditing,
  (newVal) => {
    logger.debug(`watch store.isEditing called ${newVal}`)
    if (!newVal) {
      logger.debug('- setting new value')
      store.setTextContent(editedContent.value)

      nextTick(() => {
        logger.debug('- nextTick')
        updateMaxTop()
      })

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

    logger.debug('scrollText called')
    logger.debug(`- scrollTop', ${scrollTop}`)
    logger.debug(`- scrollHeight', ${scrollHeight}`)
    logger.debug(`- clientHeight', ${clientHeight}`)

    if (scrollTop + 2 >= store.maxTop) {
      logger.debug(`- STOPPING scrollTop + 2 >= store.maxTop ', ${scrollTop} + 2, ${store.maxTop}`)      
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
      // const maxTop = scrollHeight - clientHeight - 2
      logger.debug('scrollPosition called')

      logger.debug(`- maxTop', ${store.maxTop}`)
      logger.debug(`- newVal', ${newVal}`)
      logger.debug(`- scrollTop', ${scrollTop}`)
      logger.debug(`- scrollHeight', ${scrollHeight}`)
      logger.debug(`- clientHeight', ${clientHeight}`)

      // Check if the scroll is at the end
      if (newVal < store.maxTop) {
        logger.debug(`- newVal < maxTop ', ${newVal}, ${store.maxTop}`)
        scrollContainer.value.scrollTop = newVal
      } else {
        logger.debug(`- at the end newVal >= maxTop ', ${newVal}, ${store.maxTop}`)
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
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
    logger.debug('updateMaxTop called')
    logger.debug(`- scrollContainer.scrollTop', ${scrollTop}`)
    logger.debug(`- scrollContainer.scrollHeight', ${scrollHeight}`)
    logger.debug(`- scrollContainer.clientHeight', ${clientHeight}`)

    const maxTop = scrollHeight - clientHeight - 2

    logger.debug(`- maxTop', ${maxTop}`)    
    store.setMaxTop(maxTop)

  } else {
    logger.debug('updateMaxTop scrollContainer.value is null')
  }
}

watch(
  () => store.textContent,
  () => {
    logger.debug('watch store.textContent: updateMaxTop')
    editedContent.value = store.textContent

    nextTick(() => {
      logger.debug('watch store.textContent: updateMaxTop nextTick')
      updateMaxTop()

      

    })
  }
)

watch(
  () => store.fontSize,
  () => {
    logger.debug('watch store.fontSize: updateMaxTop. New font size:', store.fontSize)
    nextTick(() => {
      logger.debug('watch store.fontSize: updateMaxTop nextTick')
      updateMaxTop()
    })
  }
)

onMounted(() => {
  if (store.isPlaying) {
    scrollInterval = window.setInterval(scrollText, store.scrollSpeed)
  }

  // scrollToElement('h3') // Example usage

  // Initialize ResizeObserver
  const resizeObserver = new ResizeObserver(() => {
    logger.debug('resizeObserver.create: updateMaxTop')
    updateMaxTop()
  })

  if (scrollContainer.value) {
    logger.debug('resizeObserver.observe(scrollContainer.value)')
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