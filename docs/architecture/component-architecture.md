# Component Architecture Documentation

## Overview

The new Apuntador component architecture allows for complete swapping of main components (`TeleprompterFrame`, `FloatingToolbar`, `HighlightBand`) without affecting application functionality. This is achieved through:

1. **Well-defined interfaces** for inter-component communication
2. **Abstract services** that separate business logic from presentation logic
3. **Coordinating composables** that handle component communication
4. **Interchangeable configurations** that allow creating completely new applications

## Architecture Structure

```
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ │
│  │ TeleprompterPage │ │ Component       │ │ Component   │ │
│  │                 │ │ Coordinators    │ │ Config      │ │
│  └─────────────────┘ └─────────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                  Component Layer                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ │
│  │ TeleprompterFrame│ │ FloatingToolbar │ │ HighlightBand│ │
│  │ (Swappable)     │ │ (Swappable)     │ │ (Swappable) │ │
│  └─────────────────┘ └─────────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                   Service Layer                         │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ │
│  │ ScrollService   │ │ ContentService  │ │ PrefsService │ │
│  │                 │ │                 │ │             │ │
│  └─────────────────┘ └─────────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    State Layer                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐ │
│  │ Teleprompter    │ │ Preferences     │ │ Persistence │ │
│  │ Store (Pinia)   │ │ Store (Pinia)   │ │ Utils       │ │
│  └─────────────────┘ └─────────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Main Components

### 1. TeleprompterFrame

**Responsibility**: Display scrollable content with mirror transformations and highlight band.

**Interfaces**:

```typescript
interface TeleprompterFrameProps {
  content: TeleprompterContent
  scrollState: ScrollState
  displayPrefs: DisplayPreferences
  highlightBand: HighlightBandConfig
}

interface TeleprompterEvents {
  'content-height-changed': [height: number]
  'viewport-height-changed': [height: number]
  tap: []
  'swipe-up': []
  'swipe-down': []
  'press-hold': []
}
```

**Available implementations**:

- `TeleprompterFrame.vue` - Original implementation with direct store access
- `TeleprompterFrameV2.vue` - Decoupled implementation using pure props/events

### 2. FloatingToolbar

**Responsibility**: Provide user controls for playback, navigation, and configuration.

**Interfaces**:

```typescript
interface FloatingToolbarProps {
  scrollState: ScrollState
  speedConfig: SpeedConfig
  displayPrefs: DisplayPreferences
  isVisible: boolean
  isMinimal?: boolean
}

interface ToolbarEvents {
  play: []
  pause: []
  'toggle-play': []
  'step-lines': [count: number]
  'go-home': []
  'go-end': []
  'speed-change': [speed: number]
  'font-size-change': [size: number]
  'mirror-toggle': ['h' | 'v']
  'open-editor': []
  'open-settings': []
  'open-file': []
}
```

**Available implementations**:

- `FloatingToolbar.vue` - Original implementation
- `FloatingToolbarV2.vue` - Decoupled implementation
- `CompactFloatingToolbar` - Minimalist implementation (example)

### 3. HighlightBand

**Responsibility**: Handle highlight band position and configuration.

**Interfaces**:

```typescript
interface HighlightBandProps {
  config: HighlightBandConfig
  viewportHeight: number
  lineHeight: number
}

interface HighlightBandEvents {
  'position-change': [positionPct: number]
  'config-change': [config: Partial<HighlightBandConfig>]
}
```

## Abstract Services

### ScrollService

Handles scroll state and playback without exposing internal implementation.

```typescript
interface IScrollService {
  play(): void
  pause(): void
  toggle(): void
  stepLines(count: number): void
  goToHome(): void
  goToEnd(): void
  setOffset(offset: number): void
  getState(): ScrollState
  onStateChange(callback: (state: ScrollState) => void): () => void
}
```

### ContentService

Manages markdown content and its compilation.

```typescript
interface IContentService {
  setContent(raw: string): Promise<void>
  getContent(): TeleprompterContent
  compileMarkdown(raw: string): Promise<string>
  onContentChange(callback: (content: TeleprompterContent) => void): () => void
}
```

### PreferencesService

Manages display preferences and configuration.

```typescript
interface IPreferencesService {
  getDisplayPrefs(): DisplayPreferences
  getSpeedConfig(): SpeedConfig
  getHighlightBandConfig(): HighlightBandConfig
  updateDisplayPrefs(prefs: Partial<DisplayPreferences>): Promise<void>
  updateSpeedConfig(config: Partial<SpeedConfig>): Promise<void>
  updateHighlightBandConfig(config: Partial<HighlightBandConfig>): Promise<void>
  onPrefsChange(callback: (prefs: DisplayPreferences) => void): () => void
}
```

## Component Coordinators

Coordinating composables allow components to work together without directly knowing each other:

```typescript
const coordinator = useAppCoordinator()
const { teleprompterFrame, floatingToolbar, highlightBand } = coordinator

