import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { debugEdgeToEdge, showDebugOverlay } from '@/utils/debug'

describe('Debug Utils', () => {
  let mockConsoleLog: any
  let mockGetComputedStyle: any
  let mockLocalStorage: any

  beforeEach(() => {
    // Mock console.log
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

    // Mock getComputedStyle
    mockGetComputedStyle = vi.fn(() => ({
      getPropertyValue: vi.fn((property: string) => {
        const values: Record<string, string> = {
          'env(safe-area-inset-top)': '20px',
          'env(safe-area-inset-bottom)': '34px',
          'env(safe-area-inset-left)': '0px',
          'env(safe-area-inset-right)': '0px',
          '--safe-area-inset-top': '20px',
          '--safe-area-inset-bottom': '34px',
          '--safe-area-inset-left': '0px',
          '--safe-area-inset-right': '0px'
        }
        return values[property] || ''
      })
    }))
    global.getComputedStyle = mockGetComputedStyle

    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    // Mock navigator
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36',
      writable: true
    })

    // Mock screen
    Object.defineProperty(window, 'screen', {
      value: {
        width: 1080,
        height: 2400,
        availWidth: 1080,
        availHeight: 2400
      },
      writable: true
    })

    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1080, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 2400, writable: true })
    Object.defineProperty(window, 'outerWidth', { value: 1080, writable: true })
    Object.defineProperty(window, 'outerHeight', { value: 2400, writable: true })

    // Mock visual viewport
    Object.defineProperty(window, 'visualViewport', {
      value: {
        width: 1080,
        height: 2400,
        offsetTop: 0,
        offsetLeft: 0,
        pageTop: 0,
        pageLeft: 0,
        scale: 1
      },
      writable: true
    })

    // Mock document
    Object.defineProperty(document, 'documentElement', {
      value: {
        className: 'mobile android',
        style: {}
      },
      writable: true
    })

    Object.defineProperty(document, 'body', {
      value: {
        className: 'debug-mode',
        appendChild: vi.fn(),
        style: {}
      },
      writable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('debugEdgeToEdge', () => {
    it('should return early if not in browser environment', () => {
      // Mock window as undefined
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      debugEdgeToEdge()

      expect(mockConsoleLog).not.toHaveBeenCalled()

      // Restore window
      global.window = originalWindow
    })

    it('should return early if debug is not enabled', () => {
      mockLocalStorage.getItem.mockReturnValue('false')

      debugEdgeToEdge()

      expect(mockConsoleLog).not.toHaveBeenCalled()
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('DEBUG_EDGE_TO_EDGE')
    })

    it('should log debug information when enabled', () => {
      mockLocalStorage.getItem.mockReturnValue('true')

      debugEdgeToEdge()

      expect(mockConsoleLog).toHaveBeenCalledWith('=== Android Edge-to-Edge Debug Info ===')
      expect(mockConsoleLog).toHaveBeenCalledWith('User Agent:', navigator.userAgent)
      expect(mockConsoleLog).toHaveBeenCalledWith('Is Android:', true)
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Screen dimensions:', {
        width: 1080,
        height: 2400,
        availWidth: 1080,
        availHeight: 2400
      })

      expect(mockConsoleLog).toHaveBeenCalledWith('Viewport dimensions:', {
        innerWidth: 1080,
        innerHeight: 2400,
        outerWidth: 1080,
        outerHeight: 2400
      })

      expect(mockConsoleLog).toHaveBeenCalledWith('Visual Viewport:', {
        width: 1080,
        height: 2400,
        offsetTop: 0,
        offsetLeft: 0,
        pageTop: 0,
        pageLeft: 0,
        scale: 1
      })

      expect(mockConsoleLog).toHaveBeenCalledWith('CSS Environment Variables:', {
        'safe-area-inset-top': '20px',
        'safe-area-inset-bottom': '34px',
        'safe-area-inset-left': '0px',
        'safe-area-inset-right': '0px'
      })

      expect(mockConsoleLog).toHaveBeenCalledWith('Custom CSS Properties:', {
        '--safe-area-inset-top': '20px',
        '--safe-area-inset-bottom': '34px',
        '--safe-area-inset-left': '0px',
        '--safe-area-inset-right': '0px'
      })

      expect(mockConsoleLog).toHaveBeenCalledWith('HTML classes:', 'mobile android')
      expect(mockConsoleLog).toHaveBeenCalledWith('Body classes:', 'debug-mode')
      expect(mockConsoleLog).toHaveBeenCalledWith('=== End Debug Info ===')
    })

    it('should handle missing visual viewport', () => {
      mockLocalStorage.getItem.mockReturnValue('true')
      Object.defineProperty(window, 'visualViewport', {
        value: undefined,
        writable: true
      })

      debugEdgeToEdge()

      expect(mockConsoleLog).toHaveBeenCalledWith('=== Android Edge-to-Edge Debug Info ===')
      // Visual viewport should not be logged
      expect(mockConsoleLog).not.toHaveBeenCalledWith('Visual Viewport:', expect.any(Object))
    })

    it('should detect non-Android user agent', () => {
      mockLocalStorage.getItem.mockReturnValue('true')
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      })

      debugEdgeToEdge()

      expect(mockConsoleLog).toHaveBeenCalledWith('Is Android:', false)
    })
  })

  describe('showDebugOverlay', () => {
    let mockDocument: any
    let mockOverlayElement: any
    let mockBottomElement: any
    let mockInfoElement: any

    beforeEach(() => {
      mockOverlayElement = {
        id: '',
        style: { cssText: '' },
        remove: vi.fn(),
        innerHTML: ''
      }
      
      mockBottomElement = {
        style: { cssText: '' },
        remove: vi.fn()
      }
      
      mockInfoElement = {
        style: { cssText: '' },
        innerHTML: '',
        remove: vi.fn()
      }

      mockDocument = {
        getElementById: vi.fn(),
        createElement: vi.fn((tag: string) => {
          if (tag === 'div') {
            return mockOverlayElement
          }
          return mockOverlayElement
        }),
        body: {
          appendChild: vi.fn()
        },
        addEventListener: vi.fn()
      }

      // Mock document methods
      Object.defineProperty(global, 'document', {
        value: {
          ...mockDocument,
          getElementById: vi.fn(),
          createElement: vi.fn(() => {
            const element = {
              id: '',
              style: { cssText: '' },
              innerHTML: '',
              remove: vi.fn()
            }
            return element
          }),
          body: {
            appendChild: vi.fn()
          },
          addEventListener: vi.fn(),
          documentElement: {
            className: 'mobile android'
          }
        },
        writable: true
      })
    })

    it('should return early if not in browser environment', () => {
      const originalWindow = global.window
      // @ts-ignore
      delete global.window

      showDebugOverlay()

      expect(document.createElement).not.toHaveBeenCalled()

      global.window = originalWindow
    })

    it('should return early if debug is not enabled', () => {
      mockLocalStorage.getItem.mockReturnValue('false')

      showDebugOverlay()

      expect(document.createElement).not.toHaveBeenCalled()
    })

    it('should remove existing overlay before creating new one', () => {
      mockLocalStorage.getItem.mockReturnValue('true')
      const existingElement = { remove: vi.fn() }
      
      vi.spyOn(document, 'getElementById').mockReturnValue(existingElement as any)

      showDebugOverlay()

      expect(document.getElementById).toHaveBeenCalledWith('debug-overlay')
      expect(existingElement.remove).toHaveBeenCalled()
    })

    it('should create debug overlay elements', () => {
      mockLocalStorage.getItem.mockReturnValue('true')
      vi.spyOn(document, 'getElementById').mockReturnValue(null)

      showDebugOverlay()

      expect(document.createElement).toHaveBeenCalledWith('div')
      expect(document.body.appendChild).toHaveBeenCalledTimes(3) // overlay, bottom, info
    })

    it('should set up click listener to close overlay', async () => {
      mockLocalStorage.getItem.mockReturnValue('true')
      vi.spyOn(document, 'getElementById').mockReturnValue(null)

      let clickHandler: any
      vi.spyOn(document, 'addEventListener').mockImplementation((event, handler, options) => {
        if (event === 'click') {
          clickHandler = handler
        }
      })

      showDebugOverlay()

      // Wait for setTimeout
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function), { once: true })
      
      // Simulate click
      if (clickHandler) {
        clickHandler()
      }
    })

    it('should handle missing computed style values', () => {
      mockLocalStorage.getItem.mockReturnValue('true')
      vi.spyOn(document, 'getElementById').mockReturnValue(null)
      
      mockGetComputedStyle.mockReturnValue({
        getPropertyValue: vi.fn(() => '') // Return empty string
      })

      showDebugOverlay()

      expect(document.createElement).toHaveBeenCalled()
      // Should still create elements even with missing CSS values
    })
  })
})