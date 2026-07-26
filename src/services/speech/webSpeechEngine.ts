/**
 * SpeechEngine implementation backed by the browser's native Web Speech API
 * (SpeechRecognition / webkitSpeechRecognition). No TypeScript lib ships types for
 * this API, so the minimal surface used here is declared locally instead of adding a
 * @types package for a handful of members.
 */

import type {
  SpeechEngine,
  SpeechEngineError,
  SpeechEngineErrorCode,
  SpeechEngineStatus,
  SpeechTranscriptEvent,
} from './speechEngine'
import { SPEECH_RESTART_DELAY_MS, type SpeechLanguage } from '@/utils/constants'

interface WebSpeechRecognitionAlternative {
  transcript: string
}

interface WebSpeechRecognitionResult {
  isFinal: boolean
  length: number
  [index: number]: WebSpeechRecognitionAlternative
}

interface WebSpeechRecognitionResultList {
  length: number
  [index: number]: WebSpeechRecognitionResult
}

interface WebSpeechRecognitionEvent {
  resultIndex: number
  results: WebSpeechRecognitionResultList
}

interface WebSpeechRecognitionErrorEvent {
  error: string
  message?: string
}

interface WebSpeechRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((_event: WebSpeechRecognitionErrorEvent) => void) | null
  onresult: ((_event: WebSpeechRecognitionEvent) => void) | null
}

interface WebSpeechRecognitionConstructor {
  new (): WebSpeechRecognition
}

function getSpeechRecognitionConstructor(): WebSpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  const globalWithSpeech = window as unknown as {
    SpeechRecognition?: WebSpeechRecognitionConstructor
    webkitSpeechRecognition?: WebSpeechRecognitionConstructor
  }
  return globalWithSpeech.SpeechRecognition ?? globalWithSpeech.webkitSpeechRecognition ?? null
}

function mapErrorCode(error: string): SpeechEngineErrorCode {
  switch (error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'permission-denied'
    case 'no-speech':
      return 'no-speech'
    case 'network':
      return 'network'
    case 'aborted':
      return 'aborted'
    default:
      return 'unknown'
  }
}

export class WebSpeechEngine implements SpeechEngine {
  private readonly RecognitionCtor = getSpeechRecognitionConstructor()
  private recognition: WebSpeechRecognition | null = null
  private shouldBeListening = false
  private _status: SpeechEngineStatus = 'idle'

  private readonly transcriptHandlers = new Set<(_event: SpeechTranscriptEvent) => void>()
  private readonly errorHandlers = new Set<(_error: SpeechEngineError) => void>()
  private readonly statusHandlers = new Set<(_status: SpeechEngineStatus) => void>()

  get isSupported(): boolean {
    return this.RecognitionCtor !== null
  }

  get status(): SpeechEngineStatus {
    return this._status
  }

  async start(language: SpeechLanguage): Promise<void> {
    if (!this.RecognitionCtor) {
      this.setStatus('error')
      this.emitError('not-supported', 'Web Speech API is not available in this browser')
      return
    }

    this.shouldBeListening = true
    this.recognition?.stop()
    this.recognition = this.createRecognition(this.RecognitionCtor, language)

    try {
      this.recognition.start()
    } catch (error) {
      this.setStatus('error')
      this.emitError('unknown', 'Failed to start speech recognition', error)
    }
  }

  async stop(): Promise<void> {
    this.shouldBeListening = false
    this.recognition?.stop()
    this.recognition = null
    this.setStatus('stopped')
  }

  onTranscript(handler: (_event: SpeechTranscriptEvent) => void): () => void {
    this.transcriptHandlers.add(handler)
    return () => this.transcriptHandlers.delete(handler)
  }

  onError(handler: (_error: SpeechEngineError) => void): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  onStatusChange(handler: (_status: SpeechEngineStatus) => void): () => void {
    this.statusHandlers.add(handler)
    return () => this.statusHandlers.delete(handler)
  }

  private createRecognition(
    RecognitionCtor: WebSpeechRecognitionConstructor,
    language: SpeechLanguage
  ): WebSpeechRecognition {
    const recognition = new RecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = language

    recognition.onstart = () => {
      if (import.meta.env.DEV) {
        console.log('[VoiceTracking] engine started, lang:', language)
      }
      this.setStatus('listening')
    }

    recognition.onresult = (event) => {
      // continuous:true accumulates multiple segments in event.results (one
      // per speech pause the recognizer detects), and a single onresult call
      // can report several of them at once (from event.resultIndex onward -
      // typically an already-final earlier segment plus the newly-forming
      // one). They must be concatenated into one growing utterance-so-far
      // string, not emitted as separate transcript events: doing the latter
      // used to feed useScriptAlignment two interleaved, contradictory
      // "streams" of text, which kept resetting its interim commit streak
      // and made voice tracking stall even though recognition itself was
      // working fine.
      let combinedText = ''
      let isFinal = false

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const alternative = result?.[0]
        if (!alternative) continue

        combinedText += (combinedText ? ' ' : '') + alternative.transcript
        isFinal = result.isFinal
      }

      if (!combinedText) return

      if (import.meta.env.DEV) {
        console.log(
          '[VoiceTracking] transcript:',
          JSON.stringify(combinedText),
          isFinal ? '(final)' : '(interim)'
        )
      }

      const transcriptEvent: SpeechTranscriptEvent = {
        text: combinedText,
        isFinal,
        timestamp: performance.now(),
      }
      this.transcriptHandlers.forEach((handler) => handler(transcriptEvent))
    }

    recognition.onerror = (event) => {
      const code = mapErrorCode(event.error)

      if (import.meta.env.DEV) {
        console.log('[VoiceTracking] engine error:', event.error, '-> mapped to', code)
      }

      // Prolonged silence is an expected, recoverable condition (not an engine
      // failure) - surface it as a status so the UI can show "paused", not an error.
      if (code === 'no-speech') {
        this.setStatus('no-match')
        return
      }

      this.setStatus('error')
      this.emitError(code, event.message || event.error)

      if (code === 'permission-denied') {
        this.shouldBeListening = false
      }
    }

    recognition.onend = () => {
      if (import.meta.env.DEV) {
        console.log('[VoiceTracking] engine ended, shouldBeListening:', this.shouldBeListening)
      }

      // Some browsers end recognition after a period of silence or a fixed
      // duration even with continuous:true; restart transparently while the
      // engine is still supposed to be listening (i.e. stop() wasn't called).
      if (!this.shouldBeListening) {
        this.setStatus('stopped')
        return
      }

      // Chrome can throw InvalidStateError if start() is called synchronously
      // within 'end' - its internal teardown isn't always finished yet. A
      // short delay avoids that without being perceptible to the reader.
      window.setTimeout(() => {
        if (!this.shouldBeListening) return
        try {
          recognition.start()
        } catch (error) {
          if (import.meta.env.DEV) {
            console.log('[VoiceTracking] restart failed:', error)
          }
          this.setStatus('error')
          this.emitError('unknown', 'Failed to restart speech recognition', error)
        }
      }, SPEECH_RESTART_DELAY_MS)
    }

    return recognition
  }

  private setStatus(status: SpeechEngineStatus): void {
    if (this._status === status) return
    this._status = status
    this.statusHandlers.forEach((handler) => handler(status))
  }

  private emitError(code: SpeechEngineErrorCode, message: string, cause?: unknown): void {
    const error: SpeechEngineError = { code, message, cause }
    this.errorHandlers.forEach((handler) => handler(error))
  }
}
