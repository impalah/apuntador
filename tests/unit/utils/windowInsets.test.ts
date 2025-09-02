import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { useWindowInsets } from '@/utils/windowInsets'

// Mock window.visualViewport
const mockVisualViewport = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

describe('useWindowInsets', () => {
  let originalVisualViewport: any
  let originalUserAgent: string
  let originalInnerHeight: number
  let originalScreenHeight: number

  beforeEach(() => {
    // Store original values
    originalVisualViewport = window.visualViewport
    originalUserAgent = navigator.userAgent
    originalInnerHeight = window.innerHeight
    originalScreenHeight = window.screen.height

    // Mock window methods
    window.addEventListener = vi.fn()
    window.removeEventListener = vi.fn()

    // Mock getComputedStyle
    window.getComputedStyle = vi.fn(() => ({
      getPropertyValue: vi.fn((prop) => {
        if (prop === 'env(safe-area-inset-top)') return '24px'
        if (prop === 'env(safe-area-inset-bottom)') return '48px'
        return '0px'
      }),
    })) as any

    // Mock document.documentElement
    document.documentElement.style.setProperty = vi.fn()
  })

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'visualViewport', {
      value: originalVisualViewport,
      writable: true,
    })
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
    })
    Object.defineProperty(window, 'innerHeight', {
      value: originalInnerHeight,
      writable: true,
    })
    Object.defineProperty(window.screen, 'height', {
      value: originalScreenHeight,
      writable: true,
    })

    vi.clearAllMocks()
  })

  it('should detect safe area insets from CSS env variables', () => {
    Object.defineProperty(window, 'visualViewport', {
      value: mockVisualViewport,
      writable: true,
    })

    const { safeAreaInsets, isEdgeToEdge } = useWindowInsets()

    // Trigger updateInsets by accessing the composable
    expect(safeAreaInsets.value.top).toBe(24)
    expect(safeAreaInsets.value.bottom).toBe(48)
    expect(isEdgeToEdge.value).toBe(true)
  })

  it('should detect Android edge-to-edge mode', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36',
      writable: true,
    })

    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      writable: true,
    })

    Object.defineProperty(window.screen, 'height', {
      value: 900,
      writable: true,
    })

    // Mock getComputedStyle to return no CSS env values
    window.getComputedStyle = vi.fn(() => ({
      getPropertyValue: vi.fn(() => '0px'),
    })) as any

    const { safeAreaInsets, isEdgeToEdge } = useWindowInsets()

    expect(isEdgeToEdge.value).toBe(true)
    expect(safeAreaInsets.value.bottom).toBeGreaterThan(0)
  })

  it('should set CSS custom properties', () => {
    const { safeAreaInsets } = useWindowInsets()

    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--safe-area-inset-top',
      expect.stringContaining('px')
    )
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--safe-area-inset-bottom',
      expect.stringContaining('px')
    )
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--safe-area-inset-left',
      expect.stringContaining('px')
    )
    expect(document.documentElement.style.setProperty).toHaveBeenCalledWith(
      '--safe-area-inset-right',
      expect.stringContaining('px')
    )
  })

  it('should handle non-Android devices gracefully', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      writable: true,
    })

    // Mock getComputedStyle to return no CSS env values
    window.getComputedStyle = vi.fn(() => ({
      getPropertyValue: vi.fn(() => '0px'),
    })) as any

    const { safeAreaInsets, isEdgeToEdge } = useWindowInsets()

    expect(isEdgeToEdge.value).toBe(false)
    expect(safeAreaInsets.value.top).toBe(0)
    expect(safeAreaInsets.value.bottom).toBe(0)
  })
})
