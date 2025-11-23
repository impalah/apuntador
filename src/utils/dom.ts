/**
 * DOM utility functions
 */

/**
 * Get element's bounding rect safely
 */
export function getElementRect(element: HTMLElement | null): DOMRect {
  if (!element) {
    return new DOMRect(0, 0, 0, 0)
  }
  return element.getBoundingClientRect()
}

/**
 * Check if element is in viewport
 */
export function isElementInViewport(element: HTMLElement): boolean {
  const rect = getElementRect(element)
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Measure text dimensions
 */
export function measureText(
  text: string,
  font: string,
  maxWidth?: number
): { width: number; height: number } {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')!
  context.font = font

  const metrics = context.measureText(text)
  const width = maxWidth ? Math.min(metrics.width, maxWidth) : metrics.width

  // Approximate height based on font size
  // Extract font size from CSS font string (e.g., "16px", "1.5em")
  // Use RegExp.exec for better control
  const fontSizeRegex = /\b(\d+(?:\.\d+)?)px\b/
  const fontSizeMatch = fontSizeRegex.exec(font)
  const fontSize = fontSizeMatch ? Number.parseFloat(fontSizeMatch[1]) : 16
  const height = fontSize * 1.2 // Approximate line height

  return { width, height }
}

/**
 * Get computed font string from element
 */
export function getElementFont(element: HTMLElement): string {
  const style = window.getComputedStyle(element)
  return `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (..._args: Parameters<T>) => void {
  let timeoutId: number | null = null
  let lastCallTime = 0

  return (..._args: Parameters<T>) => {
    const now = Date.now()

    if (now - lastCallTime >= delay) {
      func(..._args)
      lastCallTime = now
    } else if (!timeoutId) {
      timeoutId = window.setTimeout(
        () => {
          func(..._args)
          lastCallTime = Date.now()
          timeoutId = null
        },
        delay - (now - lastCallTime)
      )
    }
  }
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (..._args: Parameters<T>) => void {
  let timeoutId: number | null = null

  return (..._args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = window.setTimeout(() => {
      func(..._args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Add safe area insets as CSS custom properties
 */
export function addSafeAreaInsets(): void {
  const updateInsets = () => {
    const style = document.documentElement.style
    style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)')
    style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right)')
    style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)')
    style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left)')
  }

  updateInsets()

  // Update on orientation change
  globalThis.addEventListener('orientationchange', updateInsets)
  globalThis.addEventListener('resize', updateInsets)
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Get device pixel ratio
 */
export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1
}

/**
 * Prevent zoom on double tap (for mobile)
 */
export function preventDoubleTabZoom(element: HTMLElement): void {
  let lastTouchEnd = 0

  element.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    },
    { passive: false }
  )
}

/**
 * Get viewport dimensions
 */
export function getViewportDimensions(): { width: number; height: number } {
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  }
}

/**
 * Scroll element into view smoothly
 */
export function scrollIntoView(element: HTMLElement, behavior: ScrollBehavior = 'smooth'): void {
  element.scrollIntoView({
    behavior,
    block: 'center',
    inline: 'center',
  })
}
