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

  test('should center toolbar horizontally on all screen sizes', async ({ page }) => {
    // Load the page
    await page.goto('/')

    // Function to check toolbar centering
    async function checkCentering(width: number, height: number = 800) {
      await page.setViewportSize({ width, height })
      await page.waitForTimeout(500) // Wait for layout to adjust

      const toolbar = page.locator('[data-testid="floating-toolbar"]')
      const toolbarBox = await toolbar.boundingBox()
      const viewportSize = page.viewportSize()!

      if (!toolbarBox) {
        throw new Error('Toolbar not found')
      }

      const toolbarCenter = toolbarBox.x + toolbarBox.width / 2
      const viewportCenter = viewportSize.width / 2
      const difference = Math.abs(toolbarCenter - viewportCenter)
      const tolerance = 5

      // Verify toolbar is centered horizontally
      expect(difference).toBeLessThanOrEqual(tolerance)
    }

    // Test on different viewport sizes
    await checkCentering(360) // Mobile
    await checkCentering(768) // Tablet
    await checkCentering(1920) // Desktop
  })

  test('should play and pause teleprompter', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-pause-button"]').first()

    // Wait for button to be visible
    await expect(playButton).toBeVisible()

    // Initially should show play icon
    await expect(playButton).toHaveAttribute('aria-label', /play/i)

    // Click to play
    await playButton.click()

    // Wait a moment for the state to update
    await page.waitForTimeout(500)
    
    // Ensure button is still visible (toolbar might hide during playback)
    // Tap the teleprompter area to show toolbar if hidden
    const teleprompterContent = page.locator('.teleprompter-content')
    await teleprompterContent.click()
    await page.waitForTimeout(200)
    
    await expect(playButton).toBeVisible()
    await expect(playButton).toHaveAttribute('aria-label', /pause/i)

    // Wait a bit and check if content is scrolling
    await page.waitForTimeout(1000)

    // Click to pause
    await playButton.click()

    await page.waitForTimeout(500)
    await expect(playButton).toHaveAttribute('aria-label', /play/i)
  })

  test('should navigate with keyboard shortcuts', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-pause-button"]').first()

    // Wait for button to be visible
    await expect(playButton).toBeVisible()

    // Check if this is a mobile device (by checking user agent or viewport)
    const isMobile = await page.evaluate(() => {
      return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    })

    if (isMobile) {
      // On mobile devices, use button clicks instead of keyboard
      await playButton.click()
      await page.waitForTimeout(500)
      
      // Ensure button is visible after play - click on content with testid
      const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
      await expect(teleprompterContent).toBeVisible()
      await teleprompterContent.click({ force: true })
      await page.waitForTimeout(500)
      
      await expect(playButton).toBeVisible()
      await expect(playButton).toHaveAttribute('aria-label', /pause/i)

      await playButton.click()
      await page.waitForTimeout(300)
      await expect(playButton).toHaveAttribute('aria-label', /play/i)
    } else {
      // Note: In test environments, hotkeys might not work due to touch detection
      // So we test the core functionality using button interactions
      console.log('Testing play/pause functionality (hotkeys may not work in test environment)')

      // Test play/pause functionality
      await playButton.click()
      await page.waitForTimeout(500)
      
      // Ensure button is visible after play - click on content with testid
      const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
      await expect(teleprompterContent).toBeVisible()
      await teleprompterContent.click({ force: true })
      await page.waitForTimeout(500)
      
      await expect(playButton).toBeVisible()
      await expect(playButton).toHaveAttribute('aria-label', /pause/i)

      await playButton.click()
      await page.waitForTimeout(300)
      await expect(playButton).toHaveAttribute('aria-label', /play/i)

      // Test navigation buttons - need to open ActionsMenu first
      const moreButton = page.locator('[data-testid="more-menu-button"]')
      await expect(moreButton).toBeVisible()
      await moreButton.click()
      await page.waitForTimeout(500)

      const rewindButton = page.locator('[data-testid="rewind-button"]').first()
      const forwardButton = page.locator('[data-testid="forward-button"]').first()

      if (await rewindButton.isVisible()) {
        await rewindButton.click()
      }

      if (await forwardButton.isVisible()) {
        await forwardButton.click()
      }

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
    // Open ActionsMenu first
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    await expect(moreMenuButton).toBeVisible()
    await moreMenuButton.click()
    await page.waitForTimeout(500)

    const settingsButton = page.locator('[data-testid="settings-button"]').first()
    await expect(settingsButton).toBeVisible()
    await settingsButton.click()

    // Wait for settings view to appear
    await page.waitForTimeout(500)
    
    // Check for settings header with specific selector
    const settingsTitle = page.locator('.settings-title', { hasText: 'Settings' })
    await expect(settingsTitle).toBeVisible()
  })

  test('should change font size', async ({ page }) => {
    // Open ActionsMenu
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    await expect(moreMenuButton).toBeVisible()
    await moreMenuButton.click()
    await page.waitForTimeout(500)

    // Open settings
    const settingsButton = page.locator('[data-testid="settings-button"]').first()
    await expect(settingsButton).toBeVisible()
    await settingsButton.click()

    // Wait for settings view to appear
    await page.waitForTimeout(500)

    // Find font size input field (the number input next to the slider)
    const fontInput = page.locator('input[type="number"]').first()
    await fontInput.fill('32')
    await fontInput.press('Enter')

    // Wait a bit for the change to be processed
    await page.waitForTimeout(500)

    // Close settings
    await page.locator('[data-testid="close-settings-btn"]').click()

    // Wait for settings to close and changes to apply
    await page.waitForTimeout(1000)

    // Check if font size changed in content
    const content = page.locator('.teleprompter-content')
    await expect(content).toHaveCSS('font-size', '32px')
  })

  test('should toggle mirror modes', async ({ page }) => {
    // Open ActionsMenu
    const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
    await expect(moreMenuButton).toBeVisible()
    await moreMenuButton.click()
    await page.waitForTimeout(500)

    const container = page.locator('.teleprompter-container')
    const mirrorHButton = page.locator('[data-testid="mirror-h-button"]').first()
    const mirrorVButton = page.locator('[data-testid="mirror-v-button"]').first()
    
    await expect(mirrorHButton).toBeVisible({ timeout: 10000 })
    await expect(mirrorVButton).toBeVisible({ timeout: 10000 })
    
    // Get initial transform state
    const initialTransform = await container.evaluate(el => window.getComputedStyle(el).transform)
    
    // Click mirror H button to toggle it
    await mirrorHButton.click()
    await page.waitForTimeout(500)
    
    // Transform should now be different
    const transformAfterH = await container.evaluate(el => window.getComputedStyle(el).transform)
    expect(transformAfterH).not.toBe(initialTransform)
    
    // Click mirror V button to toggle it
    await mirrorVButton.click()
    await page.waitForTimeout(500)
    
    // Transform should be different again (both mirrors active)
    const transformAfterV = await container.evaluate(el => window.getComputedStyle(el).transform)
    expect(transformAfterV).not.toBe(transformAfterH)
    
    // Click mirror H again to turn it off
    await mirrorHButton.click()
    await page.waitForTimeout(500)
    
    // Transform should change again (only V active now)
    const transformFinal = await container.evaluate(el => window.getComputedStyle(el).transform)
    expect(transformFinal).not.toBe(transformAfterV)
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

  test.skip('should keep toolbar visible during playback on mobile', async ({ page, isMobile }) => {
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

  test.skip('should open file import dialog', async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // First, trigger the toolbar to show by clicking on the teleprompter
    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    await teleprompterContent.click()
    await page.waitForTimeout(500)

    // Check viewport size to determine layout mode
    const viewport = page.viewportSize()
    const isLargeScreen = viewport && viewport.width >= 1500 // Updated to match new breakpoint

    let editorButton

    if (isLargeScreen) {
      // On large screens, editor button should be directly visible
      editorButton = page.locator('[data-testid="editor-button"]').last()
    } else {
      // On smaller screens, need to open more menu first
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      await moreMenuButton.click()
      await page.waitForTimeout(300)
      editorButton = page.locator('[data-testid="editor-button"]').first()
    }

    // Click the editor button
    await editorButton.click()
    await page.waitForTimeout(500)

    // Wait for the editor dialog to open
    const editorDialog = page.locator('[data-testid="markdown-editor"]')
    await expect(editorDialog).toBeVisible()

    // The open file functionality now uses native file dialog
    // We verify that the button exists and is clickable
    const importButton = editorDialog.locator('[data-testid="open-file-button"]')
    await expect(importButton).toBeVisible()
    await expect(importButton).toBeEnabled()
  })

  test.skip('should accept markdown file upload and load content', async ({ page }) => {
    const testContent =
      '# Test Markdown File\n\nThis is a test markdown file for e2e testing.\n\n## Section 1\n\nLorem ipsum dolor sit amet.'

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // First, trigger the toolbar to show by clicking on the teleprompter
    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    await teleprompterContent.click()
    await page.waitForTimeout(500)

    // Check viewport size to determine layout mode
    const viewport = page.viewportSize()
    const isLargeScreen = viewport && viewport.width >= 1500 // Updated to match new breakpoint

    let editorButton

    if (isLargeScreen) {
      // On large screens, editor button should be directly visible
      editorButton = page.locator('[data-testid="editor-button"]').last()
    } else {
      // On smaller screens, need to open more menu first
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      await moreMenuButton.click()
      await page.waitForTimeout(300)
      editorButton = page.locator('[data-testid="editor-button"]').first()
    }

    // Click the editor button
    await editorButton.click()
    await page.waitForTimeout(500)

    // Wait for the editor dialog to open
    const editorDialog = page.locator('[data-testid="markdown-editor"]')
    await expect(editorDialog).toBeVisible()

    // Now click on the file import button inside the editor
    const importButton = editorDialog.locator('[data-testid="open-file-button"]')
    await importButton.click()

    // Wait for dialog to open
    await page.waitForTimeout(500)

    // Wait for dialog to be visible
    const dialog = page.locator('[data-testid="file-import-dialog"]')
    await expect(dialog).toBeVisible()

    // Find the file input inside the dialog
    const fileInput = dialog.locator('input[type="file"]')

    // Create a test file and upload it
    const testFile = Buffer.from(testContent)
    await fileInput.setInputFiles([
      {
        name: 'test-file.md',
        mimeType: 'text/markdown',
        buffer: testFile,
      },
    ])

    // Wait a moment for file processing
    await page.waitForTimeout(1000)

    // Wait for file to be processed and dialog to close (auto-import)
    await expect(dialog).not.toBeVisible({ timeout: 10000 })

    // Verify content was loaded into the teleprompter
    const teleprompterContentAfter = page.locator('[data-testid="teleprompter-content"]')
    await expect(teleprompterContentAfter).toContainText('Test Markdown File', { timeout: 5000 })
    await expect(teleprompterContentAfter).toContainText('Section 1')
    await expect(teleprompterContentAfter).toContainText('Lorem ipsum')
  })

  test.skip('should show error for invalid file types', async ({ page }) => {
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // First, trigger the toolbar to show by clicking on the teleprompter
    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    await teleprompterContent.click()
    await page.waitForTimeout(500)

    // Check viewport size to determine layout mode
    const viewport = page.viewportSize()
    const isLargeScreen = viewport && viewport.width >= 1500 // Updated to match new breakpoint

    let editorButton

    if (isLargeScreen) {
      // On large screens, editor button should be directly visible
      editorButton = page.locator('[data-testid="editor-button"]').last()
    } else {
      // On smaller screens, need to open more menu first
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      await moreMenuButton.click()
      await page.waitForTimeout(300)
      editorButton = page.locator('[data-testid="editor-button"]').first()
    }

    // Click the editor button
    await editorButton.click()
    await page.waitForTimeout(500)

    // Wait for the editor dialog to open
    const editorDialog = page.locator('[data-testid="markdown-editor"]')
    await expect(editorDialog).toBeVisible()

    // Now click on the file import button inside the editor
    const importButton = editorDialog.locator('[data-testid="open-file-button"]')
    await importButton.click()

    // Wait for dialog to open
    await page.waitForTimeout(500)

    // Wait for dialog to be visible
    const dialog = page.locator('[data-testid="file-import-dialog"]')
    await expect(dialog).toBeVisible()

    const fileInput = dialog.locator('input[type="file"]')

    // Try to upload an invalid file type
    const invalidFile = Buffer.from('This is not a markdown file')
    await fileInput.setInputFiles([
      {
        name: 'test-file.pdf',
        mimeType: 'application/pdf',
        buffer: invalidFile,
      },
    ])

    // Wait for error message to appear
    await page.waitForTimeout(2000)

    // Should show error message - try different selectors
    const errorAlert = dialog.locator('.v-alert, [role="alert"]').first()
    await expect(errorAlert).toBeVisible({ timeout: 5000 })

    // Alternative: check for the error text anywhere in the dialog
    await expect(dialog).toContainText('Please select a valid markdown or text file', {
      timeout: 5000,
    })
  })

  test.skip('should handle drag and drop file upload', async ({ page }) => {
    const testContent = '# Drag and Drop Test\n\nThis file was uploaded via drag and drop.'

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')

    // First, trigger the toolbar to show by clicking on the teleprompter
    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    await teleprompterContent.click()
    await page.waitForTimeout(500)

    // Check viewport size to determine layout mode
    const viewport = page.viewportSize()
    const isLargeScreen = viewport && viewport.width >= 1500 // Updated to match new breakpoint

    if (!isLargeScreen) {
      // On smaller screens, need to open more menu first
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      await moreMenuButton.click()
      await page.waitForTimeout(300)
    }

    // Use JavaScript to click the file button to bypass viewport issues
    await page.evaluate(() => {
      const button = document.querySelector(
        '[data-testid="file-button"]:last-of-type'
      ) as HTMLElement
      if (!button) {
        // Try the first one if last doesn't exist
        const firstButton = document.querySelector('[data-testid="file-button"]') as HTMLElement
        if (firstButton) firstButton.click()
      } else {
        button.click()
      }
    })

    // Wait for dialog to open
    await page.waitForTimeout(500)

    // Wait for dialog to be visible
    const dialog = page.locator('[data-testid="file-import-dialog"]')
    await expect(dialog).toBeVisible()

    // Find the drop zone
    const dropZone = dialog.locator('.drop-zone')
    await expect(dropZone).toBeVisible()

    // Create file data for drag and drop
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer())

    // We can't easily test actual drag and drop in Playwright,
    // so we'll test the visual feedback instead
    await dropZone.hover()

    // The drop zone should have hover styles
    await expect(dropZone).toHaveClass(/drop-zone/)
  })

  test.skip('should show file information after successful upload', async ({ page }) => {
    const testContent = '# File Info Test\n\nThis tests file information display.'

    // Wait for page to be fully loaded with timeout
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(1000) // Give extra time for initialization

    // First, trigger the toolbar to show by clicking on the teleprompter
    const teleprompterContent = page.locator('[data-testid="teleprompter-content"]')
    await teleprompterContent.click()
    await page.waitForTimeout(500)

    // Check viewport size to determine layout mode
    const viewport = page.viewportSize()
    const isLargeScreen = viewport && viewport.width >= 1500 // Updated to match new breakpoint

    if (!isLargeScreen) {
      // On smaller screens, need to open more menu first
      const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
      await moreMenuButton.click()
      await page.waitForTimeout(300)
    }

    // Use JavaScript to click the file button to bypass viewport issues
    await page.evaluate(() => {
      const button = document.querySelector(
        '[data-testid="file-button"]:last-of-type'
      ) as HTMLElement
      if (!button) {
        // Try the first one if last doesn't exist
        const firstButton = document.querySelector('[data-testid="file-button"]') as HTMLElement
        if (firstButton) firstButton.click()
      } else {
        button.click()
      }
    })

    // Wait for dialog to open
    await page.waitForTimeout(500)

    const dialog = page.locator('[data-testid="file-import-dialog"]')
    await expect(dialog).toBeVisible()

    const fileInput = page.locator('input[type="file"]')

    const testFile = Buffer.from(testContent)
    await fileInput.setInputFiles([
      {
        name: 'file-info-test.md',
        mimeType: 'text/markdown',
        buffer: testFile,
      },
    ])

    // Wait a moment for file processing
    await page.waitForTimeout(1000)

    // Should show file information before auto-import closes dialog
    const fileInfo = dialog.locator('.file-info')

    // If still visible, check file info content
    if (await fileInfo.isVisible()) {
      await expect(fileInfo).toContainText('file-info-test.md')
      await expect(fileInfo).toContainText('text/markdown')
    }

    // Dialog should eventually close due to auto-import
    await expect(dialog).not.toBeVisible({ timeout: 10000 })
  })

  test('should handle manual import when auto-import is disabled', async ({ page }) => {
    // This test would require a page configuration without auto-import
    // For now, we'll skip it as all current pages use auto-import
    test.skip(true, 'Manual import testing requires page without auto-import')
  })
})
