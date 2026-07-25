/**
 * Prop/event contract for TeleprompterFrameV2, kept separate from the Pinia
 * store shapes so the component can be reasoned about (and tested) from its
 * props alone.
 */

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

export interface DisplayPreferences {
  fontFamily: string
  fontSizePx: number
  lineHeight: number
  fgColor: string
  bgColor: string
  mirrorH: boolean
  mirrorV: boolean
  textAlignment: 'left' | 'center' | 'right'
}

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
