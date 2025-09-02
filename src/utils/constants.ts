// Application constants
export const APP_NAME = 'Apuntador'
export const APP_VERSION = '1.0.0'

// Default preferences
export const DEFAULT_FONT_SIZE = 24
export const DEFAULT_LINE_HEIGHT = 1.4
export const DEFAULT_SCROLL_SPEED = 50 // pixels per second
export const MIN_SCROLL_SPEED = 10
export const MAX_SCROLL_SPEED = 200
export const MIN_FONT_SIZE = 16
export const MAX_FONT_SIZE = 200

// Highlight band
export const DEFAULT_HIGHLIGHT_BAND_LINES = 2
export const DEFAULT_HIGHLIGHT_BAND_POS = 40 // percent from top
export const DEFAULT_DIMMING_INTENSITY = 0.3

// Colors
export const DEFAULT_FG_COLOR = '#ffffff'
export const DEFAULT_BG_COLOR = '#000000'

// Text alignment
export const DEFAULT_TEXT_ALIGNMENT = 'center'
export const TEXT_ALIGNMENTS = ['left', 'center', 'right'] as const
export type TextAlignment = (typeof TEXT_ALIGNMENTS)[number]

// Animation
export const SCROLL_ANIMATION_DURATION = 200 // ms
export const TOOLBAR_HIDE_DELAY = 3000 // ms
export const AUTOSCROLL_INTERVAL = 16 // ms (60fps)

// Touch and interaction
export const MIN_TOUCH_TARGET_SIZE = 44 // px
export const SWIPE_THRESHOLD = 50 // px
export const PRESS_AND_HOLD_DURATION = 500 // ms

// Persistence keys
export const STORAGE_KEYS = {
  PREFERENCES: 'apuntador:preferences',
  CONTENT: 'apuntador:content',
  SCROLL_POSITION: 'apuntador:scrollPosition',
} as const

// Breakpoints (matching Vuetify)
export const BREAKPOINTS = {
  XS: 600,
  SM: 960,
  MD: 1264,
  LG: 1904,
} as const

// Line stepping
export const STEP_SIZES = {
  SINGLE: 1,
  SMALL: 3,
  LARGE: 5,
  PAGE: 10,
} as const
