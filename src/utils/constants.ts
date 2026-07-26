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

// Scroll mode (auto-scroll vs. voice-tracking)
export const DEFAULT_SCROLL_MODE = 'auto'
export const SCROLL_MODES = ['auto', 'voice'] as const
export type ScrollMode = (typeof SCROLL_MODES)[number]

// Speech tracking: supported recognition languages
export const SPEECH_LANGUAGES = ['es-ES', 'en-US'] as const
export type SpeechLanguage = (typeof SPEECH_LANGUAGES)[number]
export const DEFAULT_SPEECH_LANGUAGE: SpeechLanguage = 'en-US'

// Speech tracking: sliding-window alignment tuning
export const SPEECH_ALIGNMENT_QUERY_WORDS = 5 // last N recognized words used as the match query
export const SPEECH_ALIGNMENT_WINDOW_SIZE = 24 // look-ahead tokens scanned from the cursor
export const SPEECH_ALIGNMENT_CONFIDENCE_THRESHOLD = 0.4 // fuse.js score below which a match is confident (0=perfect)
export const SPEECH_ALIGNMENT_AMBIGUITY_EPSILON = 0.05 // max score gap still considered "tied"
export const SPEECH_ALIGNMENT_COMMIT_STREAK = 2 // consecutive interim events required before committing a cursor advance
export const SPEECH_NO_MATCH_TIMEOUT_MS = 4000 // listening with no confident commit for this long -> 'no-match' status
export const SPEECH_RESTART_DELAY_MS = 250 // delay before restarting recognition on 'end' - Chrome can throw
// InvalidStateError if start() is called synchronously within the 'end' handler, before its internal
// teardown finishes
export const SPEECH_SCROLL_ANIMATION_DURATION_MS = 700 // longer than SCROLL_SMOOTH_DURATION - commits land
// every few words rather than every frame, so a longer glide reads as continuous motion instead of
// discrete hops between commits

// Animation and timing
export const SCROLL_ANIMATION_DURATION = 200 // ms
export const SCROLL_SMOOTH_DURATION = 300 // ms for scrollTo operations
export const TOOLBAR_HIDE_DELAY = 3000 // ms
export const AUTOSCROLL_INTERVAL = 16 // ms (60fps)
export const SNACKBAR_TIMEOUT = 3000 // ms
export const GAMEPAD_MESSAGE_TIMEOUT = 3000 // ms
export const INSET_UPDATE_DELAY = 500 // ms
export const INSET_QUICK_UPDATE_DELAY = 100 // ms
export const OAUTH_TOKEN_ACTIVATION_DELAY = 1000 // ms - wait for a freshly issued token to become active

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
  // NOTE: PREFERENCES intentionally does not use the "apuntador:" prefix used
  // by the other keys below - it must stay 'preferences' to match what's
  // already persisted for existing users (see usePrefsStore.ts).
  PREFERENCES: 'preferences',
  CONTENT: 'apuntador:content',
  SCROLL_POSITION: 'apuntador:scrollPosition',
  DROPBOX_TOKEN: 'apuntador:dropbox_token',
  DROPBOX_REFRESH_TOKEN: 'apuntador:dropbox_refresh_token',
  GOOGLEDRIVE_TOKEN: 'apuntador:googledrive_token',
  GOOGLEDRIVE_REFRESH_TOKEN: 'apuntador:googledrive_refresh_token',
  // NOTE: these two also intentionally keep their existing (unprefixed)
  // values to match what's already persisted for existing users.
  LANGUAGE: 'apuntador-language',
  CLOUD_ACTIVE_PROVIDER: 'cloud_active_provider',
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
//
// Only covers values bound from templates/TS (component props, :style
// bindings) - most z-index values in this codebase live in scoped <style>
// blocks (plain CSS), which can't reference these constants without a
// SCSS<->TS variable bridge this project doesn't have. Those are left as
// literals rather than adding unused entries here.
export const Z_INDEX = {
  // Floating controls that must sit above fixed UI chrome and page content
  ALWAYS_ON_TOP: 9999,
  // Bottom sheets/dialogs that must sit above ALWAYS_ON_TOP
  ALWAYS_ON_TOP_NESTED: 10000,
} as const
