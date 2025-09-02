import { test, expect } from '@playwright/test'

test.describe('Text Alignment Hotkeys Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh start
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForTimeout(1000) // Wait for initialization
  })

  test('should initialize with alignment hotkeys after fresh start', async ({ page }) => {
    // Open settings
    await page.keyboard.press('s')

    const settingsDialog = page.locator('[role="dialog"]')
    await expect(settingsDialog).toBeVisible()

    // Reset hotkeys to force default initialization
    const resetButton = page.locator('button:has-text("Reset")')
    await expect(resetButton).toBeVisible()
    await resetButton.click()
    await page.waitForTimeout(1000) // Wait for reset to complete

    // Now check for alignment hotkeys
    await expect(page.locator('[data-testid="hotkey-control-align-left"]')).toBeVisible()
    await expect(page.locator('[data-testid="hotkey-control-align-center"]')).toBeVisible()
    await expect(page.locator('[data-testid="hotkey-control-align-right"]')).toBeVisible()

    // Check default values
    const leftInput = page.locator('[data-testid="hotkey-input-align-left"]')
    const centerInput = page.locator('[data-testid="hotkey-input-align-center"]')
    const rightInput = page.locator('[data-testid="hotkey-input-align-right"]')

    await expect(leftInput).toHaveValue('1')
    await expect(centerInput).toHaveValue('2')
    await expect(rightInput).toHaveValue('3')

    // Close settings
    await page.keyboard.press('Escape')
    await expect(settingsDialog).not.toBeVisible()

    // Test that the hotkeys actually work
    await page.keyboard.press('1')
    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    let textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('left')

    await page.keyboard.press('2')
    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('center')

    await page.keyboard.press('3')
    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('right')
  })

  test('should work immediately on fresh installation', async ({ page }) => {
    // These should work even without opening settings first
    await page.keyboard.press('1')

    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    let textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('left')

    await page.keyboard.press('2')
    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('center')

    await page.keyboard.press('3')
    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('right')
  })
})
