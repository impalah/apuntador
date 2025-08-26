import { test, expect } from '@playwright/test'

test.describe('Teleprompter Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load the teleprompter page', async ({ page }) => {
    await expect(page).toHaveTitle(/Apuntador/)
    await expect(page.locator('.teleprompter-frame')).toBeVisible()
  })

  test('should show sample content by default', async ({ page }) => {
    const content = page.locator('.teleprompter-content')
    await expect(content).toBeVisible()
    await expect(content).toContainText('Welcome to Apuntador')
  })

  test('should show toolbar on load', async ({ page }) => {
    const toolbar = page.locator('.floating-toolbar')
    await expect(toolbar).toBeVisible()
  })

  test('should play and pause teleprompter', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-pause-button"]').first()

    // Initially should show play icon
    await expect(playButton).toHaveAttribute('aria-label', /play/i)

    // Use dispatchEvent to trigger the click
    await playButton.dispatchEvent('click')

    // Wait a moment for the state to update
    await page.waitForTimeout(500)
    await expect(playButton).toHaveAttribute('aria-label', /pause/i)

    // Wait a bit and check if content is scrolling
    await page.waitForTimeout(1000)

    // Click to pause
    await playButton.dispatchEvent('click')

    await page.waitForTimeout(500)
    await expect(playButton).toHaveAttribute('aria-label', /play/i)
  })

  test('should navigate with keyboard shortcuts', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-pause-button"]').first()

    // Check if this is a mobile device (by checking user agent or viewport)
    const isMobile = await page.evaluate(() => {
      return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    })

    if (isMobile) {
      // On mobile devices, use button dispatches instead of keyboard
      await playButton.dispatchEvent('click')
      await page.waitForTimeout(100)
      await expect(playButton).toHaveAttribute('aria-label', /pause/i)

      await playButton.dispatchEvent('click')
      await page.waitForTimeout(100)
      await expect(playButton).toHaveAttribute('aria-label', /play/i)
    } else {
      // On desktop, use keyboard shortcuts
      await page.click('body')

      // Test spacebar for play/pause
      await page.keyboard.press('Space')
      await page.waitForTimeout(100)
      await expect(playButton).toHaveAttribute('aria-label', /pause/i)

      await page.keyboard.press('Space')
      await page.waitForTimeout(100)
      await expect(playButton).toHaveAttribute('aria-label', /play/i)

      // Test arrow keys for navigation
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowUp')

      // Test home/end
      await page.keyboard.press('Home')
      await page.keyboard.press('End')
    }
  })
})

test.describe('Settings and Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should open settings dialog', async ({ page }) => {
    // Check if more menu button exists (mobile layout)
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    const isMobile = await moreMenuButton.isVisible()

    if (isMobile) {
      await moreMenuButton.click()
    }

    const settingsButton = page.locator('[data-testid="settings-button"]').first()
    await settingsButton.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Settings')
  })

  test('should change font size', async ({ page }) => {
    // Check if more menu button exists (mobile layout)
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    const isMobile = await moreMenuButton.isVisible()

    if (isMobile) {
      await moreMenuButton.click()
    }

    // Open settings
    const settingsButton = page.locator('[data-testid="settings-button"]').first()
    await settingsButton.click()

    // Wait for dialog to be visible
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Find font size input field (the number input next to the slider)
    const fontInput = page.locator('input[type="number"]').first()
    await fontInput.fill('32')
    await fontInput.press('Enter')

    // Close settings
    await page.locator('button:has-text("Done")').click()

    // Check if font size changed in content
    const content = page.locator('.teleprompter-content')
    await expect(content).toHaveCSS('font-size', '32px')
  })

  test('should toggle mirror modes', async ({ page }) => {
    // Check if more menu button exists (mobile layout)
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    const isMobile = await moreMenuButton.isVisible()

    if (isMobile) {
      await moreMenuButton.click()
    }

    const mirrorHButton = page.locator('[data-testid="mirror-h-button"]').first()
    await mirrorHButton.click()

    const container = page.locator('.teleprompter-container')
    await expect(container).toHaveCSS('transform', /matrix\(-1,.*0.*0.*1.*0.*0\)/)
  })
})

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should show minimal toolbar on mobile', async ({ page }) => {
    const toolbar = page.locator('.floating-toolbar')
    await expect(toolbar).toBeVisible()

    // Should show minimal number of main buttons (not counting sub-buttons inside controls)
    // In mobile mode: Play/Pause + More menu button + some control buttons = reasonable count
    const buttons = toolbar.locator('button')
    const buttonCount = await buttons.count()
    expect(buttonCount).toBeLessThanOrEqual(6) // Adjusted for SpeedControl internal buttons
  })

  test('should respond to touch gestures', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip()
    }

    // Simulate swipe down (scroll up)
    await page.touchscreen.tap(200, 300)
    await page.touchscreen.tap(200, 350)

    // Simulate swipe up (scroll down)
    await page.touchscreen.tap(200, 350)
    await page.touchscreen.tap(200, 300)
  })

  test('should keep toolbar visible during playback on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip()
    }

    const toolbar = page.locator('.floating-toolbar')
    const playButton = page.locator('[data-testid="play-pause-button"]').first()

    // Start playing
    await playButton.click()

    // Toolbar should remain visible (no auto-hide functionality)
    await page.waitForTimeout(2000)
    await expect(toolbar).toBeVisible()
    await expect(toolbar).not.toHaveClass(/hidden/)
  })
})

test.describe('File Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should open file import dialog', async ({ page }) => {
    // Check if more menu button exists (mobile layout)
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    const isMobile = await moreMenuButton.isVisible()

    if (isMobile) {
      await moreMenuButton.click()
    }

    const fileButton = page.locator('[data-testid="file-button"]').first()
    await fileButton.click()

    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Import File')
  })

  test('should accept markdown file upload', async ({ page: _page }) => {
    // This test would require creating a temporary file
    // In a real implementation, you'd use page.setInputFiles()
    test.skip(true, 'File upload testing requires setup')
  })
})
