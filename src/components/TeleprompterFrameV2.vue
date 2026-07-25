<!--
  TeleprompterFrame v2 - Decoupled Implementation
  
  This version uses service abstractions instead of direct store access,
  making it completely swappable with other implementations.
-->
<template>
  <div
    ref="containerRef"
    class="teleprompter-frame"
    :class="{ 'tauri-desktop': isTauri() }"
    @click="onTap"
  >
    <!-- DEBUG INFO - Temporary for Android debugging -->
    <!-- Debug Info Window - Controlled by environment variables -->
    <div
      v-if="showDebug"
      class="debug-info"
    >
      <div class="debug-header">
        DEBUG MODE
      </div>
      <div class="debug-row">
        <span class="debug-label">Status:</span>
        <span :class="['debug-value', { playing: scrollState.isPlaying }]">
          {{ scrollState.isPlaying ? 'PLAYING' : 'PAUSED' }}
        </span>
      </div>
      <div class="debug-row">
        <span class="debug-label">Offset:</span>
        <span class="debug-value">{{ scrollState.offset.toFixed(1) }}px</span>
      </div>
      <div class="debug-row">
        <span class="debug-label">Content:</span>
        <span class="debug-value">{{ measuredContentHeight || 'N/A' }}px</span>
      </div>
      <div class="debug-row">
        <span class="debug-label">Viewport:</span>
        <span class="debug-value">{{ viewportHeight || 'N/A' }}px</span>
      </div>
      <div class="debug-row">
        <span class="debug-label">Scroll:</span>
        <span class="debug-value">{{
          Math.round(
            (scrollState.offset /
              Math.max(1, (measuredContentHeight || 1) - (viewportHeight || 1))) *
              100
          )
        }}%</span>
      </div>
    </div>
    <!-- Transformed content container -->
    <div
      ref="transformedContainerRef"
      class="teleprompter-container"
      :style="containerStyle"
    >
      <!-- Content -->
      <div
        ref="contentRef"
        class="teleprompter-content"
        :style="contentStyle"
        data-testid="teleprompter-content"
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
    <div
      v-if="highlightBand.enabled"
      class="dimming-overlay"
      :style="dimmingStyle"
    />

    <!-- Always visible triangular visual aids -->
    <div v-if="highlightBand.enabled">
      <!-- Left triangle (pointing right) -->
      <div
        class="triangle triangle-left"
        :style="triangleStyle"
      />

      <!-- Right triangle (pointing left) -->
      <div
        class="triangle triangle-right"
        :style="triangleStyle"
      />
    </div>

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
import { isTauri } from '@/utils/tauri'
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
// Scroll Synchronization State
// ========================================

let isScrollingSynchronizing = false // Flag to prevent infinite loops
let scrollTimeout: number | null = null
const SCROLL_DEBOUNCE_MS = 50 // Debounce scroll events

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
  // Calculate minimum height: ensure content is at least 2x viewport height
  // or natural content height, whichever is greater
  const minHeight = Math.max(
    viewportHeight.value * 2, // At least 2x viewport for scrolling
    measuredContentHeight.value || viewportHeight.value * 2 // Use measured or fallback
  )

  // console.log('[ANDROID DEBUG] contentStyle computed - viewport:', viewportHeight.value, 'measured:', measuredContentHeight.value, 'minHeight:', minHeight)

  return {
    fontSize: `${props.displayPrefs.fontSizePx}px`,
    lineHeight: props.displayPrefs.lineHeight.toString(),
    fontFamily: props.displayPrefs.fontFamily,
    color: props.displayPrefs.fgColor,
    textAlign: props.displayPrefs.textAlignment,
    minHeight: `${minHeight}px`, // Dynamic height based on content
  }
})

// Dynamic line height measurement
const measuredLineHeight = ref(24)

// Dynamic content height for optimal scrolling
const measuredContentHeight = ref(0)
const viewportHeight = ref(0)

// Debug window visibility based on environment variables
const showDebug = ref(false)

// Set debug visibility based on environment
if (import.meta.env.DEV) {
  showDebug.value = true
  console.log('Debug enabled: development mode')
} else if (import.meta.env.VITE_DEBUG_MODE === 'true') {
  showDebug.value = true
  console.log('Debug enabled: VITE_DEBUG_MODE=true')
} else {
  showDebug.value = false
  console.log('Debug disabled: production mode')
}

function measureLineHeight() {
  if (!contentRef.value) return
  // Create a temporary span with sample text
  const span = document.createElement('span')
  span.textContent = 'Ag' // Use typical ascender/descender chars
  span.style.visibility = 'hidden'
  span.style.position = 'absolute'
  span.style.fontSize = `${props.displayPrefs.fontSizePx}px`
  span.style.lineHeight = props.displayPrefs.lineHeight.toString()
  span.style.fontFamily = props.displayPrefs.fontFamily
  contentRef.value.appendChild(span)
  measuredLineHeight.value = span.offsetHeight
  span.remove()
}

