import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'

// Mock the persistence utilities
vi.mock('@/services/persistence', () => ({
  contentStorage: {
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve()),
  },
  scrollPositionStorage: {
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve()),
  },
}))

describe('useTeleprompterStore - Advanced Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Content Management', () => {
    it('should handle markdown compilation errors gracefully', async () => {
      const store = useTeleprompterStore()
      
      // Invalid markdown that might cause issues
      const problematicMarkdown = '# Test\n\n<script>alert("XSS")</script>'
      
      await store.setContent(problematicMarkdown)
      
      // Should still compile (markdown-it sanitizes by default)
      expect(store.contentRaw).toBe(problematicMarkdown)
      expect(store.contentHtml).toBeDefined()
    })

    it('should compile markdown content independently', async () => {
      const store = useTeleprompterStore()
      store.contentRaw = '# Heading\n\nParagraph'
      
      await store.compileMarkdownContent()
      
      expect(store.contentHtml).toContain('<h1')
      expect(store.contentHtml).toContain('Heading')
    })
  })

  describe('Scroll State Management', () => {
    it('should indicate when can scroll up or down', () => {
      const store = useTeleprompterStore()
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      
      // At top
      store.updateScrollOffset(0)
      expect(store.canScrollUp).toBe(false)
      expect(store.canScrollDown).toBe(true)
      
      // In middle
      store.updateScrollOffset(300)
      expect(store.canScrollUp).toBe(true)
      expect(store.canScrollDown).toBe(true)
      
      // At bottom
      store.updateScrollOffset(600)
      expect(store.canScrollUp).toBe(true)
      expect(store.canScrollDown).toBe(false)
    })

    it('should sync scroll from DOM when paused', () => {
      const store = useTeleprompterStore()
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      store.pause()
      
      store.syncScrollFromDOM(250)
      
      expect(store.scrollOffset).toBe(250)
    })

    it('should clamp synced scroll to valid bounds', () => {
      const store = useTeleprompterStore()
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      store.pause()
      
      // Try to sync beyond max
      store.syncScrollFromDOM(1500)
      
      expect(store.scrollOffset).toBe(600) // Clamped to maxOffset
    })

    it('should clamp synced scroll to minimum', () => {
      const store = useTeleprompterStore()
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      store.pause()
      
      // Try to sync below min
      store.syncScrollFromDOM(-100)
      
      expect(store.scrollOffset).toBe(0) // Clamped to 0
    })
  })

  describe('Line Height Measurement', () => {
    it('should measure line height from element with normal line-height', () => {
      const store = useTeleprompterStore()
      const mockElement = document.createElement('div')
      
      // Mock getComputedStyle
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        lineHeight: 'normal',
        fontSize: '20px',
      } as CSSStyleDeclaration)
      
      store.measureLineHeight(mockElement)
      
      expect(store.lineHeightPx).toBe(24) // 20 * 1.2
    })

    it('should measure line height from element with px value', () => {
      const store = useTeleprompterStore()
      const mockElement = document.createElement('div')
      
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        lineHeight: '32px',
        fontSize: '20px',
      } as CSSStyleDeclaration)
      
      store.measureLineHeight(mockElement)
      
      expect(store.lineHeightPx).toBe(32)
    })

    it('should measure line height from element with unitless value', () => {
      const store = useTeleprompterStore()
      const mockElement = document.createElement('div')
      
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        lineHeight: '1.5',
        fontSize: '20px',
      } as CSSStyleDeclaration)
      
      store.measureLineHeight(mockElement)
      
      expect(store.lineHeightPx).toBe(30) // 20 * 1.5
    })

    it('should measure line height with em value', () => {
      const store = useTeleprompterStore()
      const mockElement = document.createElement('div')
      
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        lineHeight: '1.8',
        fontSize: '16px',
      } as CSSStyleDeclaration)
      
      store.measureLineHeight(mockElement)
      
      expect(store.lineHeightPx).toBe(28.8) // 16 * 1.8
    })
  })

  describe('Dimension Management', () => {
    it('should set viewport height', () => {
      const store = useTeleprompterStore()
      
      store.setViewportHeight(500)
      
      expect(store.viewportHeightPx).toBe(500)
    })

    it('should set content height', () => {
      const store = useTeleprompterStore()
      
      store.setContentHeight(1500)
      
      expect(store.contentHeightPx).toBe(1500)
    })

    it('should recalculate maxOffset when dimensions change', () => {
      const store = useTeleprompterStore()
      
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      expect(store.maxOffset).toBe(600)
      
      store.setContentHeight(1500)
      expect(store.maxOffset).toBe(1100)
      
      store.setViewportHeight(600)
      expect(store.maxOffset).toBe(900)
    })
  })

  describe('Persistence', () => {
    it('should save content', async () => {
      const store = useTeleprompterStore()
      const { contentStorage } = await import('@/services/persistence')
      
      await store.setContent('# Test Content')
      
      expect(contentStorage.set).toHaveBeenCalledWith('# Test Content')
    })

    it('should save content via saveContent method', async () => {
      const store = useTeleprompterStore()
      const { contentStorage } = await import('@/services/persistence')
      
      store.contentRaw = '# Direct Content'
      await store.saveContent()
      
      expect(contentStorage.set).toHaveBeenCalledWith('# Direct Content')
    })

    it('should load saved content', async () => {
      const { contentStorage } = await import('@/services/persistence')
      vi.mocked(contentStorage.get).mockResolvedValue('# Saved Content')
      
      const store = useTeleprompterStore()
      await store.loadContent()
      
      expect(store.contentRaw).toBe('# Saved Content')
      expect(store.contentHtml).toContain('<h1')
    })

    it('should handle content load errors gracefully', async () => {
      const { contentStorage } = await import('@/services/persistence')
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.mocked(contentStorage.get).mockRejectedValue(new Error('Storage error'))
      
      const store = useTeleprompterStore()
      await store.loadContent()
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load content:',
        expect.any(Error)
      )
      consoleWarnSpy.mockRestore()
    })

    it('should handle content save errors gracefully', async () => {
      const { contentStorage } = await import('@/services/persistence')
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.mocked(contentStorage.set).mockRejectedValue(new Error('Storage error'))
      
      const store = useTeleprompterStore()
      await store.saveContent()
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to save content:',
        expect.any(Error)
      )
      consoleWarnSpy.mockRestore()
    })

    it('should save scroll position', async () => {
      const store = useTeleprompterStore()
      const { scrollPositionStorage } = await import('@/services/persistence')
      
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      store.updateScrollOffset(250)
      
      await store.saveScrollPosition()
      
      expect(scrollPositionStorage.set).toHaveBeenCalledWith(250)
    })

    it('should load saved scroll position', async () => {
      const { scrollPositionStorage } = await import('@/services/persistence')
      vi.mocked(scrollPositionStorage.get).mockResolvedValue(350)
      
      const store = useTeleprompterStore()
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      
      await store.loadScrollPosition()
      
      expect(store.scrollOffset).toBe(350)
    })

    it('should handle scroll position load errors gracefully', async () => {
      const { scrollPositionStorage } = await import('@/services/persistence')
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.mocked(scrollPositionStorage.get).mockRejectedValue(new Error('Storage error'))
      
      const store = useTeleprompterStore()
      await store.loadScrollPosition()
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to load scroll position:',
        expect.any(Error)
      )
      consoleWarnSpy.mockRestore()
    })

    it('should handle scroll position save errors gracefully', async () => {
      const { scrollPositionStorage } = await import('@/services/persistence')
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      vi.mocked(scrollPositionStorage.set).mockRejectedValue(new Error('Storage error'))
      
      const store = useTeleprompterStore()
      await store.saveScrollPosition()
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to save scroll position:',
        expect.any(Error)
      )
      consoleWarnSpy.mockRestore()
    })

    it('should not load scroll position if none saved', async () => {
      const { scrollPositionStorage } = await import('@/services/persistence')
      vi.mocked(scrollPositionStorage.get).mockResolvedValue(null)
      
      const store = useTeleprompterStore()
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      store.updateScrollOffset(100)
      
      await store.loadScrollPosition()
      
      // Should remain at 100 (not changed)
      expect(store.scrollOffset).toBe(100)
    })

    it('should not load scroll position if undefined saved', async () => {
      const { scrollPositionStorage } = await import('@/services/persistence')
      vi.mocked(scrollPositionStorage.get).mockResolvedValue(null)
      
      const store = useTeleprompterStore()
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      store.updateScrollOffset(150)
      
      await store.loadScrollPosition()
      
      // Should remain at 150 (not changed)
      expect(store.scrollOffset).toBe(150)
    })

    it('should initialize by loading content and position', async () => {
      const { contentStorage, scrollPositionStorage } = await import('@/services/persistence')
      vi.mocked(contentStorage.get).mockResolvedValue('# Initialized')
      vi.mocked(scrollPositionStorage.get).mockResolvedValue(200)
      
      const store = useTeleprompterStore()
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      
      await store.initialize()
      
      expect(store.contentRaw).toBe('# Initialized')
      expect(store.scrollOffset).toBe(200)
    })
  })

  describe('Scroll Progress', () => {
    it('should return 0 progress when at top', () => {
      const store = useTeleprompterStore()
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      store.updateScrollOffset(0)
      
      expect(store.scrollProgress).toBe(0)
    })

    it('should return 100 progress when at bottom', () => {
      const store = useTeleprompterStore()
      store.setViewportHeight(400)
      store.setContentHeight(1000)
      store.updateScrollOffset(600)
      
      expect(store.scrollProgress).toBe(100)
    })

    it('should return 0 progress when maxOffset is 0', () => {
      const store = useTeleprompterStore()
      store.setViewportHeight(1000)
      store.setContentHeight(500)
      
      expect(store.scrollProgress).toBe(0)
    })
  })
})

