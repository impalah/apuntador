import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'

describe('Teleprompter Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with default values', () => {
    const store = useTeleprompterStore()

    expect(store.contentRaw).toBe('')
    expect(store.contentHtml).toBe('')
    expect(store.isPlaying).toBe(false)
    expect(store.scrollOffset).toBe(0)
    expect(store.lineHeightPx).toBe(24)
  })

  it('should set content and compile markdown', async () => {
    const store = useTeleprompterStore()
    const markdownContent = '# Test Heading\n\nThis is a test.'

    await store.setContent(markdownContent)

    expect(store.contentRaw).toBe(markdownContent)
    expect(store.contentHtml).toContain('<h1')
    expect(store.contentHtml).toContain('Test Heading')
    expect(store.contentHtml).toContain('<p>')
    expect(store.contentHtml).toContain('This is a test.')
  })

  it('should toggle play/pause state', () => {
    const store = useTeleprompterStore()

    expect(store.isPlaying).toBe(false)

    store.play()
    expect(store.isPlaying).toBe(true)

    store.pause()
    expect(store.isPlaying).toBe(false)

    store.toggle()
    expect(store.isPlaying).toBe(true)

    store.toggle()
    expect(store.isPlaying).toBe(false)
  })

  it('should step lines correctly', () => {
    const store = useTeleprompterStore()
    store.lineHeightPx = 20
    store.setViewportHeight(400)
    store.setContentHeight(1000)

    const initialOffset = store.scrollOffset

    // Step down 3 lines
    store.stepLines(3)
    expect(store.scrollOffset).toBe(initialOffset + 60) // 3 * 20px

    // Step up 1 line
    store.stepLines(-1)
    expect(store.scrollOffset).toBe(initialOffset + 40) // 60 - 20px
  })

  it('should navigate to home and end', () => {
    const store = useTeleprompterStore()
    store.setViewportHeight(400)
    store.setContentHeight(1000)
    store.updateScrollOffset(300) // Set to middle

    store.toHome()
    expect(store.scrollOffset).toBe(0)

    store.toEnd()
    expect(store.scrollOffset).toBe(600) // contentHeight - viewportHeight
  })

  it('should calculate max offset correctly', () => {
    const store = useTeleprompterStore()
    store.setViewportHeight(400)
    store.setContentHeight(1000)

    expect(store.maxOffset).toBe(600) // 1000 - 400

    store.setContentHeight(300) // Content shorter than viewport
    expect(store.maxOffset).toBe(0)
  })

  it('should calculate scroll progress correctly', () => {
    const store = useTeleprompterStore()
    store.setViewportHeight(400)
    store.setContentHeight(1000)

    store.updateScrollOffset(0)
    expect(store.scrollProgress).toBe(0)

    store.updateScrollOffset(300) // Half way
    expect(store.scrollProgress).toBe(50)

    store.updateScrollOffset(600) // End
    expect(store.scrollProgress).toBe(100)
  })

  it('should clamp scroll offset to valid bounds', () => {
    const store = useTeleprompterStore()
    store.setViewportHeight(400)
    store.setContentHeight(1000)

    // Try to scroll beyond bounds
    store.updateScrollOffset(-100)
    expect(store.scrollOffset).toBe(0)

    store.updateScrollOffset(1000)
    expect(store.scrollOffset).toBe(600) // maxOffset
  })
})
