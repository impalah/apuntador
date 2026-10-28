/**
 * SpeechEngine implementation backed by the @capacitor-community/speech-recognition
 * plugin (bundles native Android SpeechRecognizer / iOS SFSpeechRecognizer - no
 * custom native code needed here). Unlike WebSpeechEngine, the plugin exposes one
 * shared native bridge rather than a fresh recognition object per start() call, so
 * listeners are registered exactly once (registerListenersOnce) instead of per call,
 * and status is driven by the plugin's own 'listeningState' event rather than by the
 * start() promise (which resolves almost immediately when partialResults:true, before
 * real listening actually begins).
 */

import { SpeechRecognition } from '@capacitor-community/speech-recognition'
import { Capacitor } from '@capacitor/core'
import type {
  SpeechEngine,
  SpeechEngineError,
  SpeechEngineErrorCode,
  SpeechEngineStatus,
  SpeechTranscriptEvent,
} from './speechEngine'
import {
  SPEECH_NATIVE_MAX_CONSECUTIVE_RESTARTS,
  SPEECH_NATIVE_RESTART_DELAY_MS,
  type SpeechLanguage,
} from '@/utils/constants'

/**
 * Maps this plugin's unstructured native error messages to our normalized error
 * codes. Unlike the Web Speech API's small documented event.error enum, this plugin
 * rejects with plain Error objects whose message varies by platform/OS version - this
 * table is a best-effort starting point, not a verified spec. Raw messages are logged
 * in dev builds (see handleStartFailure below) so real-device testing can reveal the
 * actual strings and this table can be tightened afterward.
 */
function mapErrorMessage(message: string): SpeechEngineErrorCode {
  const lower = message.toLowerCase()
  if (lower.includes('permission') || lower.includes('denied')) return 'permission-denied'
  if (
    lower.includes('no speech') ||
    lower.includes('no match') ||
    lower.includes('timeout') ||
    lower.includes("didn't understand") ||
    lower.includes('didnt understand')
  ) {
    return 'no-speech'
  }
  if (lower.includes('network')) return 'network'
  return 'unknown'
}

const START_OPTIONS = {
  popup: false,
  partialResults: true,
  maxResults: 5,
} as const

/**
 * Single source of truth for platforms where voice mode is not offered at all
 * (the engine's isSupported and the UI toggles in ActionsMenu/FloatingToolbar
 * all use this). Android: see the isSupported comment below.
 */
export function isVoiceModeOfferedOnPlatform(): boolean {
  return Capacitor.getPlatform() !== 'android'
}

export class CapacitorSpeechEngine implements SpeechEngine {
  // false on Android: confirmed on real hardware (Samsung tablet, One UI) that
  // the silent (popup:false) recognition path never gets microphone input
  // routed to it, and the only working alternative - Android's own visible
  // recognition dialog (popup:true) - has no continuous events at all (its
  // result only arrives once the dialog closes) and would flash on/off every
  // few seconds while reading. Not worth the UX cost, so voice mode is not
  // offered on Android at all (see isVoiceModeOfferedOnPlatform).
  // True on iOS: SFSpeechRecognizer has no such limitation.
  readonly isSupported = isVoiceModeOfferedOnPlatform()

  private _status: SpeechEngineStatus = 'idle'
  private shouldBeListening = false
  // True only while we're stopping the native session ourselves (a language switch
  // while already listening) - distinguishes that self-inflicted 'stopped' event from
  // a genuinely unexpected one, so it doesn't trigger a spurious restart.
  private isTearingDownForRestart = false
  private listenersRegistered = false
  private currentLanguage: SpeechLanguage | null = null
  private consecutiveRestarts = 0
  private restartTimer: number | null = null

  private readonly transcriptHandlers = new Set<(_event: SpeechTranscriptEvent) => void>()
  private readonly errorHandlers = new Set<(_error: SpeechEngineError) => void>()
  private readonly statusHandlers = new Set<(_status: SpeechEngineStatus) => void>()

  get status(): SpeechEngineStatus {
    return this._status
  }

