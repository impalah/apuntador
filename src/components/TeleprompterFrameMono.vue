<!--
  TeleprompterFrame Mono - plain-text, monospace alternative to
  TeleprompterFrameV2. Renders precomputed lines (see useMonospaceLayout.ts,
  owned by TeleprompterPage.vue) instead of compiling/rendering Markdown, so
  voice-tracking can compute an exact scroll position (character/line-based)
  instead of an approximation. Pure props/events, same contract shape as V2
  (see src/types/component-interfaces.d.ts) - TeleprompterFrameV2.vue itself
  is intentionally untouched by this feature.
-->
<template>
  <div
    ref="containerRef"
    class="teleprompter-frame-mono"
    :class="{ 'tauri-desktop': isTauri() }"
    @click="onTap"
  >
    <div
      ref="transformedContainerRef"
      class="teleprompter-container-mono"
      :style="containerStyle"
    >
      <div
        ref="contentRef"
        class="teleprompter-content-mono"
        :style="contentStyle"
        data-testid="teleprompter-mono-content"
      >
        <div v-for="(line, index) in content.lines" :key="index" class="mono-line">
          <template v-if="line.words.length > 0">
            <span
              v-for="(word, wordIndex) in line.words"
              :key="wordIndex"
              :class="{ 'mono-word-read': isWordRead(word) }"
              >{{ word.text }}{{ wordIndex < line.words.length - 1 ? ' ' : '' }}</span
            ></template
          ><template v-else>
            {{ blankLinePlaceholder }}
          </template>
        </div>
      </div>
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
      <div
        class="triangle triangle-left"
        :style="triangleStyle"
      />
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
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { isTauri } from '@/utils/tauri'
import { useTeleprompterScrollSync } from '@/composables/useTeleprompterScrollSync'
import HighlightBandHandle from './HighlightBandHandle.vue'
import type { MonoTeleprompterFrameProps, MonoTeleprompterEvents } from '@/types/component-interfaces'
import type { MonoWord } from '@/composables/useMonospaceLayout'

interface Props {
  content: MonoTeleprompterFrameProps['content']
  scrollState: MonoTeleprompterFrameProps['scrollState']
  displayPrefs: MonoTeleprompterFrameProps['displayPrefs']
  highlightBand: MonoTeleprompterFrameProps['highlightBand']
}

const props = defineProps<Props>()
const emit = defineEmits<MonoTeleprompterEvents>()

// A fully empty block element can collapse to zero height in some browsers;
// a non-breaking space keeps blank/paragraph-separator lines at the same
// height as text lines without showing anything visible.
const blankLinePlaceholder = '\u00A0'

/**
 * Word-level "already read" state for voice-tracking coloring - purely a
 * function of the current alignment cursor (props.content.readUpToIndex), so
 * scrolling backward or re-seeking the cursor un-highlights text for free:
 * there is no separate "highlighted so far" state to reset.
 */
function isWordRead(word: MonoWord): boolean {
  const readUpToIndex = props.content.readUpToIndex
  return readUpToIndex !== null && word.renderIndex >= 0 && word.renderIndex <= readUpToIndex
}

const containerRef = ref<HTMLElement>()
const transformedContainerRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()
const highlightBandRef = ref<HTMLElement>()

const scrollOffset = computed(() => props.scrollState.offset)

useTeleprompterScrollSync(containerRef, transformedContainerRef, contentRef, scrollOffset, {
  onTap: () => emit('tap'),
  onSwipeUp: () => emit('swipe-up'),
  onSwipeDown: () => emit('swipe-down'),
  onPressHold: () => emit('press-hold'),
  onManualScroll: (scrollTop) => emit('manual-scroll', scrollTop),
  onResize: () => measureDimensions(),
})

const containerStyle = computed(() => {
  const scaleX = props.displayPrefs.mirrorH ? 'scaleX(-1)' : 'scaleX(1)'
  const scaleY = props.displayPrefs.mirrorV ? 'scaleY(-1)' : 'scaleY(1)'
  return {
    transform: `${scaleX} ${scaleY}`,
  }
})

const contentStyle = computed(() => ({
  fontSize: `${props.displayPrefs.fontSizePx}px`,
  lineHeight: props.displayPrefs.lineHeight.toString(),
  fontFamily: props.displayPrefs.fontFamily,
  color: props.displayPrefs.fgColor,
  textAlign: props.displayPrefs.textAlignment,
}))

const highlightBandStyle = computed(() => {
  if (!containerRef.value) return {}
  const viewportHeight = containerRef.value.clientHeight
  const bandHeight = props.content.lineHeightPx * props.highlightBand.lines
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
  const bandHeight = props.content.lineHeightPx * props.highlightBand.lines
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

function measureDimensions(): void {
  if (!containerRef.value || !contentRef.value) return

  const newViewportHeight = containerRef.value.clientHeight
  // contentRef's own horizontal padding eats into the space actually
  // available for text - charsPerLine must be computed against that
  // narrower width, or lines wrap assuming more room than they have and
  // get clipped by .mono-line's overflow-x: hidden.
  const contentStyles = getComputedStyle(contentRef.value)
  const horizontalPadding =
    parseFloat(contentStyles.paddingLeft) + parseFloat(contentStyles.paddingRight)
  const newViewportWidth = contentRef.value.clientWidth - horizontalPadding
  const newContentHeight = contentRef.value.scrollHeight

  emit('content-height-changed', newContentHeight)
  emit('viewport-height-changed', newViewportHeight)
  emit('viewport-width-changed', newViewportWidth)
}

function onTap(): void {
  emit('tap')
}

function onHighlightBandPositionChange(position: number): void {
  emit('highlight-band-position-change', position)
}

watch(
  () => props.content.lines,
  () => {
    nextTick(() => setTimeout(measureDimensions, 100))
  }
)

watch(
  () => [props.displayPrefs.fontSizePx, props.displayPrefs.lineHeight, props.displayPrefs.fontFamily],
  () => {
    nextTick(measureDimensions)
  }
)

onMounted(() => {
  measureDimensions()
  nextTick(measureDimensions)
})

defineExpose({
  measureDimensions,
})
</script>

<style scoped>
.teleprompter-frame-mono {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden !important;
  background: v-bind('displayPrefs.bgColor');
  cursor: default;
  user-select: none;
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

.tauri-desktop {
  overflow: hidden !important;
}

.tauri-desktop .teleprompter-container-mono {
  overflow-y: scroll !important;
  overflow-x: hidden !important;
}

.teleprompter-frame-mono::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
}

.teleprompter-container-mono {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.teleprompter-container-mono::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent;
}

.teleprompter-content-mono {
  padding: 2rem;
}

.mono-word-read {
  color: v-bind('props.displayPrefs.voiceReadColor');
}

.mono-line {
  white-space: pre;
  overflow-x: hidden;
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

@media (prefers-contrast: high) {
  .highlight-band {
    border-color: rgba(255, 255, 255, 0.8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .teleprompter-container-mono {
    scroll-behavior: auto;
  }
}

@media (max-width: 768px) {
  .teleprompter-content-mono {
    padding: 1rem;
  }
}
</style>
