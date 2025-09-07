# Component Configuration Guide - Apuntador

This guide explains how to use the component configuration system to create different variations of the application.

## Where do I define which configuration to use?

### Option 1: Default Configuration (Recommended for Production)

Edit the file `src/config/app-configuration.ts`:

```typescript
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'mixed' // Change here
```

### Option 2: Runtime Configuration (For development/testing)

Use the `RuntimeConfigManager` in any component:

```typescript
import { RuntimeConfigManager } from '@/config/app-configuration'

// Change configuration dynamically
RuntimeConfigManager.setConfiguration('standard')

// Get current configuration
const currentConfig = RuntimeConfigManager.getCurrentConfiguration()
```

### Option 3: Environment Variables

Define `VITE_COMPONENT_CONFIG` in your `.env` file:

```
VITE_COMPONENT_CONFIG=mixed
```

## Available Configurations

### 🔵 'standard' - Modern Components (Recommended)

- **TeleprompterFrameV2**: Completely decoupled
- **FloatingToolbarV2**: No store dependencies
- **HighlightBandV2**: Purely reactive
- **Usage**: New applications, maximum performance

```typescript
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'standard'
```

### 🟡 'legacy' - Original Components

- **TeleprompterFrame**: Original version
- **FloatingToolbar**: Direct store access
- **HighlightBand**: Original implementation
- **Usage**: Compatibility with existing code

```typescript
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'legacy'
```

### 🟣 'mixed' - Gradual Migration

- **TeleprompterFrameV2**: New frame
- **FloatingToolbar**: Original toolbar
- **HighlightBand**: Original band
- **Usage**: Step-by-step migration

```typescript
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'mixed'
```

### 🟢 'minimal' - Compact UI

- **TeleprompterFrameV2**: Modern frame
- **FloatingToolbarMinimal**: Reduced toolbar
- **HighlightBandV2**: Modern band
- **Usage**: Embedded applications, tablets

```typescript
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'minimal'
```

### ⚪ 'custom' - Custom Configuration

- Define your own component combination
- Edit `COMPONENT_CONFIGURATIONS.custom` in `component-configurations.ts`

## Usage Examples

### Case 1: Production Application with Fixed Configuration

```vue
<!-- src/pages/TeleprompterPage.vue -->
<template>
  <div class="teleprompter-page">
    <!-- Components are loaded according to DEFAULT_APP_CONFIG -->
    <component :is="config.teleprompterFrame.component" v-bind="teleprompterProps" @tap="onTap" />

    <component :is="config.floatingToolbar.component" v-bind="toolbarProps" @play="onPlay" />
  </div>
</template>

<script setup lang="ts">
import { getCurrentAppConfig } from '@/config/app-configuration'

const config = getCurrentAppConfig() // Uses DEFAULT_APP_CONFIG
</script>
```

### Case 2: Application with Configuration Selector

```vue
<!-- src/pages/TeleprompterPageConfigurable.vue -->
<template>
  <div>
    <!-- Configuration selector -->
    <v-radio-group v-model="selectedConfig" @update:model-value="onConfigChange">
      <v-radio label="Standard" value="standard" />
      <v-radio label="Legacy" value="legacy" />
      <v-radio label="Mixed" value="mixed" />
      <v-radio label="Minimal" value="minimal" />
    </v-radio-group>

    <!-- Dynamic components -->
    <component :is="config.teleprompterFrame.component" />
    <component :is="config.floatingToolbar.component" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RuntimeConfigManager } from '@/config/app-configuration'

const selectedConfig = ref('mixed')

function onConfigChange(newConfig: string) {
  RuntimeConfigManager.setConfiguration(newConfig)
  config.value = RuntimeConfigManager.getCurrentConfiguration()
}
</script>
```

### Case 3: Configuration by Environment Variables

```bash
# .env.development
VITE_COMPONENT_CONFIG=standard

# .env.production
VITE_COMPONENT_CONFIG=legacy

# .env.staging
VITE_COMPONENT_CONFIG=mixed
```

## Advanced Configuration

### Create Your Own Configuration

1. Edit `src/config/component-configurations.ts`:

```typescript
export const COMPONENT_CONFIGURATIONS = {
  // ... existing configurations

  'my-config': {
    teleprompterFrame: {
      component: defineAsyncComponent(() => import('@/components/MyTeleprompterFrame.vue')),
      name: 'MyTeleprompterFrame',
      version: '1.0.0',
      description: 'My custom implementation',
    },
    floatingToolbar: COMPONENTS.floatingToolbarV2,
    highlightBand: COMPONENTS.highlightBandV2,
  },
} as const
```

2. Update the type in `app-configuration.ts`:

```typescript
export type AppConfigurationName =
  | 'standard'
  | 'legacy'
  | 'mixed'
  | 'minimal'
  | 'custom'
  | 'my-config' // Add here
```

3. Use it:

```typescript
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'my-config'
```

## Best Practices

### ✅ Do

- Use 'standard' for new applications
- Use 'mixed' to migrate gradually
- Define DEFAULT_APP_CONFIG in production
- Use RuntimeConfigManager only for development/testing

### ❌ Avoid

- Changing configurations frequently in production
- Mixing original and V2 components without planning
- Using dynamic configurations in critical applications

## Recommended Workflows

### For New Applications

```typescript
// app-configuration.ts
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'standard'
```

### To Migrate Existing Application

```typescript
// Phase 1: Full compatibility
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'legacy'

// Phase 2: Gradual migration
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'mixed'

// Phase 3: Complete modernization
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'standard'
```

### For Embedded Applications

```typescript
// For tablets, kiosks, etc.
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'minimal'
```

## Troubleshooting

### ❓ "Components don't change when I change the configuration"

- Make sure to restart the development server
- Verify that you use `getCurrentAppConfig()` correctly
- Check the developer console for errors

### ❓ "TypeScript error with new configurations"

- Update the `AppConfigurationName` type in `app-configuration.ts`
- Verify that all components are correctly imported

### ❓ "Tests fail with new configurations"

- Mock `getCurrentAppConfig()` in your tests
- Use known configurations in the testing environment

---

With this guide you can now change component configuration according to your needs!
