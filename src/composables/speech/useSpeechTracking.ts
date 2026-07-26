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
  const {
    tokens,
    cursorIndex,
    processTranscript,
    reset: resetAlignment,
  } = useScriptAlignment(scriptText)

  const isSupported = engine.isSupported
  const status = ref<SpeechEngineStatus>('idle')
  const error = ref<SpeechEngineError | null>(null)
  const progress = ref<AlignmentMatch | null>(null)

  /**
   * Estimated position in the script as a 0-1 ratio (token-count based
   * approximation - see docs/voice-tracking-design.md section 5). The caller
   * (TeleprompterPage) multiplies this by maxOffset to get a pixel target for
   * SmoothScroller, without needing to know about tokens/cursorIndex itself.
   */
  const progressRatio = computed(() => {
    const totalTokens = tokens.value.length
    if (totalTokens <= 1) return 0
    return Math.min(1, Math.max(0, cursorIndex.value / (totalTokens - 1)))
  })

  const isListening = computed(() => status.value === 'listening' || status.value === 'no-match')

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
    resetAlignment()
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
    progressRatio,
    cursorIndex,
    start,
    stop,
  }
}
