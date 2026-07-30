/**
 * Platform-independent speech recognition contract. Mirrors the shape of
 * PlatformEnrollmentStrategy (src/services/mtls/enrollmentStrategy.ts): a small
 * promise-based lifecycle plus normalized event/error types, so callers never see
 * browser-specific (SpeechRecognitionErrorEvent) or plugin-specific shapes.
 */

import type { SpeechLanguage } from '@/utils/constants'

export type { SpeechLanguage }

export type SpeechEngineErrorCode =
  | 'not-supported' // API/plugin unavailable on this platform/browser
  | 'permission-denied' // microphone permission refused
  | 'no-speech' // prolonged silence / no audio detected
  | 'network' // engine requires connectivity and it's unavailable
  | 'aborted' // engine stopped unexpectedly
  | 'unknown'

export interface SpeechEngineError {
  code: SpeechEngineErrorCode
  message: string
  cause?: unknown
}

export interface SpeechTranscriptEvent {
  text: string
  isFinal: boolean // false = interim (still being refined), true = committed
  timestamp: number // performance.now() at emission
}

export type SpeechEngineStatus = 'idle' | 'listening' | 'no-match' | 'error' | 'stopped'

export interface SpeechEngine {
  readonly isSupported: boolean
  readonly status: SpeechEngineStatus

  start(language: SpeechLanguage): Promise<void>
  stop(): Promise<void>

  onTranscript(handler: (_event: SpeechTranscriptEvent) => void): () => void
  onError(handler: (_error: SpeechEngineError) => void): () => void
  onStatusChange(handler: (_status: SpeechEngineStatus) => void): () => void
}
