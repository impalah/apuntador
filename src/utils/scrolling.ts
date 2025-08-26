/**
 * Calculate pixels per line based on element's computed line height
 */
export function pxPerLine(el: HTMLElement): number {
  const computedStyle = window.getComputedStyle(el)
  const lineHeight = computedStyle.lineHeight

  if (lineHeight === 'normal') {
    // Approximate normal line height
    const fontSize = parseFloat(computedStyle.fontSize)
    return fontSize * 1.2
  }

  if (lineHeight.endsWith('px')) {
    return parseFloat(lineHeight)
  }

  if (lineHeight.endsWith('em') || lineHeight.endsWith('rem')) {
    const fontSize = parseFloat(computedStyle.fontSize)
    return parseFloat(lineHeight) * fontSize
  }

  // If it's a number (unitless), multiply by font size
  const fontSize = parseFloat(computedStyle.fontSize)
  return parseFloat(lineHeight) * fontSize
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
  private onUpdate: (_offset: number) => void
  private onComplete?: () => void

  constructor(onUpdate: (_offset: number) => void) {
    this.onUpdate = onUpdate
  }

  /**
   * Animate to target offset
   */
  scrollTo(targetOffset: number, duration: number = 300, onComplete?: () => void): void {
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
  private animate = (): void => {
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
  private speedPxPerSec: number = 50
  private onUpdate: (_offset: number) => void
  private getCurrentOffset: () => number

  constructor(
    onUpdate: (_offset: number) => void,
    getCurrentOffset: () => number,
    speedPxPerSec: number = 50
  ) {
    this.onUpdate = onUpdate
    this.getCurrentOffset = getCurrentOffset
    this.speedPxPerSec = speedPxPerSec
  }

  /**
   * Start auto-scrolling
   */
  start(): void {
    if (this.animationId !== null) return

    this.lastTime = performance.now()
    this.animate()
  }

  /**
   * Stop auto-scrolling
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
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
  private animate = (): void => {
    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 1000 // Convert to seconds
    this.lastTime = currentTime

    const currentOffset = this.getCurrentOffset()
    const newOffset = currentOffset + this.speedPxPerSec * deltaTime

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
