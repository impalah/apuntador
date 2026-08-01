import { test, expect, type Page } from '@playwright/test'

/**
 * Mocks the Web Speech API before the page's own scripts run, so
 * WebSpeechEngine.isSupported is true regardless of the actual browser
 * project running this spec (there is no real microphone in CI, and
 * Firefox/WebKit don't implement SpeechRecognition at all).
 */
async function mockWebSpeechApi(page: Page) {
  await page.addInitScript(() => {
    class MockSpeechRecognition {
      continuous = false
      interimResults = false
      lang = ''
      onstart: (() => void) | null = null
      onend: (() => void) | null = null
      onerror: ((event: unknown) => void) | null = null
      onresult: ((event: unknown) => void) | null = null

      start() {
        setTimeout(() => this.onstart?.(), 0)
      }

      stop() {
        setTimeout(() => this.onend?.(), 0)
      }
    }
    ;(window as any).SpeechRecognition = MockSpeechRecognition
    ;(window as any).webkitSpeechRecognition = MockSpeechRecognition
  })
}

/**
 * Simulates a browser without Web Speech API support (e.g. Firefox/Safari),
 * deterministically regardless of which Playwright project runs this spec.
 */
async function removeWebSpeechApi(page: Page) {
  await page.addInitScript(() => {
    ;(window as any).SpeechRecognition = undefined
    ;(window as any).webkitSpeechRecognition = undefined
  })
}

/**
 * Like mockWebSpeechApi, but keeps a handle to the live recognition instance
 * on window so the test can fire onresult events on demand via emitTranscript.
 */
async function mockControllableWebSpeechApi(page: Page) {
  await page.addInitScript(() => {
    class MockSpeechRecognition {
      continuous = false
      interimResults = false
      lang = ''
      onstart: (() => void) | null = null
      onend: (() => void) | null = null
      onerror: ((event: unknown) => void) | null = null
      onresult: ((event: unknown) => void) | null = null

      start() {
        ;(window as any).__mockSpeechRecognition = this
        setTimeout(() => this.onstart?.(), 0)
      }

      stop() {
        setTimeout(() => this.onend?.(), 0)
      }
    }
    ;(window as any).SpeechRecognition = MockSpeechRecognition
    ;(window as any).webkitSpeechRecognition = MockSpeechRecognition
  })
}

async function emitTranscript(page: Page, text: string, isFinal: boolean) {
  await page.evaluate(
    ({ text, isFinal }) => {
      const instance = (window as any).__mockSpeechRecognition
      instance?.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal, length: 1, 0: { transcript: text } } },
      })
    },
    { text, isFinal }
  )
}

/**
 * Loads plain-text content into the teleprompter via the editor's real "open
 * local file" flow (an in-memory file handed to the native file chooser),
 * since content only actually commits to teleprompterStore on save/open -
 * typing into the editor's textarea alone does not persist it.
 */
async function loadPlainTextContent(page: Page, content: string) {
  const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
  if (await moreMenuButton.isVisible()) {
    await moreMenuButton.click()
  }
  await page.locator('[data-testid="editor-button"]').first().click()
  await page.waitForURL('**/edit')

  await page.locator('[data-testid="open-file-button"]').click()
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.locator('[data-testid="local-file-option"]').click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles({
    name: 'script.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(content),
  })

  await page.locator('[data-testid="close-button"]').click()
  await page.waitForURL('**/')
}

