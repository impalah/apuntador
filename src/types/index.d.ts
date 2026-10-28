export interface HotkeyDefinition {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  action: string
  description: string
}

export interface CustomHotkeyMapping {
  [action: string]: HotkeyDefinition
}

export interface GamepadMapping {
  buttonIndex: number | null
  action: string
  description: string
}

export interface CustomGamepadMapping {
  [action: string]: GamepadMapping
}

export type HotkeyAction =
  | 'toggle-play'
  | 'step-up'
  | 'step-down'
  | 'step-up-5'
  | 'step-down-5'
  | 'go-home'
  | 'go-end'
  | 'speed-down'
  | 'speed-up'
  | 'font-up'
  | 'font-down'
  | 'mirror-h'
  | 'mirror-v'
  | 'open-editor'
  | 'open-file'
  | 'close-modal'
  | 'align-left'
  | 'align-center'
  | 'align-right'
