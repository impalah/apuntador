# Copilot Instructions for **Apuntador**

A modular, multi-platform teleprompter built with **Vue 3 + TypeScript**, **Vite**, and **Vuetify**. Features web, Android (Capacitor), and desktop (Tauri) deployments with advanced component architecture.

## Architecture Overview

**Modular Component System**: Uses coordinators + adapters to decouple UI components from state management.
- `src/coordinators/` - Business logic orchestration between components
- `src/adapters/` - Bridge Pinia stores to component interfaces  
- `src/types/component-interfaces.d.ts` - Type contracts for modular components

**Multi-Platform Deployment**:
- **Web**: Vite build → static hosting (Vercel, Netlify, etc.)
- **Android**: Capacitor → APK with automated GitHub Actions builds
- **Desktop**: Tauri → native Windows/macOS/Linux apps with code signing

## Key Tech Stack

- **Core**: Vue 3 (Composition API + `<script setup>`), TypeScript 5, Vite 5
- **UI**: Vuetify 3 (Material Design 3), responsive mobile-first design
- **State**: Pinia stores with `localforage` persistence
- **Mobile**: Capacitor 7+ with native plugins (haptics, screen orientation, keyboard)
- **Desktop**: Tauri 2+ with Rust backend for native window controls
- **Testing**: Vitest (unit) + Playwright (e2e) with coverage thresholds
- **Markdown**: `markdown-it` with plugins (anchor, sup/sub, mark, footnote)

## Directory Structure (Actual)

```
src/
├── coordinators/           # Component orchestration logic
│   └── teleprompterCoordinator.ts
├── adapters/              # Store-to-component bridges
│   └── storeToComponent.ts
├── components/            # Modular Vue components
├── stores/               # Pinia state management
│   ├── useTeleprompterStore.ts
│   ├── usePrefsStore.ts
│   ├── useFileStore.ts
│   └── useI18nStore.ts
├── utils/                # Pure utility functions
│   ├── scrolling.ts      # AutoScroller class
│   ├── markdown.ts       # Renderer with plugins
│   ├── gamepadManager.ts # Gamepad input handling
│   ├── hotkeys.ts        # Keyboard shortcuts
│   └── persistence.ts    # Storage abstraction
├── types/                # TypeScript definitions
│   ├── index.d.ts        # Core interfaces
│   └── component-interfaces.d.ts # Modular component contracts
└── pages/                # Route components
```

## Critical Implementation Patterns

### Scrolling Architecture
- **AutoScroller class** (`utils/scrolling.ts`): Handles smooth `requestAnimationFrame`-based scrolling
- **Virtual scroll offset**: Pixel-based positioning with line-height calculations
- **Play/pause loop**: Store triggers AutoScroller start/stop via coordinator

### Component Communication
```typescript
// Coordinator orchestrates multiple components
const coordinator = useTeleprompterCoordinator()
coordinator.teleprompterFrameProps  // Reactive props from stores
coordinator.toolbarHandlers.onPlay() // Actions bridge to stores
```

### Store-to-Component Adapter Pattern
```typescript
// Converts Pinia state to component props format
export function useTeleprompterFrameProps(): ComputedRef<TeleprompterFrameProps> {
  return computed(() => ({
    content: { raw: store.contentRaw, html: store.contentHtml },
    scrollState: { offset: store.scrollOffset, isPlaying: store.isPlaying },
    // ... transforms store data to component interface
  }))
}
```

### Multi-Platform Builds

**Android APK** (automated):
```bash
npm run android:apk:build  # Windows PowerShell script
./build-android-apk.sh     # Linux/macOS script
make android-apk           # Cross-platform via Makefile
```

**Desktop** (Tauri):
```bash
npm run tauri:build:win    # Windows MSI
npm run tauri:build:mac    # macOS universal binary
make tauri-build-release   # Platform-specific build scripts
```

## Development Workflow

**Core Commands**:
```bash
npm run dev         # Vite dev server (port 3000)
npm run build       # Production web build
npm run typecheck   # Vue + TS validation
npm run test        # Vitest unit tests
npm run test:e2e    # Playwright e2e tests
npm run coverage    # Coverage report
```

**Testing Strategy**:
- **Unit**: Focus on stores (`useTeleprompterStore`, `usePrefsStore`) and utils
- **E2E**: Full user flows across mobile/desktop viewports
- **Coverage**: Store logic >85%, utils >75% (components covered by e2e)

