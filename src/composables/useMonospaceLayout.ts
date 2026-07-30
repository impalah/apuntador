/**
 * Deterministic, exact line-wrapping for the monospace presenter frame - the
 * one thing that makes voice-tracking positioning exact instead of
 * approximate when that frame is active. Split into pure functions (no DOM,
 * fully unit-testable with fake widths) plus a thin reactive wrapper that
 * does the real character/line-height measurement and is owned by
 * TeleprompterPage.vue (not the frame component - it doesn't need the frame
 * to be mounted, and voice tracking reads it directly).
 *
 * See docs/voice-tracking-design.md and the "monospace frame" plan for the
 * full rationale: the markdown frame's ratio*contentHeight approximation
 * breaks down because word density per pixel isn't uniform (headings,
 * lists, blank padding). Plain monospace text with JS-computed line-wrapping
 * has no such non-uniformity - every line is exactly measuredLineHeightPx
 * tall and covers a known, exact token range.
 */

import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { buildWordStream, type WordStreamEntry } from '@/utils/plainText'
import { LINE_HEIGHT_FALLBACK, MONO_CHAR_MEASURE_SAMPLE_LENGTH } from '@/utils/constants'

export interface MonoLine {
  text: string
  /** Index (in the token stream) of the first indexable word on this line, or null if none (e.g. a blank/paragraph-separator line). */
  startTokenIndex: number | null
  /** Index of the last indexable word on this line, or null if none. */
  endTokenIndex: number | null
}

export function computeCharsPerLine(containerWidthPx: number, charWidthPx: number): number {
  if (charWidthPx <= 0) return 1
  return Math.max(1, Math.floor(containerWidthPx / charWidthPx))
}

/**
 * Greedy word-wrap of a word stream into fixed-width lines, forcing a break
 * (plus a blank separator line, matching a paragraph's visual gap) at every
 * original paragraph boundary. Each line records the token-index range of
 * its indexable words, so "which line is token N on" is an exact lookup.
 */
export function wrapWordStreamIntoLines(stream: WordStreamEntry[], charsPerLine: number): MonoLine[] {
  const lines: MonoLine[] = []
  let currentWords: WordStreamEntry[] = []
  let currentLength = 0

  function flushLine(): void {
    if (currentWords.length === 0) return
    const indices = currentWords
      .map((entry) => entry.sourceIndex)
      .filter((index): index is number => index !== null)
    lines.push({
      text: currentWords.map((entry) => entry.word).join(' '),
      startTokenIndex: indices.length > 0 ? indices[0]! : null,
      endTokenIndex: indices.length > 0 ? indices[indices.length - 1]! : null,
    })
    currentWords = []
    currentLength = 0
  }

  for (const entry of stream) {
    if (entry.paragraphBreakBefore) {
      flushLine()
      lines.push({ text: '', startTokenIndex: null, endTokenIndex: null })
    }

    const projectedLength =
      currentWords.length === 0 ? entry.word.length : currentLength + 1 + entry.word.length

    if (currentWords.length > 0 && projectedLength > charsPerLine) {
      flushLine()
    }

    currentWords.push(entry)
    currentLength =
      currentWords.length === 1 ? entry.word.length : currentLength + 1 + entry.word.length
  }
  flushLine()

  return lines
}

/** Binary search: which line (index into `lines`) contains this token index. */
export function lineIndexForToken(lines: MonoLine[], tokenIndex: number): number {
  const indexable = lines
    .map((line, index) => ({ index, line }))
    .filter(({ line }) => line.startTokenIndex !== null)

  if (indexable.length === 0) return 0

  let lo = 0
  let hi = indexable.length - 1
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    const candidate = indexable[mid]!
    if (tokenIndex < candidate.line.startTokenIndex!) {
      hi = mid - 1
    } else if (tokenIndex > candidate.line.endTokenIndex!) {
      lo = mid + 1
    } else {
      return candidate.index
    }
  }

  const clampedIdx = Math.max(0, Math.min(lo, indexable.length - 1))
  return indexable[clampedIdx]!.index
}

/**
 * Inverse-ish of lineIndexForToken: given an arbitrary (possibly
 * fractional/out-of-range) line index, find the nearest line that actually
 * carries a token and return its starting token index. Used when resyncing
 * from a manual scroll position that may land on a blank/paragraph-separator
 * line.
 */
