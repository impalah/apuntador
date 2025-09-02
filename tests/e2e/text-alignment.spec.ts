import { test, expect } from '@playwright/test'

test.describe('Text Alignment Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('[data-testid="floating-toolbar"]')
  })

  test('should have text alignment controls in all toolbar layouts', async ({ page }) => {
    // Check if more menu button exists (mobile/tablet layout)
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    const isMobile = await moreMenuButton.isVisible()

    if (isMobile) {
      // Mobile/tablet layout - alignment controls should be in more menu
      await moreMenuButton.click()
      await expect(page.locator('[data-testid="text-alignment-controls"]')).toBeVisible()
    } else {
      // Desktop layout - alignment controls should be visible directly
      await expect(page.locator('[data-testid="text-alignment-controls"]')).toBeVisible()
    }

    // Verify all alignment buttons exist
    await expect(page.locator('[data-testid="align-left-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="align-center-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="align-right-button"]')).toBeVisible()
  })

  test('should change text alignment and reflect in teleprompter content', async ({ page }) => {
    // Add some content first
    const testContent =
      '# Test Content\n\nThis is a test paragraph for alignment.\n\n## Another Section\n\nMore content here.'

    // Check if more menu button exists (mobile layout)
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    const isMobile = await moreMenuButton.isVisible()

    if (isMobile) {
      await moreMenuButton.click()
    }

    // Open editor to add content
    const editorButton = page.locator('[data-testid="editor-button"]').first()
    await editorButton.click()

    // Wait for editor dialog
    const editorDialog = page.locator('[role="dialog"]')
    await expect(editorDialog).toBeVisible()

    // Add content in the textarea
    const textarea = editorDialog.locator('textarea')
    await textarea.fill(testContent)

    // Save content
    const saveButton = editorDialog.locator('button[icon="mdi-check"], button:has(.mdi-check)')
    await saveButton.click()

    // Wait for dialog to close
    await expect(editorDialog).not.toBeVisible()

    // Now test alignment changes
    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    await expect(teleprompterContent).toBeVisible()

    // Default should be center alignment
    let textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('center')

    // Test left alignment
    if (isMobile) {
      await moreMenuButton.click()
      await page.waitForTimeout(800) // Wait for menu animation
      // Try to find the button, with retry logic
      try {
        await expect(page.locator('[data-testid="align-left-button"]')).toBeVisible({
          timeout: 3000,
        })
      } catch (e) {
        // If not found, close and reopen menu
        await page.click('body', { position: { x: 100, y: 100 } })
        await page.waitForTimeout(500)
        await moreMenuButton.click()
        await page.waitForTimeout(800)
        await expect(page.locator('[data-testid="align-left-button"]')).toBeVisible({
          timeout: 3000,
        })
      }
    }

    await page.waitForTimeout(300) // Wait for any animations
    await page.locator('[data-testid="align-left-button"]').click()

    if (isMobile) {
      // Close menu on mobile
      await page.waitForTimeout(500)
      await page.click('body', { position: { x: 100, y: 100 } })
    }

    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('left')

    // Test right alignment
    if (isMobile) {
      await moreMenuButton.click()
    }

    await page.locator('[data-testid="align-right-button"]').click()

    if (isMobile) {
      // Close menu on mobile
      await page.click('body', { position: { x: 100, y: 100 } })
    }

    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('right')

    // Test center alignment
    if (isMobile) {
      await moreMenuButton.click()
    }

    await page.locator('[data-testid="align-center-button"]').click()

    if (isMobile) {
      // Close menu on mobile
      await page.click('body', { position: { x: 100, y: 100 } })
    }

    textAlign = await teleprompterContent.evaluate((el) => window.getComputedStyle(el).textAlign)
    expect(textAlign).toBe('center')
  })

  test('should show active alignment button state', async ({ page }) => {
    // Check if more menu button exists (mobile layout)
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    const isMobile = await moreMenuButton.isVisible()

    if (isMobile) {
      await moreMenuButton.click()
    }

    // By default, center should be active
    const centerButton = page.locator('[data-testid="align-center-button"]')
    await expect(centerButton).toHaveClass(/v-btn--active|v-btn--selected/)

    // Click left alignment
    await page.locator('[data-testid="align-left-button"]').click()

    // Left button should now be active
    const leftButton = page.locator('[data-testid="align-left-button"]')
    await expect(leftButton).toHaveClass(/v-btn--active|v-btn--selected/)
  })

  test('should persist text alignment after page reload', async ({ page }) => {
    // Set alignment to left
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    const isMobile = await moreMenuButton.isVisible()

    if (isMobile) {
      await moreMenuButton.click()
      await page.waitForTimeout(500)
    }

    await page.locator('[data-testid="align-left-button"]').click()
    await page.waitForTimeout(1000) // Wait for state to be saved

    // Reload page
    await page.reload()
    await page.waitForSelector('[data-testid="floating-toolbar"]')
    await page.waitForTimeout(2000) // Wait for state to load

    // Check if alignment is still left
    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    await expect(teleprompterContent).toBeVisible()

    const textAlign = await teleprompterContent.evaluate(
      (el) => window.getComputedStyle(el).textAlign
    )
    expect(textAlign).toBe('left')

    // Check if left button is still active
    if (isMobile) {
      await moreMenuButton.click()
      await page.waitForTimeout(500)
    }

    const leftButton = page.locator('[data-testid="align-left-button"]')
    await expect(leftButton).toHaveClass(/v-btn--active|v-btn--selected/)
  })

  test('should show alignment in editor preview', async ({ page }) => {
    // Add some content and set alignment
    const testContent = '# Preview Test\n\nThis content should show alignment in the preview.'

    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    const isMobile = await moreMenuButton.isVisible()

    // Set alignment to right first
    if (isMobile) {
      await moreMenuButton.click()
    }

    await page.locator('[data-testid="align-right-button"]').click()

    if (isMobile) {
      await moreMenuButton.click()
    }

    // Open editor
    if (isMobile) {
      await moreMenuButton.click()
      await page.waitForTimeout(300)
    }

    const editorButton = page.locator('[data-testid="editor-button"]').first()
    await editorButton.click()

    const editorDialog = page.locator('[role="dialog"]')
    await expect(editorDialog).toBeVisible()

    // Add content
    const textarea = editorDialog.locator('textarea')
    await textarea.fill(testContent)

    // Enable preview if not on mobile
    if (!(await page.locator('button:has-text("👁")').isVisible())) {
      const previewToggle = editorDialog.locator(
        'button:has([icon="mdi-eye"], [icon="mdi-view-split-vertical"])'
      )
      if (await previewToggle.isVisible()) {
        await previewToggle.click()
      }
    }

    // Check if preview content has correct alignment
    const previewContent = editorDialog.locator('.preview-content')
    if (await previewContent.isVisible()) {
      const textAlign = await previewContent.evaluate((el) => window.getComputedStyle(el).textAlign)
      expect(textAlign).toBe('right')
    }

    // Close editor
    const closeButton = editorDialog.locator('button[icon="mdi-close"], button:has(.mdi-close)')
    await closeButton.click()
  })
})
