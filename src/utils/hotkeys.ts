import type {
  HotkeyDefinition,
  CustomHotkeyMapping,
  HotkeyAction,
  GamepadMapping,
  CustomGamepadMapping,
} from '@/types'
import { i18n } from '@/utils/i18n'

/**
 * Get localized description for hotkey action
 */
function getLocalizedDescription(action: string): string {
  const { t } = i18n.global

  switch (action) {
    case 'toggle-play':
      return t('hotkeys.playPause')
    case 'step-up':
      return t('hotkeys.rewindLine')
    case 'step-down':
      return t('hotkeys.forwardLine')
    case 'step-up-5':
      return t('hotkeys.rewind5Lines')
    case 'step-down-5':
      return t('hotkeys.forward5Lines')
    case 'go-home':
      return t('hotkeys.home')
    case 'go-end':
      return t('hotkeys.end')
    case 'speed-down':
      return t('hotkeys.speedDown')
    case 'speed-up':
      return t('hotkeys.speedUp')
    case 'font-up':
      return t('hotkeys.fontSizeUp')
    case 'font-down':
      return t('hotkeys.fontSizeDown')
    case 'mirror-h':
      return t('hotkeys.mirrorHorizontal')
    case 'mirror-v':
      return t('hotkeys.mirrorVertical')
    case 'open-editor':
      return t('hotkeys.openEditor')
    case 'open-settings':
      return t('hotkeys.openSettings')
    case 'open-file':
      return t('hotkeys.openFile')
    case 'close-modal':
      return t('common.close')
    case 'align-left':
      return t('toolbar.alignLeft')
    case 'align-center':
      return t('toolbar.alignCenter')
    case 'align-right':
      return t('toolbar.alignRight')
    default:
      return action
  }
}

/**
 * Keyboard shortcuts manager
 */
export class HotkeyManager {
  private handlers = new Map<string, () => void>()
  private actionHandlers = new Map<HotkeyAction, () => void>()
  private customMapping: CustomHotkeyMapping = {}
  private isListening = false

  /**
   * Update custom hotkey mapping
   */
  updateMapping(mapping: CustomHotkeyMapping): void {
    this.customMapping = { ...mapping }
    this.rebuildHandlers()
  }

  /**
   * Register action handler
   */
  registerAction(action: HotkeyAction, handler: () => void): void {
    this.actionHandlers.set(action, handler)
    this.rebuildHandlers()
  }

  /**
   * Unregister action handler
   */
  unregisterAction(action: HotkeyAction): void {
    this.actionHandlers.delete(action)
    this.rebuildHandlers()
  }

  /**
   * Register hotkey handler (legacy support)
   */
  register(hotkey: HotkeyDefinition, handler: () => void): void {
    const key = this.createKey(hotkey)
    this.handlers.set(key, handler)
  }

  /**
   * Unregister hotkey handler (legacy support)
   */
  unregister(hotkey: HotkeyDefinition): void {
    const key = this.createKey(hotkey)
    this.handlers.delete(key)
  }

  /**
   * Rebuild handlers from action handlers and custom mapping
   */
  private rebuildHandlers(): void {
    // Clear existing hotkey handlers (but keep action handlers)
    this.handlers.clear()

    // Build handlers from custom mapping
    for (const [action, hotkey] of Object.entries(this.customMapping)) {
      const handler = this.actionHandlers.get(action as HotkeyAction)
      if (handler) {
        const key = this.createKey(hotkey)
        this.handlers.set(key, handler)
      }
    }
  }

  /**
   * Start listening for keyboard events
   */
  startListening(): void {
    if (this.isListening) return

    document.addEventListener('keydown', this.handleKeyDown)
    this.isListening = true
  }

  /**
   * Stop listening for keyboard events
   */
  stopListening(): void {
    if (!this.isListening) return

    document.removeEventListener('keydown', this.handleKeyDown)
    this.isListening = false
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear()
    this.actionHandlers.clear()
  }

  /**
   * Check if a key combination is already in use
   */
  isKeyInUse(hotkey: HotkeyDefinition, excludeAction?: HotkeyAction): boolean {
    const key = this.createKey(hotkey)

    for (const [action, existingHotkey] of Object.entries(this.customMapping)) {
      if (excludeAction && action === excludeAction) continue

      const existingKey = this.createKey(existingHotkey)
      if (existingKey === key) {
        return true
      }
    }

    return false
  }

