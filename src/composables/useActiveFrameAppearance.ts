/**
 * Single dispatch point for "which store owns appearance right now" - only
 * appearance (font family/size/line-height/colors/alignment) is per-frame;
 * everything else (scroll speed, highlight band, mirror, hotkeys/gamepad
 * mappings) stays shared via usePrefsStore regardless of which frame is
 * active. Used by TeleprompterPage.vue's hotkey/gamepad closures and by
 * ActionsMenu.vue's appearance controls, so the "which store" branching
 * isn't duplicated across both.
 */

import { computed } from 'vue'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useMonoFramePrefsStore } from '@/stores/useMonoFramePrefsStore'
import { MONOSPACE_FONT_FAMILIES, type TextAlignment, type MonospaceFontFamily } from '@/utils/constants'
import { SETTINGS_FONT_FAMILIES } from '@/composables/useSettingsActions'

export function useActiveFrameAppearance() {
  const prefsStore = usePrefsStore()
  const monoStore = useMonoFramePrefsStore()

  const isMono = computed(() => prefsStore.activeFrame === 'monospace')

  const fontFamily = computed(() => (isMono.value ? monoStore.fontFamily : prefsStore.fontFamily))
  const fontSizePx = computed(() => (isMono.value ? monoStore.fontSizePx : prefsStore.fontSizePx))
  const lineHeight = computed(() => (isMono.value ? monoStore.lineHeight : prefsStore.lineHeight))
  const fgColor = computed(() => (isMono.value ? monoStore.fgColor : prefsStore.fgColor))
  const bgColor = computed(() => (isMono.value ? monoStore.bgColor : prefsStore.bgColor))
  /** Voice-tracking highlight color - monospace frame only, no markdown-frame equivalent (voice mode requires it, see usePrefsStore.setScrollMode). */
  const voiceReadColor = computed(() => monoStore.voiceReadColor)
  const textAlignment = computed(() => (isMono.value ? monoStore.textAlignment : prefsStore.textAlignment))

  /** Restrict the picker to monospace choices while the mono frame is active - enforces "monospace only" in the UI, not just the schema. */
  const fontFamilyOptions = computed<readonly string[]>(() =>
    isMono.value ? MONOSPACE_FONT_FAMILIES : SETTINGS_FONT_FAMILIES
  )

  function increaseFontSize(): void {
    ;(isMono.value ? monoStore : prefsStore).increaseFontSize()
  }

  function decreaseFontSize(): void {
    ;(isMono.value ? monoStore : prefsStore).decreaseFontSize()
  }

  function setTextAlignment(alignment: TextAlignment): void {
    ;(isMono.value ? monoStore : prefsStore).setTextAlignment(alignment)
  }

  function setFontFamily(family: string): void {
    if (isMono.value) {
      monoStore.setFontFamily(family as MonospaceFontFamily)
    } else {
      prefsStore.fontFamily = family
      prefsStore.save()
    }
  }

  function setFgColor(color: string): void {
    if (isMono.value) {
      monoStore.setFgColor(color)
    } else {
      prefsStore.fgColor = color
      prefsStore.save()
    }
  }

  function setBgColor(color: string): void {
    if (isMono.value) {
      monoStore.setBgColor(color)
    } else {
      prefsStore.bgColor = color
      prefsStore.save()
    }
  }

  function setVoiceReadColor(color: string): void {
    monoStore.setVoiceReadColor(color)
  }

  function setLineHeight(value: number): void {
    if (isMono.value) {
      monoStore.lineHeight = value
      monoStore.save()
    } else {
      prefsStore.lineHeight = value
      prefsStore.save()
    }
  }

  function setFontSizePx(value: number): void {
    if (isMono.value) {
      monoStore.fontSizePx = value
      monoStore.save()
    } else {
      prefsStore.fontSizePx = value
      prefsStore.save()
    }
  }

  return {
    isMono,
    fontFamily,
    fontSizePx,
    lineHeight,
    fgColor,
    bgColor,
    voiceReadColor,
    textAlignment,
    fontFamilyOptions,
    increaseFontSize,
    decreaseFontSize,
    setTextAlignment,
    setFontFamily,
    setFgColor,
    setBgColor,
    setVoiceReadColor,
    setLineHeight,
    setFontSizePx,
  }
}
