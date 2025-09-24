/**
 * Component Configuration Examples
 *
 * These examples show how different component implementations
 * can be configured and swapped easily using the new architecture.
 */

import type {
  AppComponentConfig,
  ITeleprompterFrameComponent,
  IFloatingToolbarComponent,
  IHighlightBandComponent,
} from '@/types/component-interfaces'

// Import component implementations
import TeleprompterFrameV2 from '@/components/TeleprompterFrameV2.vue'
import FloatingToolbar from '@/components/FloatingToolbar.vue'
import FloatingToolbarV2 from '@/components/FloatingToolbarV2.vue'
import HighlightBandHandle from '@/components/HighlightBandHandle.vue'

// ========================================
// Component Definitions
// ========================================

export const decoupledTeleprompterFrame: ITeleprompterFrameComponent = {
  name: 'TeleprompterFrameV2',
  version: '2.0.0',
  description: 'Decoupled teleprompter frame using service abstractions',
  props: {} as any,
  events: {} as any,
  component: TeleprompterFrameV2,
}

export const originalFloatingToolbar: IFloatingToolbarComponent = {
  name: 'FloatingToolbar',
  version: '1.0.0',
  description: 'Original floating toolbar with direct store access',
  props: {} as any,
  events: {} as any,
  component: FloatingToolbar,
}

export const decoupledFloatingToolbar: IFloatingToolbarComponent = {
  name: 'FloatingToolbarV2',
  version: '2.0.0',
  description: 'Decoupled floating toolbar using service abstractions',
  props: {} as any,
  events: {} as any,
  component: FloatingToolbarV2,
}

export const standardHighlightBand: IHighlightBandComponent = {
  name: 'HighlightBandHandle',
  version: '1.0.0',
  description: 'Standard highlight band implementation',
  props: {} as any,
  events: {} as any,
  component: HighlightBandHandle,
}

// ========================================
// Pre-configured Component Sets
// ========================================

export const originalComponentConfig: AppComponentConfig = {
  teleprompterFrame: decoupledTeleprompterFrame,
  floatingToolbar: originalFloatingToolbar,
  highlightBand: standardHighlightBand,
}

export const decoupledComponentConfig: AppComponentConfig = {
  teleprompterFrame: decoupledTeleprompterFrame,
  floatingToolbar: decoupledFloatingToolbar,
  highlightBand: standardHighlightBand,
}

// Mixed configuration (demonstrating interoperability)
export const mixedComponentConfig: AppComponentConfig = {
  teleprompterFrame: decoupledTeleprompterFrame,
  floatingToolbar: originalFloatingToolbar, // Using original toolbar
  highlightBand: standardHighlightBand,
}

// ========================================
// Custom Implementations (Examples)
// ========================================

// Example: Minimal Teleprompter Frame
export const minimalTeleprompterFrame: ITeleprompterFrameComponent = {
  name: 'MinimalTeleprompterFrame',
  version: '1.0.0',
  description: 'Minimal teleprompter with basic scrolling only',
  props: {} as any,
  events: {} as any,
  component: {
    name: 'MinimalTeleprompterFrame',
    template: `
      <div class="minimal-teleprompter" @click="$emit('tap')">
        <div class="content" v-html="content.html"></div>
      </div>
    `,
    props: ['content', 'scrollState', 'displayPrefs'],
    emits: ['tap'],
  },
}

// Example: Compact Toolbar
export const compactFloatingToolbar: IFloatingToolbarComponent = {
  name: 'CompactFloatingToolbar',
  version: '1.0.0',
  description: 'Ultra-compact toolbar with only essential controls',
  props: {} as any,
  events: {} as any,
  component: {
    name: 'CompactFloatingToolbar',
    template: `
      <div class="compact-toolbar">
        <button @click="$emit('toggle-play')">
          {{ scrollState.isPlaying ? '⏸' : '▶' }}
        </button>
        <button @click="$emit('open-settings')">⚙</button>
      </div>
    `,
    props: ['scrollState'],
    emits: ['toggle-play', 'open-settings'],
  },
}

// ========================================
// Component Factory
// ========================================

export class ComponentFactory {
  private static configurations = new Map<string, AppComponentConfig>([
    ['original', originalComponentConfig],
    ['decoupled', decoupledComponentConfig],
    ['mixed', mixedComponentConfig],
  ])

  static registerConfiguration(name: string, config: AppComponentConfig) {
    this.configurations.set(name, config)
  }

  static getConfiguration(name: string): AppComponentConfig | undefined {
    return this.configurations.get(name)
  }

  static listConfigurations(): string[] {
    return Array.from(this.configurations.keys())
  }

  static createCustomConfiguration(
    teleprompterFrame: ITeleprompterFrameComponent,
    floatingToolbar: IFloatingToolbarComponent,
    highlightBand: IHighlightBandComponent
  ): AppComponentConfig {
    return {
      teleprompterFrame,
      floatingToolbar,
      highlightBand,
    }
  }
}

// ========================================
// Configuration Validation
// ========================================

export function validateComponentConfig(config: AppComponentConfig): boolean {
  try {
    // Check that all required components are present
    if (!config.teleprompterFrame || !config.floatingToolbar || !config.highlightBand) {
      return false
    }

    // Check that components have required properties
    const requiredProps = ['name', 'version', 'description', 'component']

    return [config.teleprompterFrame, config.floatingToolbar, config.highlightBand].every(
      (component) => requiredProps.every((prop) => prop in component)
    )
  } catch (error) {
    console.error('Component configuration validation failed:', error)
    return false
  }
}

// ========================================
// Usage Examples
// ========================================

export const usageExamples = {
  // Basic usage with pre-configured sets
  basic: {
    config: decoupledComponentConfig,
    description: 'Standard decoupled components with service abstractions',
  },

  // Custom application with minimal UI
  minimal: {
    config: ComponentFactory.createCustomConfiguration(
      minimalTeleprompterFrame,
      compactFloatingToolbar,
      standardHighlightBand
    ),
    description: 'Minimal UI for embedded use cases',
  },

  // Legacy compatibility
  legacy: {
    config: originalComponentConfig,
    description: 'Original components for backward compatibility',
  },

  // Mixed for gradual migration
  migration: {
    config: mixedComponentConfig,
    description: 'Mixed components for gradual migration',
  },
}

// ========================================
// Dynamic Component Loading (Future)
// ========================================

export interface DynamicComponentLoader {
  loadComponent(
    name: string,
    version?: string
  ): Promise<ITeleprompterFrameComponent | IFloatingToolbarComponent | IHighlightBandComponent>
  registerComponent(component: any): void
  listAvailableComponents(): string[]
}

// This could be extended to support:
// - Loading components from URLs
// - Version management
// - Hot-swapping at runtime
// - Plugin systems

export const componentRegistry = {
  teleprompterFrames: new Map([
    ['decoupled', decoupledTeleprompterFrame],
    ['minimal', minimalTeleprompterFrame],
  ]),

  floatingToolbars: new Map([
    ['original', originalFloatingToolbar],
    ['decoupled', decoupledFloatingToolbar],
    ['compact', compactFloatingToolbar],
  ]),

  highlightBands: new Map([['standard', standardHighlightBand]]),
}
