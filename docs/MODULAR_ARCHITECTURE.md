# Module Implementation Guide - Apuntador

## Overview

Apuntador now uses a **modular architecture** that enables the development of independent and reusable components. This guide explains how to implement new modules following established patterns.

## ✅ Current Status

**Modular architecture is already active:**

- ✅ `TeleprompterFrameV2.vue` is now the default main component
- ✅ Store-to-Component adapter system implemented
- ✅ Coordination layer for inter-component communication
- ✅ TypeScript interfaces for component contracts
- ✅ Full compatibility with existing functionality maintained

## Modular Architecture

### 1. Modular Components (`src/components/`)

Modular components follow strict interfaces and are agnostic to global state:

```typescript
// Example: TeleprompterFrameV2.vue
interface TeleprompterFrameProps {
  content: TeleprompterContent
  scrollState: ScrollState
  displayPrefs: DisplayPreferences
  highlightBand: HighlightBandConfig
  mirrorSettings: MirrorSettings
  touchSettings: TouchSettings
}
```

### 2. Store-to-Component Adapters (`src/adapters/`)

Adapters convert Pinia state into component props:

```typescript
// src/adapters/storeToComponent.ts
export function useTeleprompterFrameProps() {
  const teleprompterStore = useTeleprompterStore()
  const prefsStore = usePrefsStore()

  return computed(() => ({
    content: {
      html: teleprompterStore.contentHtml,
      heightPx: teleprompterStore.contentHeightPx,
    },
    scrollState: {
      offset: teleprompterStore.scrollOffset,
      isPlaying: teleprompterStore.isPlaying,
    },
    // ... more props
  }))
}
```

### 3. Coordinators (`src/coordinators/`)

Coordinators handle inter-component communication and application logic:

```typescript
// src/coordinators/teleprompterCoordinator.ts
export function useAppCoordinator() {
  return {
    teleprompterFrameProps: useTeleprompterFrameProps(),
    teleprompterFrameHandlers: {
      onContentHeightChanged: (height: number) => {
        /* ... */
      },
      onTap: () => {
        /* ... */
      },
    },
    toolbarVisible: ref(true),
    // ... more handlers
  }
}
```

## How to Implement a New Module

### Step 1: Define Interfaces

```typescript
// src/types/modules/myModule.ts
export interface MyModuleProps {
  configuration: MyConfiguration
  data: MyData
  state: MyState
}

export interface MyModuleEvents {
  onActionExecuted: (result: any) => void
  onErrorOccurred: (error: Error) => void
}
```

### Step 2: Create Modular Component

```vue
<!-- src/components/MyModuleV2.vue -->
<template>
  <div class="my-module">
    <!-- Module implementation -->
  </div>
</template>

<script setup lang="ts">
import type { MyModuleProps, MyModuleEvents } from '@/types/modules/myModule'

// Module props (strict interface)
defineProps<MyModuleProps>()

// Module events
const emit = defineEmits<MyModuleEvents>()

// Module internal logic (no external dependencies)
</script>
```

### Step 3: Create Adapter

```typescript
// src/adapters/myModuleAdapter.ts
export function useMyModuleProps() {
  const myStore = useMyStore()
  const prefsStore = usePrefsStore()

  return computed(() => ({
    configuration: {
      option1: prefsStore.myOption1,
      option2: prefsStore.myOption2,
    },
    data: {
      elements: myStore.elements,
      filtered: myStore.filtered,
    },
    state: {
      loading: myStore.loading,
      error: myStore.error,
    },
  }))
}
```

### Step 4: Extend Coordinator

```typescript
// src/coordinators/teleprompterCoordinator.ts (extend)
export function useAppCoordinator() {
  // ... existing coordination

  // New module
  const myModuleProps = useMyModuleProps()
  const myModuleHandlers = {
    onActionExecuted: (result: any) => {
      // Handling logic
    },
    onErrorOccurred: (error: Error) => {
      console.error('Error in my module:', error)
    },
  }

  return {
    // ... existing handlers
    myModuleProps,
    myModuleHandlers,
  }
}
```

### Step 5: Integrate into Main Page

```vue
<!-- src/pages/TeleprompterPage.vue -->
<template>
  <div class="teleprompter-page">
    <!-- Existing components -->
    <TeleprompterFrameV2 v-bind="coordinator.teleprompterFrameProps.value" />

    <!-- New module -->
    <MyModuleV2
      v-bind="coordinator.myModuleProps.value"
      @action-executed="coordinator.myModuleHandlers.onActionExecuted"
      @error-occurred="coordinator.myModuleHandlers.onErrorOccurred"
    />
  </div>
</template>
```

## Modular Architecture Principles

### 1. **Separation of Concerns**

- **Components**: UI and presentation logic only
- **Adapters**: Store → Component data transformation
- **Coordinators**: Application logic and communication
- **Stores**: Global state and persistence

### 2. **Strict Interfaces**

- All modular components use typed props
- No direct store access from components
- Typed events for communication

### 3. **Testability**

- Completely isolated components
- Mockable props for testing
- Separate and testable coordination logic

### 4. **Reusability**

- Context-agnostic components
- Reusable adapters across pages
- Modular coordinators

## Examples of Future Modules

### Notes Module

```typescript
interface NotesModuleProps {
  notes: Note[]
  activeNote: Note | null
  configuration: NotesConfig
}

// Would allow taking notes during presentation
```

### Statistics Module

```typescript
interface StatisticsModuleProps {
  session: SessionStatistics
  historical: HistoricalStatistics
  metrics: PerformanceMetrics
}

// Would show usage and performance analytics
```

### Collaboration Module

```typescript
interface CollaborationModuleProps {
  room: CollaborationRoom
  participants: Participant[]
  messages: Message[]
}

// Would enable real-time collaborative sessions
```

## Module Testing

### Component Testing

```typescript
// tests/unit/components/MyModuleV2.spec.ts
import { mount } from '@vue/test-utils'
import MyModuleV2 from '@/components/MyModuleV2.vue'

describe('MyModuleV2', () => {
  it('renders correctly with valid props', () => {
    const props = {
      configuration: {
        /* ... */
      },
      data: {
        /* ... */
      },
      state: {
        /* ... */
      },
    }

    const wrapper = mount(MyModuleV2, { props })
    expect(wrapper.exists()).toBe(true)
  })
})
```

### Adapter Testing

```typescript
// tests/unit/adapters/myModuleAdapter.spec.ts
import { describe, it, expect } from 'vitest'
import { useMyModuleProps } from '@/adapters/myModuleAdapter'

describe('useMyModuleProps', () => {
  it('correctly transforms store state', () => {
    // Data transformation test
  })
})
```

## Conclusion

Apuntador's modular architecture is **ready to use** and enables:

1. **Independent development** of new modules
2. **Simplified testing** with clear interfaces
3. **Improved maintainability** with separation of concerns
4. **Reusability** of components across different contexts
5. **Scalability** for future features

To implement new modules, simply follow the steps in this guide and maintain the established separation of concerns principles.
