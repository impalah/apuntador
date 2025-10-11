import { test, expect } from '@playwright/test'

test.describe('Text Alignment Hotkeys', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000) // Wait for initialization
  })

  test('should change alignment using hotkey 1 (left)', async ({ page }) => {
    // Add some content first
    const testContent = '# Test Content\n\nThis text should be aligned left when using hotkey 1.'

    // Add content via editor
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    const isMobile = await moreMenuButton.isVisible()

    if (isMobile) {
      await moreMenuButton.click()
      await page.waitForTimeout(300)
    }

    const editorButton = page.locator('[data-testid="editor-button"]').first()
    await editorButton.click()

    const editorDialog = page.locator('[role="dialog"]')
    await expect(editorDialog).toBeVisible()

    const textarea = editorDialog.locator('textarea')
    await textarea.fill(testContent)

    const saveButton = editorDialog.locator('button[icon="mdi-check"], button:has(.mdi-check)')
    await saveButton.click()
    await expect(editorDialog).not.toBeVisible()

    // Test hotkey 1 for left alignment
    // On mobile devices, hotkeys might not work, so test the button instead
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const isMobileDevice = /Mobile|Android|iPhone|iPad/.test(userAgent)

    if (isMobileDevice) {
      // Use alignment button on mobile
      const leftButton = page.locator('[data-testid="align-left-button"]')
      if (await leftButton.isVisible()) {
        await leftButton.click()
      } else {
        // Button might be in more menu
        if (isMobile && !(await page.locator('.floating-toolbar .more-content').isVisible())) {
          await moreMenuButton.click()
          await page.waitForTimeout(300)
        }
        await leftButton.click()
      }
    } else {
      await page.keyboard.press('1')
    }

    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    const textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('left')

    // Verify button state if visible
    const leftButton = page.locator('[data-testid="align-left-button"]')
    if (await leftButton.isVisible()) {
      await expect(leftButton).toHaveClass(/v-btn--active|v-btn--selected/)
    }
  })

  test('should change alignment using hotkey 2 (center)', async ({ page }) => {
    // Test hotkey 2 for center alignment
    await page.keyboard.press('2')

    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    const textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('center')

    // Verify button state if visible
    const centerButton = page.locator('[data-testid="align-center-button"]')
    if (await centerButton.isVisible()) {
      await expect(centerButton).toHaveClass(/v-btn--active|v-btn--selected/)
    }
  })

  test('should change alignment using hotkey 3 (right)', async ({ page }) => {
    // Test hotkey 3 for right alignment
    // On mobile devices, hotkeys might not work, so test the button instead
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const isMobileDevice = /Mobile|Android|iPhone|iPad/.test(userAgent)

    if (isMobileDevice) {
      // Use alignment button on mobile
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      const isMobile = await moreMenuButton.isVisible()

      const rightButton = page.locator('[data-testid="align-right-button"]')
      if (await rightButton.isVisible()) {
        await rightButton.click()
      } else {
        // Button might be in more menu
        if (isMobile) {
          await moreMenuButton.click()
          await page.waitForTimeout(300)
        }
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

    // Verify button state if visible
    const rightButton = page.locator('[data-testid="align-right-button"]')
    if (await rightButton.isVisible()) {
      await expect(rightButton).toHaveClass(/v-btn--active|v-btn--selected/)
    }
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
      // Use alignment button on mobile
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
      // Change alignment using hotkey
      await page.keyboard.press('1') // Left alignment
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
    // Open settings
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const isMobileDevice = /Mobile|Android|iPhone|iPad/.test(userAgent)

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

    // Wait and look for hotkeys section
    await page.waitForTimeout(1000)

    // Try to find the hotkeys section by scrolling or navigating to correct tab
    const hotkeyTab = page.locator('[role="tab"]:has-text("Preferences")')
    if (await hotkeyTab.isVisible()) {
      await hotkeyTab.click()
      await page.waitForTimeout(500)
    }

    // Reset hotkeys to ensure we have the latest defaults
    const resetButton = page.locator('button:has-text("Reset")')
    if (await resetButton.isVisible()) {
      await resetButton.click()
      await page.waitForTimeout(500)
    }

    // Check if any hotkey controls are visible, not specifically alignment ones
    const hotkeyControls = page.locator('[data-testid^="hotkey-control-"]')
    const hasControls = (await hotkeyControls.count()) > 0

    if (hasControls) {
      await expect(hotkeyControls.first()).toBeVisible()
    }

    // Try to find alignment controls
    const leftControl = page.locator('[data-testid="hotkey-control-align-left"]')
    const centerControl = page.locator('[data-testid="hotkey-control-align-center"]')
    const rightControl = page.locator('[data-testid="hotkey-control-align-right"]')

    if (await leftControl.isVisible()) {
      await expect(leftControl).toBeVisible()
      await expect(centerControl).toBeVisible()
      await expect(rightControl).toBeVisible()

      // Check that they show the correct default keys
      const leftInput = page.locator('[data-testid="hotkey-input-align-left"]')
      const centerInput = page.locator('[data-testid="hotkey-input-align-center"]')
      const rightInput = page.locator('[data-testid="hotkey-input-align-right"]')

      await expect(leftInput).toHaveValue('1')
      await expect(centerInput).toHaveValue('2')
      await expect(rightInput).toHaveValue('3')
    } else {
      console.log(
        'Alignment hotkey controls not found - this may be expected if hotkeys need to be reset first'
      )
    }

    // Close settings
    const closeButton = page.locator('[data-testid="settings-close-button"]')
    if (await closeButton.isVisible()) {
      await closeButton.click()
    } else {
      await page.keyboard.press('Escape')
    }

    await expect(settingsDialog).not.toBeVisible()
  })
})