// Components communicate through the coordinator
coordinator.handlePlay() // Affects both teleprompter and toolbar
coordinator.handleTap() // Can show/hide toolbar based on state
```

## Interchangeable Configurations

```typescript
// Original configuration
const originalConfig: AppComponentConfig = {
  teleprompterFrame: originalTeleprompterFrame,
  floatingToolbar: originalFloatingToolbar,
  highlightBand: standardHighlightBand,
}

// New decoupled configuration
const decoupledConfig: AppComponentConfig = {
  teleprompterFrame: decoupledTeleprompterFrame,
  floatingToolbar: decoupledFloatingToolbar,
  highlightBand: standardHighlightBand,
}

// Custom configuration for minimalist application
const minimalConfig: AppComponentConfig = {
  teleprompterFrame: minimalTeleprompterFrame,
  floatingToolbar: compactFloatingToolbar,
  highlightBand: standardHighlightBand,
}
```

## Use Cases

### 1. Standard Application

Uses the complete decoupled configuration:

```vue
<template>
  <TeleprompterFrameV2
    :content="props.content"
    :scroll-state="props.scrollState"
    :display-prefs="props.displayPrefs"
    :highlight-band="props.highlightBand"
    @tap="coordinator.handleTap"
  />

  <FloatingToolbarV2
    :scroll-state="props.scrollState"
    :speed-config="props.speedConfig"
    :display-prefs="props.displayPrefs"
    @toggle-play="coordinator.handlePlay"
  />
</template>
```

### 2. Embedded/Minimalist Application

Uses simplified components:

```vue
<template>
  <MinimalTeleprompterFrame :content="props.content" @tap="handleTap" />

  <CompactFloatingToolbar :scroll-state="props.scrollState" @toggle-play="handlePlay" />
</template>
```

### 3. Desktop Application

Uses components with full functionality:

```vue
<template>
  <TeleprompterFrameV2
    :content="props.content"
    :scroll-state="props.scrollState"
    :display-prefs="props.displayPrefs"
    :highlight-band="props.highlightBand"
  />

  <FullDesktopToolbar
    :scroll-state="props.scrollState"
    :speed-config="props.speedConfig"
    :display-prefs="props.displayPrefs"
    :is-minimal="false"
  />
</template>
```

### 4. Gradual Migration

Mixes original and new components:

```vue
<template>
  <!-- New decoupled component -->
  <TeleprompterFrameV2 />

  <!-- Original component during migration -->
  <FloatingToolbar />
</template>
```

## Architecture Benefits

### 1. **Complete Interchangeability**

- You can change any component without affecting the rest
- Allows creating completely different applications with the same base
- Facilitates A/B testing of different UIs

### 2. **Separation of Concerns**

- Business logic separated from presentation logic
- Components focus only on UI
- Services handle state and persistence

### 3. **Improved Testability**

- Components can be tested in isolation
- Services can be easily mocked
- Clear interfaces facilitate integration testing

### 4. **Maintainability**

- Changes in one component don't affect others
- More modular and organized code
- Easier to debug specific problems

### 5. **Development Flexibility**

- Teams can work on components independently
- Allows experimentation without breaking existing functionality
- Facilitates community contributions

## Migration from Previous Architecture

### Step 1: Implement Services

```typescript
// Wrap existing stores with services
const scrollService = createScrollService()
const contentService = createContentService()
const preferencesService = createPreferencesService()
```

### Step 2: Create Decoupled Components

```typescript
// New component that uses pure props/events
const TeleprompterFrameV2 = defineComponent({
  props: ['content', 'scrollState', 'displayPrefs'],
  emits: ['tap', 'swipe-up', 'swipe-down'],
  // ...
})
```

### Step 3: Implement Coordinators

```typescript
// Coordinator that connects services with components
const coordinator = useAppCoordinator()
```

### Step 4: Interchangeable Configuration

```typescript
// Configure which implementations to use
const config = decoupledComponentConfig
```

## Future Extensions

### 1. Plugin System

- Load components dynamically
- Register components at runtime
- Dependency system

### 2. Component Themes

- Different styles for the same components
- Theme configuration per application
- Support for dark/light mode

### 3. Remote Components

- Load components from URLs
- Component versioning
- Hot updates

### 4. Application Builder

- Visual interface to configure applications
- Presets for different use cases
- Configuration exports

## Conclusion

The new component architecture provides the necessary flexibility to create multiple applications from Apuntador, maintaining core functionality while allowing completely different UIs. The clear separation of responsibilities and well-defined interfaces facilitate both maintenance and system extension.
