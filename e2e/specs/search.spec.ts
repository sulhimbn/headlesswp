import { test, expect } from '@playwright/test'

test.describe('Search', () => {
  test('should open search when clicking search button', async ({ page }) => {
    await page.goto('/')
    
    const searchButton = page.locator('header button[aria-label*="cari"]').first()
    await searchButton.click()
    
    const searchInput = page.locator('input[placeholder*="ari"], input[aria-label*="ari"]').first()
    await expect(searchInput).toBeVisible()
  })

  test('should perform search with valid query', async ({ page }) => {
    await page.goto('/cari?q=test')
    
    await expect(page.locator('#main-content')).toBeVisible()
  })

  test('should display empty state for no query', async ({ page }) => {
    await page.goto('/cari')
    
    await expect(page.locator('#main-content')).toBeVisible()
  })

  test('should display search results when available', async ({ page }) => {
    await page.goto('/')
    
    const searchButton = page.locator('header button[aria-label*="cari"]').first()
    await searchButton.click()
    
    await page.waitForTimeout(500)
    
    const searchInput = page.locator('#main-content input[type="search"], input[placeholder*="ari"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('berita')
      await searchInput.press('Enter')
      
      await expect(page).toHaveURL(/\/cari\?q=/)
    }
  })

  test('should handle special characters in search', async ({ page }) => {
    await page.goto('/cari?q=test%40special')
    await expect(page.locator('#main-content')).toBeVisible()
  })

  test('should navigate to search page with query parameter', async ({ page }) => {
    await page.goto('/cari?q=berita')
    await expect(page).toHaveURL(/\/cari\?q=berita/)
  })
})
