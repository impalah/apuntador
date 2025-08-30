/**
 * Component Interface Definitions
 *
 * These interfaces define the contracts for component communication,
 * enabling different implementations to be swapped without breaking changes.
 */

// ========================================
// Core Data Types
// ========================================

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
}

export interface HighlightBandConfig {
  lines: 1 | 2
  positionPct: number // 0-100 from top
  dimmingIntensity: number // 0-1
  enabled: boolean
}

export interface SpeedConfig {
  current: number
  min: number
  max: number
}

// ========================================
// Component Event Interfaces
// ========================================

export interface TeleprompterEvents {
  'content-height-changed': [height: number]
  'viewport-height-changed': [height: number]
  tap: []
  'swipe-up': []
  'swipe-down': []
  'press-hold': []
}

export interface ToolbarEvents {
  play: []
  pause: []
  'toggle-play': []
  'step-lines': [count: number]
  'go-home': []
  'go-end': []
  'speed-change': [speed: number]
  'font-size-change': [size: number]
  'mirror-toggle': ['h' | 'v']
  'open-editor': []
  'open-settings': []
  'open-file': []
}

export interface HighlightBandEvents {
  'position-change': [positionPct: number]
  'config-change': [config: Partial<HighlightBandConfig>]
}

// ========================================
// Component Props Interfaces
// ========================================

export interface TeleprompterFrameProps {
  content: TeleprompterContent
  scrollState: ScrollState
  displayPrefs: DisplayPreferences
  highlightBand: HighlightBandConfig
}

export interface FloatingToolbarProps {
  scrollState: ScrollState
  speedConfig: SpeedConfig
  displayPrefs: DisplayPreferences
  isVisible: boolean
  isMinimal?: boolean
}

export interface HighlightBandProps {
  config: HighlightBandConfig
  viewportHeight: number
  lineHeight: number
}

// ========================================
// Service Interfaces (for business logic)
// ========================================

export interface IScrollService {
  play(): void
  pause(): void
  toggle(): void
  stepLines(count: number): void
  goToHome(): void
  goToEnd(): void
  setOffset(offset: number): void
  getState(): ScrollState
  onStateChange(callback: (state: ScrollState) => void): () => void
}

export interface IContentService {
  setContent(raw: string): Promise<void>
  getContent(): TeleprompterContent
  compileMarkdown(raw: string): Promise<string>
  onContentChange(callback: (content: TeleprompterContent) => void): () => void
}

export interface IPreferencesService {
  getDisplayPrefs(): DisplayPreferences
  getSpeedConfig(): SpeedConfig
  getHighlightBandConfig(): HighlightBandConfig
  updateDisplayPrefs(prefs: Partial<DisplayPreferences>): Promise<void>
  updateSpeedConfig(config: Partial<SpeedConfig>): Promise<void>
  updateHighlightBandConfig(config: Partial<HighlightBandConfig>): Promise<void>
  onPrefsChange(callback: (prefs: DisplayPreferences) => void): () => void
}

export interface IPersistenceService {
  save<T>(key: string, data: T): Promise<void>
  load<T>(key: string): Promise<T | null>
  clear(key: string): Promise<void>
  clearAll(): Promise<void>
}

// ========================================
// Component Factory Interfaces
// ========================================

export interface ITeleprompterFrameComponent {
  name: string
  version: string
  description: string
  props: TeleprompterFrameProps
  events: TeleprompterEvents
  component: any // Vue component
}

export interface IFloatingToolbarComponent {
  name: string
  version: string
  description: string
  props: FloatingToolbarProps
  events: ToolbarEvents
  component: any // Vue component
}

export interface IHighlightBandComponent {
  name: string
  version: string
  description: string
  props: HighlightBandProps
  events: HighlightBandEvents
  component: any // Vue component
}

// ========================================
// Application Configuration
// ========================================

export interface AppComponentConfig {
  teleprompterFrame: ITeleprompterFrameComponent
  floatingToolbar: IFloatingToolbarComponent
  highlightBand: IHighlightBandComponent
}

export interface AppServiceConfig {
  scrollService: IScrollService
  contentService: IContentService
  preferencesService: IPreferencesService
  persistenceService: IPersistenceService
}

// ========================================
// Plugin System (for future extensions)
// ========================================

export interface IAppPlugin {
  name: string
  version: string
  install(app: any, config?: any): void | Promise<void>
  dependencies?: string[]
}

export interface IComponentPlugin extends IAppPlugin {
  components: {
    teleprompterFrame?: ITeleprompterFrameComponent
    floatingToolbar?: IFloatingToolbarComponent
    highlightBand?: IHighlightBandComponent
  }
}
