/**
 * Tests for Version Utility
 */

import { describe, it, expect } from 'vitest'
import {
  APP_VERSION,
  APP_NAME,
  COPYRIGHT_YEAR,
  COPYRIGHT_OWNER,
  REPOSITORY_URL,
  COPYRIGHT_TEXT,
  getVersionInfo,
} from '@/utils/version'

describe('version utility', () => {
  describe('constants', () => {
    it('should export APP_VERSION', () => {
      expect(APP_VERSION).toBeDefined()
      expect(typeof APP_VERSION).toBe('string')
      expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    })

    it('should export APP_NAME', () => {
      expect(APP_NAME).toBe('Apuntador')
    })

    it('should export COPYRIGHT_YEAR', () => {
      expect(COPYRIGHT_YEAR).toBeDefined()
      expect(typeof COPYRIGHT_YEAR).toBe('string')
      expect(Number.parseInt(COPYRIGHT_YEAR)).toBeGreaterThan(2024)
    })

    it('should export COPYRIGHT_OWNER', () => {
      expect(COPYRIGHT_OWNER).toBe('Impalah')
    })

    it('should export REPOSITORY_URL', () => {
      expect(REPOSITORY_URL).toBe('https://github.com/impalah/apuntador')
      expect(REPOSITORY_URL).toContain('github.com')
    })

    it('should export COPYRIGHT_TEXT with correct format', () => {
      expect(COPYRIGHT_TEXT).toContain(COPYRIGHT_YEAR)
      expect(COPYRIGHT_TEXT).toContain(COPYRIGHT_OWNER)
      expect(COPYRIGHT_TEXT).toContain(REPOSITORY_URL)
      expect(COPYRIGHT_TEXT).toMatch(/\(c\) \d{4} by .+ \(https?:\/\/.+\)/)
    })
  })

  describe('getVersionInfo', () => {
    it('should return version info object', () => {
      const info = getVersionInfo()

      expect(info).toHaveProperty('name')
      expect(info).toHaveProperty('version')
      expect(info).toHaveProperty('copyright')
      expect(info).toHaveProperty('repositoryUrl')
    })

    it('should return correct name', () => {
      const info = getVersionInfo()
      expect(info.name).toBe(APP_NAME)
    })

    it('should return correct version', () => {
      const info = getVersionInfo()
      expect(info.version).toBe(APP_VERSION)
    })

    it('should return correct copyright', () => {
      const info = getVersionInfo()
      expect(info.copyright).toBe(COPYRIGHT_TEXT)
    })

    it('should return correct repository URL', () => {
      const info = getVersionInfo()
      expect(info.repositoryUrl).toBe(REPOSITORY_URL)
    })
  })
})
