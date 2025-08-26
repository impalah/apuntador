import { describe, it, expect } from 'vitest'
import { compileMarkdown, sanitizeMarkdown, extractPlainText } from '@/utils/markdown'

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
})
