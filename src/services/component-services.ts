/**
 * Service implementations that provide clean abstractions
 * between components and Pinia stores
 */

import { computed, watch, type Ref } from 'vue'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import type {
  IScrollService,
  IContentService,
  IPreferencesService,
  ScrollState,
  TeleprompterContent,
  DisplayPreferences,
  SpeedConfig,
  HighlightBandConfig,
} from '@/types/component-interfaces'

// ========================================
// Scroll Service Implementation
// ========================================

export class ScrollService implements IScrollService {
  private teleprompterStore = useTeleprompterStore()
  private callbacks: Set<(state: ScrollState) => void> = new Set()

  constructor() {
    // Watch for state changes and notify subscribers
    watch(
      () => this.getState(),
      (newState) => {
        this.callbacks.forEach((callback) => callback(newState))
      },
      { deep: true }
    )
  }

  play(): void {
    this.teleprompterStore.play()
  }

  pause(): void {
    this.teleprompterStore.pause()
  }

  toggle(): void {
    this.teleprompterStore.toggle()
  }

  stepLines(count: number): void {
    this.teleprompterStore.stepLines(count)
  }

  goToHome(): void {
    this.teleprompterStore.toHome()
  }

  goToEnd(): void {
    this.teleprompterStore.toEnd()
  }

  setOffset(offset: number): void {
    this.teleprompterStore.updateScrollOffset(offset)
  }

  getState(): ScrollState {
    return {
      offset: this.teleprompterStore.scrollOffset,
      isPlaying: this.teleprompterStore.isPlaying,
      canScrollUp: this.teleprompterStore.canScrollUp,
      canScrollDown: this.teleprompterStore.canScrollDown,
      progress: this.teleprompterStore.scrollProgress,
    }
  }

  onStateChange(callback: (state: ScrollState) => void): () => void {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }
}

// ========================================
// Content Service Implementation
// ========================================

export class ContentService implements IContentService {
  private teleprompterStore = useTeleprompterStore()
  private callbacks: Set<(content: TeleprompterContent) => void> = new Set()

  constructor() {
    // Watch for content changes and notify subscribers
    watch(
      () => this.getContent(),
      (newContent) => {
        this.callbacks.forEach((callback) => callback(newContent))
      },
      { deep: true }
    )
  }

  async setContent(raw: string): Promise<void> {
    await this.teleprompterStore.setContent(raw)
  }

  getContent(): TeleprompterContent {
    return {
      raw: this.teleprompterStore.contentRaw,
      html: this.teleprompterStore.contentHtml,
    }
  }

  async compileMarkdown(raw: string): Promise<string> {
    // This could be extracted to use the markdown utility directly
    // if we want to compile without setting the store content
    await this.teleprompterStore.setContent(raw)
    return this.teleprompterStore.contentHtml
  }

  onContentChange(callback: (content: TeleprompterContent) => void): () => void {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }
}

// ========================================
// Preferences Service Implementation
// ========================================

export class PreferencesService implements IPreferencesService {
  private prefsStore = usePrefsStore()
  private callbacks: Set<(prefs: DisplayPreferences) => void> = new Set()

  constructor() {
    // Watch for preference changes and notify subscribers
    watch(
      () => this.getDisplayPrefs(),
      (newPrefs) => {
        this.callbacks.forEach((callback) => callback(newPrefs))
      },
      { deep: true }
    )
  }

  getDisplayPrefs(): DisplayPreferences {
    return {
      fontFamily: this.prefsStore.fontFamily,
      fontSizePx: this.prefsStore.fontSizePx,
      lineHeight: this.prefsStore.lineHeight,
      fgColor: this.prefsStore.fgColor,
      bgColor: this.prefsStore.bgColor,
      mirrorH: this.prefsStore.mirrorH,
      mirrorV: this.prefsStore.mirrorV,
    }
  }

  getSpeedConfig(): SpeedConfig {
    return {
      current: this.prefsStore.speedPxPerSec,
      min: this.prefsStore.speedMin,
      max: this.prefsStore.speedMax,
    }
  }

  getHighlightBandConfig(): HighlightBandConfig {
    return {
      lines: this.prefsStore.highlightBandLines,
      positionPct: this.prefsStore.highlightBandPosPct,
      dimmingIntensity: this.prefsStore.dimmingIntensity,
      enabled: this.prefsStore.highlightBandLines > 0,
    }
  }

  async updateDisplayPrefs(prefs: Partial<DisplayPreferences>): Promise<void> {
    if (prefs.fontFamily !== undefined) {
      this.prefsStore.fontFamily = prefs.fontFamily
    }
    if (prefs.fontSizePx !== undefined) {
      this.prefsStore.fontSizePx = prefs.fontSizePx
    }
    if (prefs.lineHeight !== undefined) {
      this.prefsStore.lineHeight = prefs.lineHeight
    }
    if (prefs.fgColor !== undefined) {
      this.prefsStore.fgColor = prefs.fgColor
    }
    if (prefs.bgColor !== undefined) {
      this.prefsStore.bgColor = prefs.bgColor
    }
    if (prefs.mirrorH !== undefined) {
      this.prefsStore.mirrorH = prefs.mirrorH
    }
    if (prefs.mirrorV !== undefined) {
      this.prefsStore.mirrorV = prefs.mirrorV
    }

    await this.prefsStore.save()
    this.prefsStore.applyCSSVariables()
  }

  async updateSpeedConfig(config: Partial<SpeedConfig>): Promise<void> {
    if (config.current !== undefined) {
      this.prefsStore.speedPxPerSec = config.current
    }
    if (config.min !== undefined) {
      this.prefsStore.speedMin = config.min
    }
    if (config.max !== undefined) {
      this.prefsStore.speedMax = config.max
    }

    await this.prefsStore.save()
  }

  async updateHighlightBandConfig(config: Partial<HighlightBandConfig>): Promise<void> {
    if (config.lines !== undefined) {
      this.prefsStore.highlightBandLines = config.lines
    }
    if (config.positionPct !== undefined) {
      this.prefsStore.highlightBandPosPct = config.positionPct
    }
    if (config.dimmingIntensity !== undefined) {
      this.prefsStore.dimmingIntensity = config.dimmingIntensity
    }

    await this.prefsStore.save()
  }

  onPrefsChange(callback: (prefs: DisplayPreferences) => void): () => void {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }
}

// ========================================
// Service Factory
// ========================================

let scrollServiceInstance: ScrollService | null = null
let contentServiceInstance: ContentService | null = null
let preferencesServiceInstance: PreferencesService | null = null

export function createScrollService(): ScrollService {
  if (!scrollServiceInstance) {
    scrollServiceInstance = new ScrollService()
  }
  return scrollServiceInstance
}

export function createContentService(): ContentService {
  if (!contentServiceInstance) {
    contentServiceInstance = new ContentService()
  }
  return contentServiceInstance
}

export function createPreferencesService(): PreferencesService {
  if (!preferencesServiceInstance) {
    preferencesServiceInstance = new PreferencesService()
  }
  return preferencesServiceInstance
}

// ========================================
// Service Provider Composable
// ========================================

export function useServices() {
  return {
    scrollService: createScrollService(),
    contentService: createContentService(),
    preferencesService: createPreferencesService(),
  }
}
