/**
 * Tests for Component Services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import {
  ScrollService,
  ContentService,
  PreferencesService,
  createScrollService,
  createContentService,
  createPreferencesService,
  useServices,
} from '@/services/component-services'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'

describe('component-services', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('ScrollService', () => {
    it('should create scroll service instance', () => {
      const service = new ScrollService()
      expect(service).toBeInstanceOf(ScrollService)
    })

    it('should play teleprompter', () => {
      const service = new ScrollService()
      const teleprompterStore = useTeleprompterStore()

      service.play()

      expect(teleprompterStore.isPlaying).toBe(true)
    })

    it('should pause teleprompter', () => {
      const service = new ScrollService()
      const teleprompterStore = useTeleprompterStore()

      teleprompterStore.play()
      service.pause()

      expect(teleprompterStore.isPlaying).toBe(false)
    })

    it('should toggle teleprompter', () => {
      const service = new ScrollService()
      const teleprompterStore = useTeleprompterStore()

      service.toggle()
      expect(teleprompterStore.isPlaying).toBe(true)

      service.toggle()
      expect(teleprompterStore.isPlaying).toBe(false)
    })

    it('should step lines', () => {
      const service = new ScrollService()
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.setViewportHeight(500)
      teleprompterStore.setContentHeight(1000)

      const initialOffset = teleprompterStore.scrollOffset

      service.stepLines(5)

      expect(teleprompterStore.scrollOffset).toBeGreaterThan(initialOffset)
    })

    it('should set scroll offset directly', () => {
      const service = new ScrollService()
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.setViewportHeight(500)
      teleprompterStore.setContentHeight(1000)

      service.setOffset(250)

      expect(teleprompterStore.scrollOffset).toBe(250)
    })

    it('should go to home', () => {
      const service = new ScrollService()
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.scrollOffset = 100

      service.goToHome()

      expect(teleprompterStore.scrollOffset).toBe(0)
    })

    it('should go to end', () => {
      const service = new ScrollService()
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.setViewportHeight(500)
      teleprompterStore.setContentHeight(1000)

      service.goToEnd()

      expect(teleprompterStore.scrollOffset).toBe(500)
    })

    it('should get current state', () => {
      const service = new ScrollService()
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.setViewportHeight(500)
      teleprompterStore.setContentHeight(1000)
      teleprompterStore.scrollOffset = 100

      const state = service.getState()

      expect(state.offset).toBe(100)
      expect(state.isPlaying).toBe(false)
      expect(state.canScrollUp).toBe(true)
      expect(state.canScrollDown).toBe(true)
      expect(typeof state.progress).toBe('number')
    })

    it('should register and call state change callbacks', () => {
      const service = new ScrollService()
      const callback = vi.fn()

      const unsubscribe = service.onStateChange(callback)

      // Callback should be registered
      expect(typeof unsubscribe).toBe('function')
    })

    it('should unsubscribe state change callbacks', () => {
      const service = new ScrollService()
      const callback = vi.fn()

      const unsubscribe = service.onStateChange(callback)
      unsubscribe()

      // Should not throw
      expect(() => unsubscribe()).not.toThrow()
    })

    it('should notify subscribers when the scroll state changes', async () => {
      const service = new ScrollService()
      const teleprompterStore = useTeleprompterStore()
      const callback = vi.fn()

      service.onStateChange(callback)
      teleprompterStore.play()
      await nextTick()

      expect(callback).toHaveBeenCalled()
    })

    it('should stop notifying after unsubscribing', async () => {
      const service = new ScrollService()
      const teleprompterStore = useTeleprompterStore()
      const callback = vi.fn()

      const unsubscribe = service.onStateChange(callback)
      unsubscribe()
      teleprompterStore.play()
      await nextTick()

      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('ContentService', () => {
    it('should create content service instance', () => {
      const service = new ContentService()
      expect(service).toBeInstanceOf(ContentService)
    })

    it('should get current content', () => {
      const service = new ContentService()
      const teleprompterStore = useTeleprompterStore()
      teleprompterStore.setContent('# Test')

      const content = service.getContent()

      expect(content.raw).toBe('# Test')
      expect(content.html).toContain('<h1')
    })

    it('should set content', () => {
      const service = new ContentService()
      const teleprompterStore = useTeleprompterStore()

      service.setContent('# New Content')

      expect(teleprompterStore.contentRaw).toBe('# New Content')
    })

    it('should compile markdown content and return the rendered HTML', async () => {
      const service = new ContentService()
      const teleprompterStore = useTeleprompterStore()

      const html = await service.compileMarkdown('# Compiled')

      expect(teleprompterStore.contentRaw).toBe('# Compiled')
      expect(html).toContain('<h1')
      expect(html).toBe(teleprompterStore.contentHtml)
    })

    it('should register content change callbacks', () => {
      const service = new ContentService()
      const callback = vi.fn()

      const unsubscribe = service.onContentChange(callback)

      expect(typeof unsubscribe).toBe('function')
    })
  })

  describe('PreferencesService', () => {
    it('should create preferences service instance', () => {
      const service = new PreferencesService()
      expect(service).toBeInstanceOf(PreferencesService)
    })

    it('should get display preferences', () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()
      prefsStore.fontSizePx = 48

      const prefs = service.getDisplayPrefs()

      expect(prefs.fontSizePx).toBe(48)
      expect(prefs.fontFamily).toBeDefined()
      expect(prefs.lineHeight).toBeDefined()
    })

    it('should update display preferences', async () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()

      await service.updateDisplayPrefs({ fontSizePx: 64 })

      expect(prefsStore.fontSizePx).toBe(64)
    })

    it('should update every individual display preference field when provided', async () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()

      await service.updateDisplayPrefs({
        fontFamily: 'Courier New',
        fontSizePx: 32,
        lineHeight: 1.8,
        fgColor: '#00ff00',
        bgColor: '#111111',
        mirrorH: true,
        mirrorV: true,
      })

      expect(prefsStore.fontFamily).toBe('Courier New')
      expect(prefsStore.fontSizePx).toBe(32)
      expect(prefsStore.lineHeight).toBe(1.8)
      expect(prefsStore.fgColor).toBe('#00ff00')
      expect(prefsStore.bgColor).toBe('#111111')
      expect(prefsStore.mirrorH).toBe(true)
      expect(prefsStore.mirrorV).toBe(true)
    })

    it('should leave display preference fields untouched when not provided', async () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()
      const originalFontFamily = prefsStore.fontFamily
      const originalMirrorH = prefsStore.mirrorH

      await service.updateDisplayPrefs({})

      expect(prefsStore.fontFamily).toBe(originalFontFamily)
      expect(prefsStore.mirrorH).toBe(originalMirrorH)
    })

    it('should get speed config', () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()
      prefsStore.speedPxPerSec = 120

      const config = service.getSpeedConfig()

      expect(config.current).toBe(120)
      expect(config.min).toBeDefined()
      expect(config.max).toBeDefined()
    })

    it('should update speed config', async () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()

      await service.updateSpeedConfig({ current: 150 })

      expect(prefsStore.speedPxPerSec).toBe(150)
    })

    it('should update min and max speed independently', async () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()

      await service.updateSpeedConfig({ min: 5, max: 300 })

      expect(prefsStore.speedMin).toBe(5)
      expect(prefsStore.speedMax).toBe(300)
    })

    it('should leave speed config untouched when not provided', async () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()
      const originalCurrent = prefsStore.speedPxPerSec

      await service.updateSpeedConfig({})

      expect(prefsStore.speedPxPerSec).toBe(originalCurrent)
    })

    it('should get highlight band config', () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()
      prefsStore.highlightBandLines = 2
      prefsStore.highlightBandPosPct = 60

      const config = service.getHighlightBandConfig()

      expect(config.lines).toBe(2)
      expect(config.positionPct).toBe(60)
      expect(config.enabled).toBe(true)
    })

    it('should update highlight band config', async () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()

      await service.updateHighlightBandConfig({ lines: 2, positionPct: 70 })

      expect(prefsStore.highlightBandLines).toBe(2)
      expect(prefsStore.highlightBandPosPct).toBe(70)
    })

    it('should update dimming intensity independently', async () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()

      await service.updateHighlightBandConfig({ dimmingIntensity: 0.5 })

      expect(prefsStore.dimmingIntensity).toBe(0.5)
    })

    it('should leave highlight band config untouched when not provided', async () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()
      const originalLines = prefsStore.highlightBandLines

      await service.updateHighlightBandConfig({})

      expect(prefsStore.highlightBandLines).toBe(originalLines)
    })

    it('should report highlight band as disabled when lines is 0', () => {
      const service = new PreferencesService()
      const prefsStore = usePrefsStore()
      // The type only allows 1 | 2, but the `enabled` getter defensively checks
      // `> 0` (e.g. for data loaded from storage that bypassed validation).
      ;(prefsStore.highlightBandLines as unknown as number) = 0

      const config = service.getHighlightBandConfig()

      expect(config.enabled).toBe(false)
    })

    it('should register preferences change callbacks', () => {
      const service = new PreferencesService()
      const callback = vi.fn()

      const unsubscribe = service.onPrefsChange(callback)

      expect(typeof unsubscribe).toBe('function')
    })
  })

  describe('Service Factories', () => {
    it('should create scroll service via factory', () => {
      const service = createScrollService()
      expect(service).toBeInstanceOf(ScrollService)
    })

    it('should return same scroll service instance', () => {
      const service1 = createScrollService()
      const service2 = createScrollService()
      expect(service1).toBe(service2)
    })

    it('should create content service via factory', () => {
      const service = createContentService()
      expect(service).toBeInstanceOf(ContentService)
    })

    it('should return same content service instance', () => {
      const service1 = createContentService()
      const service2 = createContentService()
      expect(service1).toBe(service2)
    })

    it('should create preferences service via factory', () => {
      const service = createPreferencesService()
      expect(service).toBeInstanceOf(PreferencesService)
    })

    it('should return same preferences service instance', () => {
      const service1 = createPreferencesService()
      const service2 = createPreferencesService()
      expect(service1).toBe(service2)
    })
  })

  describe('useServices composable', () => {
    it('should return all services', () => {
      const services = useServices()

      expect(services.scrollService).toBeInstanceOf(ScrollService)
      expect(services.contentService).toBeInstanceOf(ContentService)
      expect(services.preferencesService).toBeInstanceOf(PreferencesService)
    })

    it('should return singleton instances', () => {
      const services1 = useServices()
      const services2 = useServices()

      expect(services1.scrollService).toBe(services2.scrollService)
      expect(services1.contentService).toBe(services2.contentService)
      expect(services1.preferencesService).toBe(services2.preferencesService)
    })
  })
})
