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
})
