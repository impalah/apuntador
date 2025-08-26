# Technical Stack Deep Dive

This document provides comprehensive technical details about Apuntador's architecture, implementation choices, and advanced features.

## Framework Architecture

### Vue 3 Composition API

Apuntador leverages Vue 3's Composition API exclusively with `<script setup>` syntax for:

- **Better TypeScript Integration**: Native type inference
- **Improved Code Organization**: Logic grouped by feature
- **Enhanced Performance**: Better tree-shaking and smaller bundles
- **Modern Developer Experience**: Auto-imports and simplified syntax

```typescript
// Example: Reactive state with automatic cleanup
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default function useScrolling() {
  const scrollOffset = ref(0)
  const isScrolling = ref(false)

  const progress = computed(() => scrollOffset.value / maxOffset.value)

  onMounted(() => {
    // Setup scroll listeners
  })

  onUnmounted(() => {
    // Automatic cleanup
  })

  return { scrollOffset, isScrolling, progress }
}
```

### State Management with Pinia

Pinia provides modern state management with:

- **Type Safety**: Full TypeScript support
- **Devtools Integration**: Vue devtools compatibility
- **Modular Design**: Feature-based store organization
- **Server-Side Rendering**: SSR ready (future-proof)

```typescript
// Store definition with automatic type inference
export const useTeleprompterStore = defineStore('teleprompter', () => {
  const contentRaw = ref('')
  const isPlaying = ref(false)

  const compiledContent = computed(() => markdownIt.render(contentRaw.value))

  function play() {
    isPlaying.value = true
    startScrollAnimation()
  }

  return { contentRaw, isPlaying, compiledContent, play }
})
```

## Performance Engineering

### Scroll Animation Engine

Custom high-performance scrolling implementation:

```typescript
class ScrollEngine {
  private animationId: number | null = null
  private lastTimestamp = 0

  start(speed: number) {
    const animate = (timestamp: number) => {
      const deltaTime = timestamp - this.lastTimestamp
      const deltaOffset = (speed * deltaTime) / 1000

      this.updateOffset(deltaOffset)
      this.lastTimestamp = timestamp

      if (this.isPlaying) {
        this.animationId = requestAnimationFrame(animate)
      }
    }

    this.lastTimestamp = performance.now()
    this.animationId = requestAnimationFrame(animate)
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
}
```

### Memory Management

Efficient resource management:

```typescript
// Automatic cleanup with lifecycle hooks
onUnmounted(() => {
  scrollEngine.stop()
  resizeObserver.disconnect()
  document.removeEventListener('keydown', handleKeydown)
})

// Weak references for event handling
const eventListeners = new WeakMap()

// Debounced expensive operations
const debouncedResize = debounce((entries) => {
  measureViewport()
  recalculateLineHeights()
}, 16) // ~60fps
```

### Bundle Optimization

Vite configuration for optimal performance:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-ui': ['vuetify'],
          'vendor-utils': ['markdown-it', 'localforage'],
        },
      },
    },
    // Enable modern browser features
    target: 'es2020',
    // Optimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },

  // Development optimizations
  server: {
    hmr: true,
    fs: {
      strict: false,
    },
  },
})
```

## TypeScript Integration

### Strict Type Safety

Complete type coverage with strict settings:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Custom Type Definitions

Domain-specific types for better DX:

```typescript
// src/types/teleprompter.d.ts
interface TeleprompterConfig {
  readonly speed: ScrollSpeed
  readonly font: FontConfig
  readonly mirror: MirrorConfig
  readonly highlight: HighlightConfig
}

type ScrollSpeed = Brand<number, 'ScrollSpeed'>
type FontSize = Brand<number, 'FontSize'>

// Branded types for type safety
type Brand<T, K> = T & { readonly __brand: K }

// Utility types for component props
type PropsOf<T> = T extends new (...args: any[]) => infer P
  ? P extends { $props: infer Props }
    ? Props
    : never
  : never
```

## Testing Architecture

### Unit Testing Strategy

Comprehensive testing with Vitest:

```typescript
// Component testing with Vue Test Utils
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

describe('TeleprompterFrame', () => {
  it('should handle scroll events correctly', async () => {
    const wrapper = mount(TeleprompterFrame, {
      global: {
        plugins: [createTestingPinia()],
      },
      props: {
        content: '<p>Test content</p>',
        isPlaying: false,
      },
    })

    const scrollEvent = new Event('scroll')
    await wrapper.find('[data-testid="scroll-container"]').trigger('scroll')

    expect(wrapper.emitted('scroll')).toBeTruthy()
  })
})

