import { describe, it, expect } from 'vitest'
import {
  DEFAULT_HOTKEYS,
  createDefaultMapping,
  DEFAULT_GAMEPAD_MAPPINGS,
  createDefaultGamepadMapping,
  updateDescriptionsInMapping,
  updateDescriptionsInGamepadMapping,
  HotkeyManager,
} from '@/utils/hotkeys'

describe('hotkeys utils', () => {
  describe('DEFAULT_HOTKEYS', () => {
    it('should be an array of hotkey definitions', () => {
      expect(DEFAULT_HOTKEYS).toBeInstanceOf(Array)
      expect(DEFAULT_HOTKEYS.length).toBeGreaterThan(0)
    })

    it('should have toggle-play hotkey for Space', () => {
      const spaceHotkey = DEFAULT_HOTKEYS.find((h: any) => h.key === ' ')
      expect(spaceHotkey).toBeDefined()
      expect(spaceHotkey?.action).toBe('toggle-play')
    })

    it('should have step hotkeys for Arrow keys', () => {
      const upHotkey = DEFAULT_HOTKEYS.find((h: any) => h.key === 'ArrowUp')
      const downHotkey = DEFAULT_HOTKEYS.find((h: any) => h.key === 'ArrowDown')
      
      expect(upHotkey).toBeDefined()
      expect(downHotkey).toBeDefined()
    })
  })

  describe('createDefaultMapping', () => {
    it('should create a mapping object', () => {
      const mapping = createDefaultMapping()
      
      expect(mapping).toBeTypeOf('object')
      expect(mapping).toHaveProperty('toggle-play')
      expect(mapping).toHaveProperty('step-up')
      expect(mapping).toHaveProperty('step-down')
    })

    it('should have descriptions for all actions', () => {
      const mapping = createDefaultMapping()
      
      const keys = Object.keys(mapping)
      expect(keys.length).toBeGreaterThan(0)
      
      keys.forEach(key => {
        expect(mapping[key as keyof typeof mapping]).toHaveProperty('description')
      })
    })
  })

  describe('DEFAULT_GAMEPAD_MAPPINGS', () => {
    it('should be an array of gamepad mappings', () => {
      expect(DEFAULT_GAMEPAD_MAPPINGS).toBeInstanceOf(Array)
      expect(DEFAULT_GAMEPAD_MAPPINGS.length).toBeGreaterThan(0)
    })

    it('should have button 0 mapped to toggle-play', () => {
      const toggleMapping = DEFAULT_GAMEPAD_MAPPINGS.find((m: any) => m.action === 'toggle-play')
      expect(toggleMapping).toBeDefined()
    })
  })

  describe('createDefaultGamepadMapping', () => {
    it('should create a gamepad mapping object', () => {
      const mapping = createDefaultGamepadMapping()
      
      expect(mapping).toBeTypeOf('object')
      expect(Object.keys(mapping).length).toBeGreaterThan(0)
    })

    it('should have action keys', () => {
      const mapping = createDefaultGamepadMapping()
      
      expect(mapping).toHaveProperty('toggle-play')
      expect(mapping['toggle-play']).toHaveProperty('description')
    })
  })

  describe('updateDescriptionsInMapping', () => {
    it('should update descriptions in mapping', () => {
      const original = createDefaultMapping()
      const updated = updateDescriptionsInMapping(original)
      
      expect(updated).toBeTypeOf('object')
      expect(Object.keys(updated).length).toBe(Object.keys(original).length)
    })

    it('should preserve action assignments', () => {
      const original = createDefaultMapping()
      const updated = updateDescriptionsInMapping(original)
      
      expect(updated['toggle-play']?.action).toBe('toggle-play')
    })
  })

  describe('updateDescriptionsInGamepadMapping', () => {
    it('should update descriptions in gamepad mapping', () => {
      const original = createDefaultGamepadMapping()
      const updated = updateDescriptionsInGamepadMapping(original)
      
      expect(updated).toBeTypeOf('object')
      expect(Object.keys(updated).length).toBe(Object.keys(original).length)
    })
  })

  describe('HotkeyManager', () => {
    it('should create instance', () => {
      const manager = new HotkeyManager()
      
      expect(manager).toBeDefined()
      expect(manager).toBeInstanceOf(HotkeyManager)
    })

    it('should have register method', () => {
      const manager = new HotkeyManager()
      
      expect(manager.register).toBeTypeOf('function')
    })

    it('should have unregister method', () => {
      const manager = new HotkeyManager()
      
      expect(manager.unregister).toBeTypeOf('function')
    })
  })
})

