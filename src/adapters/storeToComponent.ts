/**
 * Store to Component Adapter
 *
 * This adapter converts Pinia store data to the format expected by
 * modular components, enabling seamless integration between the existing
 * store-based architecture and the new component interfaces.
 */

import { computed, type ComputedRef } from 'vue'
import { useTeleprompterStore } from '@/stores/useTeleprompterStore'
import { usePrefsStore } from '@/stores/usePrefsStore'
import type {
  TeleprompterFrameProps,
  TeleprompterContent,
  ScrollState,
  DisplayPreferences,
  HighlightBandConfig,
  SpeedConfig,
  FloatingToolbarProps,
} from '@/types/component-interfaces'

/**
 * Creates reactive props for TeleprompterFrameV2 from Pinia stores
 */
export function useTeleprompterFrameProps(): ComputedRef<TeleprompterFrameProps> {
  const teleprompterStore = useTeleprompterStore()
  const prefsStore = usePrefsStore()

  return computed<TeleprompterFrameProps>(() => ({
    content: {
      raw: teleprompterStore.contentRaw,
      html: teleprompterStore.contentHtml,
    } as TeleprompterContent,

    scrollState: {
      offset: teleprompterStore.scrollOffset,
      isPlaying: teleprompterStore.isPlaying,
      canScrollUp: teleprompterStore.scrollOffset > 0,
      canScrollDown: teleprompterStore.scrollOffset < teleprompterStore.maxOffset,
      progress:
        teleprompterStore.maxOffset > 0
          ? (teleprompterStore.scrollOffset / teleprompterStore.maxOffset) * 100
          : 0,
    } as ScrollState,

    displayPrefs: {
      fontFamily: prefsStore.fontFamily,
      fontSizePx: prefsStore.fontSizePx,
      lineHeight: prefsStore.lineHeight,
      fgColor: prefsStore.fgColor,
      bgColor: prefsStore.bgColor,
      mirrorH: prefsStore.mirrorH,
      mirrorV: prefsStore.mirrorV,
      textAlignment: prefsStore.textAlignment,
    } as DisplayPreferences,

    highlightBand: {
      lines: prefsStore.highlightBandLines,
      positionPct: prefsStore.highlightBandPosPct,
      dimmingIntensity: prefsStore.dimmingIntensity,
      enabled: prefsStore.highlightBandLines > 0,
    } as HighlightBandConfig,
  }))
}

/**
 * Creates reactive props for FloatingToolbar from Pinia stores
 */
export function useFloatingToolbarProps(): ComputedRef<FloatingToolbarProps> {
  const teleprompterStore = useTeleprompterStore()
  const prefsStore = usePrefsStore()

  return computed<FloatingToolbarProps>(() => ({
    scrollState: {
      offset: teleprompterStore.scrollOffset,
      isPlaying: teleprompterStore.isPlaying,
      canScrollUp: teleprompterStore.scrollOffset > 0,
      canScrollDown: teleprompterStore.scrollOffset < teleprompterStore.maxOffset,
      progress:
        teleprompterStore.maxOffset > 0
          ? (teleprompterStore.scrollOffset / teleprompterStore.maxOffset) * 100
          : 0,
    } as ScrollState,

    speedConfig: {
      current: prefsStore.speedPxPerSec,
      min: prefsStore.speedMin,
      max: prefsStore.speedMax,
    } as SpeedConfig,

    displayPrefs: {
      fontFamily: prefsStore.fontFamily,
      fontSizePx: prefsStore.fontSizePx,
      lineHeight: prefsStore.lineHeight,
      fgColor: prefsStore.fgColor,
      bgColor: prefsStore.bgColor,
      mirrorH: prefsStore.mirrorH,
      mirrorV: prefsStore.mirrorV,
      textAlignment: prefsStore.textAlignment,
    } as DisplayPreferences,

    isVisible: true, // This would come from toolbar visibility logic
    isMinimal: false, // This would come from responsive logic
  }))
}

/**
 * Event handlers that bridge component events to store actions
 */
export function useTeleprompterFrameEventHandlers() {
  const teleprompterStore = useTeleprompterStore()
  const prefsStore = usePrefsStore()

  return {
    onContentHeightChanged: (height: number) => {
      // Update store with new content height
      teleprompterStore.setViewportHeight(height)
    },

    onViewportHeightChanged: (height: number) => {
      // Update store with new viewport height
      teleprompterStore.setViewportHeight(height)
    },

    onTap: () => {
      // Handle tap events (might toggle toolbar visibility)
      console.log('Tap detected')
    },

    onSwipeUp: () => {
      // Handle swipe up (scroll down)
      teleprompterStore.stepLines(-1)
    },

    onSwipeDown: () => {
      // Handle swipe down (scroll up)
      teleprompterStore.stepLines(1)
    },

    onPressHold: () => {
      // Handle press and hold (might show toolbar)
      console.log('Press and hold detected')
    },
  }
}

/**
 * Event handlers for FloatingToolbar
 */
export function useFloatingToolbarEventHandlers() {
  const teleprompterStore = useTeleprompterStore()
  const prefsStore = usePrefsStore()

  return {
    onPlay: () => {
      teleprompterStore.play()
    },

    onPause: () => {
      teleprompterStore.pause()
    },

    onTogglePlay: () => {
      teleprompterStore.toggle()
    },

    onStepLines: (count: number) => {
      teleprompterStore.stepLines(count)
    },

    onGoHome: () => {
      teleprompterStore.toHome()
    },

    onGoEnd: () => {
      teleprompterStore.toEnd()
    },

    onSpeedChange: (speed: number) => {
      prefsStore.speedPxPerSec = speed
    },

    onFontSizeChange: (size: number) => {
      prefsStore.fontSizePx = size
    },

    onMirrorToggle: (axis: 'h' | 'v') => {
      if (axis === 'h') {
        prefsStore.mirrorH = !prefsStore.mirrorH
      } else {
        prefsStore.mirrorV = !prefsStore.mirrorV
      }
    },

    onOpenEditor: () => {
      // This would be handled by the parent component
      console.log('Open editor requested')
    },

    onOpenSettings: () => {
      // This would be handled by the parent component
      console.log('Open settings requested')
    },

    onOpenFile: () => {
      // This would be handled by the parent component
      console.log('Open file requested')
    },
  }
}

/**
 * Event handlers for HighlightBand
 */
export function useHighlightBandEventHandlers() {
  const prefsStore = usePrefsStore()

  return {
    onPositionChange: (positionPct: number) => {
      prefsStore.highlightBandPosPct = positionPct
    },

    onConfigChange: (config: Partial<HighlightBandConfig>) => {
      if (config.lines !== undefined) {
        prefsStore.highlightBandLines = config.lines
      }
      if (config.positionPct !== undefined) {
        prefsStore.highlightBandPosPct = config.positionPct
      }
      if (config.dimmingIntensity !== undefined) {
        prefsStore.dimmingIntensity = config.dimmingIntensity
      }
    },
  }
}
