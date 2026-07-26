import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import type {
  SpeechEngine,
  SpeechEngineError,
  SpeechEngineStatus,
  SpeechTranscriptEvent,
} from '@/services/speech/speechEngine'

const createSpeechEngine = vi.fn()
vi.mock('@/services/speech/createSpeechEngine', () => ({
  createSpeechEngine: (...args: unknown[]) => createSpeechEngine(...args),
}))

class FakeSpeechEngine implements SpeechEngine {
  isSupported = true
  status: SpeechEngineStatus = 'idle'

  private transcriptHandlers = new Set<(_event: SpeechTranscriptEvent) => void>()
  private errorHandlers = new Set<(_error: SpeechEngineError) => void>()
  private statusHandlers = new Set<(_status: SpeechEngineStatus) => void>()

  start = vi.fn(async () => {
    this.emitStatus('listening')
  })

  stop = vi.fn(async () => {
    this.emitStatus('stopped')
  })

  onTranscript(handler: (_event: SpeechTranscriptEvent) => void) {
    this.transcriptHandlers.add(handler)
    return () => this.transcriptHandlers.delete(handler)
  }

  onError(handler: (_error: SpeechEngineError) => void) {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  onStatusChange(handler: (_status: SpeechEngineStatus) => void) {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  emitTranscript(text: string, isFinal: boolean) {
    const event: SpeechTranscriptEvent = { text, isFinal, timestamp: performance.now() }
    this.transcriptHandlers.forEach((h) => h(event))
  }

  emitError(error: SpeechEngineError) {
    this.errorHandlers.forEach((h) => h(error))
  }

  emitStatus(status: SpeechEngineStatus) {
    this.status = status
    this.statusHandlers.forEach((h) => h(status))
  }
}

let fakeEngine: FakeSpeechEngine
// Imported dynamically after the mock is registered.
let useSpeechTracking: typeof import('@/composables/speech/useSpeechTracking').useSpeechTracking

beforeEach(async () => {
  vi.useFakeTimers()
  fakeEngine = new FakeSpeechEngine()
  createSpeechEngine.mockReturnValue(fakeEngine)
  ;({ useSpeechTracking } = await import('@/composables/speech/useSpeechTracking'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

const SCRIPT = 'uno dos tres cuatro cinco seis siete ocho nueve diez'

describe('useSpeechTracking', () => {
  it('reflects the engine support flag', () => {
    fakeEngine.isSupported = false
    const tracking = useSpeechTracking(ref(SCRIPT), ref('en-US'))
    expect(tracking.isSupported).toBe(false)
  })

  it('starts the engine with the requested language', async () => {
    const language = ref<'es-ES' | 'en-US'>('es-ES')
    const tracking = useSpeechTracking(ref(SCRIPT), language)

    await tracking.start()

    expect(fakeEngine.start).toHaveBeenCalledWith('es-ES')
    expect(tracking.status.value).toBe('listening')
    expect(tracking.isListening.value).toBe(true)
  })

  it('advances progress when a transcript matches the script', async () => {
    const tracking = useSpeechTracking(ref(SCRIPT), ref('en-US'))
    await tracking.start()

    fakeEngine.emitTranscript('uno dos tres', true)

    expect(tracking.progress.value?.sourceIndex).toBe(2)
    expect(tracking.progress.value?.confidence).toBeCloseTo(1, 5)
    expect(tracking.progressRatio.value).toBeCloseTo(2 / 9, 5)
  })

  it('surfaces engine errors', async () => {
    const tracking = useSpeechTracking(ref(SCRIPT), ref('en-US'))
    await tracking.start()

    fakeEngine.emitError({ code: 'permission-denied', message: 'denied' })

    expect(tracking.error.value).toEqual({ code: 'permission-denied', message: 'denied' })
  })

  it('surfaces a no-match status after the silence timeout with no confident commit', async () => {
    const tracking = useSpeechTracking(ref(SCRIPT), ref('en-US'))
    await tracking.start()

    // A confident commit re-arms the timer; only silence past the timeout
    // with nothing committed should flip the status to no-match.
    await vi.advanceTimersByTimeAsync(10_000)

    expect(tracking.status.value).toBe('no-match')
  })

  it('unsubscribes and stops the engine on stop()', async () => {
    const tracking = useSpeechTracking(ref(SCRIPT), ref('en-US'))
    await tracking.start()

    await tracking.stop()

    expect(fakeEngine.stop).toHaveBeenCalledTimes(1)
    expect(tracking.status.value).toBe('stopped')

    // Transcripts after stop() should not be processed anymore.
    fakeEngine.emitTranscript('uno dos tres', true)
    expect(tracking.progress.value).toBeNull()
  })

  it('restarts the engine with the new language while listening', async () => {
    const language = ref<'es-ES' | 'en-US'>('es-ES')
    const tracking = useSpeechTracking(ref(SCRIPT), language)
    await tracking.start()

    language.value = 'en-US'
    await vi.waitFor(() => {
      expect(fakeEngine.start).toHaveBeenCalledWith('en-US')
    })
  })

  it('seekToRatio moves the cursor to the expected token for a given scroll ratio', async () => {
    const tracking = useSpeechTracking(ref(SCRIPT), ref('en-US'))
    await tracking.start()

    tracking.seekToRatio(0.5) // 10 tokens (0-9) -> round(0.5 * 9) = 5 ("seis")
    expect(tracking.cursorIndex.value).toBe(5)

    const match = tracking.progress.value
    expect(match).toBeNull() // seeking alone doesn't commit a match

    fakeEngine.emitTranscript('siete ocho nueve', true)
    expect(tracking.progress.value?.sourceIndex).toBe(8)
  })

  it('does not reset the cursor back to zero on a stop/start cycle (pause/resume mid-script)', async () => {
    const tracking = useSpeechTracking(ref(SCRIPT), ref('en-US'))
    await tracking.start()

    fakeEngine.emitTranscript('uno dos tres', true)
    expect(tracking.cursorIndex.value).toBe(2)

    await tracking.stop()
    await tracking.start()

    // Previously start() unconditionally reset the alignment cursor to 0,
    // meaning every pause/resume silently restarted matching from the very
    // beginning regardless of where playback actually was.
    expect(tracking.cursorIndex.value).toBe(2)
  })
})
