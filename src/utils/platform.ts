/**
 * Platform detection utilities
 */

/**
 * Check if running in Tauri (Desktop application)
 * @returns true if running in Tauri, false otherwise
 */
export function isTauri(): boolean {
  // Check for Tauri-specific globals
  // @ts-ignore - __TAURI__ is injected by Tauri at runtime
  return typeof globalThis !== 'undefined' && window.__TAURI__ !== undefined
}

/**
 * Check if running in Capacitor (Mobile application)
 * @returns true if running in Capacitor, false otherwise
 */
export function isCapacitor(): boolean {
  return typeof globalThis !== 'undefined' && 
         // @ts-ignore - Capacitor is injected at runtime
         window.Capacitor !== undefined
}

/**
 * Check if running in a web browser
 * @returns true if running in web browser, false otherwise
 */
export function isWeb(): boolean {
  return !isTauri() && !isCapacitor()
}

/**
 * Get the current platform
 * @returns 'tauri' | 'capacitor' | 'web'
 */
export function getPlatform(): 'tauri' | 'capacitor' | 'web' {
  if (isTauri()) return 'tauri'
  if (isCapacitor()) return 'capacitor'
  return 'web'
}