// Store testing
import { setActivePinia, createPinia } from 'pinia'

describe('TeleprompterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should compile markdown correctly', () => {
    const store = useTeleprompterStore()
    store.setContent('# Hello World')

    expect(store.contentHtml).toContain('<h1>Hello World</h1>')
  })
})
```

### E2E Testing with Playwright

Cross-browser testing for real-world scenarios:

```typescript
// tests/e2e/teleprompter.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Teleprompter Core Features', () => {
  test('should auto-scroll at specified speed', async ({ page }) => {
    await page.goto('/')

    // Set known scroll speed
    await page.click('[data-testid="settings-button"]')
    await page.fill('[data-testid="speed-input"]', '50')
    await page.click('[data-testid="save-settings"]')

    // Start playback and measure scroll
    const startOffset = await page.evaluate(
      () => document.querySelector('.scroll-container')?.scrollTop
    )

    await page.click('[data-testid="play-button"]')
    await page.waitForTimeout(2000)

    const endOffset = await page.evaluate(
      () => document.querySelector('.scroll-container')?.scrollTop
    )

    // Verify scroll distance matches expected speed
    const expectedDistance = 50 * 2 // 50px/sec * 2sec
    const actualDistance = endOffset - startOffset
    expect(actualDistance).toBeCloseTo(expectedDistance, 10)
  })
})
```

## Security Considerations

### Input Validation

Zod schemas for runtime type checking:

```typescript
import { z } from 'zod'

const PreferencesSchema = z.object({
  fontSizePx: z.number().min(12).max(200),
  speedPxPerSec: z.number().min(10).max(200),
  fgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  bgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

function validatePreferences(data: unknown): Preferences {
  return PreferencesSchema.parse(data)
}
```

### Content Sanitization

Safe HTML rendering:

```typescript
// Markdown compilation with security
const md = new MarkdownIt({
  html: false, // Disable raw HTML
  linkify: false, // Disable auto-linking
  breaks: true,
})

// Custom renderer for safe output
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('rel', 'noopener noreferrer')
  tokens[idx].attrSet('target', '_blank')
  return self.renderToken(tokens, idx, options)
}
```

### Data Privacy

Local-only storage implementation:

```typescript
// Privacy-first persistence
class PrivateStorage {
  private readonly prefix = 'apuntador_'

  async set(key: string, value: any): Promise<void> {
    const encrypted = this.encrypt(JSON.stringify(value))
    await localforage.setItem(`${this.prefix}${key}`, encrypted)
  }

  async get<T>(key: string): Promise<T | null> {
    const encrypted = await localforage.getItem(`${this.prefix}${key}`)
    if (!encrypted) return null

    const decrypted = this.decrypt(encrypted as string)
    return JSON.parse(decrypted)
  }

  private encrypt(data: string): string {
    // Simple XOR encryption for local storage
    // Note: Not cryptographically secure, just obfuscation
    return btoa(
      data
        .split('')
        .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ 42))
        .join('')
    )
  }
}
```

## Accessibility Implementation

### WCAG 2.1 AA Compliance

Comprehensive accessibility features:

```typescript
// Keyboard navigation
const keyboardHandlers = {
  Space: () => teleprompter.toggle(),
  ArrowUp: () => teleprompter.stepLines(-1),
  ArrowDown: () => teleprompter.stepLines(1),
  Home: () => teleprompter.toHome(),
  End: () => teleprompter.toEnd(),
}

// ARIA live regions for screen readers
const announceChange = (message: string) => {
  const liveRegion = document.getElementById('sr-live-region')
  if (liveRegion) {
    liveRegion.textContent = message
  }
}

// Focus management
const focusManager = {
  trapFocus(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    container.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    })
  },
}
```

## Development Workflow

### Hot Module Replacement

Optimized development experience:

```typescript
// main.ts - HMR setup
if (import.meta.hot) {
  import.meta.hot.accept('./App.vue', (newModule) => {
    // Handle component updates
  })

  import.meta.hot.accept('./stores/teleprompter', (newModule) => {
    // Handle store updates
    app.use(createPinia())
  })
}
```

### Build Pipeline

Automated quality checks:

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run stylelint
      - run: npm run test
      - run: npm run test:e2e
      - run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

This technical documentation provides deep insights into Apuntador's implementation choices and advanced features, enabling developers to understand, contribute to, and extend the codebase effectively.
