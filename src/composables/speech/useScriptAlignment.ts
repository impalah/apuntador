/**
 * Speech-source-independent estimator of "where in the script is the user reading".
 * Takes transcript text (interim or final) and returns the best-guess token position,
 * using a sliding look-ahead window of upcoming script tokens scored with fuse.js.
 * See docs/voice-tracking-design.md section 5 for the full algorithm rationale.
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue'
import Fuse from 'fuse.js'
import { normalizeWords, tokenizeScript, type ScriptToken } from '@/utils/speech/scriptTokenizer'
import {
  SPEECH_ALIGNMENT_AMBIGUITY_EPSILON,
  SPEECH_ALIGNMENT_COMMIT_STREAK,
  SPEECH_ALIGNMENT_CONFIDENCE_THRESHOLD,
  SPEECH_ALIGNMENT_QUERY_WORDS,
  SPEECH_ALIGNMENT_WINDOW_SIZE,
} from '@/utils/constants'

export interface AlignmentMatch {
  sourceIndex: number
  /** 0 (no confidence) to 1 (perfect match). */
  confidence: number
}

interface ScoredCandidate {
  sourceIndex: number
  score: number
  text: string
}

function buildCandidates(tokens: ScriptToken[], cursorIndex: number, queryLength: number) {
  const windowEnd = Math.min(tokens.length, cursorIndex + SPEECH_ALIGNMENT_WINDOW_SIZE)
  const candidates: { text: string; sourceIndex: number }[] = []

  // sourceIndex is the *last* word of the matched phrase, not its start - it
  // represents how far the reader has progressed once this phrase is heard,
  // which is what should drive the scroll position forward.
  for (let start = cursorIndex; start + queryLength <= windowEnd; start++) {
    const slice = tokens.slice(start, start + queryLength)
    candidates.push({
      text: slice.map((token) => token.normalized).join(' '),
      sourceIndex: tokens[start + queryLength - 1]!.sourceIndex,
    })
  }

  return candidates
}

/**
 * Picks the best candidate, breaking near-ties (within the ambiguity epsilon) in
 * favor of the smallest forward jump from the cursor - see design doc section 5,
 * "Ambiguity".
 */
function pickBest(scored: ScoredCandidate[]): ScoredCandidate | null {
  if (scored.length === 0) return null

  const sorted = [...scored].sort((a, b) => a.score - b.score)
  const best = sorted[0]!
  const tied = sorted.filter((c) => c.score - best.score <= SPEECH_ALIGNMENT_AMBIGUITY_EPSILON)

  return tied.reduce((closest, c) => (c.sourceIndex < closest.sourceIndex ? c : closest), tied[0]!)
}

export function useScriptAlignment(scriptText: Ref<string> | ComputedRef<string>) {
  const tokens = computed<ScriptToken[]>(() => tokenizeScript(scriptText.value))
  const cursorIndex = ref(0)

  let pendingIndex: number | null = null
  let pendingStreak = 0

  function reset(): void {
    cursorIndex.value = 0
    pendingIndex = null
    pendingStreak = 0
  }

  function commit(sourceIndex: number, confidence: number): AlignmentMatch {
    cursorIndex.value = sourceIndex
    pendingIndex = null
    pendingStreak = 0
    return { sourceIndex, confidence }
  }

  /**
   * Feed a transcript segment (interim or final) from useSpeechTracking. Returns a
   * committed AlignmentMatch only when the cursor actually advances; null otherwise
   * (no confident match yet, or the match didn't clear the commit rule below).
   */
  function processTranscript(text: string, isFinal: boolean): AlignmentMatch | null {
    const scriptTokens = tokens.value
    const queryWords = normalizeWords(text).slice(-SPEECH_ALIGNMENT_QUERY_WORDS)
    if (queryWords.length === 0) return null

    const queryLength = queryWords.length
    const candidates = buildCandidates(scriptTokens, cursorIndex.value, queryLength)
    if (candidates.length === 0) return null

    const fuse = new Fuse(candidates, {
      keys: ['text'],
      includeScore: true,
      threshold: 1, // don't let fuse.js pre-filter - we apply our own confidence threshold
      ignoreLocation: true,
    })

    const query = queryWords.join(' ')
    const results = fuse.search(query)

    if (results.length === 0) {
      if (import.meta.env.DEV) {
        console.log(
          '[VoiceTracking] alignment: no fuse.js results for query',
          JSON.stringify(query)
        )
      }
      return null
    }

    const scored: ScoredCandidate[] = results.map((result) => ({
      sourceIndex: result.item.sourceIndex,
      score: result.score ?? 1,
      text: result.item.text,
    }))

    const best = pickBest(scored)

    if (import.meta.env.DEV) {
      console.log(
        '[VoiceTracking] alignment: query',
        JSON.stringify(query),
        'best candidate',
        best ? JSON.stringify(best.text) : null,
        'score',
        best?.score,
        '(threshold',
        SPEECH_ALIGNMENT_CONFIDENCE_THRESHOLD,
        ') cursor',
        cursorIndex.value
      )
    }

    if (!best) return null
    if (best.score > SPEECH_ALIGNMENT_CONFIDENCE_THRESHOLD) return null
    if (best.sourceIndex < cursorIndex.value) return null // never move backward

    const confidence = 1 - best.score

    if (isFinal) {
      if (import.meta.env.DEV) {
        console.log('[VoiceTracking] alignment: committed (final) -> sourceIndex', best.sourceIndex)
      }
      return commit(best.sourceIndex, confidence)
    }

    // Interim result: require the same candidate to win several times in a row
    // before committing, to damp jitter from partial/still-refining transcripts.
    if (pendingIndex === best.sourceIndex) {
      pendingStreak += 1
    } else {
      pendingIndex = best.sourceIndex
      pendingStreak = 1
    }

    if (pendingStreak >= SPEECH_ALIGNMENT_COMMIT_STREAK) {
      if (import.meta.env.DEV) {
        console.log(
          '[VoiceTracking] alignment: committed (interim streak) -> sourceIndex',
          best.sourceIndex
        )
      }
      return commit(best.sourceIndex, confidence)
    }

    if (import.meta.env.DEV) {
      console.log(
        '[VoiceTracking] alignment: pending streak',
        pendingStreak,
        '/',
        SPEECH_ALIGNMENT_COMMIT_STREAK,
        'for sourceIndex',
        best.sourceIndex
      )
    }

    return null
  }

  return {
    tokens,
    cursorIndex,
    processTranscript,
    reset,
  }
}
