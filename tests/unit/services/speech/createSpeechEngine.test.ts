import { describe, it, expect, vi, afterEach } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn().mockReturnValue('ios'),
  },
}))

vi.mock('@capacitor-community/speech-recognition', () => ({
  SpeechRecognition: {
    available: vi.fn().mockResolvedValue({ available: true }),
    checkPermissions: vi.fn().mockResolvedValue({ speechRecognition: 'granted' }),
    requestPermissions: vi.fn().mockResolvedValue({ speechRecognition: 'granted' }),
    start: vi.fn().mockResolvedValue({}),
    stop: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
    removeAllListeners: vi.fn().mockResolvedValue(undefined),
  },
}))

import { Capacitor } from '@capacitor/core'
import { createSpeechEngine } from '@/services/speech/createSpeechEngine'
import { WebSpeechEngine } from '@/services/speech/webSpeechEngine'
import { CapacitorSpeechEngine } from '@/services/speech/capacitorSpeechEngine'

describe('createSpeechEngine', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns a WebSpeechEngine on non-native platforms', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false)

    const engine = createSpeechEngine()

    expect(engine).toBeInstanceOf(WebSpeechEngine)
  })

  it('returns a CapacitorSpeechEngine on native platforms', () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)

    const engine = createSpeechEngine()

    expect(engine).toBeInstanceOf(CapacitorSpeechEngine)
    expect(engine.isSupported).toBe(true)
  })

  it('the native engine resolves start/stop and subscriptions without throwing', async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true)
    const engine = createSpeechEngine()

    const unsubscribe = engine.onTranscript(() => {})
    await expect(engine.start('en-US')).resolves.toBeUndefined()
    await expect(engine.stop()).resolves.toBeUndefined()
    expect(() => unsubscribe()).not.toThrow()
  })
})
