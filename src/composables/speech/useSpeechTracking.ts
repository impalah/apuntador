/**
 * Connects a platform SpeechEngine (selected via createSpeechEngine) to
 * useScriptAlignment and exposes the combined result as reactive state: whether
 * we're listening, whether the platform supports it, the last error, and the
 * estimated position in the script. This is the only composable
 * TeleprompterPage needs to know about - it never touches SpeechEngine or
 * useScriptAlignment directly.
 */

import { computed, onUnmounted, ref, watch, type Ref } from 'vue'
import { createSpeechEngine } from '@/services/speech/createSpeechEngine'
import type { SpeechEngineError, SpeechEngineStatus } from '@/services/speech/speechEngine'
import type { SpeechLanguage } from '@/utils/constants'
import { SPEECH_NO_MATCH_TIMEOUT_MS } from '@/utils/constants'
import { useScriptAlignment, type AlignmentMatch } from './useScriptAlignment'

export function useSpeechTracking(scriptText: Ref<string>, language: Ref<SpeechLanguage>) {
  const engine = createSpeechEngine()
  const { cursorIndex, processTranscript, seek } = useScriptAlignment(scriptText)

  const isSupported = engine.isSupported
  const status = ref<SpeechEngineStatus>('idle')
  const error = ref<SpeechEngineError | null>(null)
  const progress = ref<AlignmentMatch | null>(null)

  const isListening = computed(() => status.value === 'listening' || status.value === 'no-match')

  /**
   * Resyncs the alignment cursor to a token index. TeleprompterPage calls this
   * after any manual repositioning (step lines, home/end, manual drag) and
   * before (re)starting voice tracking, so matching resumes from wherever the
   * reader actually is. Voice mode only runs on the monospace frame, whose
   * line-based layout maps a scroll position to an exact token index.
   */
  function seekToIndex(tokenIndex: number): void {
    seek(tokenIndex)
  }

  let noMatchTimer: number | null = null
  let unsubscribeTranscript: (() => void) | null = null
  let unsubscribeError: (() => void) | null = null
  let unsubscribeStatus: (() => void) | null = null

  function clearNoMatchTimer(): void {
    if (noMatchTimer !== null) {
      window.clearTimeout(noMatchTimer)
      noMatchTimer = null
    }
  }

  /** No confident alignment commit within the timeout -> surface 'no-match'. */
  function armNoMatchTimer(): void {
    clearNoMatchTimer()
    noMatchTimer = window.setTimeout(() => {
      if (status.value === 'listening') {
        if (import.meta.env.DEV) {
          console.log(
            '[VoiceTracking] no confident commit for',
            SPEECH_NO_MATCH_TIMEOUT_MS,
            'ms -> no-match'
          )
        }
        status.value = 'no-match'
      }
    }, SPEECH_NO_MATCH_TIMEOUT_MS)
  }

  function unsubscribeAll(): void {
    unsubscribeTranscript?.()
    unsubscribeError?.()
    unsubscribeStatus?.()
    unsubscribeTranscript = null
    unsubscribeError = null
    unsubscribeStatus = null
  }

  async function start(): Promise<void> {
    if (!isSupported) {
      status.value = 'error'
      error.value = { code: 'not-supported', message: 'Speech tracking is not supported here' }
      return
    }

    error.value = null
    progress.value = null
    unsubscribeAll()

    unsubscribeTranscript = engine.onTranscript((event) => {
      const match = processTranscript(event.text, event.isFinal)
      if (match) {
        progress.value = match
        status.value = 'listening'
        armNoMatchTimer()
      }
    })

    unsubscribeError = engine.onError((engineError) => {
      error.value = engineError
    })

    unsubscribeStatus = engine.onStatusChange((newStatus) => {
      if (import.meta.env.DEV) {
        console.log('[VoiceTracking] status:', status.value, '->', newStatus)
      }
      status.value = newStatus
      if (newStatus === 'listening') {
        armNoMatchTimer()
      } else {
        clearNoMatchTimer()
      }
    })

    await engine.start(language.value)
  }

  async function stop(): Promise<void> {
    clearNoMatchTimer()
    unsubscribeAll()
    await engine.stop()
    status.value = 'stopped'
  }

  // Dynamic language switching while already listening (es-ES <-> en-US).
  watch(language, async (newLanguage) => {
    if (isListening.value) {
      await engine.start(newLanguage)
    }
  })

  onUnmounted(() => {
    void stop()
  })

  return {
    isSupported,
    isListening,
    status,
    error,
    progress,
    cursorIndex,
    start,
    stop,
    seekToIndex,
  }
}
