# Voice Tracking Mode — Design (Fase 0)

Status: proposal, no production code. Branch: `feature/voice-tracking-fase-0-diseno-exploracion`.

## 1. Exploration summary

### Presentation layer
- `src/components/TeleprompterFrameV2.vue` renders the script and owns the DOM scroll
  container. It is **already fully decoupled from the scroll source**: it receives
  `scrollState.offset` as a prop and, on change, sets `el.scrollTop = newOffset`
  (`TeleprompterFrameV2.vue:326-345`, `flush: 'sync'`). It has no idea whether that
  offset came from a timer, a manual drag, or something else. It emits `manual-scroll`
  when the user scrolls the DOM directly (`TeleprompterFrameV2.vue:469-489`).
- `src/pages/TeleprompterPage.vue` is the only orchestrator: it reads `usePrefsStore` /
  `useTeleprompterStore`, builds the props object for `TeleprompterFrameV2`, and wires
  hotkeys/gamepad/toolbar events to store actions. There is **no `coordinators/` or
  `adapters/` directory** in `src/` today (verified via `grep -rl coordinator|adapter src`
  and `find src -maxdepth 1 -type d`) — the CLAUDE.md description of a coordinator/adapter
  layer is the target architecture, not the current one. Pages talk to stores directly.
  Voice tracking wiring should follow this existing, real convention (live in
  `TeleprompterPage.vue`), not invent a coordinator layer that doesn't exist anywhere
  else in the codebase.

### Scroll/speed store
- `src/stores/useTeleprompterStore.ts` holds `scrollOffset` and a single choke point,
  `updateScrollOffset(newOffset)` (`useTeleprompterStore.ts:116-145`), that clamps the
  offset, auto-pauses at the end, and is called from four independent places today:
  `AutoScroller`'s tick, `stepLines`, `toHome`/`toEnd`, and `syncScrollFromDOM` (manual
  scroll). This is the natural fourth caller for voice-driven position updates — no
  change to the store's public contract is needed.
- `src/utils/scrolling.ts` already provides `SmoothScroller`, a `requestAnimationFrame`
  easing animator that takes a target offset and calls `onUpdate` each frame
  (`scrolling.ts:44-115`). It is currently unused by any store/component but is exactly
  the "smooth animation, not raw jumps" primitive Fase 1 needs — voice tracking should
  drive `SmoothScroller.scrollTo(estimatedOffset)`, which in turn calls
  `teleprompterStore.updateScrollOffset`, instead of writing a second easing
  implementation.

### Settings/preferences
- `src/stores/usePrefsStore.ts` is a Pinia store with a Zod schema
  (`preferencesSchema`), `load()`/`save()` through `src/services/persistence`
  (localforage-backed), and simple `ref`-per-field state — e.g. `textAlignment`
  follows exactly the pattern a `scrollMode: 'auto' | 'voice'` field would follow
  (schema entry + ref + `set*` action + include in `save()`/`reset()`).
- `src/components/SettingsDialog.vue` is tabbed (`appearance` / `behavior` / `controls`
  / `cloud` / `data` / `about`). The `behavior` tab already holds scroll-speed settings
  (`SettingsDialog.vue:221-260`), making it the natural home for "Modo de avance:
  Automático / Por voz" (open question below).
- Quick controls live in `src/components/FloatingToolbar.vue` (always-visible 3-button
  bar: play/pause, speed, more-menu) and `src/components/ActionsMenu.vue` (secondary
  menu). A mic toggle should sit in `FloatingToolbar.vue` next to play/pause per the
  spec's requirement of being reachable without leaving the presentation screen.

### i18n
- `vue-i18n`, 9 locales under `src/locales/*.json` (`ca-ES`, `de-DE`, `en-US`, `es-ES`,
  `fr-FR`, `gl-ES`, `it-IT`, `pt-BR`, `pt-PT`). Existing keys are flat-namespaced
  (`settings.*`, `toolbar.*`, `hotkeys.*`). New keys should follow the same
  `settings.*`/`toolbar.*` namespaces across all 9 files to avoid missing-translation
  fallback warnings, even though the feature only functionally supports es-ES/en-US
  speech recognition.

