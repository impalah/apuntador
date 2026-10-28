import { test, expect } from '@playwright/test'

/**
 * The floating toolbar holds five controls (play, voice toggle, frame picker,
 * speed, more). With fixed widths it used to overflow phone screens and push
 * the More button off-screen, making the actions menu unreachable on mobile.
 * Runs on every project, so desktop, tablet-sized and phone viewports are all
 * covered.
 */
test.describe('Floating toolbar layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')
  })

  test('keeps every toolbar control inside the viewport', async ({ page }) => {
    const viewport = page.viewportSize()
    expect(viewport).not.toBeNull()

    const controls = page.locator('[data-testid="floating-toolbar"] > *')
    const count = await controls.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const box = await controls.nth(i).boundingBox()
      expect(box, `toolbar control ${i} has no box`).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width)
    }
  })

  test('opens the actions menu from the More button', async ({ page }) => {
    await page.locator('[data-testid="more-menu-button"]').click()

    await expect(page.locator('[data-testid="align-left-button"]')).toBeVisible()
  })

  test('keeps every editor toolbar button inside the viewport', async ({ page }) => {
    // Six fixed-size buttons used to overflow phones and cut off the close button
    await page.goto('/edit')
    const buttons = page.locator('.editor-toolbar .toolbar-btn')
    await expect(buttons.first()).toBeVisible()
    const viewport = page.viewportSize()!

    const count = await buttons.count()
    for (let i = 0; i < count; i++) {
      const box = (await buttons.nth(i).boundingBox())!
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
    }
  })

  test('opens settings with its header and tabs in view', async ({ page }) => {
    // Under Vuetify 4 a formerly dead 180px bottom padding took effect and the
    // settings header and tabs opened scrolled out of the bottom sheet; the
    // sheet content was also wider than phone screens
    await page.locator('[data-testid="more-menu-button"]').click()
    await page.locator('[data-testid="settings-button"]').click()

    const back = page.locator('[data-testid="close-settings-btn"]')
    const tabs = page.locator('.settings-content .v-tabs')
    await expect(back).toBeInViewport()
    await expect(tabs).toBeInViewport()

    const viewport = page.viewportSize()!
    const content = (await page.locator('.menu-content').boundingBox())!
    expect(content.x).toBeGreaterThanOrEqual(0)
    expect(content.x + content.width).toBeLessThanOrEqual(viewport.width)
  })

  test('the actions menu covers the toolbar while a notification is showing', async ({ page }) => {
    // A visible snackbar made Vuetify stack the next sheet at z 2010, under the
    // toolbar (then 9999), which covered the last menu buttons
    await page.goto('/edit')
    await page.locator('[data-testid="open-file-button"]').click()
    const fileChooser = page.waitForEvent('filechooser')
    await page.locator('[data-testid="local-file-option"]').click()
    await (
      await fileChooser
    ).setFiles({
      name: 'script.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Notification test script.'),
    })
    await expect(page.locator('.notification-snackbar')).toBeVisible()

    await page.locator('[data-testid="close-button"]').click()
    await page.waitForSelector('[data-testid="floating-toolbar"]')
    await page.locator('[data-testid="more-menu-button"]').click()

    await page.locator('[data-testid="settings-button"]').click({ timeout: 5000 })
    await expect(page.locator('[data-testid="close-settings-btn"]')).toBeVisible()
  })
})
