import { describe, it, expect } from 'vitest'
import { buildWordStream, stripMarkdownSyntax } from '@/utils/plainText'

describe('stripMarkdownSyntax', () => {
  it('preserves paragraph breaks (blank lines) in the output', () => {
    const stripped = stripMarkdownSyntax('First paragraph.\n\nSecond paragraph.')
    expect(stripped).toContain('\n\n')
  })
})

describe('buildWordStream', () => {
  it('assigns sequential sourceIndex to indexable words', () => {
    const stream = buildWordStream('uno dos tres')
    expect(stream.map((e) => e.word)).toEqual(['uno', 'dos', 'tres'])
    expect(stream.map((e) => e.sourceIndex)).toEqual([0, 1, 2])
  })

  it('gives punctuation-only words a null sourceIndex but still keeps them for rendering', () => {
    const stream = buildWordStream('uno --- dos')
    expect(stream.map((e) => e.word)).toEqual(['uno', '---', 'dos'])
    expect(stream.map((e) => e.sourceIndex)).toEqual([0, null, 1])
  })

  it('marks the first word of a new paragraph, not words within a paragraph', () => {
    const stream = buildWordStream('uno dos\n\ntres cuatro')
    expect(stream.map((e) => ({ word: e.word, paragraphBreakBefore: e.paragraphBreakBefore }))).toEqual([
      { word: 'uno', paragraphBreakBefore: false },
      { word: 'dos', paragraphBreakBefore: false },
      { word: 'tres', paragraphBreakBefore: true },
      { word: 'cuatro', paragraphBreakBefore: false },
    ])
  })

  it('does not mark a paragraph break for a single line break within a paragraph', () => {
    const stream = buildWordStream('uno dos\ntres')
    expect(stream.every((e) => !e.paragraphBreakBefore)).toBe(true)
  })

  it('produces the same word sequence regardless of paragraph splitting', () => {
    const withParagraphs = buildWordStream('uno dos\n\ntres cuatro\n\ncinco')
    expect(withParagraphs.map((e) => e.word)).toEqual(['uno', 'dos', 'tres', 'cuatro', 'cinco'])
    expect(withParagraphs.map((e) => e.sourceIndex)).toEqual([0, 1, 2, 3, 4])
  })

  it('returns an empty array for empty input', () => {
    expect(buildWordStream('')).toEqual([])
  })
})
