# Architecture Overview

Apuntador follows a modern Vue 3 architecture with clear separation of concerns and reactive state management.

## System Architecture

```mermaid
graph TB
    subgraph "User Interface Layer"
        UI[Vue Components]
        Router[Vue Router]
        Vuetify[Vuetify UI Framework]
    end

    subgraph "State Management Layer"
        Pinia[Pinia Store]
        TStore[Teleprompter Store]
        PStore[Preferences Store]
    end

    subgraph "Business Logic Layer"
        Utils[Utility Functions]
        Markdown[Markdown Parser]
        Scrolling[Scroll Engine]
        Persistence[Data Persistence]
    end

    subgraph "Browser APIs"
        LocalStorage[Local Storage]
        FileAPI[File API]
        FullscreenAPI[Fullscreen API]
        RAF[RequestAnimationFrame]
    end

    UI --> Router
    UI --> Vuetify
    UI --> Pinia
    Pinia --> TStore
    Pinia --> PStore
    TStore --> Utils
    PStore --> Persistence
    Utils --> Markdown
    Utils --> Scrolling
    Persistence --> LocalStorage
    UI --> FileAPI
    UI --> FullscreenAPI
    Scrolling --> RAF
```

## Component Architecture

```mermaid
graph TD
    App[App.vue] --> Router[Vue Router]
    Router --> TeleprompterPage[TeleprompterPage.vue]

    TeleprompterPage --> TeleprompterFrame[TeleprompterFrame.vue]
    TeleprompterPage --> FloatingToolbar[FloatingToolbar.vue]

    TeleprompterFrame --> HighlightBand[HighlightBandHandle.vue]

    FloatingToolbar --> SpeedControl[SpeedControl.vue]
    FloatingToolbar --> FontSizeControl[FontSizeControl.vue]
    FloatingToolbar --> SettingsDialog[SettingsDialog.vue]
    FloatingToolbar --> MarkdownEditor[MarkdownEditor.vue]
    FloatingToolbar --> FileLoader[FileLoader.vue]

    subgraph "Shared State"
        TeleprompterStore[useTeleprompterStore]
        PrefsStore[usePrefsStore]
    end

    TeleprompterFrame -.-> TeleprompterStore
    FloatingToolbar -.-> TeleprompterStore
    SettingsDialog -.-> PrefsStore
    MarkdownEditor -.-> TeleprompterStore
```

## Data Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Components
    participant Store as Pinia Store
    participant Utils as Utilities
    participant Browser as Browser APIs

    User->>UI: Interaction (click, touch, keyboard)
    UI->>Store: Dispatch Action
    Store->>Utils: Process Data
    Utils->>Browser: Browser API Call
    Browser-->>Utils: Response
    Utils-->>Store: Update State
    Store-->>UI: Reactive Update
    UI-->>User: Visual Feedback
```

## Tech Stack Details

### Frontend Framework

- **Vue 3.4+** - Composition API, `<script setup>`
- **TypeScript 5.0+** - Full type safety
- **Vuetify 3.4+** - Material Design components

### Build & Development

- **Vite 5.0+** - Fast development server and optimized builds
- **ESLint** - Code linting with Vue and TypeScript rules
- **Prettier** - Code formatting
- **Stylelint** - CSS/SCSS linting

### State Management

- **Pinia 2.1+** - Modern Vuex alternative
- **localforage** - Async storage with IndexedDB/WebSQL/localStorage fallback

### Testing

- **Vitest** - Fast unit testing framework
- **Vue Test Utils** - Vue component testing utilities
- **Playwright** - Cross-browser E2E testing
- **jsdom** - DOM environment for testing

### Utilities

- **markdown-it** - Markdown parsing with plugins
- **Zod** - Runtime type validation
- **TypeScript** - Compile-time type checking

## Performance Optimizations

### Rendering Performance

- **Virtual scrolling** for large documents
- **RAF-based** smooth animations
- **CSS transforms** for GPU acceleration
- **Debounced** resize handlers

### Memory Management

- **Reactive watchers** cleanup on component unmount
- **Event listener** removal in lifecycle hooks
- **Computed properties** for expensive calculations
- **LocalStorage** cleanup utilities

### Bundle Optimization

- **Tree shaking** for unused code elimination
- **Code splitting** for route-based chunks
- **Asset optimization** with Vite
- **Compression** for production builds

## Security Considerations

### Data Privacy

- **No external requests** - all processing local
- **No analytics** or tracking
- **User-controlled** data persistence
- **File validation** for imports

### Input Validation

- **Zod schemas** for runtime validation
- **TypeScript** for compile-time checks
- **File type** restrictions
- **Content sanitization** for HTML output

## Browser Compatibility

### Supported Features

- **ES2020** syntax and features
- **CSS Grid** and Flexbox
- **RequestAnimationFrame** for animations
- **File API** for imports
- **Fullscreen API** (where available)

### Graceful Degradation

- **Fallback** for unsupported Fullscreen API
- **Alternative** interaction methods on mobile
- **Progressive enhancement** for advanced features
