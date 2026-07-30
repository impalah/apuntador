/**
 * Markdown-to-plain-text utilities, shared by voice-tracking's tokenizer
 * (src/utils/speech/scriptTokenizer.ts) and the monospace presenter frame's
 * rendering/layout (src/composables/useMonospaceLayout.ts) - both need "the
 * words of the script with markdown syntax stripped", just for different
 * purposes (matching speech vs. laying out lines).
 */

export function stripMarkdownSyntax(raw: string): string {
  let text = raw

  text = text.replace(/```[\s\S]*?```/g, ' ') // fenced code blocks (code isn't spoken)
  text = text.replace(/`([^`]*)`/g, '$1') // inline code -> keep content
  text = text.replace(/!\[[^\]]*]\([^)]*\)/g, ' ') // images -> drop entirely (incl. alt text)
  text = text.replace(/\[([^\]]*)]\([^)]*\)/g, '$1') // links -> keep visible text
  text = text.replace(/<[^>]*>/g, ' ') // raw HTML tags
  text = text.replace(/^#{1,6}\s+/gm, '') // heading markers
  text = text.replace(/^>\s?/gm, '') // blockquote markers
  text = text.replace(/^\s*[-*+]\s+/gm, '') // unordered list markers
  text = text.replace(/^\s*\d+[.)]\s+/gm, '') // ordered list markers
  text = text.replace(/^\s*-{3,}\s*$/gm, ' ') // horizontal rules
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
  text = text.replace(/(\*|_)(.*?)\1/g, '$2') // italic

  return text
}

/**
 * Lowercase, strip diacritics (é, ñ, ...) and strip punctuation, keeping unicode
 * letters/numbers. Shared by script tokenization and transcript queries so both
 * sides of the comparison are normalized identically.
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
}

export function normalizeWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normalizeWord)
    .filter((word) => word.length > 0)
}

export interface WordStreamEntry {
  /** Original word as it appears in the script, for display purposes. */
  word: string
  /** Lowercased, accent-stripped, punctuation-stripped form used for matching. */
  normalized: string
  /**
   * 0-based ordinal position among *indexable* words (normalized !== ''),
   * or null for a punctuation-only "word" (e.g. a lone "-") that carries no
   * alignment token - it still needs to be rendered, it just isn't something
   * speech can be matched against.
   */
  sourceIndex: number | null
  /** True if a blank line (paragraph break) preceded this word in the source. */
  paragraphBreakBefore: boolean
}

/**
 * Splits stripped plain text into words, preserving paragraph boundaries
 * (needed by the monospace frame's line-wrapper to force breaks at the same
 * points a reader would expect them) while keeping the exact same word
 * content/order as a plain whitespace split - a blank-line gap is just a
 * particular run of whitespace, so splitting into paragraphs first and then
 * words within each paragraph yields an identical overall word sequence.
 */
export function buildWordStream(raw: string): WordStreamEntry[] {
  const stripped = stripMarkdownSyntax(raw)
  const paragraphs = stripped.split(/\n\s*\n+/)

  const entries: WordStreamEntry[] = []
  let counter = 0

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.split(/\s+/).filter((word) => word.length > 0)
    words.forEach((word, wordIndex) => {
      const normalized = normalizeWord(word)
      entries.push({
        word,
        normalized,
        sourceIndex: normalized ? counter++ : null,
        paragraphBreakBefore: wordIndex === 0 && paragraphIndex > 0,
      })
    })
  })

  return entries
}
