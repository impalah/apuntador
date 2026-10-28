import { DEFAULT_SCROLL_SPEED, SCROLL_SMOOTH_DURATION } from './constants'

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
  private readonly getCurrentOffset: () => number
  private onComplete?: () => void

  constructor(onUpdate: (_offset: number) => void, getCurrentOffset: () => number = () => 0) {
    this.onUpdate = onUpdate
    this.getCurrentOffset = getCurrentOffset
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

    // Schedule the next frame before notifying: onUpdate may call stop()
    // (e.g. auto-pause at the end of the text), which must be able to cancel it
    this.animationId = requestAnimationFrame(this.animate)
    this.onUpdate(newOffset)
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
