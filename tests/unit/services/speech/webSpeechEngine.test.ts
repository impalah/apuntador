import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WebSpeechEngine } from '@/services/speech/webSpeechEngine'

interface MockResultAlternative {
  transcript: string
}

interface MockResult {
  isFinal: boolean
  length: number
  0: MockResultAlternative
}

class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = []

  continuous = false
  interimResults = false
  lang = ''
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: ((event: { error: string; message?: string }) => void) | null = null
  onresult:
    | ((event: {
        resultIndex: number
        results: { length: number; [i: number]: MockResult }
      }) => void)
    | null = null

  start = vi.fn()
  stop = vi.fn()

  constructor() {
    MockSpeechRecognition.instances.push(this)
  }
}

function makeResultEvent(transcript: string, isFinal: boolean) {
  return {
    resultIndex: 0,
    results: {
      length: 1,
      0: { isFinal, length: 1, 0: { transcript } },
    },
  }
}

describe('WebSpeechEngine', () => {
  const originalSpeechRecognition = (window as any).SpeechRecognition
  const originalWebkitSpeechRecognition = (window as any).webkitSpeechRecognition

  beforeEach(() => {
    MockSpeechRecognition.instances = []
    ;(window as any).SpeechRecognition = MockSpeechRecognition
    delete (window as any).webkitSpeechRecognition
  })

  afterEach(() => {
    ;(window as any).SpeechRecognition = originalSpeechRecognition
    ;(window as any).webkitSpeechRecognition = originalWebkitSpeechRecognition
  })

  it('reports unsupported when neither SpeechRecognition nor webkitSpeechRecognition exist', () => {
    delete (window as any).SpeechRecognition
    delete (window as any).webkitSpeechRecognition

    const engine = new WebSpeechEngine()

    expect(engine.isSupported).toBe(false)
  })

  it('falls back to webkitSpeechRecognition when SpeechRecognition is absent', () => {
    delete (window as any).SpeechRecognition
    ;(window as any).webkitSpeechRecognition = MockSpeechRecognition

    const engine = new WebSpeechEngine()

    expect(engine.isSupported).toBe(true)
  })

  it('emits a not-supported error and never starts recognition when unsupported', async () => {
    delete (window as any).SpeechRecognition
    delete (window as any).webkitSpeechRecognition

    const engine = new WebSpeechEngine()
    const errorHandler = vi.fn()
    engine.onError(errorHandler)

    await engine.start('en-US')

    expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({ code: 'not-supported' }))
    expect(engine.status).toBe('error')
  })

  it('configures continuous/interim recognition with the requested language and starts it', async () => {
    const engine = new WebSpeechEngine()
    await engine.start('es-ES')

    const instance = MockSpeechRecognition.instances[0]!
    expect(instance.continuous).toBe(true)
    expect(instance.interimResults).toBe(true)
    expect(instance.lang).toBe('es-ES')
    expect(instance.start).toHaveBeenCalledTimes(1)
  })

  it('transitions to listening status on the engine start event', async () => {
    const engine = new WebSpeechEngine()
    const statusHandler = vi.fn()
    engine.onStatusChange(statusHandler)

    await engine.start('en-US')
    MockSpeechRecognition.instances[0]!.onstart?.()

    expect(engine.status).toBe('listening')
    expect(statusHandler).toHaveBeenCalledWith('listening')
  })

  it('forwards final and interim transcripts', async () => {
    const engine = new WebSpeechEngine()
    const transcriptHandler = vi.fn()
    engine.onTranscript(transcriptHandler)

    await engine.start('en-US')
    const instance = MockSpeechRecognition.instances[0]!

    instance.onresult?.(makeResultEvent('hello world', false))
    instance.onresult?.(makeResultEvent('hello world', true))

    expect(transcriptHandler).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ text: 'hello world', isFinal: false })
    )
    expect(transcriptHandler).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ text: 'hello world', isFinal: true })
    )
  })

  it('maps prolonged silence to no-match status, not an error', async () => {
    const engine = new WebSpeechEngine()
    const errorHandler = vi.fn()
    const statusHandler = vi.fn()
    engine.onError(errorHandler)
    engine.onStatusChange(statusHandler)

    await engine.start('en-US')
    MockSpeechRecognition.instances[0]!.onerror?.({ error: 'no-speech' })

    expect(errorHandler).not.toHaveBeenCalled()
    expect(engine.status).toBe('no-match')
    expect(statusHandler).toHaveBeenCalledWith('no-match')
  })

  it('maps permission-denial to a permission-denied error and stops auto-restart', async () => {
    const engine = new WebSpeechEngine()
    const errorHandler = vi.fn()
    engine.onError(errorHandler)

    await engine.start('en-US')
    const instance = MockSpeechRecognition.instances[0]!
    instance.onerror?.({ error: 'not-allowed' })

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'permission-denied' })
    )
    expect(engine.status).toBe('error')

    // Some browsers fire 'end' right after an unrecoverable error - since
    // permission was denied, the engine must not try to restart itself.
    instance.onend?.()
    expect(instance.start).toHaveBeenCalledTimes(1)
  })

  it('auto-restarts recognition on unexpected end while still supposed to be listening', async () => {
    vi.useFakeTimers()
    try {
      const engine = new WebSpeechEngine()
      await engine.start('en-US')

      const instance = MockSpeechRecognition.instances[0]!
      instance.onend?.()

      // Restart is deliberately deferred (see SPEECH_RESTART_DELAY_MS) to
      // avoid Chrome's InvalidStateError when start() is called synchronously
      // within 'end'.
      expect(instance.start).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(300)
      expect(instance.start).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not restart recognition after an explicit stop()', async () => {
    const engine = new WebSpeechEngine()
    await engine.start('en-US')

    const instance = MockSpeechRecognition.instances[0]!
    await engine.stop()

    expect(instance.stop).toHaveBeenCalledTimes(1)

    instance.onend?.()
    expect(instance.start).toHaveBeenCalledTimes(1) // only the initial start()
    expect(engine.status).toBe('stopped')
  })

  it('restarts with a new recognition instance when the language changes', async () => {
    const engine = new WebSpeechEngine()
    await engine.start('es-ES')
    const first = MockSpeechRecognition.instances[0]!

    await engine.start('en-US')
    const second = MockSpeechRecognition.instances[1]!

    expect(first.stop).toHaveBeenCalledTimes(1)
    expect(second.lang).toBe('en-US')
    expect(second.start).toHaveBeenCalledTimes(1)
  })
})
