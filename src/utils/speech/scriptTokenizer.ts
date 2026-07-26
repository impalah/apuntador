/**
 * Turns raw Markdown script content into a flat, comparable word stream for voice
 * alignment. Deliberately separate from src/utils/markdown.ts (compileMarkdown),
 * which is render-oriented (Markdown -> HTML) rather than token-oriented.
 */

export interface ScriptToken {
  /** Original word as it appears in the script, for display purposes. */
  word: string
  /** Lowercased, accent-stripped, punctuation-stripped form used for matching. */
  normalized: string
  /** 0-based ordinal position among normalized tokens - what "cursor position" means. */
  sourceIndex: number
}

function stripMarkdownSyntax(raw: string): string {
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

export function tokenizeScript(raw: string): ScriptToken[] {
  const stripped = stripMarkdownSyntax(raw)
  const words = stripped.split(/\s+/).filter((word) => word.length > 0)

  const tokens: ScriptToken[] = []
  for (const word of words) {
    const normalized = normalizeWord(word)
    if (!normalized) continue
    tokens.push({ word, normalized, sourceIndex: tokens.length })
  }
  return tokens
}