  async start(language: SpeechLanguage): Promise<void> {
    this.clearRestartTimer()
    this.registerListenersOnce()

    if (this.shouldBeListening) {
      // Already listening (language switch) - stop first so the listeningState
      // handler below can tell this apart from an unexpected native stop.
      this.isTearingDownForRestart = true
      try {
        await SpeechRecognition.stop()
      } catch {
        // best-effort - the plugin may already be stopped
      }
    }

    this.shouldBeListening = true
    this.currentLanguage = language

    try {
      const { available } = await SpeechRecognition.available()
      if (!available) {
        this.shouldBeListening = false
        this.setStatus('error')
        this.emitError('not-supported', 'Speech recognition is not available on this device')
        return
      }

      let permission = await SpeechRecognition.checkPermissions()
      if (permission.speechRecognition !== 'granted') {
        permission = await SpeechRecognition.requestPermissions()
      }
      if (permission.speechRecognition !== 'granted') {
        this.shouldBeListening = false
        this.setStatus('error')
        this.emitError(
          'permission-denied',
          'Microphone/speech recognition permission was not granted'
        )
        return
      }

      await SpeechRecognition.start({ language, ...START_OPTIONS })
    } catch (error) {
      this.handleStartFailure(error)
    } finally {
      this.isTearingDownForRestart = false
    }
  }

  async stop(): Promise<void> {
    this.shouldBeListening = false
    this.clearRestartTimer()
    try {
      await SpeechRecognition.stop()
    } catch {
      // best-effort
    }
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

  /**
   * Registered exactly once for the engine's lifetime - the plugin is a singleton
   * native bridge, not a per-call object like the web engine's, so re-registering on
   * every start() would stack duplicate listeners across language switches. Never
   * unregistered: useSpeechTracking owns one engine instance for the page's whole
   * lifetime, and shouldBeListening already guards the handler bodies below.
   */
  private registerListenersOnce(): void {
    if (this.listenersRegistered) return
    this.listenersRegistered = true

    SpeechRecognition.addListener('partialResults', (data) => {
      if (!this.shouldBeListening) return
      const text = data.matches?.[0]
      if (!text) return

      if (import.meta.env.DEV) {
        console.log('[VoiceTracking] native transcript:', JSON.stringify(text))
      }

      // This plugin has no equivalent of the Web Speech API's per-segment
      // isFinal:true - it only ever streams continuously-refining partial
      // results for the current utterance, so every event here is interim.
      // useScriptAlignment's commit-streak logic already handles that.
      const transcriptEvent: SpeechTranscriptEvent = {
        text,
        isFinal: false,
        timestamp: performance.now(),
      }
      this.transcriptHandlers.forEach((handler) => handler(transcriptEvent))
    })

    SpeechRecognition.addListener('listeningState', (data) => {
      if (import.meta.env.DEV) {
        console.log(
          '[VoiceTracking] native listeningState:',
          data.status,
          'shouldBeListening:',
          this.shouldBeListening
        )
      }

      if (data.status === 'started') {
        this.consecutiveRestarts = 0
        this.setStatus('listening')
        return
      }

      // data.status === 'stopped'
      if (this.isTearingDownForRestart) {
        // Our own language-switch stop() - the start() call issued right after
        // it will produce its own 'started' event shortly.
        return
      }

      if (!this.shouldBeListening) {
        this.setStatus('stopped')
        return
      }

      // The native session ended on its own while we're still supposed to be
      // listening (Android's SpeechRecognizer in particular is known to time
      // out even though this plugin documents "listens until stop()").
      this.scheduleRestart()
    })
  }

  private scheduleRestart(): void {
    this.consecutiveRestarts += 1
    if (this.consecutiveRestarts > SPEECH_NATIVE_MAX_CONSECUTIVE_RESTARTS) {
      this.shouldBeListening = false
      this.setStatus('error')
      this.emitError(
        'unknown',
        'Speech recognition kept stopping unexpectedly and gave up restarting'
      )
      return
    }

    this.clearRestartTimer()
    this.restartTimer = window.setTimeout(() => {
      this.restartTimer = null
      if (!this.shouldBeListening || !this.currentLanguage) return

      SpeechRecognition.start({ language: this.currentLanguage, ...START_OPTIONS }).catch(
        (error: unknown) => {
          this.handleStartFailure(error)
        }
      )
    }, SPEECH_NATIVE_RESTART_DELAY_MS)
  }

  private clearRestartTimer(): void {
    if (this.restartTimer !== null) {
      window.clearTimeout(this.restartTimer)
      this.restartTimer = null
    }
  }

  private handleStartFailure(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    const code = mapErrorMessage(message)

    if (import.meta.env.DEV) {
      console.log('[VoiceTracking] native error:', message, '-> mapped to', code)
    }

    // Silence is recoverable: keep listening and retry (bounded by the
    // consecutive-restart budget). Stopping here left the UI showing
    // "waiting for speech" while the native recognizer was already dead.
    if (code === 'no-speech' && this.shouldBeListening) {
      this.setStatus('no-match')
      this.scheduleRestart()
      return
    }

    this.shouldBeListening = false
    if (code === 'no-speech') {
      this.setStatus('no-match')
      return
    }

    this.setStatus('error')
    this.emitError(code, message, error)
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
