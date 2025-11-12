/**
 * Tests for Platform Detection
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { isTauri, isCapacitor, isWeb, getPlatform } from '@/utils/platform'

describe('platform detection', () => {
  beforeEach(() => {
    // Reset window globals
    // @ts-ignore
    delete window.__TAURI__
    // @ts-ignore
    delete window.Capacitor
  })

  describe('isTauri', () => {
    it('should return false when __TAURI__ is not defined', () => {
      expect(isTauri()).toBe(false)
    })

    it('should return true when __TAURI__ is defined', () => {
      // @ts-ignore
      window.__TAURI__ = {}
      expect(isTauri()).toBe(true)
    })
  })

  describe('isCapacitor', () => {
    it('should return false when Capacitor is not defined', () => {
      expect(isCapacitor()).toBe(false)
    })

    it('should return true when Capacitor is defined', () => {
      // @ts-ignore
      window.Capacitor = {}
      expect(isCapacitor()).toBe(true)
    })
  })

  describe('isWeb', () => {
    it('should return true when neither Tauri nor Capacitor is defined', () => {
      expect(isWeb()).toBe(true)
    })

    it('should return false when Tauri is defined', () => {
      // @ts-ignore
      window.__TAURI__ = {}
      expect(isWeb()).toBe(false)
    })

    it('should return false when Capacitor is defined', () => {
      // @ts-ignore
      window.Capacitor = {}
      expect(isWeb()).toBe(false)
    })
  })

  describe('getPlatform', () => {
    it('should return web when neither Tauri nor Capacitor is defined', () => {
      expect(getPlatform()).toBe('web')
    })

    it('should return tauri when __TAURI__ is defined', () => {
      // @ts-ignore
      window.__TAURI__ = {}
      expect(getPlatform()).toBe('tauri')
    })

    it('should return capacitor when Capacitor is defined', () => {
      // @ts-ignore
      window.Capacitor = {}
      expect(getPlatform()).toBe('capacitor')
    })

    it('should prioritize Tauri over Capacitor', () => {
      // @ts-ignore
      window.__TAURI__ = {}
      // @ts-ignore
      window.Capacitor = {}
      expect(getPlatform()).toBe('tauri')
    })
  })
})