  /**
   * Get readable key name for display
   */
  getKeyDisplayName(hotkey: HotkeyDefinition): string {
    const parts = []

    if (hotkey.ctrlKey) parts.push('Ctrl')
    if (hotkey.altKey) parts.push('Alt')
    if (hotkey.shiftKey) parts.push('Shift')

    let keyName = hotkey.key

    // Convert special keys to readable names
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      ArrowUp: '↑',
      ArrowDown: '↓',
      ArrowLeft: '←',
      ArrowRight: '→',
      PageUp: 'Page Up',
      PageDown: 'Page Down',
      Home: 'Home',
      End: 'End',
      Escape: 'Esc',
      Enter: 'Enter',
      Tab: 'Tab',
      Backspace: 'Backspace',
      Delete: 'Delete',
    }

    if (keyMap[keyName]) {
      keyName = keyMap[keyName]
    } else if (keyName.length === 1) {
      keyName = keyName.toUpperCase()
    }

    parts.push(keyName)
    return parts.join(' + ')
  }

  /**
   * Create unique key for hotkey combination
   */
  private createKey(hotkey: HotkeyDefinition): string {
    const parts = []
    if (hotkey.ctrlKey) parts.push('ctrl')
    if (hotkey.altKey) parts.push('alt')
    if (hotkey.shiftKey) parts.push('shift')
    parts.push(hotkey.key.toLowerCase())
    return parts.join('+')
  }

  /**
   * Handle keydown events
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    // Skip if user is typing in an input element
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return
    }

    const key = this.createKeyFromEvent(event)
    const handler = this.handlers.get(key)

    if (handler) {
      event.preventDefault()
      event.stopPropagation()
      handler()
    }
  }

  /**
   * Create key string from keyboard event
   */
  private createKeyFromEvent(event: KeyboardEvent): string {
    const parts = []
    if (event.ctrlKey || event.metaKey) parts.push('ctrl')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    parts.push(event.key.toLowerCase())
    return parts.join('+')
  }
}

/**
 * Default hotkey definitions for the teleprompter
 */
export const DEFAULT_HOTKEYS: HotkeyDefinition[] = [
  { key: ' ', action: 'toggle-play', description: getLocalizedDescription('toggle-play') },
  { key: 'ArrowUp', action: 'step-up', description: getLocalizedDescription('step-up') },
  { key: 'ArrowDown', action: 'step-down', description: getLocalizedDescription('step-down') },
  { key: 'PageUp', action: 'step-up-5', description: getLocalizedDescription('step-up-5') },
  { key: 'PageDown', action: 'step-down-5', description: getLocalizedDescription('step-down-5') },
  { key: 'Home', action: 'go-home', description: getLocalizedDescription('go-home') },
  { key: 'End', action: 'go-end', description: getLocalizedDescription('go-end') },
  { key: 'ArrowLeft', action: 'speed-down', description: getLocalizedDescription('speed-down') },
  { key: 'ArrowRight', action: 'speed-up', description: getLocalizedDescription('speed-up') },
  { key: '+', action: 'font-up', description: getLocalizedDescription('font-up') },
  { key: '-', action: 'font-down', description: getLocalizedDescription('font-down') },
  { key: 'h', action: 'mirror-h', description: getLocalizedDescription('mirror-h') },
  { key: 'v', action: 'mirror-v', description: getLocalizedDescription('mirror-v') },
  { key: 'e', action: 'open-editor', description: getLocalizedDescription('open-editor') },
  { key: 's', action: 'open-settings', description: getLocalizedDescription('open-settings') },
  { key: 'f', action: 'open-file', description: getLocalizedDescription('open-file') },
  { key: 'Escape', action: 'close-modal', description: getLocalizedDescription('close-modal') },
  { key: '1', action: 'align-left', description: getLocalizedDescription('align-left') },
  { key: '2', action: 'align-center', description: getLocalizedDescription('align-center') },
  { key: '3', action: 'align-right', description: getLocalizedDescription('align-right') },
]

/**
 * Convert default hotkeys array to custom mapping
 */
