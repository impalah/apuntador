/**
 * Turns raw Markdown script content into a flat, comparable token stream for
 * voice alignment. A thin filter over the shared buildWordStream (see
 * src/utils/plainText.ts) - keeps only the words that carry an alignment
 * index, dropping punctuation-only "words" that have nothing to match
 * against speech (they're still rendered by the monospace frame, which
 * consumes buildWordStream directly instead of this filtered view).
 */

import { buildWordStream } from '@/utils/plainText'

export interface ScriptToken {
  /** Original word as it appears in the script, for display purposes. */
  word: string
  /** Lowercased, accent-stripped, punctuation-stripped form used for matching. */
  normalized: string
  /** 0-based ordinal position among normalized tokens - what "cursor position" means. */
  sourceIndex: number
}

export { normalizeWord, normalizeWords } from '@/utils/plainText'

export function tokenizeScript(raw: string): ScriptToken[] {
  return buildWordStream(raw)
    .filter((entry) => entry.sourceIndex !== null)
    .map(({ word, normalized, sourceIndex }) => ({ word, normalized, sourceIndex: sourceIndex! }))
}
