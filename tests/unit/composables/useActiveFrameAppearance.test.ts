import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useActiveFrameAppearance } from '@/composables/useActiveFrameAppearance'
import { usePrefsStore } from '@/stores/usePrefsStore'
import { useMonoFramePrefsStore } from '@/stores/useMonoFramePrefsStore'

// Mock localStorage/localforage so store persistence doesn't blow up in jsdom
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

vi.mock('localforage', () => ({
  default: {
    createInstance: () => ({
      getItem: async (key: string) => {
        const value = localStorageMock.getItem(key)
        return value ? JSON.parse(value) : null
      },
      setItem: async (key: string, value: any) => {
        localStorageMock.setItem(key, JSON.stringify(value))
      },
      removeItem: async (key: string) => {
        localStorageMock.removeItem(key)
      },
    }),
  },
}))

describe('useActiveFrameAppearance', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  it('reads from usePrefsStore when the markdown frame is active', () => {
    const prefsStore = usePrefsStore()
    prefsStore.fontFamily = 'Georgia, serif'

    const appearance = useActiveFrameAppearance()

    expect(appearance.isMono.value).toBe(false)
    expect(appearance.fontFamily.value).toBe('Georgia, serif')
  })

  it('reads from useMonoFramePrefsStore when the monospace frame is active', () => {
    const prefsStore = usePrefsStore()
    const monoStore = useMonoFramePrefsStore()
    prefsStore.setActiveFrame('monospace')
    monoStore.setFontFamily('Monaco, monospace')

    const appearance = useActiveFrameAppearance()

    expect(appearance.isMono.value).toBe(true)
    expect(appearance.fontFamily.value).toBe('Monaco, monospace')
  })

  it('restricts fontFamilyOptions to monospace choices only when mono is active', () => {
    const prefsStore = usePrefsStore()
    const appearance = useActiveFrameAppearance()

    expect(appearance.fontFamilyOptions.value).toContain('Roboto, sans-serif')

    prefsStore.setActiveFrame('monospace')
    expect(appearance.fontFamilyOptions.value).not.toContain('Roboto, sans-serif')
    expect(appearance.fontFamilyOptions.value).toContain('Courier New, monospace')
  })

  it('routes setTextAlignment/increaseFontSize to the active store', () => {
    const prefsStore = usePrefsStore()
    const monoStore = useMonoFramePrefsStore()
    const appearance = useActiveFrameAppearance()

    appearance.setTextAlignment('left')
    expect(prefsStore.textAlignment).toBe('left')
    expect(monoStore.textAlignment).toBe('center') // untouched

    prefsStore.setActiveFrame('monospace')
    appearance.setTextAlignment('right')
    expect(monoStore.textAlignment).toBe('right')
    expect(prefsStore.textAlignment).toBe('left') // untouched by the mono-mode call

    appearance.increaseFontSize()
    expect(monoStore.fontSizePx).toBe(26)
    expect(prefsStore.fontSizePx).toBe(24) // untouched
  })

  it('routes setFontFamily/setFgColor/setBgColor to the active store', () => {
    const prefsStore = usePrefsStore()
    const monoStore = useMonoFramePrefsStore()
    const appearance = useActiveFrameAppearance()

    appearance.setFontFamily('Arial, sans-serif')
    appearance.setFgColor('#111111')
    appearance.setBgColor('#222222')
    expect(prefsStore.fontFamily).toBe('Arial, sans-serif')
    expect(prefsStore.fgColor).toBe('#111111')
    expect(prefsStore.bgColor).toBe('#222222')

    prefsStore.setActiveFrame('monospace')
    appearance.setFontFamily('Consolas, monospace')
    appearance.setFgColor('#333333')
    appearance.setBgColor('#444444')
    expect(monoStore.fontFamily).toBe('Consolas, monospace')
    expect(monoStore.fgColor).toBe('#333333')
    expect(monoStore.bgColor).toBe('#444444')
  })

  it('routes setFontSizePx/setLineHeight to the active store', () => {
    const prefsStore = usePrefsStore()
    const monoStore = useMonoFramePrefsStore()
    const appearance = useActiveFrameAppearance()

    appearance.setFontSizePx(40)
    appearance.setLineHeight(1.8)
    expect(prefsStore.fontSizePx).toBe(40)
    expect(prefsStore.lineHeight).toBe(1.8)
    expect(monoStore.fontSizePx).toBe(24) // untouched

    prefsStore.setActiveFrame('monospace')
    appearance.setFontSizePx(30)
    appearance.setLineHeight(1.2)
    expect(monoStore.fontSizePx).toBe(30)
    expect(monoStore.lineHeight).toBe(1.2)
    expect(prefsStore.fontSizePx).toBe(40) // untouched by the mono-mode call
  })
})
