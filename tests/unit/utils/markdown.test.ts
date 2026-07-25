import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import {
  compileMarkdown,
  sanitizeMarkdown,
  extractPlainText,
  createMarkdownRenderer,
  countLinesInHtml,
} from '@/utils/markdown'

describe('Markdown Utils', () => {
  it('should compile basic markdown', () => {
    const markdown = '# Heading\n\nThis is **bold** text.'
    const html = compileMarkdown(markdown)

    expect(html).toContain('<h1')
    expect(html).toContain('Heading')
    expect(html).toContain('<strong>')
    expect(html).toContain('bold')
  })

  it('should handle special markdown features', () => {
    const markdown = `
# Main Heading

This text has ==highlighted== content.

Superscript: H^2^O
Subscript: H~2~O

This is a footnote[^1].

[^1]: Footnote content
    `

    const html = compileMarkdown(markdown)

    expect(html).toContain('<mark>')
    expect(html).toContain('<sup>')
    expect(html).toContain('<sub>')
    expect(html).toContain('footnote')
  })

  it('should sanitize dangerous content', () => {
    const dangerous = `
# Safe Heading

<script>alert('xss')</script>

<iframe src="javascript:alert('xss')"></iframe>

[Safe Link](javascript:alert('xss'))
    `

    const sanitized = sanitizeMarkdown(dangerous)

    expect(sanitized).not.toContain('<script>')
    expect(sanitized).not.toContain('<iframe>')
    expect(sanitized).not.toContain('javascript:')
    expect(sanitized).toContain('# Safe Heading')
  })

  it('should extract plain text from HTML', () => {
    const html = '<h1>Heading</h1><p>This is <strong>bold</strong> text.</p>'
    const plainText = extractPlainText(html)

    expect(plainText).toBe('HeadingThis is bold text.')
    expect(plainText).not.toContain('<')
    expect(plainText).not.toContain('>')
  })

  it('should handle empty or invalid input', () => {
    // With the new padding feature, empty content still gets padding divs
    const emptyResult = compileMarkdown('')
    expect(emptyResult).toContain('teleprompter-padding-top')
    expect(emptyResult).toContain('teleprompter-padding-bottom')

    expect(sanitizeMarkdown('')).toBe('')
    expect(extractPlainText('')).toBe('')

    const html = compileMarkdown('Just plain text')
    expect(html).toContain('<p>')
    expect(html).toContain('Just plain text')
    expect(html).toContain('teleprompter-padding-top')
    expect(html).toContain('teleprompter-padding-bottom')
  })

  it('should preserve whitespace and formatting', () => {
    const markdown = `
First paragraph.

Second paragraph with
line break.

    Indented content.
    `

    const html = compileMarkdown(markdown)
    expect(html).toContain('<p>')
    expect(html).toContain('<br>')
  })

  describe('createMarkdownRenderer', () => {
    it('returns a configured MarkdownIt instance', () => {
      const md = createMarkdownRenderer()

      expect(md).toBeInstanceOf(MarkdownIt)
      // linkify option should auto-detect bare URLs
      expect(md.render('Visit https://example.com')).toContain('<a href="https://example.com"')
    })

    it('renders raw HTML since the html option is enabled', () => {
      const md = createMarkdownRenderer()

      expect(md.render('<div class="custom">raw</div>')).toContain('<div class="custom">raw</div>')
    })
  })

  describe('sanitizeMarkdown edge cases', () => {
    it('removes script tags regardless of case', () => {
      const sanitized = sanitizeMarkdown('<SCRIPT>alert(1)</SCRIPT>')
      expect(sanitized).not.toContain('alert(1)')
    })

    it('removes multiple dangerous tags in the same content', () => {
      const sanitized = sanitizeMarkdown(
        '<script>a()</script>text<script>b()</script><iframe src="x"></iframe>'
      )

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('<iframe>')
      expect(sanitized).toContain('text')
    })

    it('leaves safe markdown content untouched', () => {
      const safe = '# Title\n\nSome *safe* content with a [link](https://example.com).'
      expect(sanitizeMarkdown(safe)).toBe(safe)
    })
  })

  describe('extractPlainText edge cases', () => {
    it('returns an empty string for markup with no text content', () => {
      expect(extractPlainText('<div></div>')).toBe('')
    })

    it('strips nested tags and preserves surrounding text', () => {
      const html = '<div>Before <span><em>nested</em></span> After</div>'
      const text = extractPlainText(html)

      expect(text).toContain('Before')
      expect(text).toContain('nested')
      expect(text).toContain('After')
      expect(text).not.toContain('<')
    })
  })

  describe('countLinesInHtml', () => {
    it('calculates line count from the rendered element height', () => {
      const restoreOffsetHeight = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'offsetHeight'
      )
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get: () => 100,
      })

      try {
        const lines = countLinesInHtml('<p>Some content</p>', 20, 300)
        expect(lines).toBe(5) // ceil(100 / 20)
      } finally {
        if (restoreOffsetHeight) {
          Object.defineProperty(HTMLElement.prototype, 'offsetHeight', restoreOffsetHeight)
        }
      }
    })

    it('removes the temporary measuring element from the DOM afterwards', () => {
      const initialChildCount = document.body.children.length

      countLinesInHtml('<p>Content</p>', 20, 300)

      expect(document.body.children.length).toBe(initialChildCount)
    })

    it('rounds up partial lines', () => {
      const restoreOffsetHeight = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        'offsetHeight'
      )
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get: () => 21,
      })

      try {
        // 21 / 20 = 1.05 -> should round up to 2
        expect(countLinesInHtml('<p>x</p>', 20, 300)).toBe(2)
      } finally {
        if (restoreOffsetHeight) {
          Object.defineProperty(HTMLElement.prototype, 'offsetHeight', restoreOffsetHeight)
        }
      }
    })
  })
})
