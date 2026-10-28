import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

type PermissionState = 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied'
type ListenerName = 'partialResults' | 'listeningState'
type Listener = (data: any) => void

const listeners: Record<ListenerName, Listener[]> = {
  partialResults: [],
  listeningState: [],
}

function emitPartialResults(matches: string[]) {
  listeners.partialResults.forEach((cb) => cb({ matches }))
}

function emitListeningState(status: 'started' | 'stopped') {
  listeners.listeningState.forEach((cb) => cb({ status }))
}

vi.mock('@capacitor-community/speech-recognition', () => ({
  SpeechRecognition: {
    available: vi.fn(),
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    addListener: vi.fn(),
    removeAllListeners: vi.fn(),
  },
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: vi.fn().mockReturnValue('ios'),
  },
}))

import { Capacitor } from '@capacitor/core'
import { SpeechRecognition } from '@capacitor-community/speech-recognition'
import { CapacitorSpeechEngine } from '@/services/speech/capacitorSpeechEngine'
import { SPEECH_NATIVE_MAX_CONSECUTIVE_RESTARTS } from '@/utils/constants'

describe('CapacitorSpeechEngine', () => {
  beforeEach(() => {
    listeners.partialResults = []
    listeners.listeningState = []

    vi.mocked(SpeechRecognition.addListener).mockImplementation(((
      eventName: ListenerName,
      listener: Listener
    ) => {
      listeners[eventName].push(listener)
      return Promise.resolve({ remove: vi.fn() } as any)
    }) as any)

    vi.mocked(SpeechRecognition.available).mockResolvedValue({ available: true })
    vi.mocked(SpeechRecognition.checkPermissions).mockResolvedValue({
      speechRecognition: 'granted' as PermissionState,
    })
    vi.mocked(SpeechRecognition.requestPermissions).mockResolvedValue({
      speechRecognition: 'granted' as PermissionState,
    })
    vi.mocked(SpeechRecognition.start).mockResolvedValue({})
    vi.mocked(SpeechRecognition.stop).mockResolvedValue(undefined)
    vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('isSupported is true on iOS (optimistic - no sync availability check exists on native)', () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue('ios')
    const engine = new CapacitorSpeechEngine()
    expect(engine.isSupported).toBe(true)
  })

  it('isSupported is false on Android (silent recognition is unreliable on real hardware, see class-level comment)', () => {
    vi.mocked(Capacitor.getPlatform).mockReturnValue('android')
    const engine = new CapacitorSpeechEngine()
    expect(engine.isSupported).toBe(false)
  })

  it('emits a not-supported error and never checks permissions when unavailable', async () => {
    vi.mocked(SpeechRecognition.available).mockResolvedValue({ available: false })
    const engine = new CapacitorSpeechEngine()
    const errorHandler = vi.fn()
    engine.onError(errorHandler)

    await engine.start('en-US')

    expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({ code: 'not-supported' }))
    expect(engine.status).toBe('error')
    expect(SpeechRecognition.checkPermissions).not.toHaveBeenCalled()
    expect(SpeechRecognition.start).not.toHaveBeenCalled()
  })

  it('skips requestPermissions when already granted', async () => {
    const engine = new CapacitorSpeechEngine()
    await engine.start('en-US')

    expect(SpeechRecognition.requestPermissions).not.toHaveBeenCalled()
    expect(SpeechRecognition.start).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en-US', popup: false, partialResults: true })
    )
  })

  it('requests permission when not yet granted, and proceeds once granted', async () => {
    vi.mocked(SpeechRecognition.checkPermissions).mockResolvedValue({
      speechRecognition: 'prompt' as PermissionState,
    })
    const engine = new CapacitorSpeechEngine()
    await engine.start('en-US')

    expect(SpeechRecognition.requestPermissions).toHaveBeenCalledTimes(1)
    expect(SpeechRecognition.start).toHaveBeenCalledTimes(1)
  })

  it('emits permission-denied and does not start when permission is refused', async () => {
    vi.mocked(SpeechRecognition.checkPermissions).mockResolvedValue({
      speechRecognition: 'prompt' as PermissionState,
    })
    vi.mocked(SpeechRecognition.requestPermissions).mockResolvedValue({
      speechRecognition: 'denied' as PermissionState,
    })
    const engine = new CapacitorSpeechEngine()
    const errorHandler = vi.fn()
    engine.onError(errorHandler)

    await engine.start('en-US')

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'permission-denied' })
    )
    expect(engine.status).toBe('error')
    expect(SpeechRecognition.start).not.toHaveBeenCalled()

    // A later unexpected native stop must not trigger a restart once permission
    // was denied and shouldBeListening was cleared.
    emitListeningState('stopped')
    await vi.waitFor(() => expect(SpeechRecognition.start).not.toHaveBeenCalled())
  })

  it('transitions to listening status on the listeningState "started" event', async () => {
    const engine = new CapacitorSpeechEngine()
    const statusHandler = vi.fn()
    engine.onStatusChange(statusHandler)

    await engine.start('en-US')
    emitListeningState('started')

    expect(engine.status).toBe('listening')
    expect(statusHandler).toHaveBeenCalledWith('listening')
  })

  it('forwards partial results as interim transcripts (no isFinal:true path exists natively)', async () => {
    const engine = new CapacitorSpeechEngine()
    const transcriptHandler = vi.fn()
    engine.onTranscript(transcriptHandler)

    await engine.start('en-US')
    emitListeningState('started')
    emitPartialResults(['hello world'])

    expect(transcriptHandler).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'hello world', isFinal: false })
    )
  })

  it('ignores partialResults events with no matches', async () => {
    const engine = new CapacitorSpeechEngine()
    const transcriptHandler = vi.fn()
    engine.onTranscript(transcriptHandler)

    await engine.start('en-US')
    emitPartialResults([])

    expect(transcriptHandler).not.toHaveBeenCalled()
  })

  it('ignores stray partialResults events after stop()', async () => {
    const engine = new CapacitorSpeechEngine()
    const transcriptHandler = vi.fn()
    engine.onTranscript(transcriptHandler)

    await engine.start('en-US')
    await engine.stop()
    emitPartialResults(['too late'])

    expect(transcriptHandler).not.toHaveBeenCalled()
  })

  it('auto-restarts after an unexpected stop while still supposed to be listening', async () => {
    vi.useFakeTimers()
    try {
      const engine = new CapacitorSpeechEngine()
      await engine.start('en-US')
      expect(SpeechRecognition.start).toHaveBeenCalledTimes(1)

      emitListeningState('started')
      emitListeningState('stopped') // unexpected - shouldBeListening is still true

      expect(SpeechRecognition.start).toHaveBeenCalledTimes(1) // not yet - restart is deferred
      await vi.advanceTimersByTimeAsync(500)
      expect(SpeechRecognition.start).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('gives up restarting and emits an error after too many consecutive unexpected stops', async () => {
    vi.useFakeTimers()
    try {
      const engine = new CapacitorSpeechEngine()
      const errorHandler = vi.fn()
      engine.onError(errorHandler)

      await engine.start('en-US')
      emitListeningState('started')

      for (let i = 0; i < SPEECH_NATIVE_MAX_CONSECUTIVE_RESTARTS; i++) {
        emitListeningState('stopped')
        await vi.advanceTimersByTimeAsync(500)
      }
      // One more unexpected stop pushes past the circuit breaker threshold.
      emitListeningState('stopped')

      expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({ code: 'unknown' }))
      expect(engine.status).toBe('error')
    } finally {
      vi.useRealTimers()
    }
  })

  it('resets the consecutive-restart counter on a successful restart', async () => {
    vi.useFakeTimers()
    try {
      const engine = new CapacitorSpeechEngine()
      await engine.start('en-US')

      emitListeningState('started')
      emitListeningState('stopped')
      await vi.advanceTimersByTimeAsync(500)
      emitListeningState('started') // counter resets here

      // Should be able to survive another full round of restarts without
      // tripping the circuit breaker, since the counter was reset.
      const errorHandler = vi.fn()
      const engine2ErrorSpy = errorHandler
      for (let i = 0; i < SPEECH_NATIVE_MAX_CONSECUTIVE_RESTARTS; i++) {
        emitListeningState('stopped')
        await vi.advanceTimersByTimeAsync(500)
        emitListeningState('started')
      }

      expect(engine2ErrorSpy).not.toHaveBeenCalled()
      expect(engine.status).toBe('listening')
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not restart after an explicit stop()', async () => {
    const engine = new CapacitorSpeechEngine()
    await engine.start('en-US')
    await engine.stop()

    expect(SpeechRecognition.stop).toHaveBeenCalledTimes(1)
    expect(engine.status).toBe('stopped')

    emitListeningState('stopped')
    expect(SpeechRecognition.start).toHaveBeenCalledTimes(1) // only the initial start()
  })

  it('stops the previous session before starting a new one on language switch, without a spurious restart', async () => {
    const engine = new CapacitorSpeechEngine()
    await engine.start('es-ES')
    emitListeningState('started')

    await engine.start('en-US')

    // The internal stop() from the language switch fires its own 'stopped'
    // event - it must be swallowed, not treated as unexpected.
    emitListeningState('stopped')
    emitListeningState('started')

    expect(SpeechRecognition.stop).toHaveBeenCalledTimes(1)
    expect(SpeechRecognition.start).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ language: 'en-US' })
    )
    // Exactly the two explicit start() calls - no extra restart was scheduled.
    expect(SpeechRecognition.start).toHaveBeenCalledTimes(2)
  })

  it('registers the partialResults/listeningState listeners exactly once even across multiple start() calls', async () => {
    const engine = new CapacitorSpeechEngine()
    await engine.start('es-ES')
    await engine.start('en-US')
    await engine.start('es-ES')

    const calls = vi.mocked(SpeechRecognition.addListener).mock.calls as unknown as [
      ListenerName,
      Listener,
    ][]
    const partialResultsRegistrations = calls.filter(([eventName]) => eventName === 'partialResults')
    const listeningStateRegistrations = calls.filter(([eventName]) => eventName === 'listeningState')

    expect(partialResultsRegistrations).toHaveLength(1)
    expect(listeningStateRegistrations).toHaveLength(1)
  })

  it('maps a network-related start failure to a network error', async () => {
    vi.mocked(SpeechRecognition.start).mockRejectedValue(new Error('Network error occurred'))
    const engine = new CapacitorSpeechEngine()
    const errorHandler = vi.fn()
    engine.onError(errorHandler)

    await engine.start('en-US')

    expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({ code: 'network' }))
    expect(engine.status).toBe('error')
  })

  it('maps a no-speech-flavored start failure to no-match status without an onError emission', async () => {
    vi.mocked(SpeechRecognition.start).mockRejectedValue(new Error('No speech detected'))
    const engine = new CapacitorSpeechEngine()
    const errorHandler = vi.fn()
    engine.onError(errorHandler)

    await engine.start('en-US')

    expect(errorHandler).not.toHaveBeenCalled()
    expect(engine.status).toBe('no-match')
  })

  it('keeps retrying after a no-speech start failure instead of going silent for good', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(SpeechRecognition.start).mockRejectedValueOnce(new Error('No speech detected'))
      const engine = new CapacitorSpeechEngine()

      await engine.start('en-US')
      expect(engine.status).toBe('no-match')
      expect(SpeechRecognition.start).toHaveBeenCalledTimes(1)

      await vi.advanceTimersByTimeAsync(500)
      expect(SpeechRecognition.start).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('maps the real-device "Didn\'t understand" start failure to no-match status without an onError emission', async () => {
    vi.mocked(SpeechRecognition.start).mockRejectedValue(
      new Error("Didn't understand, please try again.")
    )
    const engine = new CapacitorSpeechEngine()
    const errorHandler = vi.fn()
    engine.onError(errorHandler)

    await engine.start('en-US')

    expect(errorHandler).not.toHaveBeenCalled()
    expect(engine.status).toBe('no-match')
  })

  it('maps an unrecognized start failure to unknown', async () => {
    vi.mocked(SpeechRecognition.start).mockRejectedValue(new Error('Something exploded'))
    const engine = new CapacitorSpeechEngine()
    const errorHandler = vi.fn()
    engine.onError(errorHandler)

    await engine.start('en-US')

    expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({ code: 'unknown' }))
  })

  it('onTranscript/onError/onStatusChange unsubscribe functions remove their handlers', async () => {
    const engine = new CapacitorSpeechEngine()
    const transcriptHandler = vi.fn()
    const unsubscribe = engine.onTranscript(transcriptHandler)

    await engine.start('en-US')
    unsubscribe()
    emitPartialResults(['should not be received'])

    expect(transcriptHandler).not.toHaveBeenCalled()
  })
})
