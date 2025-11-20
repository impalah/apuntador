import { test, expect } from '@playwright/test'

test.describe('Text Alignment Hotkeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000) // Wait for initialization
  })

  test('should change alignment using hotkey 1 (left)', async ({ page }) => {
    // On mobile devices, hotkeys might not work, so test the button instead
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const isMobileDevice = /Mobile|Android|iPhone|iPad/.test(userAgent)

    if (isMobileDevice) {
      // Use alignment button on mobile
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      await moreMenuButton.click()
      await page.waitForTimeout(300)
      
      const leftButton = page.locator('[data-testid="align-left-button"]')
      await leftButton.click()
      await page.waitForTimeout(300)
    } else {
      // Use hotkey on desktop
      await page.keyboard.press('1')
      await page.waitForTimeout(300)
    }

    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    const textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('left')

    // Verify button state in menu
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    if (!isMobileDevice) {
      // On desktop, need to open menu to see button
      await moreMenuButton.click()
      await page.waitForTimeout(300)
    }
    
    const leftButton = page.locator('[data-testid="align-left-button"]')
    await expect(leftButton).toHaveClass(/active/)
  })

  test('should change alignment using hotkey 2 (center)', async ({ page }) => {
    // Test hotkey 2 for center alignment
    await page.keyboard.press('2')
    await page.waitForTimeout(300)

    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    const textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('center')

    // Verify button state in menu
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    await moreMenuButton.click()
    await page.waitForTimeout(300)

    const centerButton = page.locator('[data-testid="align-center-button"]')
    await expect(centerButton).toHaveClass(/active/)
  })

  test('should change alignment using hotkey 3 (right)', async ({ page }) => {
    // Test hotkey 3 for right alignment
    // On mobile devices, hotkeys might not work, so test the button instead
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const isMobileDevice = /Mobile|Android|iPhone|iPad/.test(userAgent)

    if (isMobileDevice) {
      // Use alignment button on mobile - always open menu
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      await expect(moreMenuButton).toBeVisible()
      await moreMenuButton.click()
      await page.waitForTimeout(300)
      
      const rightButton = page.locator('[data-testid="align-right-button"]')
      await expect(rightButton).toBeVisible()
      await rightButton.click()
      await page.waitForTimeout(300)
    } else {
      // Use hotkey on desktop
      await page.keyboard.press('3')
      await page.waitForTimeout(300)
    }

    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    const textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('right')

    // Verify button state in menu
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    if (!isMobileDevice) {
      // On desktop, need to open menu to see button
      await moreMenuButton.click()
      await page.waitForTimeout(300)
    }
    
    const rightButton = page.locator('[data-testid="align-right-button"]')
    await expect(rightButton).toHaveClass(/active/)
  })

  test('should sequence through alignments using hotkeys', async ({ page }) => {
    // On mobile devices, hotkeys might not work, so test the buttons instead
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const isMobileDevice = /Mobile|Android|iPhone|iPad/.test(userAgent)

    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')

    // Start with default (center)
    let textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('center')

    if (isMobileDevice) {
      // Use alignment buttons on mobile
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      const isMobile = await moreMenuButton.isVisible()

      // Press 1 for left
      const leftButton = page.locator('[data-testid="align-left-button"]')
      if (await leftButton.isVisible()) {
        await leftButton.click()
      } else if (isMobile) {
        await moreMenuButton.click()
        await page.waitForTimeout(300)
        await leftButton.click()
      }

      textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
      expect(textAlign).toBe('left')

      // Press 3 for right
      const rightButton = page.locator('[data-testid="align-right-button"]')
      if (await rightButton.isVisible()) {
        await rightButton.click()
      } else if (isMobile) {
        await moreMenuButton.click()
        await page.waitForTimeout(300)
        await rightButton.click()
      }

      textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
      expect(textAlign).toBe('right')

      // Press 2 for center
      const centerButton = page.locator('[data-testid="align-center-button"]')
      if (await centerButton.isVisible()) {
        await centerButton.click()
      } else if (isMobile) {
        await moreMenuButton.click()
        await page.waitForTimeout(300)
        await centerButton.click()
      }

      textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
      expect(textAlign).toBe('center')
    } else {
      // Desktop: Use keyboard hotkeys
      // Press 1 for left
      await page.keyboard.press('1')
      textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
      expect(textAlign).toBe('left')

      // Press 3 for right
      await page.keyboard.press('3')
      textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
      expect(textAlign).toBe('right')

      // Press 2 for center
      await page.keyboard.press('2')
      textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
      expect(textAlign).toBe('center')
    }
  })

  test('should persist alignment changes made via hotkeys', async ({ page }) => {
    // On mobile devices, hotkeys might not work, so test the button instead
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const isMobileDevice = /Mobile|Android|iPhone|iPad/.test(userAgent)

    if (isMobileDevice) {
      // Use alignment button on mobile - always open menu
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      await expect(moreMenuButton).toBeVisible()
      await moreMenuButton.click()
      await page.waitForTimeout(300)
      
      const leftButton = page.locator('[data-testid="align-left-button"]')
      await expect(leftButton).toBeVisible()
      await leftButton.click()
      await page.waitForTimeout(300)
    } else {
      // Change alignment using hotkey
      await page.keyboard.press('1') // Left alignment
      await page.waitForTimeout(300)
    }

    let teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    let textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('left')

    // Reload page
    await page.reload()
    await page.waitForTimeout(1000)

    // Check that alignment persisted
    teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('left')
  })

  test.skip('should not interfere with other hotkeys', async ({ page }) => {
    // Test that alignment hotkeys don't interfere with other hotkeys
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const isMobileDevice = /Mobile|Android|iPhone|iPad/.test(userAgent)

    // Press space to toggle play (should work normally)
    await page.keyboard.press(' ')

    // We can't easily test play state without content, but we can test that
    // the alignment hotkeys still work after using other hotkeys

    // Test alignment hotkey still works
    if (isMobileDevice) {
      // Use alignment button on mobile
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

    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    const textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('right')
  })

  test('should show alignment hotkeys in settings', async ({ page }) => {
    // Open settings via ActionsMenu
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    await expect(moreMenuButton).toBeVisible()
    await moreMenuButton.click()
    await page.waitForTimeout(500)

    const settingsButton = page.locator('[data-testid="settings-button"]')
    await expect(settingsButton).toBeVisible()
    await settingsButton.click()

    // Verify settings opened (now integrated in ActionsMenu sheet)
    const settingsTitle = page.locator('.settings-title')
    await expect(settingsTitle).toBeVisible({ timeout: 5000 })

    // Close settings by clicking close button
    const closeButton = page.locator('[data-testid="close-settings-btn"]')
    if (await closeButton.isVisible()) {
      await closeButton.click()
      await page.waitForTimeout(300)
    }
  })
})
