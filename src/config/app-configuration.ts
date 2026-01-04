/**
 * Application Configuration
 *
 * This is where you configure which component implementations
 * your application should use by default.
 */

import type { AppComponentConfig } from '@/types/component-interfaces'
import {
  originalComponentConfig,
  decoupledComponentConfig,
  mixedComponentConfig,
  usageExamples,
  ComponentFactory,
  compactFloatingToolbar,
  standardHighlightBand,
} from './component-configurations'

// ========================================
// Application Configuration Options
// ========================================

/**
 * Available application configurations
 *
 * Choose one of these or create your own custom configuration:
 *
 * - 'standard': Modern decoupled components (recommended)
 * - 'legacy': Original components for compatibility
 * - 'mixed': Combination for gradual migration
 * - 'minimal': Compact UI for embedded use cases
 * - 'custom': Your own component combination
 */
export type AppConfigurationName = 'standard' | 'legacy' | 'mixed' | 'minimal' | 'custom'

/**
 * Default application configuration
 *
 * CHANGE THIS TO SELECT YOUR PREFERRED CONFIGURATION
 */
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'mixed' // 👈 CHANGE HERE

/**
 * Configuration registry with descriptions
 */
export const APP_CONFIGURATIONS: Record<
  AppConfigurationName,
  {
    name: string
    description: string
    config: AppComponentConfig
    recommendedFor: string[]
  }
> = {
  standard: {
    name: 'Standard (Decoupled)',
    description: 'Modern decoupled components with full features and service abstractions',
    config: decoupledComponentConfig,
    recommendedFor: ['New applications', 'Modern development', 'Full features'],
  },

  legacy: {
    name: 'Legacy (Original)',
    description: 'Original components with direct store access for backward compatibility',
    config: originalComponentConfig,
    recommendedFor: ['Existing applications', 'Migration period', 'Compatibility'],
  },

  mixed: {
    name: 'Mixed (Migration)',
    description: 'Combination of old and new components for gradual migration',
    config: mixedComponentConfig,
    recommendedFor: ['Gradual migration', 'Testing new components', 'Hybrid approach'],
  },

  minimal: {
    name: 'Minimal UI',
    description: 'Compact interface with essential controls only',
    config: usageExamples.minimal.config,
    recommendedFor: ['Embedded applications', 'Mobile focus', 'Simple UI'],
  },

  custom: {
    name: 'Custom Configuration',
    description: 'Decoupled teleprompter with compact toolbar',
    config: ComponentFactory.createCustomConfiguration(
      decoupledComponentConfig.teleprompterFrame,
      compactFloatingToolbar,
      standardHighlightBand
    ),
    recommendedFor: ['Specialized use cases', 'Custom requirements', 'Specific workflows'],
  },
}

/**
 * Get the current application configuration
 */
export function getCurrentAppConfig(): AppComponentConfig {
  return APP_CONFIGURATIONS[DEFAULT_APP_CONFIG].config
}

/**
 * Get configuration by name
 */
export function getAppConfig(name: AppConfigurationName): AppComponentConfig {
  return APP_CONFIGURATIONS[name].config
}

/**
 * Get all available configurations
 */
export function getAvailableConfigurations() {
  return Object.entries(APP_CONFIGURATIONS).map(([key, value]) => ({
    configName: key as AppConfigurationName,
    ...value,
  }))
}

// ========================================
// Environment-specific configurations
// ========================================

/**
 * Get configuration based on environment
 *
 * You can use this to automatically select configurations
 * based on development, staging, or production environments.
 */
export function getConfigForEnvironment(): AppComponentConfig {
  const env = import.meta.env.MODE

  switch (env) {
    case 'development':
      // Use decoupled for development to test new features
      return APP_CONFIGURATIONS.standard.config

    case 'staging':
      // Use mixed for staging to test compatibility
      return APP_CONFIGURATIONS.mixed.config

    case 'production':
      // Use the configured default for production
      return getCurrentAppConfig()

    default:
      return getCurrentAppConfig()
  }
}

// ========================================
// Component-specific overrides
// ========================================

/**
 * Override specific components while keeping others from a base configuration
 *
 * Example: Use the standard configuration but with a compact toolbar
 */
export function createConfigWithOverrides(
  baseConfig: AppConfigurationName,
  overrides: Partial<AppComponentConfig>
): AppComponentConfig {
  const base = getAppConfig(baseConfig)

  return {
    teleprompterFrame: overrides.teleprompterFrame || base.teleprompterFrame,
    floatingToolbar: overrides.floatingToolbar || base.floatingToolbar,
    highlightBand: overrides.highlightBand || base.highlightBand,
  }
}

// ========================================
// Usage Examples
// ========================================

/**
 * Example: Create a configuration for mobile devices
 */
export const mobileConfig = createConfigWithOverrides('standard', {
  floatingToolbar: compactFloatingToolbar,
})

/**
 * Example: Create a configuration for presentation mode
 */
export const presentationConfig = createConfigWithOverrides('minimal', {
  teleprompterFrame: decoupledComponentConfig.teleprompterFrame,
})

/**
 * Example: Create a configuration for development/testing
 */
export const developmentConfig = createConfigWithOverrides('mixed', {
  // Keep mixed to test compatibility between old and new components
})

// ========================================
// Runtime Configuration
// ========================================

/**
 * Configuration that can be changed at runtime
 *
 * Use this in your main application to allow users to switch
 * between different UI configurations.
 */
export class RuntimeConfigManager {
  private currentConfig: AppConfigurationName = DEFAULT_APP_CONFIG
  private readonly listeners: ((config: AppComponentConfig) => void)[] = []

  getCurrentConfig(): AppComponentConfig {
    return getAppConfig(this.currentConfig)
  }

  getCurrentConfigName(): AppConfigurationName {
    return this.currentConfig
  }

  setConfig(name: AppConfigurationName): void {
    this.currentConfig = name
    const config = this.getCurrentConfig()
    this.listeners.forEach((listener) => listener(config))
  }

  onConfigChange(listener: (config: AppComponentConfig) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
}

// Export singleton instance
export const runtimeConfigManager = new RuntimeConfigManager()
