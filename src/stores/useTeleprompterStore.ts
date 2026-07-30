import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { compileMarkdown } from '@/utils/markdown'
import { AutoScroller, clampScrollOffset } from '@/utils/scrolling'
import { contentStorage, scrollPositionStorage } from '@/services/persistence'
import { LINE_HEIGHT_FALLBACK } from '@/utils/constants'
import { usePrefsStore } from './usePrefsStore'

export const useTeleprompterStore = defineStore('teleprompter', () => {
  const preferences = usePrefsStore()

  // State
  const contentRaw = ref('')
  const contentHtml = ref('')
  const isPlaying = ref(false)
  const scrollOffset = ref(0)
  const lineHeightPx = ref(LINE_HEIGHT_FALLBACK) // Use constant instead of magic number
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

  /**
   * skipAutoScroller lets an alternative driver (e.g. voice tracking) mark the
   * teleprompter as playing without starting the interval-based AutoScroller -
   * it stays isPlaying=true (so pause/UI/auto-pause-at-end logic keeps working)
   * while some other caller drives updateScrollOffset directly. Default (no
   * options) behavior is unchanged for every existing caller.
   */
  function play(options?: { skipAutoScroller?: boolean }) {
    // console.log('[ANDROID DEBUG] play() called, current isPlaying:', isPlaying.value)
    if (isPlaying.value) {
      // console.log('[ANDROID DEBUG] play() - already playing, returning')
      return
    }

    // console.log('[ANDROID DEBUG] play() - setting isPlaying to true')
    // console.log('[ANDROID DEBUG] play() - dimensions check: contentHeight:', contentHeightPx.value, 'viewportHeight:', viewportHeightPx.value, 'maxOffset:', maxOffset.value)
    // console.log('[ANDROID DEBUG] play() - current scrollOffset:', scrollOffset.value, 'lineHeight:', lineHeightPx.value)
    isPlaying.value = true

    if (options?.skipAutoScroller) {
      return
    }

    if (autoScroller) {
      // console.log('[ANDROID DEBUG] play() - restarting existing AutoScroller, speed:', preferences.speedPxPerSec)
      autoScroller.setSpeed(preferences.speedPxPerSec)
      autoScroller.start()
    } else {
      // console.log('[ANDROID DEBUG] play() - creating new AutoScroller, speed:', preferences.speedPxPerSec)
      autoScroller = new AutoScroller(
        updateScrollOffset,
        () => scrollOffset.value,
        preferences.speedPxPerSec
      )
      // console.log('[ANDROID DEBUG] play() - updating existing AutoScroller speed:', preferences.speedPxPerSec)
      // Update speed for existing scroller
      autoScroller.setSpeed(preferences.speedPxPerSec)
    }

    // console.log('[ANDROID DEBUG] play() - starting AutoScroller')
    autoScroller.start()
    // console.log('[ANDROID DEBUG] play() - AutoScroller started successfully')
  }

  function pause() {
    // console.log('[ANDROID DEBUG] pause() called, current isPlaying:', isPlaying.value)
    if (!isPlaying.value) {
      // console.log('[ANDROID DEBUG] pause() - already paused, returning')
      return
    }

    // console.log('[ANDROID DEBUG] pause() - setting isPlaying to false')
    isPlaying.value = false
    
    if (autoScroller) {
      // console.log('[ANDROID DEBUG] pause() - stopping AutoScroller')
      autoScroller.stop()
      // console.log('[ANDROID DEBUG] pause() - AutoScroller stopped')
    // } else {
    //   console.log('[ANDROID DEBUG] pause() - no AutoScroller to stop')
    }
    
    saveScrollPosition()
  }

  function toggle() {
    // console.log('[ANDROID DEBUG] toggle() called, current isPlaying:', isPlaying.value)
    if (isPlaying.value) {
      // console.log('[ANDROID DEBUG] toggle() - calling pause()')
      pause()
    } else {
      // console.log('[ANDROID DEBUG] toggle() - calling play()')
      play()
    }
  }

  function updateScrollOffset(newOffset: number) {
    const previousOffset = scrollOffset.value
    const clampedOffset = clampScrollOffset(
      newOffset,
      contentHeightPx.value,
      viewportHeightPx.value
    )
    
    // console.log('[ANDROID DEBUG] updateScrollOffset - from:', previousOffset.toFixed(1), 'to:', clampedOffset.toFixed(1), 'content height:', contentHeightPx.value, 'viewport height:', viewportHeightPx.value)
    
    scrollOffset.value = clampedOffset

    // Auto-pause when reaching the end of text while playing
    // Only auto-pause if:
    // 1. We are playing
    // 2. We reached the maximum offset
    // 3. We were scrolling forward (not seeking/jumping)
    // 4. There was significant movement (> 5px to avoid tiny adjustments)
    const scrollDelta = Math.abs(newOffset - previousOffset)
    if (
      isPlaying.value &&
      clampedOffset >= maxOffset.value &&
      newOffset > previousOffset &&
      scrollDelta > 5 && // Require more meaningful movement
      maxOffset.value > 0
    ) {
      // Only if there's actual content to scroll
      pause()
    }
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
      const fontSize = Number.parseFloat(computedStyle.fontSize)
      lineHeightPx.value = fontSize * 1.2
    } else if (lineHeight.includes('px')) {
      lineHeightPx.value = Number.parseFloat(lineHeight)
    } else {
      const fontSize = Number.parseFloat(computedStyle.fontSize)
      lineHeightPx.value = Number.parseFloat(lineHeight) * fontSize
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
      if (typeof saved === 'string' && saved) {
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

  /**
   * Update scroll offset from manual scroll (e.g., mouse wheel, touch)
   * This is called when the user manually scrolls the content
   */
  function syncScrollFromDOM(domScrollTop: number) {
    // Only sync if we're not currently playing (to avoid conflicts with auto-scroll)
    if (!isPlaying.value) {
      const clampedOffset = clampScrollOffset(
        domScrollTop,
        contentHeightPx.value,
        viewportHeightPx.value
      )
      
      // console.log('[SCROLL SYNC] Manual scroll detected - DOM:', domScrollTop.toFixed(1), 'clamped:', clampedOffset.toFixed(1))
      
      // Update our internal state without triggering the watcher
      scrollOffset.value = clampedOffset
      
      // Save the new position
      saveScrollPosition()
    }
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
    syncScrollFromDOM,
  }
})
