import {
  DEFAULT_SCROLL_SPEED,
  SCROLL_SMOOTH_DURATION,
  NORMAL_LINE_HEIGHT_MULTIPLIER,
} from './constants'

/**
 * Calculate pixels per line based on element's computed line height
 */
export function pxPerLine(el: HTMLElement): number {
  const computedStyle = window.getComputedStyle(el)
  const lineHeight = computedStyle.lineHeight

  if (lineHeight === 'normal') {
    // Approximate normal line height
    const fontSize = Number.parseFloat(computedStyle.fontSize)
    return fontSize * NORMAL_LINE_HEIGHT_MULTIPLIER
  }

  if (lineHeight.endsWith('px')) {
    return Number.parseFloat(lineHeight)
  }

  if (lineHeight.endsWith('em') || lineHeight.endsWith('rem')) {
    const fontSize = Number.parseFloat(computedStyle.fontSize)
    return Number.parseFloat(lineHeight) * fontSize
  }

  // If it's a number (unitless), multiply by font size
  const fontSize = Number.parseFloat(computedStyle.fontSize)
  return Number.parseFloat(lineHeight) * fontSize
}

/**
 * Calculate pixel offset for a given number of lines
 */
export function offsetForLines(n: number, lineHeightPx: number): number {
  return n * lineHeightPx
}

/**
 * Smooth scroll animation using requestAnimationFrame
 */
export class SmoothScroller {
  private animationId: number | null = null
  private startTime: number = 0
  private startOffset: number = 0
  private targetOffset: number = 0
  private duration: number = 0
  private readonly onUpdate: (_offset: number) => void
  private onComplete?: () => void

  constructor(onUpdate: (_offset: number) => void) {
    this.onUpdate = onUpdate
  }

  /**
   * Animate to target offset
   */
  scrollTo(
    targetOffset: number,
    duration: number = SCROLL_SMOOTH_DURATION,
    onComplete?: () => void
  ): void {
    this.cancel()

    this.startTime = performance.now()
    this.startOffset = this.getCurrentOffset()
    this.targetOffset = Math.max(0, targetOffset)
    this.duration = duration
    this.onComplete = onComplete

    this.animate()
  }

  /**
   * Get current scroll offset (to be implemented by consumer)
   */
  private getCurrentOffset(): number {
    // This should be overridden or passed as parameter
    return 0
  }

  /**
   * Cancel current animation
   */
  cancel(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  /**
   * Animation loop
   */
  private readonly animate = (): void => {
    const currentTime = performance.now()
    const elapsed = currentTime - this.startTime
    const progress = Math.min(elapsed / this.duration, 1)

    // Easing function (ease-out)
    const eased = 1 - Math.pow(1 - progress, 3)

    const currentOffset = this.startOffset + (this.targetOffset - this.startOffset) * eased
    this.onUpdate(currentOffset)

    if (progress < 1) {
      this.animationId = requestAnimationFrame(this.animate)
    } else {
      this.animationId = null
      this.onComplete?.()
    }
  }
}

/**
 * Auto-scroll animation for teleprompter
 */
export class AutoScroller {
  private animationId: number | null = null
  private lastTime: number = 0
  private speedPxPerSec: number = DEFAULT_SCROLL_SPEED
  private readonly onUpdate: (_offset: number) => void
  private readonly getCurrentOffset: () => number

  constructor(
    onUpdate: (_offset: number) => void,
    getCurrentOffset: () => number,
    speedPxPerSec: number = DEFAULT_SCROLL_SPEED
  ) {
    this.onUpdate = onUpdate
    this.getCurrentOffset = getCurrentOffset
    this.speedPxPerSec = speedPxPerSec
  }

  /**
   * Start auto-scrolling
   */
  start(): void {
    // console.log('[ANDROID DEBUG] AutoScroller.start() called, current animationId:', this.animationId)
    if (this.animationId !== null) {
      // console.log('[ANDROID DEBUG] AutoScroller.start() - already running, returning')
      return
    }

    // console.log('[ANDROID DEBUG] AutoScroller.start() - starting animation, speed:', this.speedPxPerSec)
    this.lastTime = performance.now()
    this.animate()
    // console.log('[ANDROID DEBUG] AutoScroller.start() - animation started, animationId:', this.animationId)
  }

  /**
   * Stop auto-scrolling
   */
  stop(): void {
    // console.log('[ANDROID DEBUG] AutoScroller.stop() called, current animationId:', this.animationId)
    if (this.animationId !== null) {
      // console.log('[ANDROID DEBUG] AutoScroller.stop() - canceling animation')
      cancelAnimationFrame(this.animationId)
      this.animationId = null
      // console.log('[ANDROID DEBUG] AutoScroller.stop() - animation canceled')
    // } else {
    //   console.log('[ANDROID DEBUG] AutoScroller.stop() - no animation to cancel')
    }
  }

  /**
   * Update scroll speed
   */
  setSpeed(speedPxPerSec: number): void {
    this.speedPxPerSec = speedPxPerSec
  }

  /**
   * Check if currently scrolling
   */
  get isRunning(): boolean {
    return this.animationId !== null
  }

  /**
   * Animation loop
   */
  private readonly animate = (): void => {
    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000 // Convert to seconds
    this.lastTime = currentTime

    const currentOffset = this.getCurrentOffset()
    const newOffset = currentOffset + this.speedPxPerSec * deltaTime

    // Log every few frames to avoid spam
    // if (Math.floor(currentTime / 1000) !== Math.floor((currentTime - 16) / 1000)) {
    //   console.log('[ANDROID DEBUG] AutoScroller.animate() - currentOffset:', currentOffset.toFixed(1), 'newOffset:', newOffset.toFixed(1), 'speed:', this.speedPxPerSec, 'deltaTime:', deltaTime.toFixed(3))
    // }

    this.onUpdate(newOffset)

    this.animationId = requestAnimationFrame(this.animate)
  }
}

/**
 * Clamp scroll offset to valid bounds
 */
export function clampScrollOffset(
  offset: number,
  contentHeight: number,
  viewportHeight: number
): number {
  const maxOffset = Math.max(0, contentHeight - viewportHeight)
  return Math.max(0, Math.min(offset, maxOffset))
}

/**
 * Calculate scroll progress as percentage (0-100)
 */
export function getScrollProgress(
  offset: number,
  contentHeight: number,
  viewportHeight: number
): number {
  const maxOffset = Math.max(1, contentHeight - viewportHeight)
  return (offset / maxOffset) * 100
}
