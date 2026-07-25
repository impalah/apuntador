# Component Architecture

## Overview

Components and pages talk directly to Pinia stores and services. There is no
coordinator/adapter indirection layer — a generalized version of one was
built and later removed (2026-07) because it only ever covered the
teleprompter flow, duplicated logic the stores already exposed as getters,
and in one place mutated store state directly in a way that silently broke
persistence (it bypassed the store's own actions). Pinia stores already are
the ViewModel layer for this app: state, computed getters, and actions.

## TeleprompterFrameV2 is the one deliberate exception

`TeleprompterFrameV2.vue` (the render/scroll engine, the largest and most
complex component in the app) takes pure props and emits events instead of
reading stores directly:

```typescript
// src/types/component-interfaces.d.ts
interface TeleprompterFrameProps {
  content: TeleprompterContent
  scrollState: ScrollState
  displayPrefs: DisplayPreferences
  highlightBand: HighlightBandConfig
}

interface TeleprompterEvents {
  'content-height-changed': [height: number]
  'viewport-height-changed': [height: number]
  'highlight-band-position-change': [positionPct: number]
  'manual-scroll': [scrollTop: number]
  tap: []
  'swipe-up': []
  'swipe-down': []
  'press-hold': []
}
```

Its parent, `TeleprompterPage.vue`, builds `teleprompterFrameProps` as a
local `computed()` that reads `useTeleprompterStore()` and `usePrefsStore()`
and reshapes their fields into that prop contract. This keeps the one
genuinely complex rendering component testable/reasoned-about from its
props alone, without requiring every other component in the app to go
through the same indirection.

## Everywhere else: components talk to stores and services directly

This is the normal, idiomatic pattern in this codebase — e.g.
`FloatingToolbar.vue`, `SettingsDialog.vue`, `ActionsMenu.vue`,
`EditorPage.vue` call `usePrefsStore()`, `useTeleprompterStore()`,
`useCloudStore()`, etc. directly and define their own local prop/emit
types. Don't add a `component-interfaces.d.ts` entry or an adapter for
these — it isn't the pattern this codebase uses, and the one time it was
tried at app scale it added maintenance cost without a concrete use case
(no planned Pinia replacement, no multi-backend store swapping) to justify
it.

## If you need cross-store/cross-composable orchestration

Logic that genuinely spans multiple stores or composables (e.g. "auto-hide
the toolbar during playback, coordinated with tap/gamepad input") belongs
in a **composable** (`src/composables/`), created when the need is real and
shared by 2+ components — not a preemptive "coordinator" class for a
hypothetical future case.