// Re-measure when font size or line height changes
watch(
  () => [
    props.displayPrefs.fontSizePx,
    props.displayPrefs.lineHeight,
    props.displayPrefs.fontFamily,
  ],
  () => {
    nextTick(measureLineHeight)
  },
  { immediate: true }
)

const highlightBandStyle = computed(() => {
  if (!containerRef.value) return {}
  const viewportHeight = containerRef.value.clientHeight
  const bandHeight = measuredLineHeight.value * props.highlightBand.lines
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
  const bandHeight = measuredLineHeight.value * props.highlightBand.lines
  const bandTop = (viewportHeight * props.highlightBand.positionPct) / 100 - bandHeight / 2
  const bandBottom = bandTop + bandHeight
  return {
    '--band-top': `${Math.max(0, bandTop)}px`,
    '--band-bottom': `${Math.max(0, viewportHeight - bandBottom)}px`,
    '--dimming-intensity': props.highlightBand.dimmingIntensity.toString(),
  }
})

const triangleStyle = computed(() => ({
  top: `${props.highlightBand.positionPct}%`,
  transform: 'translateY(-50%)',
}))

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

  // Add scroll listener to sync manual scroll with store
  if (transformedContainerRef.value) {
    transformedContainerRef.value.addEventListener('scroll', onManualScroll, { passive: true })
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

  // Remove scroll event listener
  if (transformedContainerRef.value) {
    transformedContainerRef.value.removeEventListener('scroll', onManualScroll)
  }

  // Clean up scroll timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
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

// Watch for scroll offset changes and update container scrollTop * WITH DEBUG & SYNC *
watch(
  () => props.scrollState.offset,
  (newOffset: number) => {
    // console.log('[SCROLL SYNC] Store offset changed to:', newOffset.toFixed(1))
    if (transformedContainerRef.value && !isScrollingSynchronizing) {
      const el = transformedContainerRef.value
      // console.log('[SCROLL SYNC] Updating DOM scrollTop from', el.scrollTop.toFixed(1), 'to', newOffset.toFixed(1))

      // Set flag to prevent sync loop
      isScrollingSynchronizing = true
      el.scrollTop = newOffset

      // Reset flag after a brief moment
      setTimeout(() => {
        isScrollingSynchronizing = false
      }, 10)
    }
  },
  { flush: 'sync' } // Force immediate execution, don't wait for Vue's batch updates
)

// Watch for font changes
watch(
  () => [props.displayPrefs.fontSizePx, props.displayPrefs.lineHeight],
  () => {
    nextTick(measureDimensions)
  }
)

// Watch for content changes to recalculate dimensions
watch(
  () => props.content.html,
  () => {
    // Wait for DOM to update, then measure
    nextTick(() => {
      setTimeout(measureDimensions, 100) // Small delay to ensure rendering is complete
    })
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

  const newViewportHeight = containerRef.value.clientHeight
  const newContentHeight = contentRef.value.scrollHeight

  // Update reactive refs for computed styles
  viewportHeight.value = newViewportHeight
  measuredContentHeight.value = newContentHeight

  // console.log('[ANDROID DEBUG] measureDimensions - viewport:', newViewportHeight, 'content:', newContentHeight)

  emit('content-height-changed', newContentHeight)
  emit('viewport-height-changed', newViewportHeight)
}

// ========================================
// Touch Interactions
// ========================================

function onTouchStart(event: TouchEvent) {
  if (event.touches.length !== 1) return

  const touch = event.touches[0]
  if (!touch) return
  touchStartY = touch.clientY
  touchStartTime = Date.now()
}

function onTouchEnd(event: TouchEvent) {
  if (event.changedTouches.length !== 1) return

  const touch = event.changedTouches[0]
  if (!touch) return
  const touchEndY = touch.clientY
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
  emit('highlight-band-position-change', position)
}

// ========================================
// Manual Scroll Synchronization
// ========================================

function onManualScroll(event: Event) {
  // Skip if we're in the middle of programmatic scrolling
  if (isScrollingSynchronizing) {
    return
  }

  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop

  // console.log('[SCROLL SYNC] Manual scroll detected:', scrollTop.toFixed(1))

  // Debounce the scroll events to avoid too many updates
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  scrollTimeout = window.setTimeout(() => {
    // console.log('[SCROLL SYNC] Emitting manual scroll offset:', scrollTop.toFixed(1))
    emit('manual-scroll', scrollTop)
  }, SCROLL_DEBOUNCE_MS)
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
  overflow: hidden !important;
  background: v-bind('displayPrefs.bgColor');
  cursor: default;
  user-select: none;

  /* Ensure no scrollbars on parent container */
  -ms-overflow-style: none !important; /* IE and Edge */
  scrollbar-width: none !important; /* Firefox */
}

/* Tauri/Desktop specific: more aggressive scrollbar hiding */
@media screen and (min-width: 1024px) {
  .teleprompter-frame,
  .teleprompter-container,
  .transformed-container {
    overflow: hidden !important;
    -ms-overflow-style: none !important;
    scrollbar-width: none !important;
  }

  .teleprompter-frame::-webkit-scrollbar,
  .teleprompter-container::-webkit-scrollbar,
  .transformed-container::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
}

/* Specific styles for Tauri desktop environment */
.tauri-desktop {
  overflow: hidden !important;
}

.tauri-desktop .teleprompter-container {
  overflow-y: scroll !important; /* Keep scroll functionality */
  overflow-x: hidden !important;
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

.tauri-desktop .teleprompter-container::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
}

.tauri-desktop .transformed-container {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

.tauri-desktop .transformed-container::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
}

/* Hide scrollbars on parent container too */
.teleprompter-frame::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
}

.teleprompter-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  /* TEMPORAL: scroll-behavior: smooth; - Disabled for debugging */

  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
.debug-info {
  position: fixed;
  top: 70px;
  right: 10px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  z-index: 9999;
  min-width: 200px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.debug-header {
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
  color: #00ff88;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;
}

.debug-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  align-items: center;
}

.debug-label {
  color: #aaaaaa;
  font-weight: normal;
}

.debug-value {
  color: #ffffff;
  font-weight: bold;
  text-align: right;
}

.debug-value.playing {
  color: #00ff88;
  text-shadow: 0 0 4px rgba(0, 255, 136, 0.3);
}

/* Responsive debug positioning */
@media (max-width: 768px) {
  .debug-info {
    top: 60px; /* Smaller top margin on mobile */
    right: 5px;
    left: 5px; /* Full width on mobile for better readability */
    min-width: auto;
    font-size: 10px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .debug-info {
    top: 80px; /* More space on tablets */
  }
}

@media (min-width: 1025px) {
  .debug-info {
    top: 70px; /* Standard desktop positioning */
  }
}

/* Hide scrollbar for Chrome, Safari and Opera */
.teleprompter-container::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent;
}

.teleprompter-container::-webkit-scrollbar-track {
  display: none;
  background: transparent;
}

.teleprompter-container::-webkit-scrollbar-thumb {
  display: none;
  background: transparent;
}

.teleprompter-container::-webkit-scrollbar-corner {
  display: none;
  background: transparent;
}

/* Hide scrollbar for Firefox */
/* Also hide scrollbars on the transformed container */
.transformed-container::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent;
}

