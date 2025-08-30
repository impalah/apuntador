import { defineStore } from 'pinia'
import { ref } from 'vue'
import { z } from 'zod'
import { storage } from '@/utils/persistence'
import type { CustomHotkeyMapping, HotkeyDefinition } from '@/types'
import { createDefaultMapping } from '@/utils/hotkeys'
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_SCROLL_SPEED,
  MIN_SCROLL_SPEED,
  MAX_SCROLL_SPEED,
  DEFAULT_FG_COLOR,
  DEFAULT_BG_COLOR,
  DEFAULT_HIGHLIGHT_BAND_LINES,
  DEFAULT_HIGHLIGHT_BAND_POS,
  DEFAULT_DIMMING_INTENSITY,
} from '@/utils/constants'

// Zod schema for preferences validation
const preferencesSchema = z.object({
  fontFamily: z.string().default('Roboto, sans-serif'),
  fontSizePx: z.number().min(12).max(300).default(DEFAULT_FONT_SIZE),
  lineHeight: z.number().min(1).max(3).default(DEFAULT_LINE_HEIGHT),
  fgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default(DEFAULT_FG_COLOR),
  bgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default(DEFAULT_BG_COLOR),
  speedPxPerSec: z
    .number()
    .min(MIN_SCROLL_SPEED)
    .max(MAX_SCROLL_SPEED)
    .default(DEFAULT_SCROLL_SPEED),
  speedMin: z.number().min(1).max(100).default(MIN_SCROLL_SPEED),
  speedMax: z.number().min(50).max(500).default(MAX_SCROLL_SPEED),
  mirrorH: z.boolean().default(false),
  mirrorV: z.boolean().default(false),
  highlightBandLines: z.union([z.literal(1), z.literal(2)]).default(DEFAULT_HIGHLIGHT_BAND_LINES),
  highlightBandPosPct: z.number().min(0).max(100).default(DEFAULT_HIGHLIGHT_BAND_POS),
  dimmingIntensity: z.number().min(0).max(1).default(DEFAULT_DIMMING_INTENSITY),
  customHotkeys: z
    .record(
      z.object({
        key: z.string(),
        ctrlKey: z.boolean().optional(),
        altKey: z.boolean().optional(),
        shiftKey: z.boolean().optional(),
        action: z.string(),
        description: z.string(),
      })
    )
    .optional()
    .default({}),
})

export type PreferencesState = z.infer<typeof preferencesSchema>