## Component Interface Contracts

Components communicate via typed interfaces in `types/component-interfaces.d.ts`:

```typescript
interface TeleprompterFrameProps {
  content: TeleprompterContent
  scrollState: ScrollState  
  displayPrefs: DisplayPreferences
  highlightBand: HighlightBandConfig
}
```

This enables swapping component implementations without breaking the coordinator layer.

## Input Handling Architecture

**Multi-Input Support**:
- **Keyboard**: `utils/hotkeys.ts` with customizable mappings
- **Touch**: Vue touch directives for swipe/tap gestures  
- **Gamepad**: `utils/gamepadManager.ts` for wireless controller support
- **Accessibility**: ARIA roles, screen reader support

## Platform-Specific Features

**Android** (Capacitor):
- Edge-to-edge immersive mode
- Hardware back button handling
- Haptic feedback for interactions
- Screen orientation lock

**Desktop** (Tauri):  
- Native window controls (minimize/maximize/close)
- Always-on-top mode for professional setups
- File system access for script import/export
- Code signing for Windows (self-signed certificate workflow)

## Build & Deployment

**Automated Android Builds**: GitHub Actions triggers on tags, outputs signed APK
**Cross-Platform Scripts**: PowerShell (Windows) + Bash (Linux/macOS) build scripts
**Makefile Integration**: Unified commands across all platforms

Use existing build scripts in `scripts/` directory - don't recreate the wheel for platform-specific builds.

## Performance Patterns

- **60fps scrolling**: `requestAnimationFrame` with delta-time calculations
- **Bundle splitting**: Manual chunks for Vue, Vuetify, Capacitor in `vite.config.ts`
- **Virtual scrolling**: Only render visible content for large documents
- **Memory management**: Cleanup watchers/timers in component unmount hooks

## Key Files to Reference

- `src/coordinators/teleprompterCoordinator.ts` - Component orchestration patterns
- `src/stores/useTeleprompterStore.ts` - Core state management with AutoScroller
- `src/utils/scrolling.ts` - Smooth scrolling implementation
- `vite.config.ts` - Build configuration with test coverage thresholds
- `Makefile` - Cross-platform build targets
- `capacitor.config.ts` - Android app configuration
- `src-tauri/` - Desktop app Rust backend

When modifying this codebase, maintain the modular architecture and respect the existing build pipelines.

---

## 2) Tech Stack (lock these choices)

- **Runtime / Build**: Node 20+, Vite 5, pnpm or npm (default to **npm**).
- **Framework**: Vue 3 (Composition API) + TypeScript.
- **UI**: Vuetify 3 (Material 3), icons via Material Design Icons.
- **State**: Pinia.
- **Routing**: Vue Router 4 (routes kept minimal).
- **Markdown**: `markdown-it` with plugins: `markdown-it-anchor`, `markdown-it-sup`, `markdown-it-sub`, `markdown-it-mark`, `markdown-it-footnote`.
- **Persistence**: `localforage` (or `localStorage` as fallback) via a small abstraction.
- **Testing**: Vitest, @vue/test-utils, jsdom; coverage via `c8`. E2E: Playwright.
- **Lint/Format**: ESLint (vue/recommended + typescript), Prettier, Stylelint (for CSS/SCSS in SFCs).
- **Types / Utils**: Zod for schema validation of settings and file input.

---

## 3) Commands & Scripts (for package.json)

Copilot should create npm scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "vue-tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "stylelint": "stylelint \"src/**/*.{vue,css,scss}\"",
    "test": "vitest run",
    "test:ui": "vitest",
    "test:e2e": "playwright test",
    "coverage": "vitest run --coverage"
  }
}
```

Also generate a **Makefile** exposing: `install`, `dev`, `build`, `preview`, `lint`, `format`, `stylelint`, `typecheck`, `test`, `test-e2e`, `coverage`, `clean`.

---

## 4) Directory Structure

```
apuntador/
  ├─ src/
  │  ├─ app/
  │  │  ├─ main.ts
  │  │  ├─ App.vue
  │  │  └─ router.ts
  │  ├─ components/
  │  │  ├─ TeleprompterFrame.vue
  │  │  ├─ FloatingToolbar.vue
  │  │  ├─ SpeedControl.vue
  │  │  ├─ FontSizeControl.vue
  │  │  ├─ SettingsDialog.vue
  │  │  ├─ MarkdownEditor.vue
  │  │  ├─ FileLoader.vue
  │  │  └─ HighlightBandHandle.vue
  │  ├─ stores/
  │  │  ├─ useTeleprompterStore.ts
  │  │  └─ usePrefsStore.ts
  │  ├─ utils/
  │  │  ├─ markdown.ts
  │  │  ├─ scrolling.ts
  │  │  ├─ persistence.ts
  │  │  ├─ hotkeys.ts
  │  │  └─ dom.ts
  │  ├─ styles/
  │  │  ├─ main.scss
  │  │  └─ variables.scss
  │  ├─ types/
  │  │  └─ index.d.ts
  │  └─ pages/
  │     └─ TeleprompterPage.vue
  ├─ public/
  │  └─ sample.md
  ├─ tests/
  │  ├─ unit/
  │  ├─ e2e/
  │  └─ fixtures/
  ├─ vite.config.ts
  ├─ tsconfig.json
  ├─ eslint.config.mjs
  ├─ stylelint.config.cjs
  ├─ .prettierrc
  ├─ .editorconfig
  ├─ Makefile
  └─ README.md
