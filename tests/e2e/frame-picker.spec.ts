import { test, expect } from '@playwright/test'

test.describe('Frame picker (markdown vs monospace)', () => {
  test('defaults to the markdown frame', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

    await expect(page.locator('[data-testid="teleprompter-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="teleprompter-mono-content"]')).toHaveCount(0)
  })

  test('toggling the toolbar control switches to the monospace frame and renders plain text', async ({
    page,
  }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

    const toggle = page.locator('[data-testid="frame-picker-toggle"]')
    await expect(toggle).toBeVisible()
    await toggle.click()

    const monoContent = page.locator('[data-testid="teleprompter-mono-content"]')
    await expect(monoContent).toBeVisible()
    await expect(page.locator('[data-testid="teleprompter-content"]')).toHaveCount(0)

    // Sample content includes a "# ..." heading and "**...**" bold text - the
    // mono frame must show the words but never markdown-rendered elements.
    await expect(monoContent.locator('h1, h2, h3, strong, em')).toHaveCount(0)
    await expect(monoContent).not.toContainText('#')
  })

  test('renders with a monospace font family', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')
    await page.locator('[data-testid="frame-picker-toggle"]').click()

    const monoContent = page.locator('[data-testid="teleprompter-mono-content"]')
    await expect(monoContent).toBeVisible()

    const fontFamily = await monoContent.evaluate((el) => window.getComputedStyle(el).fontFamily)
    expect(fontFamily.toLowerCase()).toContain('courier')
  })

  test('persists the selected frame across a reload', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

    await page.locator('[data-testid="frame-picker-toggle"]').click()
    await expect(page.locator('[data-testid="teleprompter-mono-content"]')).toBeVisible()
    await page.waitForTimeout(1000) // let the async persistence write flush

    await page.reload()
    await page.waitForSelector('[data-testid="floating-toolbar"]')
    await expect(page.locator('[data-testid="teleprompter-mono-content"]')).toBeVisible()
  })

  test('toggling back returns to the markdown frame', async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')

    const toggle = page.locator('[data-testid="frame-picker-toggle"]')
    await toggle.click()
    await expect(page.locator('[data-testid="teleprompter-mono-content"]')).toBeVisible()

    await toggle.click()
    await expect(page.locator('[data-testid="teleprompter-content"]')).toBeVisible()
    await expect(page.locator('[data-testid="teleprompter-mono-content"]')).toHaveCount(0)
  })
})
