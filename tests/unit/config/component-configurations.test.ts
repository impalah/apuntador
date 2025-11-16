/**
 * Tests for Component Configurations
 */

import { describe, it, expect } from 'vitest'
import {
  decoupledTeleprompterFrame,
  originalFloatingToolbar,
  decoupledFloatingToolbar,
  standardHighlightBand,
  originalComponentConfig,
  decoupledComponentConfig,
  mixedComponentConfig,
  minimalTeleprompterFrame,
} from '@/config/component-configurations'

describe('component-configurations', () => {
  describe('Component Definitions', () => {
    it('should export decoupled teleprompter frame configuration', () => {
      expect(decoupledTeleprompterFrame).toBeDefined()
      expect(decoupledTeleprompterFrame.name).toBe('TeleprompterFrameV2')
      expect(decoupledTeleprompterFrame.version).toBe('2.0.0')
      expect(decoupledTeleprompterFrame.component).toBeDefined()
    })

    it('should export original floating toolbar configuration', () => {
      expect(originalFloatingToolbar).toBeDefined()
      expect(originalFloatingToolbar.name).toBe('FloatingToolbar')
      expect(originalFloatingToolbar.version).toBe('1.0.0')
      expect(originalFloatingToolbar.component).toBeDefined()
    })

    it('should export decoupled floating toolbar configuration', () => {
      expect(decoupledFloatingToolbar).toBeDefined()
      expect(decoupledFloatingToolbar.name).toBe('FloatingToolbar')
      expect(decoupledFloatingToolbar.version).toBe('2.0.0')
      expect(decoupledFloatingToolbar.component).toBeDefined()
    })

    it('should export standard highlight band configuration', () => {
      expect(standardHighlightBand).toBeDefined()
      expect(standardHighlightBand.name).toBe('HighlightBandHandle')
      expect(standardHighlightBand.version).toBe('1.0.0')
      expect(standardHighlightBand.component).toBeDefined()
    })

    it('should export minimal teleprompter frame configuration', () => {
      expect(minimalTeleprompterFrame).toBeDefined()
      expect(minimalTeleprompterFrame.name).toBe('MinimalTeleprompterFrame')
      expect(minimalTeleprompterFrame.version).toBe('1.0.0')
      expect(minimalTeleprompterFrame.component).toBeDefined()
    })
  })

  describe('Pre-configured Component Sets', () => {
    it('should export original component config with all required components', () => {
      expect(originalComponentConfig).toBeDefined()
      expect(originalComponentConfig.teleprompterFrame).toBeDefined()
      expect(originalComponentConfig.floatingToolbar).toBeDefined()
      expect(originalComponentConfig.highlightBand).toBeDefined()
    })

    it('should use decoupled frame and original toolbar in original config', () => {
      expect(originalComponentConfig.teleprompterFrame).toBe(decoupledTeleprompterFrame)
      expect(originalComponentConfig.floatingToolbar).toBe(originalFloatingToolbar)
      expect(originalComponentConfig.highlightBand).toBe(standardHighlightBand)
    })

    it('should export decoupled component config with all required components', () => {
      expect(decoupledComponentConfig).toBeDefined()
      expect(decoupledComponentConfig.teleprompterFrame).toBeDefined()
      expect(decoupledComponentConfig.floatingToolbar).toBeDefined()
      expect(decoupledComponentConfig.highlightBand).toBeDefined()
    })

    it('should use all decoupled components in decoupled config', () => {
      expect(decoupledComponentConfig.teleprompterFrame).toBe(decoupledTeleprompterFrame)
      expect(decoupledComponentConfig.floatingToolbar).toBe(decoupledFloatingToolbar)
      expect(decoupledComponentConfig.highlightBand).toBe(standardHighlightBand)
    })

    it('should export mixed component config', () => {
      expect(mixedComponentConfig).toBeDefined()
      expect(mixedComponentConfig.teleprompterFrame).toBeDefined()
      expect(mixedComponentConfig.floatingToolbar).toBeDefined()
      expect(mixedComponentConfig.highlightBand).toBeDefined()
    })

    it('should mix decoupled frame with original toolbar in mixed config', () => {
      expect(mixedComponentConfig.teleprompterFrame).toBe(decoupledTeleprompterFrame)
      expect(mixedComponentConfig.floatingToolbar).toBe(originalFloatingToolbar)
      expect(mixedComponentConfig.highlightBand).toBe(standardHighlightBand)
    })
  })

  describe('Component Metadata', () => {
    it('should have valid version strings', () => {
      expect(decoupledTeleprompterFrame.version).toMatch(/^\d+\.\d+\.\d+$/)
      expect(originalFloatingToolbar.version).toMatch(/^\d+\.\d+\.\d+$/)
      expect(decoupledFloatingToolbar.version).toMatch(/^\d+\.\d+\.\d+$/)
      expect(standardHighlightBand.version).toMatch(/^\d+\.\d+\.\d+$/)
    })

    it('should have non-empty descriptions', () => {
      expect(decoupledTeleprompterFrame.description).toBeTruthy()
      expect(originalFloatingToolbar.description).toBeTruthy()
      expect(decoupledFloatingToolbar.description).toBeTruthy()
      expect(standardHighlightBand.description).toBeTruthy()
    })
  })
})
