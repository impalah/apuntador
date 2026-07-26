/**
 * Prop/event contract for TeleprompterFrameV2, kept separate from the Pinia
 * store shapes so the component can be reasoned about (and tested) from its
 * props alone.
 */

import type { PreferencesState } from '@/stores/usePrefsStore'

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