test.describe('Voice tracking mode', () => {
  test('activates voice mode from the visible Settings button (ActionsMenu quick toggle) and persists it', async ({
    page,
  }) => {
    await mockWebSpeechApi(page)
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

    // Voice mode requires the monospace frame - switch to it first.
    await page.locator('[data-testid="frame-picker-toggle"]').click()
    await page.waitForTimeout(300)

    // This is the actual path a user reaches from the on-screen "more menu" ->
    // "Settings" button - ActionsMenu.vue keeps its own embedded mini-settings
    // view (no "behavior" tab), so the scroll-mode toggle lives as a quick
    // action alongside mirror/theater/alignment, not inside that mini tab set.
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    await moreMenuButton.click()
    await page.waitForTimeout(300)

    const voiceQuickButton = page.locator('[data-testid="scroll-mode-voice-quick-button"]')
    await expect(voiceQuickButton).toBeVisible()
    await voiceQuickButton.click()
    await expect(voiceQuickButton).toHaveClass(/active/)

    const autoQuickButton = page.locator('[data-testid="scroll-mode-auto-quick-button"]')
    await expect(autoQuickButton).not.toHaveClass(/active/)

    // Close the menu and confirm the toolbar quick toggle reflects the same
    // persisted preference, and that it survives a reload.
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="scroll-mode-quick-toggle"]')).toHaveClass(/active/)
    await page.waitForTimeout(1000) // Wait for the async persistence write to flush

    await page.reload()
    await expect(page.locator('[data-testid="scroll-mode-quick-toggle"]')).toHaveClass(/active/)
  })

  test('quick toggle in the toolbar switches mode without leaving the presentation screen', async ({
    page,
  }) => {
    await mockWebSpeechApi(page)
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

    // Voice mode requires the monospace frame - switch to it first.
    await page.locator('[data-testid="frame-picker-toggle"]').click()
    await page.waitForTimeout(300)

    const quickToggle = page.locator('[data-testid="scroll-mode-quick-toggle"]')
    const overlay = page.locator('[data-testid="voice-status-overlay"]')

    await expect(quickToggle).not.toHaveClass(/active/)
    await expect(overlay).toHaveCount(0)

    await quickToggle.click()
    await expect(quickToggle).toHaveClass(/active/)
    await expect(overlay).toBeVisible()

    await quickToggle.click()
    await expect(quickToggle).not.toHaveClass(/active/)
    await expect(overlay).toHaveCount(0)
  })

  test('falls back to automatic mode visibly when Web Speech API is unsupported', async ({
    page,
  }) => {
    await removeWebSpeechApi(page)
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

    // Voice mode requires the monospace frame - switch to it first (this test
    // exercises the *unsupported-engine* fallback, not the frame gate).
    await page.locator('[data-testid="frame-picker-toggle"]').click()
    await page.waitForTimeout(300)

    const quickToggle = page.locator('[data-testid="scroll-mode-quick-toggle"]')
    await quickToggle.click()
    await expect(quickToggle).toHaveClass(/active/)

    const playButton = page.locator('[data-testid="play-pause-button"]').first()
    await playButton.click()

    // The overlay lives outside the toolbar, so it's a reliable signal
    // regardless of the toolbar's own auto-hide-during-playback behavior.
    await expect(page.locator('[data-testid="voice-status-overlay"]')).toHaveCount(0)

    // Playback continued via automatic scroll instead of freezing - confirm
    // the persisted preference actually reverted to 'auto'.
    await expect
      .poll(async () => {
        const raw = await page.evaluate(() => localStorage.getItem('preferences'))
        return raw ? JSON.parse(raw).scrollMode : undefined
      })
      .toBe('auto')

    // Tap the frame to bring the (desktop-auto-hidden-during-play) toolbar
    // back, then confirm both the quick toggle and play state reflect it.
    await page.locator('.teleprompter-frame-mono').click()
    await expect(quickToggle).not.toHaveClass(/active/)
    await expect(playButton).toHaveAttribute('aria-label', /pause/i)
  })

  test('rejects voice mode while the markdown frame is active', async ({ page }) => {
    await mockWebSpeechApi(page)
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

    // Default frame is markdown - the quick toggle should stay inactive.
    const quickToggle = page.locator('[data-testid="scroll-mode-quick-toggle"]')
    await quickToggle.click()
    await page.waitForTimeout(300)

    await expect(quickToggle).not.toHaveClass(/active/)
    await expect(page.locator('[data-testid="voice-status-overlay"]')).toHaveCount(0)

    const raw = await page.evaluate(() => localStorage.getItem('preferences'))
    expect(raw ? JSON.parse(raw).scrollMode : undefined).not.toBe('voice')
  })

  test('drops back to auto scroll mode when switching away from the monospace frame while voice mode is active', async ({
    page,
  }) => {
    await mockWebSpeechApi(page)
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

    const framePickerToggle = page.locator('[data-testid="frame-picker-toggle"]')
    await framePickerToggle.click()
    await page.waitForTimeout(300)

    const quickToggle = page.locator('[data-testid="scroll-mode-quick-toggle"]')
    await quickToggle.click()
    await expect(quickToggle).toHaveClass(/active/)

    // Switch back to the markdown frame while voice mode is active.
    await framePickerToggle.click()
    await page.waitForTimeout(300)

    await expect(quickToggle).not.toHaveClass(/active/)
    await expect(page.locator('[data-testid="voice-status-overlay"]')).toHaveCount(0)

    const raw = await page.evaluate(() => localStorage.getItem('preferences'))
    expect(JSON.parse(raw!).scrollMode).toBe('auto')
  })

  test('the voice highlight color is always visible in Settings (regardless of active frame), and controls the rendered "already read" color', async ({
    page,
  }) => {
    await mockControllableWebSpeechApi(page)
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')
    await loadPlainTextContent(page, 'Uno dos tres cuatro cinco seis siete ocho.')
    await page.waitForSelector('[data-testid="floating-toolbar"]')
    await page.waitForTimeout(300)

    // Markdown frame active (default) - the control is visible and editable
    // here too, even though it only takes visible effect on the monospace
    // frame (voice mode requires it). Opened via the "more menu" -> Settings
    // mini-view (ActionsMenu.vue) - the only settings surface in the app.
    // The Appearance tab is selected by default, so no tab click is needed.
    await page.locator('[data-testid="more-menu-button"]').click()
    await page.waitForTimeout(300)
    await page.locator('[data-testid="settings-button"]').click()
    await page.waitForTimeout(300)

    const colorInput = page.locator('[data-testid="voice-read-color-input"] input[type="color"]')
    await expect(colorInput).toBeVisible()
    await expect(colorInput).toHaveValue('#ffeb3b')

    await colorInput.fill('#ff00ff')
    await page.waitForTimeout(300)
    await page.keyboard.press('Escape')

    // Switch to the monospace frame, start voice mode, and confirm the
    // rendered highlight matches the color set while markdown was active.
    await page.locator('[data-testid="frame-picker-toggle"]').click()
    await page.waitForTimeout(300)
    await page.locator('[data-testid="scroll-mode-quick-toggle"]').click()
    await page.locator('[data-testid="play-pause-button"]').first().click()
    await page.waitForTimeout(300)

    await emitTranscript(page, 'uno dos tres', true)
    await page.waitForTimeout(800)

    const readColor = await page
      .locator('.mono-word-read')
      .first()
      .evaluate((el) => getComputedStyle(el).color)
    expect(readColor).toBe('rgb(255, 0, 255)')
  })

  test('the voice highlight color control is also reachable from the quick "more menu" -> Settings mini-view', async ({
    page,
  }) => {
    await mockWebSpeechApi(page)
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

    // This is the only settings surface in the app: the on-screen "more menu"
    // button opens a quick-actions sheet first (navigation, etc.), and only
    // the nested "Settings" button inside that sheet reveals the tabbed
    // settings view (ActionsMenu.vue).
    await page.locator('[data-testid="more-menu-button"]').click()
    await page.waitForTimeout(300)
    await page.locator('[data-testid="settings-button"]').click()
    await page.waitForTimeout(300)

    const colorInput = page.locator('[data-testid="voice-read-color-input"] input[type="color"]')
    await expect(colorInput).toBeVisible()
    await expect(colorInput).toHaveValue('#ffeb3b')
  })

  test('advances the scroll offset under the monospace frame as mocked transcripts arrive', async ({
    page,
  }) => {
    await mockControllableWebSpeechApi(page)
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

    await loadPlainTextContent(
      page,
      'Hoy quiero hablar de algo importante.\n\n' +
        'Cada palabra que digo debería mover el texto hacia arriba poco a poco.\n\n' +
        'Y este seguimiento por voz debería funcionar igual de bien en el modo monoespaciado.'
    )

    await page.locator('[data-testid="frame-picker-toggle"]').click()
    const monoContent = page.locator('[data-testid="teleprompter-mono-content"]')
    await expect(monoContent).toBeVisible()

    await page.locator('[data-testid="scroll-mode-quick-toggle"]').click()
    await page.locator('[data-testid="play-pause-button"]').first().click()
    await page.waitForTimeout(300) // let the (mocked) engine report 'listening'

    const scrollContainer = page.locator('.teleprompter-container-mono')
    const initialOffset = await scrollContainer.evaluate((el) => el.scrollTop)

    // Grows the recognized transcript across several onresult events, as the
    // real engine would while the reader progresses through the script.
    await emitTranscript(page, 'Hoy quiero hablar de algo', false)
    await emitTranscript(page, 'Hoy quiero hablar de algo importante', true)
    await emitTranscript(page, 'Cada palabra que digo debería', false)
    await emitTranscript(page, 'Cada palabra que digo debería mover', false)
    await page.waitForTimeout(1200) // allow the 700ms scroll animation to settle

    const laterOffset = await scrollContainer.evaluate((el) => el.scrollTop)
    expect(laterOffset).toBeGreaterThan(initialOffset)
  })
})
