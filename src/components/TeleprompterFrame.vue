<template>
  <div ref="containerRef" class="teleprompter-frame" @click="onTap">
    <!-- Transformed content container -->
    <div ref="transformedContainerRef" class="teleprompter-container" :style="containerStyle">
      <!-- Content -->
      <div
        ref="contentRef"
        class="teleprompter-content"
        data-testid="teleprompter-content"
        :style="contentStyle"
        v-html="teleprompterStore.contentHtml"
      />
    </div>

    <!-- Fixed highlight band (not transformed) -->
    <div
      v-if="prefsStore.highlightBandLines > 0"
      ref="highlightBandRef"
      class="highlight-band"
      :style="highlightBandStyle"
    />

    <!-- Fixed dimming overlay (not transformed) -->
    <div v-if="prefsStore.highlightBandLines > 0" class="dimming-overlay" :style="dimmingStyle" />

    <!-- Highlight band position handle -->
    <HighlightBandHandle
      v-if="prefsStore.highlightBandLines > 0 && !teleprompterStore.isPlaying"
      :position="prefsStore.highlightBandPosPct"
      @position-change="onHighlightBandPositionChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { throttle } from '@/utils/dom'
import HighlightBandHandle from './HighlightBandHandle.vue'

// Stores
const teleprompterStore = useTeleprompterStore()
const prefsStore = usePrefsStore()

// Emits
const emit = defineEmits<{
  contentHeightChanged: [height: number]
  viewportHeightChanged: [height: number]
  tap: []
}>()

// Refs
const containerRef = ref<HTMLElement>()
const transformedContainerRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const highlightBandRef = ref<HTMLElement>()

// Touch handling
let touchStartY = 0
let touchStartTime = 0
const SWIPE_THRESHOLD = 50
const PRESS_HOLD_DURATION = 500

// Computed styles
const containerStyle = computed(() => {
  // Mirror transforms on the container, like in the reference implementation
  const scaleX = prefsStore.mirrorH ? 'scaleX(-1)' : 'scaleX(1)'
  const scaleY = prefsStore.mirrorV ? 'scaleY(-1)' : 'scaleY(1)'

  return {
    transform: `${scaleX} ${scaleY}`,
  }
})

const contentStyle = computed(() => {
  return {
    lineHeight: prefsStore.lineHeight.toString(),
    fontFamily: prefsStore.fontFamily,
    color: prefsStore.fgColor,
  }
})

const highlightBandStyle = computed(() => {
  if (!containerRef.value) return {}

  const viewportHeight = containerRef.value.clientHeight
  const bandHeight = teleprompterStore.lineHeightPx * prefsStore.highlightBandLines
  const bandTop = (viewportHeight * prefsStore.highlightBandPosPct) / 100 - bandHeight / 2

  return {
    top: `${Math.max(0, bandTop)}px`,
    height: `${bandHeight}px`,
    backgroundColor: `rgba(255, 255, 255, ${0.1})`,
  }
})

const dimmingStyle = computed(() => {
  if (!containerRef.value) return {}

  const viewportHeight = containerRef.value.clientHeight
  const bandHeight = teleprompterStore.lineHeightPx * prefsStore.highlightBandLines
  const bandTop = (viewportHeight * prefsStore.highlightBandPosPct) / 100 - bandHeight / 2
  const bandBottom = bandTop + bandHeight

  return {
    '--band-top': `${Math.max(0, bandTop)}px`,
    '--band-bottom': `${Math.max(0, viewportHeight - bandBottom)}px`,
    '--dimming-intensity': prefsStore.dimmingIntensity.toString(),
  }
})

// Lifecycle
onMounted(() => {
  measureDimensions()
  setupResizeObserver()

  // Add passive touch event listeners for better performance
  if (containerRef.value) {
    containerRef.value.addEventListener('touchstart', onTouchStart, { passive: true })
    containerRef.value.addEventListener('touchend', onTouchEnd, { passive: true })
  }

  // Initial measurement after content loads
  nextTick(measureDimensions)
})

onUnmounted(() => {
  cleanupResizeObserver()

  // Remove touch event listeners
  if (containerRef.value) {
    containerRef.value.removeEventListener('touchstart', onTouchStart)
    containerRef.value.removeEventListener('touchend', onTouchEnd)
  }
})

// Watch for content changes
watch(
  () => teleprompterStore.contentHtml,
  () => {
    nextTick(measureDimensions)
  }
)

// Watch for scroll offset changes and update container scrollTop
watch(
  () => teleprompterStore.scrollOffset,
  (newOffset: number) => {
    if (transformedContainerRef.value) {
      transformedContainerRef.value.scrollTop = newOffset
    }
  }
)

watch(
  () => [prefsStore.fontSizePx, prefsStore.lineHeight],
  () => {
    nextTick(measureDimensions)
  }
)

// Resize observer
let resizeObserver: ResizeObserver | null = null

function setupResizeObserver() {
  if (typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver(throttle(measureDimensions, 100))

  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  if (contentRef.value) {
    resizeObserver.observe(contentRef.value)
  }
}

function cleanupResizeObserver() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
}

