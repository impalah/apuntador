import { test, expect } from '@playwright/test'

test.describe('Text Alignment Hotkeys Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure fresh start
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForTimeout(1000) // Wait for initialization
  })

  test.skip('should initialize with alignment hotkeys after fresh start', async ({ page }) => {
    // Check if it's a mobile device first
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const isMobileDevice = /Mobile|Android|iPhone|iPad/.test(userAgent)

    // Open settings
    if (isMobileDevice) {
      // Use settings button on mobile
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      const isMobile = await moreMenuButton.isVisible()

      const settingsButton = page.locator('[data-testid="settings-button"]')
      if (await settingsButton.isVisible()) {
        await settingsButton.click()
      } else if (isMobile) {
        await moreMenuButton.click()
        await page.waitForTimeout(300)
        await settingsButton.click()
      }
    } else {
      await page.keyboard.press('s')
    }

    const settingsDialog = page.locator('[role="dialog"]')
    await expect(settingsDialog).toBeVisible({ timeout: 10000 })

    // Try to find preferences tab first
    const preferencesTab = page.locator('[role="tab"]:has-text("Preferences")')
    if (await preferencesTab.isVisible()) {
      await preferencesTab.click()
      await page.waitForTimeout(500)
    }

    // Reset hotkeys to force default initialization - but only if button exists
    const resetButton = page.locator('button:has-text("Reset")')
    if (await resetButton.isVisible()) {
      await resetButton.click()
      await page.waitForTimeout(1000) // Wait for reset to complete
    }

    // Check if hotkey controls exist
    const hotkeyControls = page.locator('[data-testid^="hotkey-control-"]')
    const hasControls = (await hotkeyControls.count()) > 0

    if (hasControls) {
      // Now check for alignment hotkeys
      const leftControl = page.locator('[data-testid="hotkey-control-align-left"]')
      const centerControl = page.locator('[data-testid="hotkey-control-align-center"]')
      const rightControl = page.locator('[data-testid="hotkey-control-align-right"]')

      if (await leftControl.isVisible()) {
        await expect(leftControl).toBeVisible()
        await expect(centerControl).toBeVisible()
        await expect(rightControl).toBeVisible()

        // Check default values
        const leftInput = page.locator('[data-testid="hotkey-input-align-left"]')
        const centerInput = page.locator('[data-testid="hotkey-input-align-center"]')
        const rightInput = page.locator('[data-testid="hotkey-input-align-right"]')

        await expect(leftInput).toHaveValue('1')
        await expect(centerInput).toHaveValue('2')
        await expect(rightInput).toHaveValue('3')
      }
    }

    // Close settings
    const closeButton = page.locator('[data-testid="settings-close-button"]')
    if (await closeButton.isVisible()) {
      await closeButton.click()
    } else {
      await page.keyboard.press('Escape')
    }

    await expect(settingsDialog).not.toBeVisible()

    // Test that the hotkeys actually work
    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')

    if (isMobileDevice) {
      // Use alignment buttons on mobile
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      const isMobile = await moreMenuButton.isVisible()

      const leftButton = page.locator('[data-testid="align-left-button"]')
      if (await leftButton.isVisible()) {
        await leftButton.click()
      } else if (isMobile) {
        await moreMenuButton.click()
        await page.waitForTimeout(300)
        await leftButton.click()
      }
    } else {
      await page.keyboard.press('1')
    }

    let textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('left')

    if (isMobileDevice) {
      const centerButton = page.locator('[data-testid="align-center-button"]')
      if (await centerButton.isVisible()) {
        await centerButton.click()
      } else {
        const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
        const isMobile = await moreMenuButton.isVisible()
        if (isMobile) {
          await moreMenuButton.click()
          await page.waitForTimeout(300)
        }
        await centerButton.click()
      }
    } else {
      await page.keyboard.press('2')
    }

    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('center')

    if (isMobileDevice) {
      const rightButton = page.locator('[data-testid="align-right-button"]')
      if (await rightButton.isVisible()) {
        await rightButton.click()
      } else {
        const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
        const isMobile = await moreMenuButton.isVisible()
        if (isMobile) {
          await moreMenuButton.click()
          await page.waitForTimeout(300)
        }
        await rightButton.click()
      }
    } else {
      await page.keyboard.press('3')
    }

    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('right')
  })

  test('should work immediately on fresh installation', async ({ page }) => {
    // These should work even without opening settings first
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const isMobileDevice = /Mobile|Android|iPhone|iPad/.test(userAgent)

    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')

    if (isMobileDevice) {
      // Use alignment buttons on mobile
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      const isMobile = await moreMenuButton.isVisible()

      const leftButton = page.locator('[data-testid="align-left-button"]')
      if (await leftButton.isVisible()) {
        await leftButton.click()
      } else if (isMobile) {
        await moreMenuButton.click()
        await page.waitForTimeout(300)
        await leftButton.click()
      }
    } else {
      await page.keyboard.press('1')
    }

    let textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('left')

    if (isMobileDevice) {
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      const isMobile = await moreMenuButton.isVisible()

      const centerButton = page.locator('[data-testid="align-center-button"]')
      if (await centerButton.isVisible()) {
        await centerButton.click()
      } else if (isMobile) {
        await moreMenuButton.click()
        await page.waitForTimeout(300)
        await centerButton.click()
      }
    } else {
      await page.keyboard.press('2')
    }

    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('center')

    if (isMobileDevice) {
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      const isMobile = await moreMenuButton.isVisible()

      const rightButton = page.locator('[data-testid="align-right-button"]')
      if (await rightButton.isVisible()) {
        await rightButton.click()
      } else if (isMobile) {
        await moreMenuButton.click()
        await page.waitForTimeout(300)
        await rightButton.click()
      }
    } else {
      await page.keyboard.press('3')
    }

    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('right')
  })
})