### Platform-strategy precedent (directly reusable pattern)
- `src/services/mtls/enrollmentStrategy.ts` defines a `PlatformEnrollmentStrategy`
  interface; `webEnrollmentStrategy.ts`, `androidEnrollmentStrategy.ts`,
  `iosEnrollmentStrategy.ts`, `desktopEnrollmentStrategy.ts` implement it;
  `unifiedMTLSService.ts` resolves the right one at runtime from
  `Capacitor.getPlatform()`. This is the same shape requested for `SpeechEngine` in
  the spec, so Fase 0's interface design below mirrors it deliberately rather than
  inventing a new pattern.
- Platform detection already exists and should be reused as-is:
  `Capacitor.isNativePlatform()` / `Capacitor.getPlatform()` in `src/utils/capacitor.ts`,
  `isTauri()` in `src/utils/tauri.ts`.

### Tests
- Vitest unit tests: `tests/unit/**/*.test.ts`, `jsdom` environment, `tests/setup.ts`.
  Coverage (`vitest.config.ts`) uses explicit `include`/`exclude` lists, not a blanket
  glob — `src/composables/**` and `src/components/**` are currently **excluded** from
  coverage entirely ("UI-coupled, tested via e2e" / "tested via e2e"). New speech
  composables (`useScriptAlignment`, `useSpeechTracking`) will need real Vitest unit
  tests per the spec, but for their numbers to count toward the coverage gate, Fase 1
  must add `src/composables/speech/**` (and `src/services/speech/**`) to the `include`
  list — otherwise the tests run and pass but don't move the coverage numbers. Flagging
  now so Fase 1 doesn't silently skip that config change.
- Playwright e2e: `tests/e2e/*.spec.ts`, auto-starts `npm run dev` on `:3000`
  (`playwright.config.ts`), runs against chromium/firefox/webkit + 2 mobile viewports.
  There's already a "text alignment" feature (`useScriptAlignment` name collision risk —
  see open question below): `src/components/TextAlignmentControls.vue` +
  `tests/e2e/text-alignment*.spec.ts` are about CSS `text-align` (left/center/right),
  unrelated to script-position alignment. No code collision, only a naming one.

## 2. `SpeechEngine` interface

```ts
// src/services/speech/speechEngine.ts

export type SpeechLanguage = 'es-ES' | 'en-US'

export type SpeechEngineErrorCode =
  | 'not-supported'      // API/plugin unavailable on this platform/browser
  | 'permission-denied'  // microphone permission refused
  | 'no-speech'          // prolonged silence / no audio detected
  | 'network'            // engine requires connectivity and it's unavailable
  | 'aborted'            // engine stopped unexpectedly
  | 'unknown'

export interface SpeechEngineError {
  code: SpeechEngineErrorCode
  message: string
  cause?: unknown
}

export interface SpeechTranscriptEvent {
  text: string
  isFinal: boolean       // false = interim (still being refined), true = committed
  timestamp: number      // performance.now() at emission
}

export type SpeechEngineStatus = 'idle' | 'listening' | 'no-match' | 'error' | 'stopped'

export interface SpeechEngine {
  readonly isSupported: boolean
  readonly status: SpeechEngineStatus

  start(language: SpeechLanguage): Promise<void>
  stop(): Promise<void>

  onTranscript(handler: (_event: SpeechTranscriptEvent) => void): () => void
  onError(handler: (_error: SpeechEngineError) => void): () => void
  onStatusChange(handler: (_status: SpeechEngineStatus) => void): () => void
}
```

Notes:
- Mirrors `PlatformEnrollmentStrategy`'s shape: a small, promise-based lifecycle
  (`start`/`stop`) plus normalized result/error types, so `webSpeechEngine.ts` (Fase 1)
  and `capacitorSpeechEngine.ts` (Fase 2) can both satisfy it without leaking
  browser-specific (`SpeechRecognitionErrorEvent`) or plugin-specific shapes upward.
  `unifiedMTLSService.ts`'s pattern of resolving a strategy once and delegating,
  without repeating platform `if`/`else` in callers, is the direct precedent.
  `on*` handlers return an unsubscribe function (standard Vue composable convention
  already used elsewhere, e.g. event listener cleanup in
  `TeleprompterFrameV2.vue:293-311`), avoiding a bespoke event-emitter dependency.
