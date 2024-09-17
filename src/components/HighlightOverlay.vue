<template>
    <div
      class="highlight-overlay"
      :style="{
        top: `${highlightPosition}%`,
        backgroundColor: highlightBackgroundColor
      }"
    >
      <font-awesome-icon
        icon="caret-right"
        class="left-arrow"
        :style="{
          color: highlightArrowColor,
          fontSize: highlightArrowSize
        }"
        @mousedown="startDrag('left')"
      />
      <font-awesome-icon
        icon="caret-left"
        class="right-arrow"
        :style="{
          color: highlightArrowColor,
          fontSize: highlightArrowSize
        }"
        @mousedown="startDrag('right')"
      />
    </div>
  </template>
  
<script setup lang="ts">

import { ref, onMounted, onBeforeUnmount } from 'vue';
import { CommandInvoker } from '@/commands/CommandInvoker';
import { UpdateHighlightPositionCommand } from '@/commands/UpdateHighlightPositionCommand';
import { usePrompterSettingsStore } from '@/stores/prompterSettings';
import logger from '@/core/logger'


const store = usePrompterSettingsStore();
const invoker = new CommandInvoker();

const props = defineProps({
    highlightPosition: {
        type: Number,
        required: true
    },
    highlightBackgroundColor: {
        type: String,
        required: true
    },
    highlightArrowColor: {
        type: String,
        required: true
    },
    highlightArrowSize: {
        type: String,
        required: true
    }
})


const dragging = ref(false);
const direction = ref<'left' | 'right' | null>(null);

const startDrag = (dir: 'left' | 'right') => {
  logger.info('HighlightOverlay startDrag called with direction: ', dir)
  dragging.value = true;
  direction.value = dir;
};

const stopDrag = () => {
  logger.info('HighlightOverlay stopDrag')
  dragging.value = false;
  direction.value = null;
};

const onMouseMove = (event: MouseEvent) => {
  if (!dragging.value) return;

  logger.info('HighlightOverlay onMouseMove')

  const newY = event.clientY;
  const highlightPosition = Math.min(Math.max((newY / window.innerHeight) * 100, 4), 94);
  invoker.addCommand(new UpdateHighlightPositionCommand(store, highlightPosition))
  invoker.executeCommands();

};

onMounted(() => {
  logger.info('HighlightOverlay mounted')
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', stopDrag);
});

onBeforeUnmount(() => {
  logger.info('HighlightOverlay unmounted')
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', stopDrag);
});




</script>
  
  <style scoped>
  .highlight-overlay {
    position: absolute;
    left: 0;
    width: 100%;
    height: calc(3 * 1em); /* Altura de tres líneas de texto */
    transform: translateY(-50%); /* Centrar verticalmente */
    /* pointer-events: none; */
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
  </style>