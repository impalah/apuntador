/**
 * Vite plugin to auto-sync version from package.json to src/utils/version.ts
 * 
 * This plugin automatically updates the APP_VERSION constant in src/utils/version.ts
 * with the version from package.json during build and dev processes.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import type { Plugin } from 'vite'

interface VersionSyncOptions {
  /** Path to package.json (default: './package.json') */
  packageJsonPath?: string
  /** Path to version.ts file (default: './src/utils/version.ts') */
  versionFilePath?: string
  /** Whether to update during dev mode (default: true) */
  updateInDev?: boolean
}

export function versionSync(options: VersionSyncOptions = {}): Plugin {
  const {
    packageJsonPath = './package.json',
    versionFilePath = './src/utils/version.ts',
    updateInDev = true
  } = options

  let hasUpdated = false

  return {
    name: 'version-sync',
    
    buildStart() {
      updateVersionFile()
      hasUpdated = true
    },

    configureServer(server) {
      if (updateInDev) {
        // Update version on server start if not already updated in buildStart
        if (!hasUpdated) {
          updateVersionFile()
          hasUpdated = true
        }
        
        // Watch package.json for changes during dev
        server.watcher.add(packageJsonPath)
        server.watcher.on('change', (path) => {
          if (path.endsWith('package.json')) {
            updateVersionFile()
            server.ws.send({
              type: 'full-reload'
            })
          }
        })
      }
    }
  }

  function updateVersionFile() {
    try {
      // Read package.json version
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
      const version = packageJson.version

      if (!version) {
        console.warn('⚠️ No version found in package.json')
        return
      }

      // Read current version.ts file
      const versionFileFull = resolve(versionFilePath)
      const currentContent = readFileSync(versionFileFull, 'utf-8')

      // Update APP_VERSION constant
      const updatedContent = currentContent.replace(
        /export const APP_VERSION = ['"`][\d.]+['"`]/,
        `export const APP_VERSION = '${version}'`
      )

      // Update the comment with current package.json version
      const finalContent = updatedContent.replace(
        /CURRENT PACKAGE\.JSON VERSION: [\d.]+/,
        `CURRENT PACKAGE.JSON VERSION: ${version}`
      )

      // Write updated file only if content changed
      if (finalContent !== currentContent) {
        writeFileSync(versionFileFull, finalContent, 'utf-8')
        console.log(`✨ Version synced: ${version} → src/utils/version.ts`)
      }

    } catch (error) {
      console.error('❌ Error syncing version:', error)
    }
  }
}