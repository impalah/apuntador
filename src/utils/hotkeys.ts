import type { HotkeyDefinition } from '@/types'

/**
 * Keyboard shortcuts manager
 */
export class HotkeyManager {
  private handlers = new Map<string, () => void>()
  private isListening = false

  /**
   * Register hotkey handler
   */
  register(hotkey: HotkeyDefinition, handler: () => void): void {
    const key = this.createKey(hotkey)
    this.handlers.set(key, handler)
  }

  /**
   * Unregister hotkey handler
   */
  unregister(hotkey: HotkeyDefinition): void {
    const key = this.createKey(hotkey)
    this.handlers.delete(key)
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
  { key: '[', action: 'speed-down', description: 'Decrease speed' },
  { key: ']', action: 'speed-up', description: 'Increase speed' },
  { key: '=', action: 'font-up', description: 'Increase font size' },
  { key: '-', action: 'font-down', description: 'Decrease font size' },
  { key: 'h', action: 'mirror-h', description: 'Toggle horizontal mirror' },
  { key: 'v', action: 'mirror-v', description: 'Toggle vertical mirror' },
  { key: 'e', action: 'open-editor', description: 'Open editor' },
  { key: 's', action: 'open-settings', description: 'Open settings' },
  { key: 'f', action: 'open-file', description: 'Open file' },
  { key: 'Escape', action: 'close-modal', description: 'Close modal/dialog' },
]

// Export singleton instance
export const hotkeyManager = new HotkeyManager()
