/**
 * Prop/event contract for TeleprompterFrameV2, kept separate from the Pinia
 * store shapes so the component can be reasoned about (and tested) from its
 * props alone.
 */

import type { PreferencesState } from '@/stores/usePrefsStore'
import type { MonoPreferencesState } from '@/stores/useMonoFramePrefsStore'
import type { MonoLine } from '@/composables/useMonospaceLayout'

export interface TeleprompterContent {
  raw: string
  html: string
}

export interface ScrollState {
  offset: number
  isPlaying: boolean
  canScrollUp: boolean
  canScrollDown: boolean
  progress: number // 0-100
}

/**
 * The subset of PreferencesState (the Zod-validated store type, which is the
 * single source of truth) that TeleprompterFrameV2 needs for rendering.
 */
export type DisplayPreferences = Pick<
  PreferencesState,
  | 'fontFamily'
  | 'fontSizePx'
  | 'lineHeight'
  | 'fgColor'
  | 'bgColor'
  | 'mirrorH'
  | 'mirrorV'
  | 'textAlignment'
>

export interface HighlightBandConfig {
  lines: 1 | 2
  positionPct: number // 0-100 from top
  dimmingIntensity: number // 0-1
  enabled: boolean
}

export interface TeleprompterFrameProps {
  content: TeleprompterContent
  scrollState: ScrollState
  displayPrefs: DisplayPreferences
  highlightBand: HighlightBandConfig
}

export interface TeleprompterEvents {
  'content-height-changed': [height: number]
  'viewport-height-changed': [height: number]
  'highlight-band-position-change': [positionPct: number]
  'manual-scroll': [scrollTop: number]
  tap: []
  'swipe-up': []
  'swipe-down': []
  'press-hold': []
}

/**
 * Prop/event contract for TeleprompterFrameMono - the plain-text, monospace
 * alternative to TeleprompterFrameV2. Reuses ScrollState/HighlightBandConfig
 * and the base event set as-is; `content` is the one deliberate divergence
 * (precomputed lines instead of raw/html - see useMonospaceLayout.ts, owned
 * by TeleprompterPage.vue, not this component) and it adds
 * 'viewport-width-changed' since line-wrapping needs the container width.
 */
export type MonoDisplayPreferences = Pick<
  MonoPreferencesState,
  'fontFamily' | 'fontSizePx' | 'lineHeight' | 'fgColor' | 'bgColor' | 'voiceReadColor' | 'textAlignment'
> &
  Pick<PreferencesState, 'mirrorH' | 'mirrorV'>

export interface MonoTeleprompterContent {
  lines: MonoLine[]
  /** Exact, page-measured line height (useMonospaceLayout) - the frame uses this
   *  directly for highlight-band placement rather than re-measuring itself. */
  lineHeightPx: number
  /**
   * Voice-tracking alignment cursor (token index) for word-level "already
   * read" coloring, or null when voice tracking isn't the active scroll mode
   * (no coloring). Words with `renderIndex <= readUpToIndex` render in
   * VOICE_READ_TEXT_COLOR; the rest keep the normal fgColor.
   */
  readUpToIndex: number | null
}

export interface MonoTeleprompterFrameProps {
  content: MonoTeleprompterContent
  scrollState: ScrollState
  displayPrefs: MonoDisplayPreferences
  highlightBand: HighlightBandConfig
}

export interface MonoTeleprompterEvents extends TeleprompterEvents {
  'viewport-width-changed': [width: number]
}
