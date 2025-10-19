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

// Font size adjustments
export const FONT_SIZE_STEP = 2 // px increment/decrement
export const SPEED_ADJUSTMENT_STEP = 5 // px/sec increment/decrement

// Line height calculation
export const LINE_HEIGHT_FALLBACK = 24 // px - used when measurement unavailable
export const NORMAL_LINE_HEIGHT_MULTIPLIER = 1.2 // multiplier for 'normal' line-height

// Highlight band
export const DEFAULT_HIGHLIGHT_BAND_LINES = 2
export const DEFAULT_HIGHLIGHT_BAND_POS = 40 // percent from top
export const DEFAULT_DIMMING_INTENSITY = 0.3

// Colors
export const DEFAULT_FG_COLOR = '#ffffff'
export const DEFAULT_BG_COLOR = '#000000'

// Additional theme colors
export const THEME_COLORS = {
  STATUS_BAR_DARK: '#1E1E1E',
  EDITOR_BG_LIGHT: '#fafafa',
  EDITOR_FG_DARK: '#333',
  EDITOR_CODE_BG: '#f5f5f5',
  EDITOR_BLOCKQUOTE_BORDER: '#ddd',
  EDITOR_BLOCKQUOTE_TEXT: '#666',
  EDITOR_HIGHLIGHT_BG: '#f0f0f0',
  EDITOR_PRE_BG: '#f8f8f8',
} as const

// Text alignment
export const DEFAULT_TEXT_ALIGNMENT = 'center'
export const TEXT_ALIGNMENTS = ['left', 'center', 'right'] as const
export type TextAlignment = (typeof TEXT_ALIGNMENTS)[number]

// Animation and timing
export const SCROLL_ANIMATION_DURATION = 200 // ms
export const SCROLL_SMOOTH_DURATION = 300 // ms for scrollTo operations
export const TOOLBAR_HIDE_DELAY = 3000 // ms
export const AUTOSCROLL_INTERVAL = 16 // ms (60fps)
export const SNACKBAR_TIMEOUT = 3000 // ms
export const GAMEPAD_MESSAGE_TIMEOUT = 3000 // ms
export const INSET_UPDATE_DELAY = 500 // ms
export const INSET_QUICK_UPDATE_DELAY = 100 // ms

// Touch and interaction
export const MIN_TOUCH_TARGET_SIZE = 44 // px
export const SWIPE_THRESHOLD = 50 // px
export const PRESS_AND_HOLD_DURATION = 500 // ms
export const TAP_DURATION_MAX = 300 // ms
export const TAP_MOVEMENT_MAX = 10 // px

// Padding and spacing
export const TELEPROMPTER_CONTENT_PADDING = 24 // px
export const VIEWPORT_PADDING_HEIGHT = '50vh' // CSS value
export const VIEWPORT_PADDING_MIN_HEIGHT = '300px' // CSS value

// UI Layout
export const FLOATING_TOOLBAR_Z_INDEX = 100
export const IMPLEMENTATION_TOGGLE_Z_INDEX = 2000
export const HIGHLIGHT_BAND_Z_INDEX = 10
export const DIMMING_OVERLAY_Z_INDEX = 5

// Menu and popover spacing
export const MENU_OFFSET = 16 // px
export const DIALOG_PADDING = 12 // px

// Settings constraints
export const SETTINGS_MAX_FONT_SIZE = 200 // px
export const SETTINGS_MIN_SPEED = 10 // px/sec
export const SETTINGS_MAX_SPEED = 300 // px/sec
export const SETTINGS_SPEED_MIN_CONSTRAINT = 1 // for validation
export const SETTINGS_SPEED_MAX_CONSTRAINT = 100 // for validation
export const SETTINGS_SPEED_STEP = 5 // for sliders

// Gamepad thresholds and virtual button ranges
export const GAMEPAD_AXIS_THRESHOLD = 0.5
export const GAMEPAD_VIRTUAL_BUTTON_AXIS_BASE = 1000
export const GAMEPAD_VIRTUAL_BUTTON_ACTIVITY_BASE = 2000
export const GAMEPAD_ACTIVITY_SENSOR_BUTTON = 2002
export const GAMEPAD_PRECISION_DIVISOR = 100 // for rounding axis values

// Window insets estimation
export const ANDROID_STATUS_BAR_MIN_HEIGHT = 24 // px
export const ANDROID_STATUS_BAR_SCREEN_RATIO = 0.03 // 3% of screen height
export const ANDROID_NAV_BAR_MIN_HEIGHT = 48 // px
export const ANDROID_NAV_BAR_SCREEN_RATIO = 0.06 // 6% of screen height

// Persistence keys
export const STORAGE_KEYS = {
  PREFERENCES: 'apuntador:preferences',
  CONTENT: 'apuntador:content',
  SCROLL_POSITION: 'apuntador:scrollPosition',
  DROPBOX_TOKEN: 'apuntador:dropbox_token',
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

// Hotkey alignment numbers
export const ALIGNMENT_HOTKEYS = {
  LEFT: '1',
  CENTER: '2',
  RIGHT: '3',
} as const

// Z-index hierarchy
export const Z_INDEX = {
  DIMMING_OVERLAY: 5,
  HIGHLIGHT_BAND: 10,
  FLOATING_TOOLBAR: 100,
  IMPLEMENTATION_TOGGLE: 2000,
} as const