- `status` intentionally separates `'no-match'` (recognizer running, no confident
  alignment found — a `useScriptAlignment` concern layered on top) from `'error'`
  (engine-level failure). Only the engine layer needs to model support detection and
  hard failures; alignment confidence is not part of this interface.

## 3. Folder structure

```
src/services/speech/
  speechEngine.ts          # SpeechEngine interface + shared types (Fase 0/1)
  webSpeechEngine.ts        # SpeechRecognition / webkitSpeechRecognition (Fase 1)
  capacitorSpeechEngine.ts  # @capacitor-community/speech-recognition (Fase 2)
  createSpeechEngine.ts     # runtime selector (Capacitor.isNativePlatform() ? ... : ...)

src/composables/speech/
  useScriptAlignment.ts     # fuse.js-based script-position estimator (Fase 1)
  useSpeechTracking.ts      # wires SpeechEngine + useScriptAlignment, exposes reactive state (Fase 1)
```

No `src/components/presenter/` directory is proposed — see decision below.

## 4. Presenter reuse vs. duplicate — decision

**Decision: reuse `TeleprompterFrameV2.vue` as-is. No `VoiceTrackingPresenter.vue`.**

Justification: the spec's principle #2 only calls for a separate presenter if the
current one "no puede aceptar fácilmente una fuente de avance distinta... sin
ensuciarse de lógica de voz." It already can, today, with zero voice-related code
inside it:

- `TeleprompterFrameV2` takes `scrollState.offset` as a prop and applies it to the DOM
  scroll container (`TeleprompterFrameV2.vue:326-345`). It does not know about
  `AutoScroller`, timers, or any driver at all — that logic lives entirely in
  `useTeleprompterStore` and `TeleprompterPage.vue`.
- `useTeleprompterStore.updateScrollOffset()` is already driver-agnostic and has four
  independent callers today (autoscroll tick, step buttons, home/end, manual scroll
  sync). Voice tracking becomes a fifth caller — `useSpeechTracking`/`TeleprompterPage`
  feeding estimated positions through `SmoothScroller.scrollTo(estimatedOffset)` →
  `updateScrollOffset`.
- Introducing a parallel presenter component would duplicate ~740 lines of scroll,
  touch-gesture, highlight-band, and Tauri/scrollbar-hiding CSS (`TeleprompterFrameV2.vue`)
  for no behavioral gain, and would create exactly the kind of drift the spec's
  isolation principle is trying to prevent (two presenters that must be kept in visual
  sync by hand).

What voice mode *does* need, cleanly separated from the presenter:
- A "driver" concern in `TeleprompterPage.vue` (or a small composable it calls) that,
  when voice mode is active and playing, subscribes to `useSpeechTracking`'s position
  events instead of calling `teleprompterStore.play()` (which starts `AutoScroller`).
- A status indicator (listening / paused-by-silence / error / not-supported) rendered
  in the toolbar/overlay layer — additive UI, not a modification of
  `TeleprompterFrameV2`'s existing rendering path. Exact placement (overlay inside the
  frame vs. toolbar badge) is a Fase 1 UI decision, not a Fase 0 architectural one.

## 5. Alignment algorithm design

