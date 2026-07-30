/**
 * Runtime engine selector, mirroring how unifiedMTLSService resolves a
 * PlatformEnrollmentStrategy from Capacitor.getPlatform() once and hands callers a
 * ready-to-use instance. Consumers (useSpeechTracking) never branch on platform
 * themselves; adding capacitorSpeechEngine.ts in a later phase only changes this file.
 */

import { Capacitor } from '@capacitor/core'
import type {
  SpeechEngine,
  SpeechEngineError,
  SpeechEngineStatus,
  SpeechTranscriptEvent,
} from './speechEngine'
import type { SpeechLanguage } from '@/utils/constants'
import { WebSpeechEngine } from './webSpeechEngine'

/**
 * Placeholder for native platforms until capacitorSpeechEngine.ts (Fase 2) lands.
 * Always reports unsupported so useSpeechTracking's existing fallback-to-auto path
 * handles it exactly like a browser without Web Speech API.
 */
class UnsupportedSpeechEngine implements SpeechEngine {
  readonly isSupported = false
  readonly status: SpeechEngineStatus = 'error'

  async start(_language: SpeechLanguage): Promise<void> {
    // No-op: isSupported is false, so callers are expected to check it before
    // starting and surface the fallback themselves.
  }

  async stop(): Promise<void> {
    // Nothing to stop.
  }

  onTranscript(_handler: (_event: SpeechTranscriptEvent) => void): () => void {
    return () => {}
  }

  onError(_handler: (_error: SpeechEngineError) => void): () => void {
    return () => {}
  }

  onStatusChange(_handler: (_status: SpeechEngineStatus) => void): () => void {
    return () => {}
  }
}

export function createSpeechEngine(): SpeechEngine {
  if (Capacitor.isNativePlatform()) {
    return new UnsupportedSpeechEngine()
  }
  return new WebSpeechEngine()
}
