import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}))

import { Capacitor } from '@capacitor/core'
import { createSpeechEngine } from '@/services/speech/createSpeechEngine'
import { WebSpeechEngine } from '@/services/speech/webSpeechEngine'

describe('createSpeechEngine', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns a WebSpeechEngine on non-native platforms', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

    const engine = createSpeechEngine()

    expect(engine).toBeInstanceOf(WebSpeechEngine)
  })

  it('returns an unsupported engine on native platforms (no capacitor engine yet)', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)

    const engine = createSpeechEngine()

    expect(engine).not.toBeInstanceOf(WebSpeechEngine)
    expect(engine.isSupported).toBe(false)
  })

  it('the native-platform stub resolves start/stop and subscriptions without throwing', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    const engine = createSpeechEngine()

    const unsubscribe = engine.onTranscript(() => {})
    await expect(engine.start('en-US')).resolves.toBeUndefined()
    await expect(engine.stop()).resolves.toBeUndefined()
    expect(() => unsubscribe()).not.toThrow()
  })
})
