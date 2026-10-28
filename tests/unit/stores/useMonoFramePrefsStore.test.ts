import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMonoFramePrefsStore } from '@/stores/useMonoFramePrefsStore'
import { storage } from '@/services/persistence'

// Mock localStorage
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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

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

describe('useMonoFramePrefsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
  })

  it('initializes with defaults', () => {
    const store = useMonoFramePrefsStore()
    expect(store.fontFamily).toBe('Courier New, monospace')
    expect(store.fontSizePx).toBe(24)
    expect(store.textAlignment).toBe('center')
    expect(store.voiceReadColor).toBe('#FFEB3B')
  })

  it('sets font family and persists it', async () => {
    const store = useMonoFramePrefsStore()

    store.setFontFamily('Monaco, monospace')
    expect(store.fontFamily).toBe('Monaco, monospace')

    const saved = JSON.parse(localStorageMock.getItem('apuntador:monoFramePreferences') || '{}')
    expect(saved.fontFamily).toBe('Monaco, monospace')
  })

  it('falls back to the default font family when the saved value is not monospace', async () => {
    localStorageMock.setItem(
      'apuntador:monoFramePreferences',
      JSON.stringify({
        fontFamily: 'Comic Sans MS, cursive',
        fontSizePx: 24,
        lineHeight: 1.4,
        fgColor: '#ffffff',
        bgColor: '#000000',
        textAlignment: 'center',
      })
    )
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const store = useMonoFramePrefsStore()
    await store.load()

    expect(store.fontFamily).toBe('Courier New, monospace')
    warnSpy.mockRestore()
  })

  it('increases/decreases font size within bounds', () => {
    const store = useMonoFramePrefsStore()

    store.increaseFontSize()
    expect(store.fontSizePx).toBe(26)

    store.fontSizePx = 16
    store.decreaseFontSize()
    expect(store.fontSizePx).toBe(16) // clamped at MIN_FONT_SIZE
  })

  it('sets text alignment and colors, persisting each', async () => {
    const store = useMonoFramePrefsStore()

    store.setTextAlignment('left')
    store.setFgColor('#00ff00')
    store.setBgColor('#111111')
    store.setVoiceReadColor('#ff9900')

    expect(store.textAlignment).toBe('left')
    expect(store.fgColor).toBe('#00ff00')
    expect(store.bgColor).toBe('#111111')
    expect(store.voiceReadColor).toBe('#ff9900')

    const saved = JSON.parse(localStorageMock.getItem('apuntador:monoFramePreferences') || '{}')
    expect(saved.textAlignment).toBe('left')
    expect(saved.fgColor).toBe('#00ff00')
    expect(saved.bgColor).toBe('#111111')
    expect(saved.voiceReadColor).toBe('#ff9900')
  })

  it('falls back to the default voice read color when the saved value is malformed', async () => {
    localStorageMock.setItem(
      'apuntador:monoFramePreferences',
      JSON.stringify({
        fontFamily: 'Courier New, monospace',
        fontSizePx: 24,
        lineHeight: 1.4,
        fgColor: '#ffffff',
        bgColor: '#000000',
        voiceReadColor: 'not-a-hex-color',
        textAlignment: 'center',
      })
    )
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const store = useMonoFramePrefsStore()
    await store.load()

    expect(store.voiceReadColor).toBe('#FFEB3B')
    warnSpy.mockRestore()
  })

  it('defaults the voice read color when loading a payload saved before the field existed', async () => {
    localStorageMock.setItem(
      'apuntador:monoFramePreferences',
      JSON.stringify({
        fontFamily: 'Courier New, monospace',
        fontSizePx: 24,
        lineHeight: 1.4,
        fgColor: '#ffffff',
        bgColor: '#000000',
        textAlignment: 'center',
      })
    )

    const store = useMonoFramePrefsStore()
    await store.load()

    expect(store.voiceReadColor).toBe('#FFEB3B')
  })

  it('round-trips save/load', async () => {
    const store = useMonoFramePrefsStore()
    store.setFontFamily('Consolas, monospace')
    store.setTextAlignment('right')
    store.setVoiceReadColor('#00ccff')
    await store.save()

    setActivePinia(createPinia())
    const newStore = useMonoFramePrefsStore()
    await newStore.load()

    expect(newStore.fontFamily).toBe('Consolas, monospace')
    expect(newStore.textAlignment).toBe('right')
    expect(newStore.voiceReadColor).toBe('#00ccff')
  })

  it('resets to defaults', () => {
    const store = useMonoFramePrefsStore()
    store.setFontFamily('Monaco, monospace')
    store.setTextAlignment('left')
    store.setVoiceReadColor('#00ccff')

    store.reset()

    expect(store.fontFamily).toBe('Courier New, monospace')
    expect(store.textAlignment).toBe('center')
    expect(store.voiceReadColor).toBe('#FFEB3B')
  })

  it('logs a warning instead of throwing when persisting fails', async () => {
    const store = useMonoFramePrefsStore()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const setSpy = vi.spyOn(storage, 'set').mockRejectedValueOnce(new Error('disk full'))

    await expect(store.save()).resolves.toBeUndefined()

    expect(warnSpy).toHaveBeenCalledWith('Failed to save mono frame preferences:', expect.any(Error))
    setSpy.mockRestore()
    warnSpy.mockRestore()
  })
})
