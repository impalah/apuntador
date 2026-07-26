import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { clampScrollOffset } from '@/utils/scrolling'

// Mock the scrolling utility
vi.mock('@/utils/scrolling', () => ({
  clampScrollOffset: vi.fn((offset, contentHeight, viewportHeight) => {
    const maxOffset = Math.max(0, contentHeight - viewportHeight)
    return Math.max(0, Math.min(offset, maxOffset))
  }),
  AutoScroller: class {
    start = vi.fn()
    stop = vi.fn()
    setSpeed = vi.fn()
  }
}))

// Mock persistence
vi.mock('@/services/persistence', () => ({
  contentStorage: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined)
  },
  scrollPositionStorage: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined)
  }
}))

// Mock markdown utility
vi.mock('@/utils/markdown', () => ({
  compileMarkdown: vi.fn((content: string) => `<p>${content}</p>`)
}))

describe('TeleprompterStore - Manual Scroll Sync', () => {
  let store: ReturnType<typeof useTeleprompterStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTeleprompterStore()
    
    // Set up basic dimensions
    store.setContentHeight(1000)
    store.setViewportHeight(400)
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('syncScrollFromDOM', () => {
    it('should sync scroll position when not playing', () => {
      // Arrange
      store.scrollOffset = 100
      const newScrollTop = 250
      
      // Act
      store.syncScrollFromDOM(newScrollTop)
      
      // Assert
      expect(store.scrollOffset).toBe(250)
      expect(clampScrollOffset).toHaveBeenCalledWith(250, 1000, 400)
    })

    it('should not sync scroll position when playing', () => {
      // Arrange
      store.scrollOffset = 100
      store.isPlaying = true
      const newScrollTop = 250
      
      // Act
      store.syncScrollFromDOM(newScrollTop)
      
      // Assert
      expect(store.scrollOffset).toBe(100) // Should remain unchanged
      expect(clampScrollOffset).not.toHaveBeenCalled()
    })

    it('should clamp scroll position to valid bounds', () => {
      // Arrange
      store.scrollOffset = 100
      const newScrollTop = 1500 // Beyond max offset (1000 - 400 = 600)
      
      // Act
      store.syncScrollFromDOM(newScrollTop)
      
      // Assert
      expect(clampScrollOffset).toHaveBeenCalledWith(1500, 1000, 400)
      expect(store.scrollOffset).toBe(600) // Should be clamped to max offset
    })

    it('should clamp negative scroll position to zero', () => {
      // Arrange
      store.scrollOffset = 100
      const newScrollTop = -50
      
      // Act
      store.syncScrollFromDOM(newScrollTop)
      
      // Assert
      expect(clampScrollOffset).toHaveBeenCalledWith(-50, 1000, 400)
      expect(store.scrollOffset).toBe(0) // Should be clamped to 0
    })

    it('should update scroll progress after sync', () => {
      // Arrange
      store.scrollOffset = 0
      const newScrollTop = 300 // 50% of max offset (600)
      
      // Act
      store.syncScrollFromDOM(newScrollTop)
      
      // Assert
      expect(store.scrollOffset).toBe(300)
      expect(store.scrollProgress).toBe(50) // 300/600 * 100 = 50%
    })

    it('should maintain canScrollUp and canScrollDown state after sync', () => {
      // Test scroll to middle position
      store.syncScrollFromDOM(300)
      expect(store.canScrollUp).toBe(true)
      expect(store.canScrollDown).toBe(true)

      // Test scroll to top
      store.syncScrollFromDOM(0)
      expect(store.canScrollUp).toBe(false)
      expect(store.canScrollDown).toBe(true)

      // Test scroll to bottom
      store.syncScrollFromDOM(600) // max offset
      expect(store.canScrollUp).toBe(true)
      expect(store.canScrollDown).toBe(false)
    })

    it('should work with zero content height', () => {
      // Arrange
      store.setContentHeight(0)
      store.setViewportHeight(400)
      const newScrollTop = 100
      
      // Act
      store.syncScrollFromDOM(newScrollTop)
      
      // Assert
      expect(store.scrollOffset).toBe(0) // Should be clamped to 0 when no content
    })

    it('should work when content height equals viewport height', () => {
      // Arrange
      store.setContentHeight(400)
      store.setViewportHeight(400)
      const newScrollTop = 100
      
      // Act  
      store.syncScrollFromDOM(newScrollTop)
      
      // Assert
      expect(store.scrollOffset).toBe(0) // Should be clamped to 0 when no scrollable content
    })
  })

  describe('Integration with play/pause', () => {
    it('should allow manual scroll sync when paused', () => {
      // Arrange
      store.isPlaying = false
      store.scrollOffset = 100
      
      // Act
      store.syncScrollFromDOM(200)
      
      // Assert
      expect(store.scrollOffset).toBe(200)
    })

    it('should ignore manual scroll sync when playing', () => {
      // Arrange
      store.isPlaying = true
      store.scrollOffset = 100
      
      // Act
      store.syncScrollFromDOM(200)
      
      // Assert
      expect(store.scrollOffset).toBe(100) // Should remain unchanged
    })

    it('should resume from manual scroll position after pause', () => {
      // Arrange - start playing
      store.isPlaying = true
      store.scrollOffset = 100
      
      // Act - pause and manually scroll
      store.pause()
      expect(store.isPlaying).toBe(false)
      
      store.syncScrollFromDOM(300)
      expect(store.scrollOffset).toBe(300)
      
      // Resume playing - should continue from manual position
      store.play()
      expect(store.scrollOffset).toBe(300) // Should start from manual position
    })
  })

  describe('Scroll position persistence', () => {
    it('should trigger save when manual scroll occurs', async () => {
      // Import the mocked persistence module
      const { scrollPositionStorage } = await import('@/services/persistence')
      
      // Act
      store.syncScrollFromDOM(250)
      
      // Assert
      expect(scrollPositionStorage.set).toHaveBeenCalledWith(250)
    })
  })
})