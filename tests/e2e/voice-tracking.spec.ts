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

test.describe('Voice tracking mode', () => {
  test('activates voice mode from Settings (behavior tab) and persists it', async ({ page }) => {
    await mockWebSpeechApi(page)

    // SettingsDialog is reachable via the app's existing hash deep-link
    // (see TeleprompterPage.vue's parseHashNavigation, also used for cloud
    // provider setup) - the visible "more menu" settings button currently
    // opens ActionsMenu's own embedded mini-settings instead, which doesn't
    // include the behavior tab.
    await page.goto('/#options/behavior')

    const behaviorTab = page.locator('[data-testid="behavior-tab"]')
    await expect(behaviorTab).toBeVisible()

    const voiceButton = page.locator('[data-testid="scroll-mode-voice-button"]')
    await expect(voiceButton).toBeVisible()
    await voiceButton.click()
    await page.waitForTimeout(300)

    // Close the dialog and confirm the quick toggle in the toolbar reflects
    // the same persisted preference.
    await page.keyboard.press('Escape')
    const quickToggle = page.locator('[data-testid="scroll-mode-quick-toggle"]')
    await expect(quickToggle).toHaveClass(/active/)

    await page.reload()
    await expect(page.locator('[data-testid="scroll-mode-quick-toggle"]')).toHaveClass(/active/)
  })

  test('quick toggle in the toolbar switches mode without leaving the presentation screen', async ({
    page,
  }) => {
    await mockWebSpeechApi(page)
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

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
    await page.locator('.teleprompter-frame').click()
    await expect(quickToggle).not.toHaveClass(/active/)
    await expect(playButton).toHaveAttribute('aria-label', /pause/i)
  })
})
