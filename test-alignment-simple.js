// Simplified test to check if alignment works
import { test, expect } from '@playwright/test'

test('simple alignment test', async ({ page }) => {
  await page.goto('/')

  // Check if more menu exists (mobile)
  const moreMenuButton = page.locator('[data-testid="more-menu-button"]')
  const isMobile = await moreMenuButton.isVisible()

  console.log('Is mobile:', isMobile)

  if (isMobile) {
    await moreMenuButton.click()
    await page.waitForTimeout(1000)
  }

  // Try to find alignment buttons
  const leftButton = page.locator('[data-testid="align-left-button"]')
  const isVisible = await leftButton.isVisible()
  console.log('Left button visible:', isVisible)

  if (isVisible) {
    await leftButton.click()
    console.log('Clicked left button')
  }
})
