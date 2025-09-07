import { defineStore } from 'pinia'
import { ref } from 'vue'
import { z } from 'zod'
import { storage } from '@/utils/persistence'
import type {
  CustomHotkeyMapping,
  HotkeyDefinition,
  CustomGamepadMapping,
  GamepadMapping,
} from '@/types'
import { createDefaultMapping, createDefaultGamepadMapping } from '@/utils/hotkeys'
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
  DEFAULT_TEXT_ALIGNMENT,
  TEXT_ALIGNMENTS,
  type TextAlignment,
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
  textAlignment: z.enum(TEXT_ALIGNMENTS).default(DEFAULT_TEXT_ALIGNMENT as TextAlignment),
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
  customGamepadMappings: z
    .record(
      z.object({
        buttonIndex: z.number().nullable(),
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
  const textAlignment = ref<TextAlignment>(DEFAULT_TEXT_ALIGNMENT as TextAlignment)
  const customHotkeys = ref<CustomHotkeyMapping>(createDefaultMapping())
  const customGamepadMappings = ref<CustomGamepadMapping>(createDefaultGamepadMapping())

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
        textAlignment.value = validated.textAlignment

        // Handle custom hotkeys with fallback to defaults
        const hotkeyCount = Object.keys(validated.customHotkeys || {}).length

        customHotkeys.value = hotkeyCount > 0 ? validated.customHotkeys : createDefaultMapping()

        // Handle custom gamepad mappings with fallback to defaults
        const gamepadMappingCount = Object.keys(validated.customGamepadMappings || {}).length

        customGamepadMappings.value =
          gamepadMappingCount > 0 ? validated.customGamepadMappings : createDefaultGamepadMapping()
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
        textAlignment: textAlignment.value,
        customHotkeys: customHotkeys.value,
        customGamepadMappings: customGamepadMappings.value,
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
    textAlignment.value = DEFAULT_TEXT_ALIGNMENT as TextAlignment
    customHotkeys.value = createDefaultMapping()
    customGamepadMappings.value = createDefaultGamepadMapping()
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

  function setTextAlignment(alignment: TextAlignment) {
    textAlignment.value = alignment
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
    root.style.setProperty('--text-alignment', textAlignment.value)
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

  /**
   * Update a gamepad mapping
   */
  function updateGamepadMapping(action: string, buttonIndex: number | null) {
    if (customGamepadMappings.value[action]) {
      customGamepadMappings.value[action].buttonIndex = buttonIndex
      save()
    }
  }

  /**
   * Reset gamepad mappings to defaults (all set to null/none)
   */
  function resetGamepadMappings() {
    customGamepadMappings.value = createDefaultGamepadMapping()
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
    textAlignment,
    customHotkeys,
    customGamepadMappings,

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
    setTextAlignment,
    applyCSSVariables,
    updateHotkey,
    resetHotkeys,
    updateGamepadMapping,
    resetGamepadMappings,
  }
})
