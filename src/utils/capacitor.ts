/**
 * Capacitor utilities for mobile app functionality
 */

import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { ScreenOrientation } from '@capacitor/screen-orientation'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Keyboard } from '@capacitor/keyboard'

/**
 * Initialize mobile-specific configurations
 */
export async function initMobileApp() {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    // Configure status bar for dark theme
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#1E1E1E' })

    // Allow all orientations - let the app handle responsive design
    await ScreenOrientation.unlock()

    // Listen for orientation changes to trigger layout updates
    ScreenOrientation.addListener('screenOrientationChange', (orientation) => {
      console.log('Orientation changed:', orientation)
      // Trigger a window resize event to help Vue components recalculate
      window.dispatchEvent(new Event('resize'))
      // Add a small delay to ensure proper layout recalculation
      setTimeout(() => {
        window.dispatchEvent(new Event('orientationchange'))
      }, 100)
    })

    // Hide keyboard automatically when not needed
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open')
    })

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open')
    })
  } catch (error) {
    console.warn('Mobile initialization failed:', error)
  }
}

/**
 * Provide haptic feedback for user interactions
 */
export async function vibrate(style: ImpactStyle = ImpactStyle.Light) {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    await Haptics.impact({ style })
  } catch (error) {
    console.warn('Haptic feedback failed:', error)
  }
}

/**
 * Force landscape orientation for teleprompter
 */
export async function forceLandscape() {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    await ScreenOrientation.lock({ orientation: 'landscape' })
  } catch (error) {
    console.warn('Screen orientation lock failed:', error)
  }
}

/**
 * Allow all orientations
 */
export async function allowAllOrientations() {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    await ScreenOrientation.unlock()
  } catch (error) {
    console.warn('Screen orientation unlock failed:', error)
  }
}

/**
 * Allow portrait orientation (for settings, editor, etc.)
 */
export async function allowPortrait() {
  if (!Capacitor.isNativePlatform()) {
    return
  }

  try {
    await ScreenOrientation.unlock()
  } catch (error) {
    console.warn('Screen orientation unlock failed:', error)
  }
}

/**
 * Get current screen orientation
 */
export async function getCurrentOrientation() {
  if (!Capacitor.isNativePlatform()) {
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  }

  try {
    const orientation = await ScreenOrientation.orientation()
    return orientation.type.includes('landscape') ? 'landscape' : 'portrait'
  } catch (error) {
    console.warn('Failed to get orientation:', error)
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  }
}

/**
 * Check if device is in landscape orientation
 */
export async function isLandscape(): Promise<boolean> {
  const orientation = await getCurrentOrientation()
  return orientation === 'landscape'
}

/**
 * Check if running on mobile device
 */
export function isMobile(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Get platform name
 */
export function getPlatform(): string {
  return Capacitor.getPlatform()
}