export const usePrefsStore = defineStore('preferences', () => {
  // State with defaults
  const fontFamily = ref('Roboto, sans-serif')
  const fontSizePx = ref(DEFAULT_FONT_SIZE)
  const lineHeight = ref(DEFAULT_LINE_HEIGHT)
  const fgColor = ref(DEFAULT_FG_COLOR)
  const bgColor = ref(DEFAULT_BG_COLOR)
  const speedPxPerSec = ref(DEFAULT_SCROLL_SPEED)
  const speedMin = ref(MIN_SCROLL_SPEED)
  const speedMax = ref(MAX_SCROLL_SPEED)
  const mirrorH = ref(false)
  const mirrorV = ref(false)
  const highlightBandLines = ref<1 | 2>(DEFAULT_HIGHLIGHT_BAND_LINES)
  const highlightBandPosPct = ref(DEFAULT_HIGHLIGHT_BAND_POS)
  const dimmingIntensity = ref(DEFAULT_DIMMING_INTENSITY)
  const customHotkeys = ref<CustomHotkeyMapping>(createDefaultMapping())

  // Actions
  async function load() {
    try {
      const saved = await storage.get('preferences')
      if (saved) {
        const validated = preferencesSchema.parse(saved)

        fontFamily.value = validated.fontFamily
        fontSizePx.value = validated.fontSizePx
        lineHeight.value = validated.lineHeight
        fgColor.value = validated.fgColor
        bgColor.value = validated.bgColor
        speedPxPerSec.value = validated.speedPxPerSec
        speedMin.value = validated.speedMin
        speedMax.value = validated.speedMax
        mirrorH.value = validated.mirrorH
        mirrorV.value = validated.mirrorV
        highlightBandLines.value = validated.highlightBandLines
        highlightBandPosPct.value = validated.highlightBandPosPct
        dimmingIntensity.value = validated.dimmingIntensity

        // Handle custom hotkeys with fallback to defaults
        const hotkeyCount = Object.keys(validated.customHotkeys || {}).length

        customHotkeys.value = hotkeyCount > 0 ? validated.customHotkeys : createDefaultMapping()
      }
    } catch (error) {
      console.warn('Failed to load preferences, using defaults:', error)
      reset()
    }
  }

  async function save() {
    try {
      const prefs: PreferencesState = {
        fontFamily: fontFamily.value,
        fontSizePx: fontSizePx.value,
        lineHeight: lineHeight.value,
        fgColor: fgColor.value,
        bgColor: bgColor.value,
        speedPxPerSec: speedPxPerSec.value,
        speedMin: speedMin.value,
        speedMax: speedMax.value,
        mirrorH: mirrorH.value,
        mirrorV: mirrorV.value,
        highlightBandLines: highlightBandLines.value,
        highlightBandPosPct: highlightBandPosPct.value,
        dimmingIntensity: dimmingIntensity.value,
        customHotkeys: customHotkeys.value,
      }

      await storage.set('preferences', prefs)
    } catch (error) {
      console.warn('Failed to save preferences:', error)
    }
  }

  function reset() {
    fontFamily.value = 'Roboto, sans-serif'
    fontSizePx.value = DEFAULT_FONT_SIZE
    lineHeight.value = DEFAULT_LINE_HEIGHT
    fgColor.value = DEFAULT_FG_COLOR
    bgColor.value = DEFAULT_BG_COLOR
    speedPxPerSec.value = DEFAULT_SCROLL_SPEED
    speedMin.value = MIN_SCROLL_SPEED
    speedMax.value = MAX_SCROLL_SPEED
    mirrorH.value = false
    mirrorV.value = false
    highlightBandLines.value = DEFAULT_HIGHLIGHT_BAND_LINES
    highlightBandPosPct.value = DEFAULT_HIGHLIGHT_BAND_POS
    dimmingIntensity.value = DEFAULT_DIMMING_INTENSITY
    customHotkeys.value = createDefaultMapping()
  }

  // Convenience actions for common adjustments
  function increaseFontSize() {
    fontSizePx.value = Math.min(300, fontSizePx.value + 2)
    save()
  }

  function decreaseFontSize() {
    fontSizePx.value = Math.max(12, fontSizePx.value - 2)
    save()
  }

  function increaseSpeed() {
    speedPxPerSec.value = Math.min(speedMax.value, speedPxPerSec.value + 5)
    save()
  }

  function decreaseSpeed() {
    speedPxPerSec.value = Math.max(speedMin.value, speedPxPerSec.value - 5)
    save()
  }

  function toggleMirrorH() {
    mirrorH.value = !mirrorH.value
    save()
  }

  function toggleMirrorV() {
    mirrorV.value = !mirrorV.value
    save()
  }

  // CSS custom properties for reactive styling
  function applyCSSVariables() {
    const root = document.documentElement
    root.style.setProperty('--font-family', fontFamily.value)
    root.style.setProperty('--font-size', `${fontSizePx.value}px`)
    root.style.setProperty('--line-height', lineHeight.value.toString())
    root.style.setProperty('--teleprompter-fg', fgColor.value)
    root.style.setProperty('--teleprompter-bg', bgColor.value)
    root.style.setProperty('--dimming-intensity', dimmingIntensity.value.toString())
  }

  // Hotkey management
  function updateHotkey(action: string, hotkey: HotkeyDefinition) {
    customHotkeys.value = {
      ...customHotkeys.value,
      [action]: hotkey,
    }
    save()
  }

  function resetHotkeys() {
    customHotkeys.value = createDefaultMapping()
    save()
  }

  return {
    // State
    fontFamily,
    fontSizePx,
    lineHeight,
    fgColor,
    bgColor,
    speedPxPerSec,
    speedMin,
    speedMax,
    mirrorH,
    mirrorV,
    highlightBandLines,
    highlightBandPosPct,
    dimmingIntensity,
    customHotkeys,

    // Actions
    load,
    save,
    reset,
    increaseFontSize,
    decreaseFontSize,
    increaseSpeed,
    decreaseSpeed,
    toggleMirrorH,
    toggleMirrorV,
    applyCSSVariables,
    updateHotkey,
    resetHotkeys,
  }
})