export function createDefaultMapping(): CustomHotkeyMapping {
  const mapping: CustomHotkeyMapping = {}

  for (const hotkey of DEFAULT_HOTKEYS) {
    mapping[hotkey.action] = {
      key: hotkey.key,
      ctrlKey: hotkey.ctrlKey,
      altKey: hotkey.altKey,
      shiftKey: hotkey.shiftKey,
      action: hotkey.action,
      description: getLocalizedDescription(hotkey.action),
    }
  }

  return mapping
}

/**
 * Default gamepad button mappings for the teleprompter
 * Setting all to null (none) by default as requested
 */
export const DEFAULT_GAMEPAD_MAPPINGS: GamepadMapping[] = [
  { buttonIndex: null, action: 'toggle-play', description: getLocalizedDescription('toggle-play') },
  { buttonIndex: null, action: 'step-up', description: getLocalizedDescription('step-up') },
  { buttonIndex: null, action: 'step-down', description: getLocalizedDescription('step-down') },
  { buttonIndex: null, action: 'step-up-5', description: getLocalizedDescription('step-up-5') },
  { buttonIndex: null, action: 'step-down-5', description: getLocalizedDescription('step-down-5') },
  { buttonIndex: null, action: 'go-home', description: getLocalizedDescription('go-home') },
  { buttonIndex: null, action: 'go-end', description: getLocalizedDescription('go-end') },
  { buttonIndex: null, action: 'speed-down', description: getLocalizedDescription('speed-down') },
  { buttonIndex: null, action: 'speed-up', description: getLocalizedDescription('speed-up') },
  { buttonIndex: null, action: 'font-up', description: getLocalizedDescription('font-up') },
  { buttonIndex: null, action: 'font-down', description: getLocalizedDescription('font-down') },
  { buttonIndex: null, action: 'mirror-h', description: getLocalizedDescription('mirror-h') },
  { buttonIndex: null, action: 'mirror-v', description: getLocalizedDescription('mirror-v') },
  { buttonIndex: null, action: 'open-editor', description: getLocalizedDescription('open-editor') },
  {
    buttonIndex: null,
    action: 'open-settings',
    description: getLocalizedDescription('open-settings'),
  },
  { buttonIndex: null, action: 'open-file', description: getLocalizedDescription('open-file') },
  { buttonIndex: null, action: 'close-modal', description: getLocalizedDescription('close-modal') },
  { buttonIndex: null, action: 'align-left', description: getLocalizedDescription('align-left') },
  {
    buttonIndex: null,
    action: 'align-center',
    description: getLocalizedDescription('align-center'),
  },
  { buttonIndex: null, action: 'align-right', description: getLocalizedDescription('align-right') },
]

/**
 * Convert default gamepad mappings array to custom mapping
 */
export function createDefaultGamepadMapping(): CustomGamepadMapping {
  const mapping: CustomGamepadMapping = {}

  for (const gamepadMapping of DEFAULT_GAMEPAD_MAPPINGS) {
    mapping[gamepadMapping.action] = {
      buttonIndex: gamepadMapping.buttonIndex,
      action: gamepadMapping.action,
      description: getLocalizedDescription(gamepadMapping.action),
    }
  }

  return mapping
}

/**
 * Update descriptions in existing mapping with current locale
 */
export function updateDescriptionsInMapping(mapping: CustomHotkeyMapping): CustomHotkeyMapping {
  const updatedMapping: CustomHotkeyMapping = {}

  for (const [action, hotkey] of Object.entries(mapping)) {
    updatedMapping[action] = {
      ...hotkey,
      description: getLocalizedDescription(action),
    }
  }

  return updatedMapping
}

/**
 * Update descriptions in existing gamepad mapping with current locale
 */
export function updateDescriptionsInGamepadMapping(
  mapping: CustomGamepadMapping
): CustomGamepadMapping {
  const updatedMapping: CustomGamepadMapping = {}

  for (const [action, gamepadMapping] of Object.entries(mapping)) {
    updatedMapping[action] = {
      ...gamepadMapping,
      description: getLocalizedDescription(action),
    }
  }

  return updatedMapping
}

// Export singleton instance
export const hotkeyManager = new HotkeyManager()