// Measurements
function measureDimensions() {
  if (!containerRef.value || !contentRef.value) return

  const viewportHeight = containerRef.value.clientHeight
  const contentHeight = contentRef.value.scrollHeight

  teleprompterStore.setViewportHeight(viewportHeight)
  teleprompterStore.setContentHeight(contentHeight)
  teleprompterStore.measureLineHeight(contentRef.value)

  emit('contentHeightChanged', contentHeight)
  emit('viewportHeightChanged', viewportHeight)
}

// Touch interactions
function onTouchStart(event: TouchEvent) {
  if (event.touches.length !== 1) return

  const touch = event.touches[0]
  touchStartY = touch.clientY
  touchStartTime = Date.now()
}

function onTouchEnd(event: TouchEvent) {
  if (event.changedTouches.length !== 1) return

  const touch = event.changedTouches[0]
  const touchEndY = touch.clientY
  const touchDuration = Date.now() - touchStartTime
  const deltaY = touchEndY - touchStartY

  // Check for press and hold
  if (touchDuration >= PRESS_HOLD_DURATION && Math.abs(deltaY) < 10) {
    onPressAndHold()
    return
  }

  // Check for swipe
  if (Math.abs(deltaY) >= SWIPE_THRESHOLD) {
    const direction = deltaY > 0 ? -1 : 1 // Swipe up = scroll down
    teleprompterStore.stepLines(direction)
    return
  }

  // Regular tap
  if (touchDuration < 300 && Math.abs(deltaY) < 10) {
    onTap()
  }
}

function onTap() {
  emit('tap')
}

function onPressAndHold() {
  // Could emit a different event for press and hold
  emit('tap')
}

// Highlight band
function onHighlightBandPositionChange(position: number) {
  prefsStore.highlightBandPosPct = position
  prefsStore.save()
}

// Public methods (can be called from parent)
function play() {
  teleprompterStore.play()
}

function pause() {
  teleprompterStore.pause()
}

function stepLines(lines: number) {
  teleprompterStore.stepLines(lines)
}

// Expose public methods
defineExpose({
  play,
  pause,
  stepLines,
  measureDimensions,
})
</script>

<style scoped>
.teleprompter-frame {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: var(--teleprompter-bg, #000000);
  cursor: default;
  user-select: none;
}

.teleprompter-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.teleprompter-content {
  position: relative;
  width: 100%;
  padding: 24px;
  font-family: var(--font-family, 'Roboto', sans-serif);
  font-size: var(--font-size, 24px);
  line-height: var(--line-height, 1.4);
  color: var(--teleprompter-fg, #ffffff);
  word-wrap: break-word;
  transition: transform 0.1s ease-out;
}

.highlight-band {
  position: absolute;
  left: 0;
  width: 100%;
  z-index: 10;
  pointer-events: none;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-left: none;
  border-right: none;
  transition:
    top 0.2s ease,
    height 0.2s ease;
}

.dimming-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    background: var(--teleprompter-bg, #000000);
    opacity: var(--dimming-intensity, 0.3);
    transition: opacity 0.3s ease;
  }

  &::before {
    top: 0;
    height: var(--band-top, 40%);
  }

  &::after {
    bottom: 0;
    height: var(--band-bottom, 40%);
  }
}

/* Typography styles for content */
.teleprompter-content :deep(h1),
.teleprompter-content :deep(h2),
.teleprompter-content :deep(h3),
.teleprompter-content :deep(h4),
.teleprompter-content :deep(h5),
.teleprompter-content :deep(h6) {
  margin: 1em 0 0.5em 0;
  font-weight: 500;
}

.teleprompter-content :deep(p) {
  margin: 0.75em 0;
}

.teleprompter-content :deep(ul),
.teleprompter-content :deep(ol) {
  margin: 0.75em 0;
  padding-left: 2em;
}

.teleprompter-content :deep(blockquote) {
  margin: 1em 0;
  padding-left: 1em;
  border-left: 4px solid rgba(255, 255, 255, 0.3);
  font-style: italic;
}

.teleprompter-content :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.teleprompter-content :deep(pre) {
  background: rgba(255, 255, 255, 0.05);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
}

.teleprompter-content :deep(mark) {
  background: rgba(255, 255, 0, 0.3);
  padding: 0.1em 0.2em;
}

/* Padding divs for teleprompter spacing */
.teleprompter-content :deep(.teleprompter-padding-top),
.teleprompter-content :deep(.teleprompter-padding-bottom) {
  display: block;
  width: 100%;
  /* Ensure padding is at least one full viewport height */
  min-height: 100vh;
  /* For smaller screens, ensure at least 600px */
  min-height: max(100vh, 600px);
}

/* Optional: Add subtle visual indicator for padding areas during development */
.teleprompter-content :deep(.teleprompter-padding-top) {
  background: transparent;
}

.teleprompter-content :deep(.teleprompter-padding-bottom) {
  background: transparent;
}
</style>