### Tokenization & normalization
- Source of truth is `teleprompterStore.contentRaw` (the raw Markdown), not the
  compiled HTML — avoids stripping tags. Build once per content change:
  1. Strip Markdown syntax markers (`#`, `*`, `_`, `` ` ``, link/image syntax) with a
     lightweight regex pass (the existing `compileMarkdown` pipeline is
     render-oriented, not token-oriented, so this is a separate, small utility).
  2. Split into a flat token array of `{ word: string, sourceIndex: number }`, where
     `sourceIndex` is the token's ordinal position (0-based) in the script — this index
     is what "estimated position in script" means throughout the design.
  3. Normalize each token for comparison only (keep originals for display): lowercase,
     strip diacritics (`normalize('NFD').replace(/[̀-ͯ]/g, '')` — handles
     `é`, `ñ`, etc. for both es-ES and en-US), strip punctuation
     (`replace(/[^\p{L}\p{N}]/gu, '')`).

### Sliding window matching
- Maintain `cursorIndex` (last confidently-matched token index, starts at 0).
- On each transcript event from `useSpeechTracking` (interim or final), take the last
  `K` recognized words (`K` ≈ 4–6, tunable) as the query.
- Build a look-ahead window of the next `N` tokens from `cursorIndex` (`N` ≈ 20–30,
  tunable) and generate candidate subsequences (every contiguous run of `K` tokens
  inside that window, as a joined string) as the Fuse.js search corpus — Fuse.js is
  built for "rank items in a list against a query," so the *candidate windows* are the
  list, not individual words. Each candidate carries its starting `sourceIndex`.
- Query Fuse.js with the recognized phrase; take the best-scoring candidate.

### Confidence threshold & commit rule
- Fuse.js score is 0 (perfect) to 1 (no match); use a threshold (e.g. `0.4`, tunable
  constant in `src/utils/constants.ts`) below which a match is "confident."
- Only advance `cursorIndex` if the best candidate's `sourceIndex` is `>= cursorIndex`
  (monotonic — never move backward from spurious matches) and within the look-ahead
  window (bounds the maximum single jump, preventing a false-positive match far ahead
  from causing a large visible skip).
- To damp jitter from interim (non-final) results, only *commit* a cursor advance when
  either (a) the same window keeps winning across consecutive interim events, or (b)
  the transcript segment is final. Interim events can be used to move the scroll
  preview optimistically but the confirmed `cursorIndex` should be the more stable
  signal driving `SmoothScroller`.

### Ambiguity (multiple similar-score matches)
- If the top two candidates' scores are within a small epsilon (e.g. `0.05`) of each
  other, prefer the one closer to `cursorIndex` (smallest forward jump) — this favors
  local, expected progress over a coincidental match further down the script (e.g. a
  repeated phrase like "and now," or "y ahora," appearing twice).
- If ambiguity persists across several consecutive events (recognizer genuinely stuck,
  e.g. repeated word in the script read multiple times), hold position rather than
  guessing — same as the no-confident-match case.

### No-match / silence handling
- If no candidate clears the confidence threshold for a configurable timeout (e.g. 3–5s
  of continuous listening with no commit), surface `status: 'no-match'` so the UI can
  show a paused/waiting indicator, per the spec's "no dejar el texto congelado sin
  explicación" requirement. This is distinct from the engine-level `'error'` status.

### fuse.js sufficiency
- Fuse.js's fuzzy string scoring (Bitap/Levenshtein-based internally) is adequate for
  short-phrase matching against a small rebuilt-per-event candidate list, which is the
  scale this needs (tens of candidates, few-word strings) — not the same as running it
  over the entire script as one corpus. If Fase 1 finds the per-event corpus rebuild
  too slow or the scoring not discriminating enough between adjacent candidates (likely
  failure mode: many near-identical short phrases scoring similarly), the documented
  fallback is a direct token-level Levenshtein/Damerau-Levenshtein similarity computed
  by hand over the same candidate windows — same interface (`useScriptAlignment` returns
  `{ sourceIndex, confidence }`), swappable implementation, decided and documented at
  that point rather than speculatively built now.

## 6. Decisions (resolved 2026-07-26)

1. **Naming**: renamed `useTextAlignment` → **`useScriptAlignment`** everywhere in this
   document and in the planned implementation, precisely to avoid any confusion with
   the existing, unrelated `TextAlignmentControls.vue` / `prefsStore.textAlignment`
   (CSS `text-align`).
2. **Settings tab placement**: "Modo de avance: Automático / Por voz" goes in the
   existing `behavior` tab of `SettingsDialog.vue`, alongside scroll-speed settings.
3. **i18n scope**: new keys are added to all 9 locale files. es-ES and en-US are the
   priority — if a translation is uncertain or awkward for another locale, a
   best-effort literal/English-fallback string is acceptable there as long as es-ES/
   en-US are correct and complete.
4. **Status indicator placement**: an **always-visible overlay** inside the
   presentation viewport whenever voice mode is the active scroll mode (not just on
   error/no-match) — visible in `listening`/`no-match`/`error`/`not-supported` states
   alike, so the user always has positive confirmation of which mode is driving the
   scroll and its current status.

## 7. Explicitly out of scope for Fase 0

No production code, no dependency additions (`fuse.js` is not yet in `package.json`
and won't be added until Fase 1), no store/component modifications.
