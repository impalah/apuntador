/**
 * Runtime engine selector, mirroring how unifiedMTLSService resolves a
 * PlatformEnrollmentStrategy from Capacitor.getPlatform() once and hands callers a
 * ready-to-use instance. Consumers (useSpeechTracking) never branch on platform
 * themselves; the native engine is backed by @capacitor-community/speech-recognition
 * (see capacitorSpeechEngine.ts), which bundles its own Android/iOS implementation.
 */

import { Capacitor } from '@capacitor/core'
import type { SpeechEngine } from './speechEngine'
import { WebSpeechEngine } from './webSpeechEngine'
import { CapacitorSpeechEngine } from './capacitorSpeechEngine'

export function createSpeechEngine(): SpeechEngine {
  if (Capacitor.isNativePlatform()) {
    return new CapacitorSpeechEngine()
  }
  return new WebSpeechEngine()
}