```

---

## 5) Core Features & Implementation Details

### 5.1 Teleprompter Frame & Scrolling

- Render markdown to HTML; ensure large font sizes render cleanly and wrap gracefully.
- Maintain a **virtual scroll offset** (in pixels) in store. On _Play_, increment this offset on a timer using current **scrollSpeed** (pixels/sec) \* delta‑time.
- Smooth scrolling via `requestAnimationFrame`; pause cancels the loop.
- **Rewind/Forward** jump by N rendered lines. Strategy: compute line height from computed style and convert line jumps to pixel offsets.
- **Home/End**: set scroll offset to 0 or to contentHeight ‑ viewportHeight.
- **Mirror**: implement via CSS transforms on the scroll container:
  - Horizontal: `transform: scaleX(-1)`
  - Vertical: `transform: scaleY(-1)`
  - Ensure toolbar and editor are **not mirrored**; only the teleprompter content.

### 5.2 Highlight Band

- An overlay div positioned within the viewport, height = 1 or 2 line‑heights (configurable).
- Non‑highlighted areas are dimmed via backdrop/overlay layer or by reducing opacity of non‑band text using a mask.
- Band position is adjustable by dragging a handle (component `HighlightBandHandle.vue`) or via settings slider; persist position (percentage from top).

### 5.3 Floating Toolbar (auto‑hide)

- Appears on single tap/click in the reading area when paused; hides on _Play_.
- Minimal mode on small screens: show **[Play/Pause] [Speed±] [More]**. Expanding reveals: **Rew/Fwd**, **Home/End**, **Font±**, **Mirror H/V**, **Editor**, **Settings**, **Open File**.
- Use Vuetify speed dial / bottom app bar variant depending on layout.

### 5.4 Markdown Editor & Import

- Provide a full‑screen modal editor with live preview (split view on wide screens, toggle on mobile).
- Save updates to store and persistence.
- File import (.md/.txt): accept drag‑and‑drop and file picker; validate with Zod; read as UTF‑8.
- Provide a default sample script (`public/sample.md`).

### 5.5 Settings

- Options: font family, base font size, line height, foreground color, background color, highlight band height/position, scroll speed min/max, mirror defaults, dimming intensity.
- Persist via `localforage` under namespaced keys; schema‑validate with Zod and migrate on version bumps.

### 5.6 Accessibility & Input

- Keyboard shortcuts on desktop: Space (Play/Pause), ↑/↓ (line ±1), PgUp/PgDn (line ±5), Home/End, `[`/`]` (speed −/+), `=`/`-` (font +/−), `H`/`V` (mirror), `E` (editor), `S` (settings).
- Touch gestures: swipe up/down (line ±1), press‑and‑hold → show toolbar.
- ARIA roles for toolbar and dialogs; high contrast theme option.

---

## 6) State Model (Pinia)

`useTeleprompterStore`:

```ts
state: {
  contentRaw: string,          // markdown source
  contentHtml: string,         // compiled HTML (cached)
  isPlaying: boolean,
  scrollOffset: number,        // px from top
  lineHeightPx: number,        // measured
  viewportHeightPx: number,
}
getters: {
  maxOffset: (s) => Math.max(0, contentHeightPx - s.viewportHeightPx)
}
actions: {
  setContent(raw: string), compileMarkdown(),
  play(), pause(), toggle(),
  stepLines(n: number), toHome(), toEnd(),
  measureLineHeight(), setViewportHeight(h: number)
}
```

`usePrefsStore`:

```ts
state: {
  fontFamily: string,
  fontSizePx: number, lineHeight: number,
  fgColor: string, bgColor: string,
  speedPxPerSec: number, speedMin: number, speedMax: number,
  mirrorH: boolean, mirrorV: boolean,
  highlightBandLines: 1 | 2,
  highlightBandPosPct: number // 0..100 from top
}
actions: { load(), save(), reset() }
```

---

## 7) Coding Conventions

- **Composition API** with `<script setup lang="ts">` in SFCs.
- Keep components small and focused; prefer props + emits.
- Styles: SCSS in SFCs; theme tokens in `styles/variables.scss` and Vuetify theme config.
- Avoid magic numbers; centralize constants in `src/utils/constants.ts` (Copilot should create it if needed).
- All public functions documented with TSDoc; all complex functions have unit tests.

---

## 8) Testing Strategy & Coverage

- **Unit** (Vitest):
  - Stores: play/pause logic, speed math, stepping lines, persistence.
  - Components: toolbar visibility rules, highlight band calculations, mirror transforms.
  - Utils: markdown compile, scrolling math, hotkeys.
- **E2E** (Playwright):
  - Load sample.md → play → pause → rewind/forward → settings change persists.
  - Mobile viewport scenarios and toolbar minimal mode.
- **Coverage thresholds** (enforce in Vitest config):
  - Statements/Branches/Functions/Lines: **≥ 85%** project‑wide.

---

## 9) CI & Quality Gates (optional for local, encouraged for CI)

- Run `npm run typecheck`, `lint`, `stylelint`, `test`, `coverage` on PRs.
- Fail if coverage < thresholds.

---

## 10) README Requirements

Copilot must generate a `README.md` that covers:

- Project intro + screenshots/GIFs placeholders.
- Requirements: Node 20+.
- **Install**: `npm install`
- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Tests**: `npm test`, `npm run test:e2e`, coverage report location.
- **Makefile** targets and examples.
- How to import a `.md` file and how to use the editor.
- Keyboard shortcuts and touch gestures.
- Settings and persistence.

---

## 11) UX & Responsiveness Rules

- Mobile/tablet first; base layout uses a full‑screen scroll container with safe‑area insets respected.
- Toolbar anchors to bottom (mobile) or floats over content; auto‑hide on _Play_ with a gentle fade.
- Minimum tappable target size: 44×44px.
- Dynamic type scaling: font size slider from 16px to 200px; maintain readable line height (1.2–1.6).

---

## 12) Security & Privacy

- No network calls by default. Import is local‑file only.
- Persisted data stays in browser storage; provide a “Clear all data” button.

---

## 13) Suggested Implementation Order (for Copilot)

1. Vite + Vue + TS + Vuetify scaffolding; lint/format/test configs.
2. Pinia stores; persistence abstraction; markdown utils.
3. TeleprompterFrame with scrolling loop and highlight band; minimal toolbar.
4. Full toolbar with all actions; keyboard & touch.
5. Settings dialog and persistence.
6. Markdown editor + file import.
7. Tests (unit → e2e); README; Makefile.

---

## 14) Example Prompts for Copilot (inline comments)

- _“Create `TeleprompterFrame.vue` with a scrollable container, accepts `contentHtml`, applies mirror transforms from prefs, exposes methods `play()`, `pause()`, `stepLines(n)`.”_
- _“Implement `scrolling.ts` with `pxPerLine(el: HTMLElement): number` and `offsetForLines(n: number): number` using measured line‑height.”_
- _“In `FloatingToolbar.vue`, implement minimal mode on `xs` screens and expand with a ‘More’ sheet.”_
- _“Add Vitest unit tests for `useTeleprompterStore` play/pause and line stepping logic.”_
- _“Add Playwright test: load sample.md, hit Play, wait 2s, assert scroll offset increased, change speed, assert rate change.”_

---

## 15) Acceptance Criteria

- All core actions work on desktop and mobile.
- Clean reading surface during playback; toolbar hides.
- Highlight band adjustable; dimming works.
- Markdown editing and file import functional.
- Mirror H/V independent of UI.
- Settings persist across reloads.
- Tests pass with ≥ 85% coverage.
- README is complete and accurate; Makefile targets work.

---

_This file should evolve with the codebase. Keep it concise but precise; update when APIs/components change._
