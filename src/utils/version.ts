/**
 * Version utility for Apuntador
 * 
 * This file provides access to the application version.
 * The version is automatically synchronized with package.json during build/dev.
 * 
 * ✨ AUTO-SYNCED: This file is automatically updated by the vite-plugin-version-sync plugin
 */

/**
 * Current application version - Automatically updated from package.json
 * @see package.json version field
 * @see config/vite-plugin-version-sync.ts for sync implementation
 * CURRENT PACKAGE.JSON VERSION: 1.1.61
 */
export const APP_VERSION = '1.1.61'

/**
 * Application name
 */
export const APP_NAME = 'Apuntador'

/**
 * Copyright information
 */
export const COPYRIGHT_YEAR = '2025'
export const COPYRIGHT_OWNER = 'Impalah'
export const REPOSITORY_URL = 'https://github.com/impalah/apuntador'

/**
 * Full copyright string
 */
export const COPYRIGHT_TEXT = `(c) ${COPYRIGHT_YEAR} by ${COPYRIGHT_OWNER} (${REPOSITORY_URL})`

/**
 * Get version info object
 */
export function getVersionInfo() {
  return {
    name: APP_NAME,
    version: APP_VERSION,
    copyright: COPYRIGHT_TEXT,
    repositoryUrl: REPOSITORY_URL,
  }
}