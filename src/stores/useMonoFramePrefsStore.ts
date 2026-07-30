import { defineStore } from 'pinia'
import { ref } from 'vue'
import { z } from 'zod'
import { storage } from '@/services/persistence'
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  MIN_FONT_SIZE,
  SETTINGS_MAX_FONT_SIZE,
  DEFAULT_FG_COLOR,
  DEFAULT_BG_COLOR,
  DEFAULT_TEXT_ALIGNMENT,
  TEXT_ALIGNMENTS,
  type TextAlignment,
  MONOSPACE_FONT_FAMILIES,
  DEFAULT_MONO_FONT_FAMILY,
  type MonospaceFontFamily,
  FONT_SIZE_STEP,
  STORAGE_KEYS,
} from '@/utils/constants'

/**
 * Appearance-only preferences for the monospace presenter frame
 * (TeleprompterFrameMono.vue), kept fully separate from usePrefsStore so the
 * markdown frame's look is never affected by editing the monospace frame's,
 * and vice versa - "the presenter's configuration is associated with each
 * frame." Behavior settings (scroll speed, highlight band, mirror,
 * hotkeys/gamepad) are NOT duplicated here; both frames share those via
 * usePrefsStore.
 */
const monoPreferencesSchema = z.object({
  fontFamily: z.enum(MONOSPACE_FONT_FAMILIES).default(DEFAULT_MONO_FONT_FAMILY),
  fontSizePx: z.number().min(MIN_FONT_SIZE).max(SETTINGS_MAX_FONT_SIZE).default(DEFAULT_FONT_SIZE),
  lineHeight: z.number().min(1).max(3).default(DEFAULT_LINE_HEIGHT),
  fgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default(DEFAULT_FG_COLOR),
  bgColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default(DEFAULT_BG_COLOR),
  textAlignment: z.enum(TEXT_ALIGNMENTS).default(DEFAULT_TEXT_ALIGNMENT as TextAlignment),
})

export type MonoPreferencesState = z.infer<typeof monoPreferencesSchema>

export const useMonoFramePrefsStore = defineStore('monoFramePreferences', () => {
  const fontFamily = ref<MonospaceFontFamily>(DEFAULT_MONO_FONT_FAMILY)
  const fontSizePx = ref(DEFAULT_FONT_SIZE)
  const lineHeight = ref(DEFAULT_LINE_HEIGHT)
  const fgColor = ref(DEFAULT_FG_COLOR)
  const bgColor = ref(DEFAULT_BG_COLOR)
  const textAlignment = ref<TextAlignment>(DEFAULT_TEXT_ALIGNMENT as TextAlignment)

  async function load() {
    try {
      const saved = await storage.get(STORAGE_KEYS.MONO_FRAME_PREFERENCES)
      if (saved) {
        const validated = monoPreferencesSchema.parse(saved)

        fontFamily.value = validated.fontFamily
        fontSizePx.value = validated.fontSizePx
        lineHeight.value = validated.lineHeight
        fgColor.value = validated.fgColor
        bgColor.value = validated.bgColor
        textAlignment.value = validated.textAlignment
      }
    } catch (error) {
      console.warn('Failed to load mono frame preferences, using defaults:', error)
      reset()
    }
  }

  async function save() {
    try {
      const prefs: MonoPreferencesState = {
        fontFamily: fontFamily.value,
        fontSizePx: fontSizePx.value,
        lineHeight: lineHeight.value,
        fgColor: fgColor.value,
        bgColor: bgColor.value,
        textAlignment: textAlignment.value,
      }

      await storage.set(STORAGE_KEYS.MONO_FRAME_PREFERENCES, prefs)
    } catch (error) {
      console.warn('Failed to save mono frame preferences:', error)
    }
  }

  function reset() {
    fontFamily.value = DEFAULT_MONO_FONT_FAMILY
    fontSizePx.value = DEFAULT_FONT_SIZE
    lineHeight.value = DEFAULT_LINE_HEIGHT
    fgColor.value = DEFAULT_FG_COLOR
    bgColor.value = DEFAULT_BG_COLOR
    textAlignment.value = DEFAULT_TEXT_ALIGNMENT as TextAlignment
  }

  function increaseFontSize() {
    fontSizePx.value = Math.min(SETTINGS_MAX_FONT_SIZE, fontSizePx.value + FONT_SIZE_STEP)
    save()
  }

  function decreaseFontSize() {
    fontSizePx.value = Math.max(MIN_FONT_SIZE, fontSizePx.value - FONT_SIZE_STEP)
    save()
  }

  function setFontFamily(family: MonospaceFontFamily) {
    fontFamily.value = family
    save()
  }

  function setTextAlignment(alignment: TextAlignment) {
    textAlignment.value = alignment
    save()
  }

  function setFgColor(color: string) {
    fgColor.value = color
    save()
  }

  function setBgColor(color: string) {
    bgColor.value = color
    save()
  }

  return {
    // State
    fontFamily,
    fontSizePx,
    lineHeight,
    fgColor,
    bgColor,
    textAlignment,

    // Actions
    load,
    save,
    reset,
    increaseFontSize,
    decreaseFontSize,
    setFontFamily,
    setTextAlignment,
    setFgColor,
    setBgColor,
  }
})
