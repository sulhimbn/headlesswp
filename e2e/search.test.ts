import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test('should load search page correctly', async ({ page }) => {
    await page.goto('/cari')
    await expect(page.locator('main')).toBeVisible()
  })

  test('should have search input on search page', async ({ page }) => {
    await page.goto('/cari')
    const searchInput = page.locator('input[type="search"], input[name="q"], input[name="s"]')
    await expect(searchInput).toBeVisible()
  })

  test('should display search results when query is provided', async ({ page }) => {
    await page.goto('/cari?q=test')
    const resultsContainer = page.locator('main')
    await expect(resultsContainer).toBeVisible()
  })
})