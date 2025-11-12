/**
 * Tests for Store to Component Adapter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  useTeleprompterFrameProps,
  useFloatingToolbarProps,
  useTeleprompterFrameEventHandlers,
  useFloatingToolbarEventHandlers,
  useHighlightBandEventHandlers,
} from '@/adapters/storeToComponent'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'

describe('storeToComponent adapter', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('useTeleprompterFrameProps', () => {
    it('should create reactive props from stores', () => {
      const props = useTeleprompterFrameProps()

      expect(props.value).toHaveProperty('content')
      expect(props.value).toHaveProperty('scrollState')
      expect(props.value).toHaveProperty('displayPrefs')
      expect(props.value).toHaveProperty('highlightBand')
    })

    it('should include content from teleprompter store', () => {
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.setContent('# Test Content')

      const props = useTeleprompterFrameProps()

      expect(props.value.content.raw).toBe('# Test Content')
      expect(props.value.content.html).toContain('<h1')
    })

    it('should include scroll state with calculated progress', () => {
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.scrollOffset = 50
      teleprompterStore.setViewportHeight(100)
      teleprompterStore.setContentHeight(200)

      const props = useTeleprompterFrameProps()

      expect(props.value.scrollState.offset).toBe(50)
      expect(props.value.scrollState.isPlaying).toBe(false)
      expect(props.value.scrollState.canScrollUp).toBe(true)
      expect(props.value.scrollState.canScrollDown).toBe(true)
      expect(props.value.scrollState.progress).toBe(50)
    })

    it('should include display preferences', () => {
      const prefsStore = usePrefsStore()
      prefsStore.fontSizePx = 48
      prefsStore.mirrorH = true

      const props = useTeleprompterFrameProps()

      expect(props.value.displayPrefs.fontSizePx).toBe(48)
      expect(props.value.displayPrefs.mirrorH).toBe(true)
      expect(props.value.displayPrefs.mirrorV).toBe(false)
    })

    it('should include highlight band config', () => {
      const prefsStore = usePrefsStore()
      prefsStore.highlightBandLines = 2
      prefsStore.highlightBandPosPct = 50
      prefsStore.dimmingIntensity = 0.7

      const props = useTeleprompterFrameProps()

      expect(props.value.highlightBand.lines).toBe(2)
      expect(props.value.highlightBand.positionPct).toBe(50)
      expect(props.value.highlightBand.dimmingIntensity).toBe(0.7)
      expect(props.value.highlightBand.enabled).toBe(true)
    })

    it('should mark highlight band as enabled by default with lines > 0', () => {
      const prefsStore = usePrefsStore()
      prefsStore.highlightBandLines = 1 // Valid value (1 or 2)

      const props = useTeleprompterFrameProps()

      expect(props.value.highlightBand.enabled).toBe(true)
      expect(props.value.highlightBand.lines).toBe(1)
    })
  })

  describe('useFloatingToolbarProps', () => {
    it('should create toolbar props from stores', () => {
      const props = useFloatingToolbarProps()

      expect(props.value).toHaveProperty('scrollState')
      expect(props.value).toHaveProperty('speedConfig')
      expect(props.value).toHaveProperty('displayPrefs')
      expect(props.value).toHaveProperty('isVisible')
      expect(props.value).toHaveProperty('isMinimal')
    })

    it('should include speed configuration', () => {
      const prefsStore = usePrefsStore()
      prefsStore.speedPxPerSec = 100
      prefsStore.speedMin = 10
      prefsStore.speedMax = 500

      const props = useFloatingToolbarProps()

      expect(props.value.speedConfig.current).toBe(100)
      expect(props.value.speedConfig.min).toBe(10)
      expect(props.value.speedConfig.max).toBe(500)
    })

    it('should default isVisible to true', () => {
      const props = useFloatingToolbarProps()

      expect(props.value.isVisible).toBe(true)
    })

    it('should default isMinimal to false', () => {
      const props = useFloatingToolbarProps()

      expect(props.value.isMinimal).toBe(false)
    })
  })

  describe('useTeleprompterFrameEventHandlers', () => {
    it('should provide onContentHeightChanged handler', () => {
      const handlers = useTeleprompterFrameEventHandlers()
      const teleprompterStore = useTeleprompterStore()

      handlers.onContentHeightChanged(1000)

      expect(teleprompterStore.contentHeightPx).toBe(1000)
    })

    it('should provide onViewportHeightChanged handler', () => {
      const handlers = useTeleprompterFrameEventHandlers()
      const teleprompterStore = useTeleprompterStore()

      handlers.onViewportHeightChanged(500)

      expect(teleprompterStore.viewportHeightPx).toBe(500)
    })

    it('should provide onManualScroll handler', () => {
      const handlers = useTeleprompterFrameEventHandlers()
      const teleprompterStore = useTeleprompterStore()
      
      // Ensure not playing so sync works
      teleprompterStore.pause()
      teleprompterStore.setViewportHeight(500)
      teleprompterStore.setContentHeight(1000)

      handlers.onManualScroll(100)

      expect(teleprompterStore.scrollOffset).toBe(100)
    })

    it('should provide onSwipeUp handler', () => {
      const handlers = useTeleprompterFrameEventHandlers()
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.setViewportHeight(500)
      teleprompterStore.setContentHeight(1000)
      teleprompterStore.scrollOffset = 100
      const initialOffset = teleprompterStore.scrollOffset

      handlers.onSwipeUp()

      // Swipe up should scroll down (negative step)
      expect(teleprompterStore.scrollOffset).toBeLessThan(initialOffset)
    })

    it('should provide onSwipeDown handler', () => {
      const handlers = useTeleprompterFrameEventHandlers()
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.setViewportHeight(500)
      teleprompterStore.setContentHeight(1000)
      teleprompterStore.scrollOffset = 0 // Start at top

      handlers.onSwipeDown()

      // Swipe down should scroll up (positive step)
      expect(teleprompterStore.scrollOffset).toBeGreaterThan(0)
    })
  })

  describe('useFloatingToolbarEventHandlers', () => {
    it('should provide play/pause handlers', () => {
      const handlers = useFloatingToolbarEventHandlers()
      const teleprompterStore = useTeleprompterStore()

      expect(teleprompterStore.isPlaying).toBe(false)

      handlers.onPlay()
      expect(teleprompterStore.isPlaying).toBe(true)

      handlers.onPause()
      expect(teleprompterStore.isPlaying).toBe(false)
    })

    it('should provide toggle play handler', () => {
      const handlers = useFloatingToolbarEventHandlers()
      const teleprompterStore = useTeleprompterStore()

      expect(teleprompterStore.isPlaying).toBe(false)

      handlers.onTogglePlay()
      expect(teleprompterStore.isPlaying).toBe(true)

      handlers.onTogglePlay()
      expect(teleprompterStore.isPlaying).toBe(false)
    })

    it('should provide step lines handler', () => {
      const handlers = useFloatingToolbarEventHandlers()
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.setViewportHeight(500)
      teleprompterStore.setContentHeight(1000)
      const initialOffset = teleprompterStore.scrollOffset

      handlers.onStepLines(5)

      expect(teleprompterStore.scrollOffset).toBeGreaterThan(initialOffset)
    })

    it('should provide home/end handlers', () => {
      const handlers = useFloatingToolbarEventHandlers()
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.setContentHeight(1000)
      teleprompterStore.setViewportHeight(500)
      teleprompterStore.scrollOffset = 250

      handlers.onGoEnd()
      expect(teleprompterStore.scrollOffset).toBe(500) // maxOffset

      handlers.onGoHome()
      expect(teleprompterStore.scrollOffset).toBe(0)
    })

    it('should provide speed change handler', () => {
      const handlers = useFloatingToolbarEventHandlers()
      const prefsStore = usePrefsStore()

      handlers.onSpeedChange(150)

      expect(prefsStore.speedPxPerSec).toBe(150)
    })

    it('should provide font size change handler', () => {
      const handlers = useFloatingToolbarEventHandlers()
      const prefsStore = usePrefsStore()

      handlers.onFontSizeChange(64)

      expect(prefsStore.fontSizePx).toBe(64)
    })

    it('should provide mirror toggle handler for horizontal', () => {
      const handlers = useFloatingToolbarEventHandlers()
      const prefsStore = usePrefsStore()

      expect(prefsStore.mirrorH).toBe(false)

      handlers.onMirrorToggle('h')
      expect(prefsStore.mirrorH).toBe(true)

      handlers.onMirrorToggle('h')
      expect(prefsStore.mirrorH).toBe(false)
    })

    it('should provide mirror toggle handler for vertical', () => {
      const handlers = useFloatingToolbarEventHandlers()
      const prefsStore = usePrefsStore()

      expect(prefsStore.mirrorV).toBe(false)

      handlers.onMirrorToggle('v')
      expect(prefsStore.mirrorV).toBe(true)

      handlers.onMirrorToggle('v')
      expect(prefsStore.mirrorV).toBe(false)
    })

    it('should provide open editor handler', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const handlers = useFloatingToolbarEventHandlers()

      handlers.onOpenEditor()

      expect(consoleSpy).toHaveBeenCalledWith('Open editor requested')
    })

    it('should provide open settings handler', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const handlers = useFloatingToolbarEventHandlers()

      handlers.onOpenSettings()

      expect(consoleSpy).toHaveBeenCalledWith('Open settings requested')
    })

    it('should provide open file handler', () => {
      const consoleSpy = vi.spyOn(console, 'log')
      const handlers = useFloatingToolbarEventHandlers()

      handlers.onOpenFile()

      expect(consoleSpy).toHaveBeenCalledWith('Open file requested')
    })
  })

  describe('useHighlightBandEventHandlers', () => {
    it('should provide position change handler', () => {
      const handlers = useHighlightBandEventHandlers()
      const prefsStore = usePrefsStore()

      handlers.onPositionChange(75)

      expect(prefsStore.highlightBandPosPct).toBe(75)
    })

    it('should provide config change handler for lines', () => {
      const handlers = useHighlightBandEventHandlers()
      const prefsStore = usePrefsStore()

      handlers.onConfigChange({ lines: 2 })

      expect(prefsStore.highlightBandLines).toBe(2)
    })

    it('should provide config change handler for position', () => {
      const handlers = useHighlightBandEventHandlers()
      const prefsStore = usePrefsStore()

      handlers.onConfigChange({ positionPct: 60 })

      expect(prefsStore.highlightBandPosPct).toBe(60)
    })

    it('should provide config change handler for dimming', () => {
      const handlers = useHighlightBandEventHandlers()
      const prefsStore = usePrefsStore()

      handlers.onConfigChange({ dimmingIntensity: 0.8 })

      expect(prefsStore.dimmingIntensity).toBe(0.8)
    })

    it('should handle multiple config changes at once', () => {
      const handlers = useHighlightBandEventHandlers()
      const prefsStore = usePrefsStore()

      handlers.onConfigChange({
        lines: 2,
        positionPct: 40,
        dimmingIntensity: 0.6,
      })

      expect(prefsStore.highlightBandLines).toBe(2)
      expect(prefsStore.highlightBandPosPct).toBe(40)
      expect(prefsStore.dimmingIntensity).toBe(0.6)
    })
  })
})
