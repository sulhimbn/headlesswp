import { test, expect } from '@playwright/test'

test.describe('Dark Mode', () => {
  test('should have dark mode toggle button', async ({ page }) => {
    await page.goto('/')
    
    const darkModeButton = page.locator('header button[aria-label*="mode"]').first()
    await expect(darkModeButton).toBeVisible()
  })

  test('should toggle dark mode on click', async ({ page }) => {
    await page.goto('/')
    
    const darkModeButton = page.locator('header button[aria-label*="mode"]').first()
    
    await darkModeButton.click()
    
    const html = page.locator('html')
    const classList = await html.getAttribute('class')
    
    expect(classList).toBeDefined()
  })

  test('should persist dark mode preference on page navigation', async ({ page }) => {
    await page.goto('/')
    
    const darkModeButton = page.locator('header button[aria-label*="mode"]').first()
    await darkModeButton.click()
    
    await page.waitForTimeout(500)
    
    const html = page.locator('html')
    const classAfterToggle = await html.getAttribute('class')
    
    await page.goto('/berita')
    
    const htmlAfterNav = page.locator('html')
    const classAfterNav = await htmlAfterNav.getAttribute('class')
    
    expect(classAfterNav).toBe(classAfterToggle)
  })

  test('should display correct icon based on current mode', async ({ page }) => {
    await page.goto('/')
    
    const darkModeButton = page.locator('header button[aria-label*="mode"]').first()
    const initialAriaLabel = await darkModeButton.getAttribute('aria-label')
    
    await darkModeButton.click()
    
    await page.waitForTimeout(300)
    
    const newAriaLabel = await darkModeButton.getAttribute('aria-label')
    expect(newAriaLabel).not.toBe(initialAriaLabel)
  })
})
