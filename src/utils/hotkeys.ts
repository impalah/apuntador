import type { HotkeyDefinition, CustomHotkeyMapping, HotkeyAction } from '@/types'

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
  { key: ' ', action: 'toggle-play', description: 'Play/Pause' },
  { key: 'ArrowUp', action: 'step-up', description: 'Previous line' },
  { key: 'ArrowDown', action: 'step-down', description: 'Next line' },
  { key: 'PageUp', action: 'step-up-5', description: 'Previous 5 lines' },
  { key: 'PageDown', action: 'step-down-5', description: 'Next 5 lines' },
  { key: 'Home', action: 'go-home', description: 'Go to start' },
  { key: 'End', action: 'go-end', description: 'Go to end' },
  { key: 'ArrowLeft', action: 'speed-down', description: 'Decrease speed' },
  { key: 'ArrowRight', action: 'speed-up', description: 'Increase speed' },
  { key: '+', action: 'font-up', description: 'Increase font size' },
  { key: '-', action: 'font-down', description: 'Decrease font size' },
  { key: 'h', action: 'mirror-h', description: 'Toggle horizontal mirror' },
  { key: 'v', action: 'mirror-v', description: 'Toggle vertical mirror' },
  { key: 'e', action: 'open-editor', description: 'Open editor' },
  { key: 's', action: 'open-settings', description: 'Open settings' },
  { key: 'f', action: 'open-file', description: 'Open file' },
  { key: 'Escape', action: 'close-modal', description: 'Close modal/dialog' },
  { key: '1', action: 'align-left', description: 'Align text left' },
  { key: '2', action: 'align-center', description: 'Align text center' },
  { key: '3', action: 'align-right', description: 'Align text right' },
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
      description: hotkey.description,
    }
  }

  return mapping
}

// Export singleton instance
export const hotkeyManager = new HotkeyManager()
