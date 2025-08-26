export interface TeleprompterState {
  contentRaw: string
  contentHtml: string
  isPlaying: boolean
  scrollOffset: number
  lineHeightPx: number
  viewportHeightPx: number
  contentHeightPx: number
}

export interface PreferencesState {
  fontFamily: string
  fontSizePx: number
  lineHeight: number
  fgColor: string
  bgColor: string
  speedPxPerSec: number
  speedMin: number
  speedMax: number
  mirrorH: boolean
  mirrorV: boolean
  highlightBandLines: 1 | 2
  highlightBandPosPct: number // 0..100 from top
  dimmingIntensity: number // 0..1
}

export interface ScrollAnimation {
  startTime: number
  startOffset: number
  targetOffset: number
  duration: number
}

export interface FileImportResult {
  content: string
  filename: string
  success: boolean
  error?: string
}

export type MirrorMode = 'none' | 'horizontal' | 'vertical' | 'both'

export interface HotkeyDefinition {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  action: string
  description: string
}

export interface ToolbarAction {
  id: string
  icon: string
  label: string
  action: () => void
  disabled?: boolean
  visible?: boolean
}

export interface HighlightBand {
  top: number
  height: number
  visible: boolean
}
