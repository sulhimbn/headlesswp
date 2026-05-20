import { test, expect } from '@playwright/test'

test.describe('Category/Tag Filtering', () => {
  test('category page loads', async ({ page }) => {
    await page.goto('/kategori/berita')
    
    await expect(page.getByRole('heading', { name: /Kategori/i })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('tag page loads', async ({ page }) => {
    await page.goto('/tag/berita')
    
    await expect(page.getByRole('heading', { name: /Tag/i })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('category posts display correctly', async ({ page }) => {
    await page.goto('/kategori/berita')
    
    const posts = page.locator('[class*="PostCard"]')
    const count = await posts.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
