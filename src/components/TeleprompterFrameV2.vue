<!--
  TeleprompterFrame v2 - Decoupled Implementation
  
  This version uses service abstractions instead of direct store access,
  making it completely swappable with other implementations.
-->
<template>
  <div ref="containerRef" class="teleprompter-frame" @click="onTap">
    <!-- Transformed content container -->
    <div ref="transformedContainerRef" class="teleprompter-container" :style="containerStyle">
      <!-- Content -->
      <div
        ref="contentRef"
        class="teleprompter-content"
        :style="contentStyle"
        v-html="content.html"
      />
    </div>

    <!-- Fixed highlight band (not transformed) -->
    <div
      v-if="highlightBand.enabled"
      ref="highlightBandRef"
      class="highlight-band"
      :style="highlightBandStyle"
    />

    <!-- Fixed dimming overlay (not transformed) -->
    <div v-if="highlightBand.enabled" class="dimming-overlay" :style="dimmingStyle" />

    <!-- Highlight band position handle -->
    <HighlightBandHandle
      v-if="highlightBand.enabled && !scrollState.isPlaying"
      :position="highlightBand.positionPct"
      @position-change="onHighlightBandPositionChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { throttle } from '@/utils/dom'
import HighlightBandHandle from './HighlightBandHandle.vue'
import type { TeleprompterFrameProps, TeleprompterEvents } from '@/types/component-interfaces'

// ========================================
// Props & Events (Pure Interface)
// ========================================

interface Props {
  content: TeleprompterFrameProps['content']
  scrollState: TeleprompterFrameProps['scrollState']
  displayPrefs: TeleprompterFrameProps['displayPrefs']
  highlightBand: TeleprompterFrameProps['highlightBand']
}

const props = defineProps<Props>()

const emit = defineEmits<TeleprompterEvents>()

// ========================================
// Template Refs
// ========================================

const containerRef = ref<HTMLElement>()
const transformedContainerRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const highlightBandRef = ref<HTMLElement>()

// ========================================
// Touch Handling State
// ========================================

let touchStartY = 0
let touchStartTime = 0
const SWIPE_THRESHOLD = 50
const PRESS_HOLD_DURATION = 500

// ========================================
// Computed Styles
// ========================================

const containerStyle = computed(() => {
  const scaleX = props.displayPrefs.mirrorH ? 'scaleX(-1)' : 'scaleX(1)'
  const scaleY = props.displayPrefs.mirrorV ? 'scaleY(-1)' : 'scaleY(1)'

  return {
    transform: `${scaleX} ${scaleY}`,
  }
})

const contentStyle = computed(() => {
  return {
    fontSize: `${props.displayPrefs.fontSizePx}px`,
    lineHeight: props.displayPrefs.lineHeight.toString(),
    fontFamily: props.displayPrefs.fontFamily,
    color: props.displayPrefs.fgColor,
  }
})

const highlightBandStyle = computed(() => {
  if (!containerRef.value) return {}

  const viewportHeight = containerRef.value.clientHeight
  const bandHeight = 24 * props.highlightBand.lines // Assuming 24px line height, should be measured
  const bandTop = (viewportHeight * props.highlightBand.positionPct) / 100 - bandHeight / 2

  return {
    top: `${Math.max(0, bandTop)}px`,
    height: `${bandHeight}px`,
    backgroundColor: `rgba(255, 255, 255, ${0.1})`,
  }
})

const dimmingStyle = computed(() => {
  if (!containerRef.value) return {}

  const viewportHeight = containerRef.value.clientHeight
  const bandHeight = 24 * props.highlightBand.lines
  const bandTop = (viewportHeight * props.highlightBand.positionPct) / 100 - bandHeight / 2
  const bandBottom = bandTop + bandHeight

  return {
    '--band-top': `${Math.max(0, bandTop)}px`,
    '--band-bottom': `${Math.max(0, viewportHeight - bandBottom)}px`,
    '--dimming-intensity': props.highlightBand.dimmingIntensity.toString(),
  }
})

// ========================================
// Lifecycle & Measurements
// ========================================

let resizeObserver: ResizeObserver | null = null

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

// ========================================
// Watchers
// ========================================

// Watch for content changes
watch(
  () => props.content.html,
  () => {
    nextTick(measureDimensions)
  }
)

// Watch for scroll offset changes and update container scrollTop
watch(
  () => props.scrollState.offset,
  (newOffset: number) => {
    if (transformedContainerRef.value) {
      transformedContainerRef.value.scrollTop = newOffset
    }
  }
)

// Watch for font changes
watch(
  () => [props.displayPrefs.fontSizePx, props.displayPrefs.lineHeight],
  () => {
    nextTick(measureDimensions)
  }
)

// ========================================
// Resize Observer
// ========================================

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

// ========================================
// Measurements
// ========================================

function measureDimensions() {
  if (!containerRef.value || !contentRef.value) return

  const viewportHeight = containerRef.value.clientHeight
  const contentHeight = contentRef.value.scrollHeight

  emit('content-height-changed', contentHeight)
  emit('viewport-height-changed', viewportHeight)
}

// ========================================
// Touch Interactions
// ========================================

function onTouchStart(event: TouchEvent) {
  if (event.touches.length !== 1) return

  touchStartY = event.touches[0].clientY
  touchStartTime = Date.now()
}

function onTouchEnd(event: TouchEvent) {
  if (event.changedTouches.length !== 1) return

  const touchEndY = event.changedTouches[0].clientY
  const touchEndTime = Date.now()
  const deltaY = touchEndY - touchStartY
  const duration = touchEndTime - touchStartTime

  // Check for press and hold
  if (duration >= PRESS_HOLD_DURATION && Math.abs(deltaY) < SWIPE_THRESHOLD) {
    emit('press-hold')
    return
  }

  // Check for swipe
  if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
    if (deltaY > 0) {
      emit('swipe-down')
    } else {
      emit('swipe-up')
    }
    return
  }

  // Regular tap
  emit('tap')
}

// ========================================
// Event Handlers
// ========================================

function onTap() {
  emit('tap')
}

function onHighlightBandPositionChange(position: number) {
  // This would be handled by the parent component using the service
  console.log('Highlight band position changed:', position)
  // In the refactored version, we don't handle this directly
  // The parent component should listen to this event and update via service
}

// ========================================
// Public API (exposed methods)
// ========================================

defineExpose({
  measureDimensions,
})
</script>

<style scoped>
.teleprompter-frame {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: v-bind('displayPrefs.bgColor');
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
  scroll-behavior: smooth;

  /* Hide scrollbar but allow scrolling */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.teleprompter-container::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.teleprompter-content {
  padding: 2rem;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.highlight-band {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-left: none;
  border-right: none;
  z-index: 2;
}

.dimming-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, calc(var(--dimming-intensity) * 0.8)) 0%,
    rgba(0, 0, 0, calc(var(--dimming-intensity) * 0.6)) var(--band-top),
    transparent calc(var(--band-top) + 10px),
    transparent calc(100% - var(--band-bottom) - 10px),
    rgba(0, 0, 0, calc(var(--dimming-intensity) * 0.6)) calc(100% - var(--band-bottom)),
    rgba(0, 0, 0, calc(var(--dimming-intensity) * 0.8)) 100%
  );
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .teleprompter-content {
    padding: 1rem;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .highlight-band {
    border-color: rgba(255, 255, 255, 0.8);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .teleprompter-container {
    scroll-behavior: auto;
  }
}
</style>
