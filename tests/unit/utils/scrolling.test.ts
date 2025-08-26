import { describe, it, expect, vi } from 'vitest'
import {
  pxPerLine,
  offsetForLines,
  clampScrollOffset,
  getScrollProgress,
  AutoScroller,
  SmoothScroller,
} from '@/utils/scrolling'

describe('Scrolling Utils', () => {
  it('should calculate pixels per line correctly', () => {
    // Mock element with computed styles
    const mockElement = {
      style: {},
    } as HTMLElement

    // Mock getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle
    window.getComputedStyle = vi.fn().mockReturnValue({
      lineHeight: '24px',
      fontSize: '16px',
    })

    const result = pxPerLine(mockElement)
    expect(result).toBe(24)

    // Test with unitless line height
    window.getComputedStyle = vi.fn().mockReturnValue({
      lineHeight: '1.5',
      fontSize: '16px',
    })

    const result2 = pxPerLine(mockElement)
    expect(result2).toBe(24) // 16 * 1.5

    // Test with 'normal' line height
    window.getComputedStyle = vi.fn().mockReturnValue({
      lineHeight: 'normal',
      fontSize: '16px',
    })

    const result3 = pxPerLine(mockElement)
    expect(result3).toBe(19.2) // 16 * 1.2

    // Restore original function
    window.getComputedStyle = originalGetComputedStyle
  })

  it('should calculate offset for lines', () => {
    expect(offsetForLines(3, 20)).toBe(60)
    expect(offsetForLines(-2, 15)).toBe(-30)
    expect(offsetForLines(0, 10)).toBe(0)
  })

  it('should clamp scroll offset to valid bounds', () => {
    // Normal case
    expect(clampScrollOffset(50, 1000, 400)).toBe(50)

    // Below minimum
    expect(clampScrollOffset(-10, 1000, 400)).toBe(0)

    // Above maximum
    expect(clampScrollOffset(800, 1000, 400)).toBe(600) // 1000 - 400

    // Content shorter than viewport
    expect(clampScrollOffset(100, 300, 400)).toBe(0)
  })

  it('should calculate scroll progress', () => {
    expect(getScrollProgress(0, 1000, 400)).toBe(0)
    expect(getScrollProgress(300, 1000, 400)).toBe(50) // 300 / 600 * 100
    expect(getScrollProgress(600, 1000, 400)).toBe(100)

    // Edge case: content shorter than viewport
    expect(getScrollProgress(0, 300, 400)).toBe(0)
  })

  it('should handle AutoScroller', () => {
    let currentOffset = 0
    const mockUpdate = vi.fn((offset: number) => {
      currentOffset = offset
    })
    const mockGetOffset = vi.fn(() => currentOffset)

    const scroller = new AutoScroller(mockUpdate, mockGetOffset, 50)

    expect(scroller.isRunning).toBe(false)

    scroller.start()
    expect(scroller.isRunning).toBe(true)

    scroller.setSpeed(100)

    scroller.stop()
    expect(scroller.isRunning).toBe(false)
  })

  it('should handle SmoothScroller', () => {
    const mockUpdate = vi.fn()
    const scroller = new SmoothScroller(mockUpdate)

    // Test scrollTo
    scroller.scrollTo(100, 300)

    // Should start animation (we can't easily test the actual animation)
    expect(mockUpdate).toHaveBeenCalled()

    // Test cancel
    scroller.cancel()
  })
})
