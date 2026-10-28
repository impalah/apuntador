import { test, expect, type Page } from '@playwright/test'

/**
 * Visual regression: reference screenshots of the main screens, on desktop
 * (chromium) and phones (Mobile Chrome, Mobile Safari - the iOS target).
 *
 * Baselines are platform-specific (Playwright suffixes them with the OS), so
 * they are only comparable on the machine type that generated them. After an
 * intended UI change, review the new screens and refresh the baselines with:
 *   npx playwright test tests/e2e/visual.spec.ts --update-snapshots
 */

const VISUAL_PROJECTS = ['chromium', 'Mobile Chrome', 'Mobile Safari']
const TOOLBAR = '[data-testid="floating-toolbar"]'

test.use({ locale: 'en-US', colorScheme: 'dark' })

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(
    !VISUAL_PROJECTS.includes(testInfo.project.name),
    'Visual baselines are kept for chromium and the two mobile projects only'
  )
  await page.goto('/')
  await page.waitForSelector(TOOLBAR)
  await settle(page)
})

/** Waits for web fonts and a couple of frames so layout is final. */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  )
}

async function openActionsMenu(page: Page) {
  await page.locator('[data-testid="more-menu-button"]').click()
  await expect(page.locator('[data-testid="align-left-button"]')).toBeVisible()
  await settle(page)
}

test.describe('Visual regression', () => {
  test('teleprompter, markdown frame', async ({ page }) => {
    await expect(page).toHaveScreenshot('teleprompter-markdown.png')
  })

  test('teleprompter, monospace frame', async ({ page }) => {
    await page.locator('[data-testid="frame-picker-toggle"]').click()
    await expect(page.locator('[data-testid="teleprompter-mono-content"]')).toBeVisible()
    await settle(page)

    await expect(page).toHaveScreenshot('teleprompter-monospace.png')
  })

  test('actions menu', async ({ page }) => {
    await openActionsMenu(page)

    await expect(page).toHaveScreenshot('actions-menu.png')
  })

  test('settings', async ({ page }) => {
    await openActionsMenu(page)
    await page.locator('[data-testid="settings-button"]').click()
    await expect(page.locator('[data-testid="close-settings-btn"]')).toBeVisible()
    await settle(page)

    await expect(page).toHaveScreenshot('settings.png')
  })

  test('file import dialog', async ({ page }) => {
    await page.keyboard.press('f') // open-file hotkey
    await expect(page.locator('[data-testid="file-import-dialog"]')).toBeVisible()
    await settle(page)

    await expect(page).toHaveScreenshot('file-import-dialog.png')
  })

  test('editor', async ({ page }) => {
    await openActionsMenu(page)
    await page.locator('[data-testid="editor-button"]').first().click()
    await expect(page).toHaveURL(/\/edit$/)
    await expect(page.locator('textarea').first()).toBeVisible()
    await page.locator('textarea').first().blur()
    await settle(page)

    await expect(page).toHaveScreenshot('editor.png')
  })
})
