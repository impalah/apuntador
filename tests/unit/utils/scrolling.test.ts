import { describe, it, expect, vi } from 'vitest'
import { clampScrollOffset, AutoScroller, SmoothScroller } from '@/utils/scrolling'

describe('Scrolling Utils', () => {
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

  it('stays stopped when onUpdate stops the AutoScroller (end-of-text auto-pause)', () => {
    let scroller: AutoScroller | null = null
    const onUpdate = vi.fn(() => scroller?.stop())

    scroller = new AutoScroller(onUpdate, () => 0, 50)
    scroller.start()

    expect(onUpdate).toHaveBeenCalledTimes(1)
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
