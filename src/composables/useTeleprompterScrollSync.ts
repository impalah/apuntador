/**
 * Touch gesture handling + scroll-offset sync (Pinia store <-> DOM) shared by
 * both presenter frames (TeleprompterFrameV2 and TeleprompterFrameMono): swipe,
 * press-and-hold and tap detection, debounced manual-scroll reporting, pushing
 * store offsets into scrollTop without echoing them back, and ResizeObserver
 * driven remeasurement.
 */

import { onMounted, onUnmounted, watch, type Ref } from 'vue'
import { throttle } from '@/utils/dom'
import {
  SWIPE_THRESHOLD,
  PRESS_AND_HOLD_DURATION,
  SCROLL_SYNC_DEBOUNCE_MS,
  SCROLL_SYNC_SUPPRESS_MS,
  RESIZE_OBSERVER_THROTTLE_MS,
} from '@/utils/constants'

export interface TeleprompterScrollSyncCallbacks {
  onTap: () => void
  onSwipeUp: () => void
  onSwipeDown: () => void
  onPressHold: () => void
  onManualScroll: (_scrollTop: number) => void
  onResize: () => void
}

export function useTeleprompterScrollSync(
  containerRef: Ref<HTMLElement | undefined>,
  scrollContainerRef: Ref<HTMLElement | undefined>,
  contentRef: Ref<HTMLElement | undefined>,
  scrollOffset: Ref<number>,
  callbacks: TeleprompterScrollSyncCallbacks
) {
  let touchStartY = 0
  let touchStartTime = 0
  let isScrollingSynchronizing = false
  let scrollTimeout: number | null = null
  let resizeObserver: ResizeObserver | null = null

  function onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return
    const touch = event.touches[0]
    if (!touch) return
    touchStartY = touch.clientY
    touchStartTime = Date.now()
  }

  function onTouchEnd(event: TouchEvent): void {
    if (event.changedTouches.length !== 1) return
    const touch = event.changedTouches[0]
    if (!touch) return

    const deltaY = touch.clientY - touchStartY
    const duration = Date.now() - touchStartTime

    if (duration >= PRESS_AND_HOLD_DURATION && Math.abs(deltaY) < SWIPE_THRESHOLD) {
      callbacks.onPressHold()
      return
    }

    if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
      if (deltaY > 0) {
        callbacks.onSwipeDown()
      } else {
        callbacks.onSwipeUp()
      }
      return
    }

    callbacks.onTap()
  }

  function onScroll(event: Event): void {
    if (isScrollingSynchronizing) return

    const target = event.target as HTMLElement
    const scrollTop = target.scrollTop

    if (scrollTimeout) {
      window.clearTimeout(scrollTimeout)
    }
    scrollTimeout = window.setTimeout(() => {
      callbacks.onManualScroll(scrollTop)
    }, SCROLL_SYNC_DEBOUNCE_MS)
  }

  // Push store scrollOffset changes into the DOM, suppressing the 'scroll'
  // listener briefly so the programmatic write isn't misread as a manual scroll.
  watch(
    scrollOffset,
    (newOffset) => {
      if (scrollContainerRef.value && !isScrollingSynchronizing) {
        const el = scrollContainerRef.value
        isScrollingSynchronizing = true
        el.scrollTop = newOffset
        window.setTimeout(() => {
          isScrollingSynchronizing = false
        }, SCROLL_SYNC_SUPPRESS_MS)
      }
    },
    { flush: 'sync' }
  )

  onMounted(() => {
    containerRef.value?.addEventListener('touchstart', onTouchStart, { passive: true })
    containerRef.value?.addEventListener('touchend', onTouchEnd, { passive: true })
    scrollContainerRef.value?.addEventListener('scroll', onScroll, { passive: true })

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(throttle(callbacks.onResize, RESIZE_OBSERVER_THROTTLE_MS))
      if (containerRef.value) resizeObserver.observe(containerRef.value)
      if (contentRef.value) resizeObserver.observe(contentRef.value)
    }
  })

  onUnmounted(() => {
    containerRef.value?.removeEventListener('touchstart', onTouchStart)
    containerRef.value?.removeEventListener('touchend', onTouchEnd)
    scrollContainerRef.value?.removeEventListener('scroll', onScroll)
    resizeObserver?.disconnect()
    if (scrollTimeout) {
      window.clearTimeout(scrollTimeout)
    }
  })
}
