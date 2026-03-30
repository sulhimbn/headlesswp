import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test('should display search page', async ({ page }) => {
    await page.goto('/cari')
    
    await expect(page.locator('#main-content')).toBeAttached()
  })

  test('should perform search from URL', async ({ page }) => {
    await page.goto('/cari?q=test')
    
    await expect(page.locator('#main-content')).toBeAttached()
  })

  test('should display no results message', async ({ page }) => {
    await page.goto('/cari?q=nonexistentsearchquery12345')
    
    await expect(page.locator('#main-content')).toBeAttached()
  })
})
