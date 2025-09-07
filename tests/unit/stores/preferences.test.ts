import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { MIN_FONT_SIZE, FONT_SIZE_STEP, SPEED_ADJUSTMENT_STEP } from '@/utils/constants'

describe('Preferences Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default values', () => {
    const store = usePrefsStore()

    expect(store.fontFamily).toBe('Roboto, sans-serif')
    expect(store.fontSizePx).toBe(24)
    expect(store.lineHeight).toBe(1.4)
    expect(store.speedPxPerSec).toBe(50)
    expect(store.mirrorH).toBe(false)
    expect(store.mirrorV).toBe(false)
    expect(store.highlightBandLines).toBe(2)
    expect(store.highlightBandPosPct).toBe(40)
  })

  it('should increase and decrease font size', () => {
    const store = usePrefsStore()
    const initialSize = store.fontSizePx

    store.increaseFontSize()
    expect(store.fontSizePx).toBe(initialSize + FONT_SIZE_STEP)

    store.decreaseFontSize()
    expect(store.fontSizePx).toBe(initialSize)

    // Test minimum bounds
    store.fontSizePx = MIN_FONT_SIZE
    store.decreaseFontSize()
    expect(store.fontSizePx).toBe(MIN_FONT_SIZE) // Should not go below minimum
  })

  it('should increase and decrease speed', () => {
    const store = usePrefsStore()
    const initialSpeed = store.speedPxPerSec

    store.increaseSpeed()
    expect(store.speedPxPerSec).toBe(initialSpeed + SPEED_ADJUSTMENT_STEP)

    store.decreaseSpeed()
    expect(store.speedPxPerSec).toBe(initialSpeed)

    // Test minimum bounds
    store.speedPxPerSec = store.speedMin
    store.decreaseSpeed()
    expect(store.speedPxPerSec).toBe(store.speedMin) // Should not go below minimum
  })

  it('should toggle mirror modes', () => {
    const store = usePrefsStore()

    expect(store.mirrorH).toBe(false)
    store.toggleMirrorH()
    expect(store.mirrorH).toBe(true)
    store.toggleMirrorH()
    expect(store.mirrorH).toBe(false)

    expect(store.mirrorV).toBe(false)
    store.toggleMirrorV()
    expect(store.mirrorV).toBe(true)
    store.toggleMirrorV()
    expect(store.mirrorV).toBe(false)
  })

  it('should reset to defaults', () => {
    const store = usePrefsStore()

    // Change some values
    store.fontSizePx = 48
    store.speedPxPerSec = 100
    store.mirrorH = true

    // Reset
    store.reset()

    // Check defaults are restored
    expect(store.fontSizePx).toBe(24)
    expect(store.speedPxPerSec).toBe(50)
    expect(store.mirrorH).toBe(false)
  })
})