export function tokenIndexForLine(lines: MonoLine[], lineIndex: number): number {
  if (lines.length === 0) return 0
  const clamped = Math.max(0, Math.min(Math.round(lineIndex), lines.length - 1))

  for (let offset = 0; offset < lines.length; offset++) {
    const before = clamped - offset
    const after = clamped + offset
    if (before >= 0 && lines[before]!.startTokenIndex !== null) return lines[before]!.startTokenIndex!
    if (after < lines.length && lines[after]!.startTokenIndex !== null) return lines[after]!.startTokenIndex!
  }
  return 0
}

/**
 * Forward/reverse scroll-position mapping, written as one visibly-inverse
 * pair (both share the exact same bandOffsetPx computation) so they can
 * never silently drift apart the way the markdown frame's ratio-based
 * formulas once did.
 */
export function monoRowToScrollOffset(
  row: number,
  measuredLineHeightPx: number,
  viewportHeightPx: number,
  highlightBandPosPct: number
): number {
  const bandOffsetPx = viewportHeightPx * (highlightBandPosPct / 100)
  return row * measuredLineHeightPx - bandOffsetPx
}

export function scrollOffsetToMonoRow(
  offset: number,
  measuredLineHeightPx: number,
  viewportHeightPx: number,
  highlightBandPosPct: number
): number {
  const bandOffsetPx = viewportHeightPx * (highlightBandPosPct / 100)
  if (measuredLineHeightPx <= 0) return 0
  return (offset + bandOffsetPx) / measuredLineHeightPx
}

const BLANK_LINE: MonoLine = { text: '', startTokenIndex: null, endTokenIndex: null }

/**
 * Reactive wrapper: measures the monospace font's real character width/line
 * height and produces the padded, wrapped line list plus a token->line
 * lookup. Owned by TeleprompterPage.vue - works whether or not the mono
 * frame is currently mounted.
 */
export function useMonospaceLayout(
  scriptText: Ref<string>,
  fontFamily: Ref<string>,
  fontSizePx: Ref<number>,
  lineHeight: Ref<number>,
  containerWidthPx: Ref<number>,
  viewportHeightPx: Ref<number>,
  paddingViewportRatio: number
) {
  const charWidthPx = ref(0)
  const measuredLineHeightPx = ref(LINE_HEIGHT_FALLBACK)

  function measure(): void {
    if (typeof document === 'undefined') return

    const span = document.createElement('span')
    span.textContent = 'M'.repeat(MONO_CHAR_MEASURE_SAMPLE_LENGTH)
    span.style.visibility = 'hidden'
    span.style.position = 'absolute'
    span.style.whiteSpace = 'pre'
    span.style.fontFamily = fontFamily.value
    span.style.fontSize = `${fontSizePx.value}px`
    span.style.lineHeight = lineHeight.value.toString()
    document.body.appendChild(span)

    charWidthPx.value = span.offsetWidth / MONO_CHAR_MEASURE_SAMPLE_LENGTH || 0
    measuredLineHeightPx.value = span.offsetHeight || fontSizePx.value * lineHeight.value

    span.remove()
  }

  watch([fontFamily, fontSizePx, lineHeight], measure, { immediate: true })

  const wordStream: ComputedRef<WordStreamEntry[]> = computed(() => buildWordStream(scriptText.value))

  const charsPerLine = computed(() => computeCharsPerLine(containerWidthPx.value, charWidthPx.value))

  const contentLines = computed<MonoLine[]>(() =>
    wrapWordStreamIntoLines(wordStream.value, charsPerLine.value)
  )

  const paddingLineCount = computed(() =>
    Math.max(0, Math.ceil((viewportHeightPx.value * paddingViewportRatio) / measuredLineHeightPx.value))
  )

  const lines = computed<MonoLine[]>(() => [
    ...Array.from({ length: paddingLineCount.value }, () => BLANK_LINE),
    ...contentLines.value,
    ...Array.from({ length: paddingLineCount.value }, () => BLANK_LINE),
  ])

  function lineIndexForTokenIndex(tokenIndex: number): number {
    return paddingLineCount.value + lineIndexForToken(contentLines.value, tokenIndex)
  }

  function tokenIndexForRow(row: number): number {
    return tokenIndexForLine(contentLines.value, row - paddingLineCount.value)
  }

  return {
    lines,
    contentLines,
    measuredLineHeightPx,
    charWidthPx,
    paddingLineCount,
    lineIndexForTokenIndex,
    tokenIndexForRow,
  }
}
