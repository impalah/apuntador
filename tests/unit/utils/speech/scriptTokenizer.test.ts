import { describe, it, expect } from 'vitest'
import { normalizeWord, normalizeWords, tokenizeScript } from '@/utils/speech/scriptTokenizer'

describe('normalizeWord', () => {
  it('lowercases', () => {
    expect(normalizeWord('HELLO')).toBe('hello')
  })

  it('strips accents/diacritics', () => {
    expect(normalizeWord('canción')).toBe('cancion')
    expect(normalizeWord('café')).toBe('cafe')
    expect(normalizeWord('mañana')).toBe('manana')
  })

  it('strips punctuation', () => {
    expect(normalizeWord('hello,')).toBe('hello')
    expect(normalizeWord('"quoted"')).toBe('quoted')
    expect(normalizeWord('well-known')).toBe('wellknown')
  })

  it('returns empty string for pure punctuation', () => {
    expect(normalizeWord('---')).toBe('')
  })
})

describe('normalizeWords', () => {
  it('splits, normalizes and drops empties', () => {
    expect(normalizeWords('Hola,   mundo!')).toEqual(['hola', 'mundo'])
  })
})

describe('tokenizeScript', () => {
  it('produces sequential source indices for plain text', () => {
    const tokens = tokenizeScript('uno dos tres')
    expect(tokens.map((t) => t.word)).toEqual(['uno', 'dos', 'tres'])
    expect(tokens.map((t) => t.sourceIndex)).toEqual([0, 1, 2])
  })

  it('strips heading markers', () => {
    const tokens = tokenizeScript('# Title\nBody text')
    expect(tokens.map((t) => t.normalized)).toEqual(['title', 'body', 'text'])
  })

  it('strips bold/italic markers but keeps the words', () => {
    const tokens = tokenizeScript('this is **very** important')
    expect(tokens.map((t) => t.word)).toEqual(['this', 'is', 'very', 'important'])
  })

  it('keeps link text and drops the URL', () => {
    const tokens = tokenizeScript('see [our site](https://example.com) for more')
    expect(tokens.map((t) => t.word)).toEqual(['see', 'our', 'site', 'for', 'more'])
  })

  it('drops images entirely, including alt text', () => {
    const tokens = tokenizeScript('before ![alt text](img.png) after')
    expect(tokens.map((t) => t.word)).toEqual(['before', 'after'])
  })

  it('drops fenced code blocks', () => {
    const tokens = tokenizeScript('before\n```\nconst x = 1\n```\nafter')
    expect(tokens.map((t) => t.word)).toEqual(['before', 'after'])
  })

  it('strips list markers', () => {
    const tokens = tokenizeScript('- first\n- second\n1. third')
    expect(tokens.map((t) => t.word)).toEqual(['first', 'second', 'third'])
  })

  it('normalizes accented words for matching while keeping the original word', () => {
    const tokens = tokenizeScript('canción')
    expect(tokens[0]?.word).toBe('canción')
    expect(tokens[0]?.normalized).toBe('cancion')
  })

  it('returns an empty array for empty input', () => {
    expect(tokenizeScript('')).toEqual([])
  })
})
