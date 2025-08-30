# 🔧 How to Change Component Configuration

## Quick Answer

To change which configuration to use (for example 'mixed'), edit **ONE SINGLE LINE** in this file:

📁 `src/config/app-configuration.ts`

```typescript
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'mixed' // 👈 CHANGE HERE
```

## Available Options

Simply replace `'mixed'` with one of these options:

```typescript
// Modern components (recommended for new apps)
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'standard'

// Original components (compatibility)
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'legacy'

// Gradual migration (combination of both)
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'mixed'

// Compact UI (for tablets/kiosks)
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'minimal'

// Your custom configuration
export const DEFAULT_APP_CONFIG: AppConfigurationName = 'custom'
```

## That's it!

Save the file and reload the application. The components will change automatically.

## Need more details?

Read the complete guide: [`docs/COMPONENT_CONFIGURATION_GUIDE.md`](./COMPONENT_CONFIGURATION_GUIDE.md)
