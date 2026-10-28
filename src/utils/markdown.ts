import MarkdownIt, { type MarkdownIt as MarkdownItInstance } from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItSup from 'markdown-it-sup'
import markdownItSub from 'markdown-it-sub'
import markdownItMark from 'markdown-it-mark'
import markdownItFootnote from 'markdown-it-footnote'
import DOMPurify from 'dompurify'
import { VIEWPORT_PADDING_HEIGHT, VIEWPORT_PADDING_MIN_HEIGHT } from './constants'

/**
 * Create and configure markdown-it instance with plugins
 */
export function createMarkdownRenderer(): MarkdownItInstance {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  })

  // Add plugins
  md.use(markdownItAnchor)
  md.use(markdownItSup)
  md.use(markdownItSub)
  md.use(markdownItMark)
  md.use(markdownItFootnote)

  return md
}

let sharedRenderer: MarkdownItInstance | null = null

/**
 * Compile markdown to HTML with proper spacing for teleprompter
 */
export function compileMarkdown(content: string): string {
  sharedRenderer ??= createMarkdownRenderer()
  // Raw HTML is allowed in scripts (html: true) and the result is rendered with
  // v-html, so strip anything executable. On Capacitor/Tauri injected script
  // would otherwise reach the native bridges.
  const htmlContent = DOMPurify.sanitize(sharedRenderer.render(content))

  // Add padding divs for teleprompter viewing
  // This ensures there's always space at the beginning and end
  const paddingTop = `<div class="teleprompter-padding-top" style="height: ${VIEWPORT_PADDING_HEIGHT}; min-height: ${VIEWPORT_PADDING_MIN_HEIGHT};"></div>`
  const paddingBottom = `<div class="teleprompter-padding-bottom" style="height: ${VIEWPORT_PADDING_HEIGHT}; min-height: ${VIEWPORT_PADDING_MIN_HEIGHT};"></div>`

  return paddingTop + htmlContent + paddingBottom
}

/**
 * Sanitize and validate markdown content
 */
export function sanitizeMarkdown(content: string): string {
  // Basic sanitization - remove potentially dangerous content
  // Preserve intentional spacing by NOT trimming
  return content
    .replaceAll(/<script[^>]*>.*?<\/script>/gi, '')
    .replaceAll(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replaceAll(/javascript:/gi, '')
}

/**
 * Extract plain text from HTML for accessibility
 */
export function extractPlainText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

/**
 * Count lines in rendered HTML
 */
export function countLinesInHtml(html: string, lineHeight: number, containerWidth: number): number {
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  tempDiv.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: ${containerWidth}px;
    line-height: ${lineHeight};
    font-family: inherit;
    font-size: inherit;
  `

  document.body.appendChild(tempDiv)
  const height = tempDiv.offsetHeight
  tempDiv.remove()

  return Math.ceil(height / lineHeight)
}
