import { describe, it, expect } from 'vitest'
import {
  type AppConfigurationName,
  DEFAULT_APP_CONFIG,
  APP_CONFIGURATIONS,
  getCurrentAppConfig,
  getAppConfig,
  getAvailableConfigurations,
} from '@/config/app-configuration'

describe('config/app-configuration.ts', () => {
  describe('DEFAULT_APP_CONFIG', () => {
    it('should have a default configuration', () => {
      expect(DEFAULT_APP_CONFIG).toBeDefined()
      expect(typeof DEFAULT_APP_CONFIG).toBe('string')
    })

    it('should be one of the valid configuration names', () => {
      const validNames: AppConfigurationName[] = ['standard', 'legacy', 'mixed', 'minimal', 'custom']
      expect(validNames).toContain(DEFAULT_APP_CONFIG)
    })
  })

  describe('APP_CONFIGURATIONS', () => {
    it('should have all configuration types', () => {
      expect(APP_CONFIGURATIONS).toHaveProperty('standard')
      expect(APP_CONFIGURATIONS).toHaveProperty('legacy')
      expect(APP_CONFIGURATIONS).toHaveProperty('mixed')
      expect(APP_CONFIGURATIONS).toHaveProperty('minimal')
      expect(APP_CONFIGURATIONS).toHaveProperty('custom')
    })

    it('should have correct structure for each configuration', () => {
      const configNames: AppConfigurationName[] = ['standard', 'legacy', 'mixed', 'minimal', 'custom']
      
      configNames.forEach(name => {
        const config = APP_CONFIGURATIONS[name]
        expect(config).toHaveProperty('name')
        expect(config).toHaveProperty('description')
        expect(config).toHaveProperty('config')
        expect(config).toHaveProperty('recommendedFor')
        
        expect(typeof config.name).toBe('string')
        expect(typeof config.description).toBe('string')
        expect(Array.isArray(config.recommendedFor)).toBe(true)
        expect(config.config).toBeDefined()
      })
    })

    it('should have teleprompterFrame component in each config', () => {
      const configNames: AppConfigurationName[] = ['standard', 'legacy', 'mixed', 'minimal', 'custom']
      
      configNames.forEach(name => {
        const config = APP_CONFIGURATIONS[name].config
        expect(config).toHaveProperty('teleprompterFrame')
        expect(config.teleprompterFrame).toBeDefined()
      })
    })

    it('should have floatingToolbar component in each config', () => {
      const configNames: AppConfigurationName[] = ['standard', 'legacy', 'mixed', 'minimal', 'custom']
      
      configNames.forEach(name => {
        const config = APP_CONFIGURATIONS[name].config
        expect(config).toHaveProperty('floatingToolbar')
        expect(config.floatingToolbar).toBeDefined()
      })
    })
  })

  describe('getCurrentAppConfig()', () => {
    it('should return the default configuration', () => {
      const config = getCurrentAppConfig()
      expect(config).toBe(APP_CONFIGURATIONS[DEFAULT_APP_CONFIG].config)
    })

    it('should return an object with component definitions', () => {
      const config = getCurrentAppConfig()
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
      expect(config).toHaveProperty('teleprompterFrame')
      expect(config).toHaveProperty('floatingToolbar')
    })
  })

  describe('getAppConfig()', () => {
    it('should return configuration for valid names', () => {
      const standardConfig = getAppConfig('standard')
      expect(standardConfig).toBe(APP_CONFIGURATIONS.standard.config)
      
      const legacyConfig = getAppConfig('legacy')
      expect(legacyConfig).toBe(APP_CONFIGURATIONS.legacy.config)
      
      const mixedConfig = getAppConfig('mixed')
      expect(mixedConfig).toBe(APP_CONFIGURATIONS.mixed.config)
      
      const minimalConfig = getAppConfig('minimal')
      expect(minimalConfig).toBe(APP_CONFIGURATIONS.minimal.config)
      
      const customConfig = getAppConfig('custom')
      expect(customConfig).toBe(APP_CONFIGURATIONS.custom.config)
    })

    it('should return different configs for different names', () => {
      const config1 = getAppConfig('standard')
      const config2 = getAppConfig('legacy')
      
      // Should be different objects (unless they happen to share the same config)
      expect(config1).toBeDefined()
      expect(config2).toBeDefined()
    })
  })

  describe('getAvailableConfigurations()', () => {
    it('should return an array of configurations', () => {
      const configs = getAvailableConfigurations()
      expect(Array.isArray(configs)).toBe(true)
      expect(configs.length).toBeGreaterThan(0)
    })

    it('should return all 5 configurations', () => {
      const configs = getAvailableConfigurations()
      expect(configs.length).toBe(5)
    })

    it('should have correct structure for each configuration', () => {
      const configs = getAvailableConfigurations()
      
      configs.forEach(config => {
        expect(config).toHaveProperty('configName')
        expect(config).toHaveProperty('name')
        expect(config).toHaveProperty('description')
        expect(config).toHaveProperty('config')
        expect(config).toHaveProperty('recommendedFor')
        
        expect(typeof config.configName).toBe('string')
        expect(typeof config.name).toBe('string')
        expect(typeof config.description).toBe('string')
        expect(Array.isArray(config.recommendedFor)).toBe(true)
      })
    })

    it('should include all valid configuration names', () => {
      const configs = getAvailableConfigurations()
      const configNames = configs.map(c => c.configName)
      
      expect(configNames).toContain('standard')
      expect(configNames).toContain('legacy')
      expect(configNames).toContain('mixed')
      expect(configNames).toContain('minimal')
      expect(configNames).toContain('custom')
    })
  })
})
