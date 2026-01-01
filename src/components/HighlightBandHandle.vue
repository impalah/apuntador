<template>
  <!-- Left handle -->
  <div
    ref="handleLeftRef"
    class="highlight-band-handle highlight-band-handle--left"
    :style="handleStyle"
    @mousedown="onMouseDown"
  >
    <v-icon size="small" color="white"> mdi-drag-horizontal </v-icon>
  </div>

  <!-- Right handle -->
  <div
    ref="handleRightRef"
    class="highlight-band-handle highlight-band-handle--right"
    :style="handleStyle"
    @mousedown="onMouseDown"
  >
    <v-icon size="small" color="white"> mdi-drag-horizontal </v-icon>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  position: number // 0-100 percentage from top
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  positionChange: [position: number]
}>()

// Refs
const handleLeftRef = ref<HTMLElement>()
const handleRightRef = ref<HTMLElement>()

// State
const isDragging = ref(false)
let containerHeight = 0

// Computed
const handleStyle = computed(() => ({
  top: `${props.position}%`,
  transform: 'translateY(-50%)',
}))

// Lifecycle
onMounted(() => {
  measureContainer()
  window.addEventListener('resize', measureContainer)

  // Add touch event listeners for drag interaction (non-passive to allow preventDefault)
  if (handleLeftRef.value) {
    handleLeftRef.value.addEventListener('touchstart', onTouchStart, { passive: false })
  }
  if (handleRightRef.value) {
    handleRightRef.value.addEventListener('touchstart', onTouchStart, { passive: false })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', measureContainer)

  // Remove touch event listeners
  if (handleLeftRef.value) {
    handleLeftRef.value.removeEventListener('touchstart', onTouchStart)
  }
  if (handleRightRef.value) {
    handleRightRef.value.removeEventListener('touchstart', onTouchStart)
  }

  cleanup()
})

// Measurements
function measureContainer() {
  const container = handleLeftRef.value?.parentElement || handleRightRef.value?.parentElement
  if (container) {
    containerHeight = container.clientHeight
  }
}

// Mouse events
function onMouseDown(event: MouseEvent) {
  event.preventDefault()
  startDrag(event.clientY)
}

// Touch events
function onTouchStart(event: TouchEvent) {
  if (event.touches.length !== 1) return

  // Prevent default scroll behavior during drag
  try {
    event.preventDefault()
  } catch (e) {
    // Handle case where preventDefault is not allowed (should not happen with passive: false)
    console.warn('Could not prevent default touch behavior:', e)
  }

  const touch = event.touches[0]
  if (!touch) return
  startDrag(touch.clientY)
}

// Drag handling
function startDrag(startY: number) {
  isDragging.value = true
  measureContainer()

  const startPosition = props.position
  const startOffsetY = (containerHeight * startPosition) / 100

  const onMove = (clientY: number) => {
    if (!isDragging.value) return

    const deltaY = clientY - startY
    const newOffsetY = startOffsetY + deltaY
    const newPosition = Math.max(0, Math.min(100, (newOffsetY / containerHeight) * 100))

    emit('positionChange', newPosition)
  }

  const onMouseMove = (event: MouseEvent) => {
    onMove(event.clientY)
  }

  const onTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 1) return
    event.preventDefault()
    const touch = event.touches[0]
    if (!touch) return
    onMove(touch.clientY)
  }

  const onEnd = () => {
    cleanup()
  }

  // Add event listeners
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onEnd)
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onEnd)

  // Store cleanup function
  currentCleanup = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onEnd)
    isDragging.value = false
    currentCleanup = null
  }
}

let currentCleanup: (() => void) | null = null

function cleanup() {
  if (currentCleanup) {
    currentCleanup()
  }
}
</script>

<style scoped>
.highlight-band-handle {
  position: absolute;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.7);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  z-index: 20;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: rgba(255, 255, 255, 0.8);
  }

  &:active {
    cursor: grabbing;
    background: rgba(0, 0, 0, 1);
    border-color: rgba(255, 255, 255, 1);
  }
}

.highlight-band-handle--left {
  left: 60px;
}

.highlight-band-handle--right {
  right: 60px;
}

/* Touch device adjustments */
@media (hover: none) and (pointer: coarse) {
  .highlight-band-handle {
    width: 44px;
    height: 44px;
    border-radius: 22px;
  }
}
</style>
