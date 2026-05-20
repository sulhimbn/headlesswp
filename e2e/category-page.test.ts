import { test, expect } from '@playwright/test'

test.describe('Category Page', () => {
  test('should load category page correctly', async ({ page }) => {
    await page.goto('/kategori/berita')
    await expect(page.locator('main')).toBeVisible()
  })

  test('should display category posts', async ({ page }) => {
    await page.goto('/kategori/berita')
    const posts = page.locator('article, a[href^="/berita/"]')
    await expect(posts.first()).toBeVisible()
  })

  test('should have category heading', async ({ page }) => {
    await page.goto('/kategori/berita')
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
  })
})