.transformed-container::-webkit-scrollbar-track {
  display: none;
  background: transparent;
}

.transformed-container::-webkit-scrollbar-thumb {
  display: none;
  background: transparent;
}

.transformed-container::-webkit-scrollbar-corner {
  display: none;
  background: transparent;
}

.transformed-container {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer and Edge */
}

.teleprompter-content {
  padding: 2rem;
  /* Dynamic min-height now controlled by computed contentStyle */
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

/* Triangular visual aids for highlight band */
.triangle {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 15;
  transform: translateY(-50%);
}

.triangle-left {
  left: 5px;
  border-top: 16px solid transparent;
  border-bottom: 16px solid transparent;
  border-left: 24px solid #2196f3;
}

.triangle-right {
  right: 5px;
  border-top: 16px solid transparent;
  border-bottom: 16px solid transparent;
  border-right: 24px solid #2196f3;
}

/* Touch device adjustments */
@media (hover: none) and (pointer: coarse) {
  .triangle-left {
    border-top: 22px solid transparent;
    border-bottom: 22px solid transparent;
    border-left: 32px solid #2196f3;
  }

  .triangle-right {
    border-top: 22px solid transparent;
    border-bottom: 22px solid transparent;
    border-right: 32px solid #2196f3;
  }
}

/* Additional fallback for high DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi), (min-resolution: 2dppx) {
  .teleprompter-container::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
  }
}

/* Aggressive scrollbar hiding for all child elements */
.teleprompter-frame *,
.teleprompter-container *,
.teleprompter-content * {
  scrollbar-width: none !important; /* Firefox */
  -ms-overflow-style: none !important; /* IE and Edge */
}

.teleprompter-frame *::-webkit-scrollbar,
.teleprompter-container *::-webkit-scrollbar,
.teleprompter-content *::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

/* Force remove scrollbars on high resolution displays */
@media screen and (min-width: 1920px),
  screen and (min-height: 1080px),
  (-webkit-min-device-pixel-ratio: 1.5) {
  .teleprompter-container {
    overflow-y: auto !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }

  .teleprompter-container::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    background: transparent !important;
  }
}
</style>
