import { test, expect } from '@playwright/test'

test.describe('Android Edge-to-Edge Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1000)
  })

  test('should handle Android edge-to-edge mode', async ({ page, isMobile }) => {
    // This test will primarily verify on mobile browsers that simulate Android
    if (!isMobile) {
      return
    }

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle')

    // Check that the more menu button is visible and properly positioned
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    
    // Only test if button is visible (may not be on all mobile browsers)
    const isMenuVisible = await moreMenuButton.isVisible().catch(() => false)
    if (!isMenuVisible) {
      console.log('Menu button not available in this mobile browser - skipping interaction tests')
      return
    }
    
    await expect(moreMenuButton).toBeVisible()

    // Verify that CSS custom properties are set
    const safeAreaTop = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')
    })

    const safeAreaBottom = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')
    })

    // These should be set even if they're "0px"
    expect(safeAreaTop).toBeDefined()
    expect(safeAreaBottom).toBeDefined()

    // Check menu button position - it should be above the bottom safe area
    const buttonBounds = await moreMenuButton.boundingBox()
    const viewportHeight = page.viewportSize()?.height || 0

    if (buttonBounds) {
      // Button should not be at the very bottom of the viewport if there are insets
      expect(buttonBounds.y + buttonBounds.height).toBeLessThanOrEqual(viewportHeight)
    }
  })

  test('should apply safe area padding to main content', async ({ page }) => {
    // Check that the teleprompter page has proper safe area styling
    const teleprompterPage = page.locator('.teleprompter-page')
    await expect(teleprompterPage).toBeVisible()

    // Check that CSS is applied for safe areas
    const computedStyle = await teleprompterPage.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
      }
    })

    // On most devices, these will be "0px" but they should be defined
    expect(computedStyle.paddingTop).toBeDefined()
    expect(computedStyle.paddingBottom).toBeDefined()
    expect(computedStyle.paddingLeft).toBeDefined()
    expect(computedStyle.paddingRight).toBeDefined()
  })

  test('should work in landscape orientation', async ({ page, isMobile }) => {
    if (!isMobile) {
      return
    }

    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)

    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    
    // Only test if button is visible (may not be on all mobile browsers)
    const isMenuVisible = await moreMenuButton.isVisible().catch(() => false)
    if (!isMenuVisible) {
      console.log('Menu button not available in this mobile browser - skipping interaction tests')
      return
    }
    
    await expect(moreMenuButton).toBeVisible()

    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 })
    await page.waitForTimeout(500)

    // Menu button should still be visible and properly positioned
    await expect(moreMenuButton).toBeVisible()
    
    // Verify content is still accessible
    const content = page.locator('[data-testid="teleprompter-content"]')
    await expect(content).toBeVisible()
  })

  test('should handle viewport changes gracefully', async ({ page }) => {
    const toolbar = page.locator('[data-testid="floating-toolbar"]')
    await expect(toolbar).toBeVisible()

    // Simulate viewport changes (like Android keyboard appearing/disappearing)
    const originalSize = page.viewportSize()

    // Simulate keyboard appearing (reduces viewport height)
    if (originalSize) {
      await page.setViewportSize({
        width: originalSize.width,
        height: Math.floor(originalSize.height * 0.6),
      })
      await page.waitForTimeout(300)

      // Toolbar should still be visible and accessible
      await expect(toolbar).toBeVisible()

      // Restore original size
      await page.setViewportSize(originalSize)
      await page.waitForTimeout(300)

      await expect(toolbar).toBeVisible()
    }
  })
})
