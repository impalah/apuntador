import { test, expect, type Page } from '@playwright/test'

/**
 * End-to-end coverage for flows that broke (or nearly broke) during the code
 * review: each test names the regression it guards against.
 */

const TOOLBAR = '[data-testid="floating-toolbar"]'
const SCROLL_CONTAINER = '.teleprompter-container'

async function openTeleprompter(page: Page) {
  await page.goto('/')
  await page.waitForSelector(TOOLBAR)
  // Let the frame measure itself before scrolling or tapping
  await expect
    .poll(() => page.locator(SCROLL_CONTAINER).evaluate((el) => el.scrollHeight))
    .toBeGreaterThan(0)
}

function scrollTop(page: Page) {
  return page.locator(SCROLL_CONTAINER).evaluate((el) => Math.round(el.scrollTop))
}

/** Resolves once scrollTop has stopped changing (key presses are processed async). */
async function settledScrollTop(page: Page): Promise<number> {
  let previous = -1
  let current = await scrollTop(page)
  while (current !== previous) {
    previous = current
    await page.waitForTimeout(250)
    current = await scrollTop(page)
  }
  return current
}

/** Taps (touch projects) or clicks (desktop) the middle of the reading area. */
async function tapReadingArea(page: Page, hasTouch: boolean) {
  const viewport = page.viewportSize()!
  const x = Math.round(viewport.width / 2)
  const y = Math.round(viewport.height * 0.45)
  if (hasTouch) {
    await page.touchscreen.tap(x, y)
  } else {
    await page.mouse.click(x, y)
  }
}

async function importFile(page: Page, name: string, content: string) {
  await page.keyboard.press('f') // open-file hotkey
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({ name, mimeType: 'text/markdown', buffer: Buffer.from(content) })
}

test.describe('Critical flows', () => {
  test.beforeEach(async ({ page }) => {
    await openTeleprompter(page)
  })

  test('a single tap toggles the toolbar exactly once', async ({ page, hasTouch }) => {
    // Regression: on touch screens touchend and the synthetic click both
    // emitted "tap", so the toolbar hid and immediately reappeared
    const toolbar = page.locator(TOOLBAR)
    await expect(toolbar).toBeVisible()

    await tapReadingArea(page, hasTouch)
    await expect(toolbar).toBeHidden()

    await tapReadingArea(page, hasTouch)
    await expect(toolbar).toBeVisible()
  })

  test('tapping while playing brings the toolbar back', async ({ page, hasTouch }) => {
    // The text moves under the finger during playback; WebKit drops the click
    // in that case, so touch taps must still be picked up from touchend
    const toolbar = page.locator(TOOLBAR)
    const playButton = page.locator('[data-testid="play-pause-button"]')
    await playButton.click()
    await page.waitForTimeout(300) // let the play/pause toolbar logic settle

    if (await toolbar.isVisible()) {
      // Phones keep the toolbar while playing; tap once to hide it first
      await expect(playButton).toHaveAttribute('aria-label', /pause/i)
      await tapReadingArea(page, hasTouch)
      await expect(toolbar).toBeHidden()
    }

    await tapReadingArea(page, hasTouch)
    await expect(toolbar).toBeVisible()
    await expect(playButton).toHaveAttribute('aria-label', /pause/i)
  })

  test('the same tap behavior applies to the monospace frame', async ({ page, hasTouch }) => {
    await page.locator('[data-testid="frame-picker-toggle"]').click()
    await expect(page.locator('[data-testid="teleprompter-mono-content"]')).toBeVisible()
    const toolbar = page.locator(TOOLBAR)

    await tapReadingArea(page, hasTouch)
    await expect(toolbar).toBeHidden()

    await tapReadingArea(page, hasTouch)
    await expect(toolbar).toBeVisible()
  })

  test('reloading restores the saved scroll position', async ({ page }) => {
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('ArrowDown') // step-down hotkey (saves position)
    }
    const saved = await settledScrollTop(page)
    expect(saved).toBeGreaterThan(0)

    await page.reload()
    await page.waitForSelector(TOOLBAR)

    await expect.poll(() => scrollTop(page)).toBeGreaterThan(saved - 3)
    expect(Math.abs((await settledScrollTop(page)) - saved)).toBeLessThanOrEqual(3)
  })

  test('playback pauses at the end of the text and stays stopped', async ({ page }) => {
    // Regression: the auto-pause required >5px per frame, which normal
    // auto-scroll speeds never reach, so playback never stopped at the end
    await page.keyboard.press('End')
    const playButton = page.locator('[data-testid="play-pause-button"]')
    await playButton.click()

    // Toolbar comes back once playback stops, showing Play again
    await expect(playButton).toBeVisible()
    await expect(playButton).toHaveAttribute('aria-label', /play/i)

    // Regression: the auto-scroller kept running after the auto-pause and
    // dragged the text forward again after Home. WebKit occasionally drops a
    // key press sent the same instant the toolbar re-mounts, so the press is
    // retried until it lands; what matters is that the text then stays put.
    await expect(async () => {
      await page.keyboard.press('Home')
      expect(await scrollTop(page)).toBe(0)
    }).toPass({ timeout: 5000 })
    await page.waitForTimeout(800)
    expect(await scrollTop(page)).toBe(0)
  })

  test('imported files are shown safely and kept intact', async ({ page }) => {
    const script = [
      '# Imported script',
      '',
      'This line mentions javascript: on purpose.',
      '',
      '<img src="x" onerror="window.__xss = 1">',
      '',
      '<script>window.__xss = 2</script>',
      '',
    ].join('\n')

    await importFile(page, 'imported.md', script)

    const content = page.locator('[data-testid="teleprompter-content"]')
    await expect(content).toContainText('This line mentions javascript: on purpose.')
    // Rendering strips executable HTML (DOMPurify)...
    await expect(content.locator('img[onerror]')).toHaveCount(0)
    await expect(content.locator('script')).toHaveCount(0)
    expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined()

    // ...but the script itself is not rewritten (the old regex sanitizer
    // altered the file content, and that altered text was saved back)
    await page.locator('[data-testid="more-menu-button"]').click()
    await page.locator('[data-testid="editor-button"]').first().click()
    await expect(page).toHaveURL(/\/edit$/)
    await expect(page.locator('textarea').first()).toHaveValue(script)
  })

  test('opening the editor directly shows the saved script', async ({ page }) => {
    // Regression: loading /edit directly skipped TeleprompterPage, so the
    // editor showed the placeholder (and could save it over the real script)
    const script = '# Saved script\n\nStill here after a reload.\n'
    await importFile(page, 'saved.md', script)
    await expect(page.locator('[data-testid="teleprompter-content"]')).toContainText(
      'Still here after a reload.'
    )

    await page.goto('/edit')

    await expect(page.locator('textarea').first()).toHaveValue(script)
  })

  test('the highlight band position persists across reloads', async ({ page }) => {
    // Regression: dragging the band changed the value without saving it
    const readSavedPosition = () =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('preferences') ?? '{}').highlightBandPosPct
      )

    const handle = page.locator('.highlight-band-handle--left')
    const box = (await handle.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 120, { steps: 6 })
    await page.mouse.up()

    await expect.poll(readSavedPosition).toBeGreaterThan(40)
    const saved = await readSavedPosition()

    await page.reload()
    await page.waitForSelector(TOOLBAR)

    const triangleTop = await page
      .locator('.triangle-left')
      .evaluate((el) => (el as HTMLElement).style.top)
    expect(Number.parseFloat(triangleTop)).toBeCloseTo(saved, 1)
  })
})
