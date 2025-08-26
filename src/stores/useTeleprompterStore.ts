import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { compileMarkdown } from '@/utils/markdown'
import { AutoScroller, clampScrollOffset } from '@/utils/scrolling'
import { contentStorage, scrollPositionStorage } from '@/utils/persistence'
import { usePrefsStore } from './usePrefsStore'

export const useTeleprompterStore = defineStore('teleprompter', () => {
  const preferences = usePrefsStore()

  // State
  const contentRaw = ref('')
  const contentHtml = ref('')
  const isPlaying = ref(false)
  const scrollOffset = ref(0)
  const lineHeightPx = ref(24) // Default fallback
  const viewportHeightPx = ref(600) // Default fallback
  const contentHeightPx = ref(0)

  // Auto-scroller instance
  let autoScroller: AutoScroller | null = null

  // Getters
  const maxOffset = computed(() => Math.max(0, contentHeightPx.value - viewportHeightPx.value))

  const scrollProgress = computed(() => {
    if (maxOffset.value === 0) return 0
    return (scrollOffset.value / maxOffset.value) * 100
  })

  const canScrollUp = computed(() => scrollOffset.value > 0)
  const canScrollDown = computed(() => scrollOffset.value < maxOffset.value)

  // Actions
  async function setContent(raw: string) {
    contentRaw.value = raw
    await compileMarkdownContent()
    await saveContent()
  }

  async function compileMarkdownContent() {
    try {
      contentHtml.value = compileMarkdown(contentRaw.value)
    } catch (error) {
      console.error('Error compiling markdown:', error)
      contentHtml.value = `<p>Error compiling markdown: ${error}</p>`
    }
  }

  function play() {
    if (isPlaying.value) return

    isPlaying.value = true

    if (!autoScroller) {
      autoScroller = new AutoScroller(
        updateScrollOffset,
        () => scrollOffset.value,
        preferences.speedPxPerSec
      )
    } else {
      // Update speed for existing scroller
      autoScroller.setSpeed(preferences.speedPxPerSec)
    }

    autoScroller.start()
  }

  function pause() {
    if (!isPlaying.value) return

    isPlaying.value = false
    autoScroller?.stop()
    saveScrollPosition()
  }

  function toggle() {
    if (isPlaying.value) {
      pause()
    } else {
      play()
    }
  }

  function updateScrollOffset(newOffset: number) {
    scrollOffset.value = clampScrollOffset(newOffset, contentHeightPx.value, viewportHeightPx.value)
  }

  function stepLines(n: number) {
    const targetOffset = scrollOffset.value + n * lineHeightPx.value
    updateScrollOffset(targetOffset)
    saveScrollPosition()
  }

  function toHome() {
    updateScrollOffset(0)
    saveScrollPosition()
  }

  function toEnd() {
    updateScrollOffset(maxOffset.value)
    saveScrollPosition()
  }

  function measureLineHeight(element: HTMLElement) {
    const computedStyle = window.getComputedStyle(element)
    const lineHeight = computedStyle.lineHeight

    if (lineHeight === 'normal') {
      const fontSize = parseFloat(computedStyle.fontSize)
      lineHeightPx.value = fontSize * 1.2
    } else if (lineHeight.includes('px')) {
      lineHeightPx.value = parseFloat(lineHeight)
    } else {
      const fontSize = parseFloat(computedStyle.fontSize)
      lineHeightPx.value = parseFloat(lineHeight) * fontSize
    }
  }

  function setViewportHeight(height: number) {
    viewportHeightPx.value = height
  }

  function setContentHeight(height: number) {
    contentHeightPx.value = height
  }

  function updateSpeed(speedPxPerSec: number) {
    autoScroller?.setSpeed(speedPxPerSec)
  }

  // Persistence
  async function saveContent() {
    try {
      await contentStorage.set(contentRaw.value)
    } catch (error) {
      console.warn('Failed to save content:', error)
    }
  }

  async function loadContent() {
    try {
      const saved = await contentStorage.get()
      if (saved) {
        contentRaw.value = saved
        await compileMarkdownContent()
      }
    } catch (error) {
      console.warn('Failed to load content:', error)
    }
  }

  async function saveScrollPosition() {
    try {
      await scrollPositionStorage.set(scrollOffset.value)
    } catch (error) {
      console.warn('Failed to save scroll position:', error)
    }
  }

  async function loadScrollPosition() {
    try {
      const saved = await scrollPositionStorage.get()
      if (typeof saved === 'number') {
        updateScrollOffset(saved)
      }
    } catch (error) {
      console.warn('Failed to load scroll position:', error)
    }
  }

  // Initialize
  async function initialize() {
    await loadContent()
    await loadScrollPosition()
  }

  return {
    // State
    contentRaw,
    contentHtml,
    isPlaying,
    scrollOffset,
    lineHeightPx,
    viewportHeightPx,
    contentHeightPx,

    // Getters
    maxOffset,
    scrollProgress,
    canScrollUp,
    canScrollDown,

    // Actions
    setContent,
    compileMarkdownContent,
    play,
    pause,
    toggle,
    updateScrollOffset,
    stepLines,
    toHome,
    toEnd,
    measureLineHeight,
    setViewportHeight,
    setContentHeight,
    updateSpeed,
    saveContent,
    loadContent,
    saveScrollPosition,
    loadScrollPosition,
    initialize,
  }
})
