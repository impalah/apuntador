/**
 * Version utility for Apuntador
 * 
 * This file provides access to the application version.
 * The version is manually synchronized with package.json during releases.
 * 
 * TODO: Consider automation via vite plugin or build script to auto-sync with package.json
 */

/**
 * Current application version - Update this when releasing new versions
 * @see package.json version field
 * CURRENT PACKAGE.JSON VERSION: 1.1.1
 */
export const APP_VERSION = '1.1.1'

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