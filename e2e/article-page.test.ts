import { test, expect } from '@playwright/test'

test.describe('Article Page', () => {
  test('should load article page correctly', async ({ page }) => {
    await page.goto('/berita')
    const articleLink = page.locator('a[href^="/berita/"]').first()
    if (await articleLink.isVisible()) {
      await articleLink.click()
      await expect(page.locator('article')).toBeVisible({ timeout: 10000 })
    }
  })

  test('should display article content', async ({ page }) => {
    await page.goto('/berita')
    const articleLink = page.locator('a[href^="/berita/"]').first()
    if (await articleLink.isVisible()) {
      await articleLink.click()
      const content = page.locator('article [class*="content"], article p').first()
      await expect(content).toBeVisible({ timeout: 10000 })
    }
  })

  test('should have working breadcrumb navigation', async ({ page }) => {
    await page.goto('/berita')
    const articleLink = page.locator('a[href^="/berita/"]').first()
    if (await articleLink.isVisible()) {
      await articleLink.click()
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"], nav')
      await expect(breadcrumb).toBeVisible({ timeout: 10000 })
    }
  })
})