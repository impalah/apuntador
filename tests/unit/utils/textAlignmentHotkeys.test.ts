import { describe, it, expect } from 'vitest'
import { DEFAULT_HOTKEYS, createDefaultMapping } from '@/utils/hotkeys'

describe('Text Alignment Hotkeys', () => {
  it('should include alignment hotkeys in DEFAULT_HOTKEYS', () => {
    const alignmentHotkeys = DEFAULT_HOTKEYS.filter((hotkey) => hotkey.action.startsWith('align-'))

    expect(alignmentHotkeys).toHaveLength(3)

    const leftHotkey = alignmentHotkeys.find((h) => h.action === 'align-left')
    const centerHotkey = alignmentHotkeys.find((h) => h.action === 'align-center')
    const rightHotkey = alignmentHotkeys.find((h) => h.action === 'align-right')

    expect(leftHotkey).toBeDefined()
    expect(leftHotkey?.key).toBe('1')
    expect(leftHotkey?.description).toBe('Align text left')

    expect(centerHotkey).toBeDefined()
    expect(centerHotkey?.key).toBe('2')
    expect(centerHotkey?.description).toBe('Align text center')

    expect(rightHotkey).toBeDefined()
    expect(rightHotkey?.key).toBe('3')
    expect(rightHotkey?.description).toBe('Align text right')
  })

  it('should include alignment hotkeys in default mapping', () => {
    const mapping = createDefaultMapping()

    expect(mapping['align-left']).toBeDefined()
    expect(mapping['align-left'].key).toBe('1')
    expect(mapping['align-left'].action).toBe('align-left')

    expect(mapping['align-center']).toBeDefined()
    expect(mapping['align-center'].key).toBe('2')
    expect(mapping['align-center'].action).toBe('align-center')

    expect(mapping['align-right']).toBeDefined()
    expect(mapping['align-right'].key).toBe('3')
    expect(mapping['align-right'].action).toBe('align-right')
  })

  it('should have correct action types', () => {
    const alignmentActions = ['align-left', 'align-center', 'align-right']

    alignmentActions.forEach((action) => {
      const hotkey = DEFAULT_HOTKEYS.find((h) => h.action === action)
      expect(hotkey).toBeDefined()
      expect(typeof hotkey?.action).toBe('string')
    })
  })
})
