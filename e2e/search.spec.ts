import { test, expect } from '@playwright/test'

/**
 * E2E-002 flow 2: search functionality (/cari).
 * Fallback-safe: asserts routing + structure, not live results.
 */
test.describe('Search flow', () => {
  test('empty search page renders search prompt', async ({ page }) => {
    await page.goto('/cari')

    await expect(page.locator('#main-content')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('search with keyword navigates and renders results or no-results state', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()

    // Open the header search (desktop or mobile toggle).
    const searchButtons = page.getByRole('button', { name: /pencarian/i })
    if ((await searchButtons.count()) > 0) {
      await searchButtons.first().click()
    }

    const searchBox = page.getByRole('searchbox').first()
    if ((await searchBox.count()) === 0) {
      // No search UI on this viewport: fall back to direct navigation.
      await page.goto('/cari?q=banten')
    } else {
      await searchBox.fill('banten')
      await searchBox.press('Enter')
    }

    await expect(page).toHaveURL(/\/cari\?q=banten/)
    await expect(page.locator('#main-content')).toBeVisible()

    // Either results grid or the no-results empty state must render.
    const articles = page.locator('#main-content article')
    if ((await articles.count()) === 0) {
      await expect(page.locator('#main-content')).toContainText(/tidak ada hasil|masukkan kata kunci/i)
    } else {
      await expect(articles.first()).toBeVisible()
    }
  })
})
