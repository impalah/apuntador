import { computed } from 'vue'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useI18nStore } from '@/stores/useI18nStore'
import { useGamepad } from '@/utils/input/gamepad'
import { storage } from '@/services/persistence'
import { getVersionInfo } from '@/utils/version'
import type { HotkeyDefinition } from '@/types'

export const SETTINGS_FONT_FAMILIES = [
  'Roboto, sans-serif',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Monaco, monospace',
  'system-ui, sans-serif',
]

/**
 * Preferences/hotkeys/gamepad/data-management actions shared by ActionsMenu
 * and SettingsDialog, which both render the same settings form in different
 * layouts (bottom sheet vs dialog).
 */
export function useSettingsActions() {
  const prefsStore = usePrefsStore()
  const i18nStore = useI18nStore()
  const gamepadComposable = useGamepad()

  const versionInfo = getVersionInfo()
  const gamepadSupported = computed(() => gamepadComposable.isSupported.value)
  const connectedGamepads = computed(() => gamepadComposable.connectedGamepads.value.length)

  async function savePrefs() {
    await prefsStore.save()
    prefsStore.applyCSSVariables()
  }

  async function onResetSettings() {
    prefsStore.reset()
    i18nStore.changeLanguage('auto')
    await prefsStore.save()
    prefsStore.applyCSSVariables()
  }

  async function onResetHotkeys() {
    prefsStore.resetHotkeys()
    await prefsStore.save()
  }

  function onHotkeyChange(action: string, hotkey: HotkeyDefinition) {
    prefsStore.updateHotkey(action, hotkey)
  }

  async function onResetGamepadMappings() {
    prefsStore.resetGamepadMappings()
    await prefsStore.save()
  }

  function onGamepadMappingChange(action: string, buttonIndex: number | null) {
    prefsStore.updateGamepadMapping(action, buttonIndex)
  }

  async function onClearAllData(confirmMessage: string) {
    if (confirm(confirmMessage)) {
      await storage.clear()
      prefsStore.reset()
      prefsStore.applyCSSVariables()
      globalThis.location.reload()
    }
  }

  return {
    prefsStore,
    i18nStore,
    fontFamilies: SETTINGS_FONT_FAMILIES,
    versionInfo,
    gamepadSupported,
    connectedGamepads,
    savePrefs,
    onResetSettings,
    onResetHotkeys,
    onHotkeyChange,
    onResetGamepadMappings,
    onGamepadMappingChange,
    onClearAllData,
  }
}
