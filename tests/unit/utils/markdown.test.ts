import { describe, it, expect } from 'vitest'
import MarkdownIt from 'markdown-it'
import { compileMarkdown, createMarkdownRenderer } from '@/utils/markdown'

describe('Markdown Utils', () => {
  it('should compile basic markdown', () => {
    const markdown = '# Heading\n\nThis is **bold** text.'
    const html = compileMarkdown(markdown)

    expect(html).toContain('<h1')
    expect(html).toContain('Heading')
    expect(html).toContain('<strong>')
    expect(html).toContain('bold')
  })

  it('strips executable HTML from compiled output but keeps inline formatting', () => {
    const markdown = [
      '<img src=x onerror="alert(1)">',
      '<script>',
      'alert(2)',
      '</script>',
      '<a href="javascript:alert(3)">link</a>',
      '<span style="color: red">kept</span>',
    ].join('\n')

    const html = compileMarkdown(markdown)

    expect(html).not.toContain('onerror')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('<span style="color: red">kept</span>')
    expect(html).toContain('teleprompter-padding-top')
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

  it('neutralizes script, iframe and javascript: links in compiled output', () => {
    const dangerous = `
# Safe Heading

<script>alert('xss')</script>

<iframe src="javascript:alert('xss')"></iframe>

[Safe Link](javascript:alert('xss'))
    `

    const html = compileMarkdown(dangerous)

    expect(html).not.toContain('<script')
    expect(html).not.toContain('<iframe')
    // markdown-it leaves the rejected link as inert text; no executable href remains
    expect(html).not.toMatch(/(href|src)="javascript:/)
    expect(html).toContain('Safe Heading')
  })

  it('should handle empty or invalid input', () => {
    // With the new padding feature, empty content still gets padding divs
    const emptyResult = compileMarkdown('')
    expect(emptyResult).toContain('teleprompter-padding-top')
    expect(emptyResult).toContain('teleprompter-padding-bottom')

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
})
