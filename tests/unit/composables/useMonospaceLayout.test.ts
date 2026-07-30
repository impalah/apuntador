import { describe, it, expect } from 'vitest'
import { buildWordStream } from '@/utils/plainText'
import {
  computeCharsPerLine,
  lineIndexForToken,
  monoRowToScrollOffset,
  scrollOffsetToMonoRow,
  tokenIndexForLine,
  wrapWordStreamIntoLines,
  type MonoLine,
} from '@/composables/useMonospaceLayout'

describe('computeCharsPerLine', () => {
  it('divides container width by character width', () => {
    expect(computeCharsPerLine(400, 10)).toBe(40)
  })

  it('floors partial characters', () => {
    expect(computeCharsPerLine(405, 10)).toBe(40)
  })

  it('never returns less than 1, even for zero/negative char width', () => {
    expect(computeCharsPerLine(400, 0)).toBe(1)
    expect(computeCharsPerLine(400, -5)).toBe(1)
  })
})

describe('wrapWordStreamIntoLines', () => {
  it('wraps words greedily to fit charsPerLine', () => {
    const stream = buildWordStream('one two three four five')
    // "one two" = 7 chars, +" three" = 13 > 10 -> break. "three four" = 10
    // exactly fits, +" five" = 15 > 10 -> break.
    const lines = wrapWordStreamIntoLines(stream, 10)
    expect(lines.map((l) => l.text)).toEqual(['one two', 'three four', 'five'])
  })

  it('records exact token index ranges per line', () => {
    const stream = buildWordStream('one two three four five')
    const lines = wrapWordStreamIntoLines(stream, 10)
    expect(lines.map((l) => [l.startTokenIndex, l.endTokenIndex])).toEqual([
      [0, 1], // "one two"
      [2, 3], // "three four"
      [4, 4], // "five"
    ])
  })

  it('inserts a blank separator line at paragraph breaks', () => {
    const stream = buildWordStream('first paragraph\n\nsecond paragraph')
    const lines = wrapWordStreamIntoLines(stream, 80)
    expect(lines.map((l) => l.text)).toEqual(['first paragraph', '', 'second paragraph'])
    expect(lines[1]!.startTokenIndex).toBeNull()
  })

  it('gives a punctuation-only word no token index but still renders it', () => {
    const stream = buildWordStream('one --- two')
    const lines = wrapWordStreamIntoLines(stream, 80)
    expect(lines[0]!.text).toBe('one --- two')
    expect(lines[0]!.startTokenIndex).toBe(0)
    expect(lines[0]!.endTokenIndex).toBe(1) // "two" is token index 1 ("---" is skipped)
  })

  it('does not break on a single long word exceeding charsPerLine', () => {
    const stream = buildWordStream('supercalifragilisticexpialidocious')
    const lines = wrapWordStreamIntoLines(stream, 10)
    expect(lines).toHaveLength(1)
    expect(lines[0]!.text).toBe('supercalifragilisticexpialidocious')
  })

  it('returns an empty array for an empty stream', () => {
    expect(wrapWordStreamIntoLines([], 40)).toEqual([])
  })
})

describe('lineIndexForToken', () => {
  const lines: MonoLine[] = [
    { text: 'one two', startTokenIndex: 0, endTokenIndex: 1 },
    { text: '', startTokenIndex: null, endTokenIndex: null },
    { text: 'three four', startTokenIndex: 2, endTokenIndex: 3 },
    { text: 'five', startTokenIndex: 4, endTokenIndex: 4 },
  ]

  it('finds the exact line for a token within its range', () => {
    expect(lineIndexForToken(lines, 0)).toBe(0)
    expect(lineIndexForToken(lines, 1)).toBe(0)
    expect(lineIndexForToken(lines, 2)).toBe(2)
    expect(lineIndexForToken(lines, 3)).toBe(2)
    expect(lineIndexForToken(lines, 4)).toBe(3)
  })

  it('skips blank/non-indexable lines entirely', () => {
    expect(lineIndexForToken(lines, 1)).not.toBe(1)
  })

  it('clamps to the last line for an out-of-range (too high) token index', () => {
    expect(lineIndexForToken(lines, 999)).toBe(3)
  })

  it('returns 0 when there are no indexable lines at all', () => {
    const allBlank: MonoLine[] = [{ text: '', startTokenIndex: null, endTokenIndex: null }]
    expect(lineIndexForToken(allBlank, 0)).toBe(0)
  })
})

describe('tokenIndexForLine', () => {
  const lines: MonoLine[] = [
    { text: 'one two', startTokenIndex: 0, endTokenIndex: 1 },
    { text: '', startTokenIndex: null, endTokenIndex: null },
    { text: 'three four', startTokenIndex: 2, endTokenIndex: 3 },
  ]

  it('returns the token index directly for a line that carries one', () => {
    expect(tokenIndexForLine(lines, 0)).toBe(0)
    expect(tokenIndexForLine(lines, 2)).toBe(2)
  })

  it('finds the nearest indexable line for a blank line', () => {
    expect(tokenIndexForLine(lines, 1)).toBe(0) // "before" is checked first at each radius
  })

  it('clamps out-of-range line indices', () => {
    expect(tokenIndexForLine(lines, -5)).toBe(0)
    expect(tokenIndexForLine(lines, 999)).toBe(2)
  })

  it('returns 0 for an empty line list', () => {
    expect(tokenIndexForLine([], 0)).toBe(0)
  })
})

describe('monoRowToScrollOffset / scrollOffsetToMonoRow (exact inverses)', () => {
  it('round-trips row -> offset -> row', () => {
    const measuredLineHeightPx = 32
    const viewportHeightPx = 800
    const highlightBandPosPct = 40

    for (const row of [0, 5, 12.5, 100]) {
      const offset = monoRowToScrollOffset(row, measuredLineHeightPx, viewportHeightPx, highlightBandPosPct)
      const roundTripped = scrollOffsetToMonoRow(
        offset,
        measuredLineHeightPx,
        viewportHeightPx,
        highlightBandPosPct
      )
      expect(roundTripped).toBeCloseTo(row, 10)
    }
  })

  it('targets the highlight band position, not the viewport top', () => {
    const target = monoRowToScrollOffset(10, 32, 800, 40)
    // row*lineHeight (320) minus the band offset (800*0.4=320) => 0, not 320
    expect(target).toBeCloseTo(0, 10)
  })

  it('handles zero line height without dividing by zero', () => {
    expect(scrollOffsetToMonoRow(100, 0, 800, 40)).toBe(0)
  })
})
