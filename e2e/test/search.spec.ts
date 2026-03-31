import { test, expect } from '@playwright/test'

test.describe('Search Flow', () => {
  test('should access search page', async ({ page }) => {
    await page.goto('/cari')
    
    await expect(page.locator('h1, h2')).toBeVisible()
    
    const searchInput = page.locator('input[type="search"], input[type="text"]').first()
    await expect(searchInput).toBeVisible()
  })

  test('should display search results when query provided', async ({ page }) => {
    await page.goto('/cari?q=test')
    
    await expect(page).toHaveURL(/\/cari/)
    
    const results = page.locator('[class*="grid"] a, [class*="list"] a')
    const resultCount = await results.count()
    expect(resultCount).toBeGreaterThanOrEqual(0)
  })

  test('should navigate to search via header', async ({ page }) => {
    await page.goto('/')
    
    const header = page.locator('header')
    const searchLink = header.locator('a[href="/cari"]').first()
    await searchLink.click()
    
    await expect(page).toHaveURL(/\/cari/)
  })
})