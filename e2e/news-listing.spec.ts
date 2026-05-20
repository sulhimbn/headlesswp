import { test, expect } from '@playwright/test'

test.describe('News Listing Page', () => {
  test('should load the news listing page correctly', async ({ page }) => {
    await page.goto('/berita')

    await expect(page).toHaveTitle(/Semua Berita/)
    await expect(page.locator('h2:has-text("Semua Berita")')).toBeVisible()
    await expect(page.locator('main')).toBeVisible()
  })

  test('should display news posts', async ({ page }) => {
    await page.goto('/berita')

    await expect(page.locator('text=Kumpulan berita terkini dari Mitra Banten News')).toBeVisible()
  })

  test('should handle pagination', async ({ page }) => {
    await page.goto('/berita?page=1')

    const pagination = page.locator('[aria-label="Navigasi halaman"]')
    await expect(pagination).toBeVisible()
  })

  test('should navigate to post detail from listing', async ({ page }) => {
    await page.goto('/berita')

    const firstPost = page.locator('article').first()
    if (await firstPost.isVisible()) {
      const postLink = firstPost.locator('a').first()
      await postLink.click()
      
      await expect(page).toHaveURL(/\/berita\//)
    }
  })
})
