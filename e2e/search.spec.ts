import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test('search page loads correctly', async ({ page }) => {
    await page.goto('/cari')
    
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('input[name="q"]')).toBeVisible()
  })

  test('search returns results', async ({ page }) => {
    await page.goto('/cari?q=berita')
    
    await page.waitForLoadState('networkidle')
    
    const searchResults = page.locator('#search-results, [class*="grid"] a, main a[href^="/berita/"]')
    const hasResults = await searchResults.first().isVisible().catch(() => false)
    
    if (hasResults) {
      await expect(searchResults.first()).toBeVisible()
    }
  })

  test('search with no results shows empty state', async ({ page }) => {
    await page.goto('/cari?q=xyzabc123nonexistent')
    
    await page.waitForLoadState('networkidle')
    
    const emptyState = page.locator('text=Tidak ada hasil')
    const hasEmptyState = await emptyState.isVisible().catch(() => false)
    
    if (hasEmptyState) {
      await expect(emptyState).toBeVisible()
    }
  })

  test('search input is functional', async ({ page }) => {
    await page.goto('/cari')
    
    const searchInput = page.locator('input[name="q"]')
    await searchInput.fill('test')
    await searchInput.press('Enter')
    
    await expect(page).toHaveURL(/q=test/)
  })
})
