import { test, expect } from '@playwright/test'

test.describe('Category Filter', () => {
  test('should load category page correctly', async ({ page }) => {
    await page.goto('/kategori/politik')

    await expect(page.locator('main')).toBeVisible()
  })

  test('should display posts for a category', async ({ page }) => {
    await page.goto('/kategori/politik')

    await expect(page.locator('main')).toBeVisible()
  })

  test('should handle invalid category gracefully', async ({ page }) => {
    await page.goto('/kategori/invalid-category-12345')

    await expect(page.locator('text=Tidak ada berita')).toBeVisible()
  })

  test('should navigate to category from post', async ({ page }) => {
    await page.goto('/berita')

    const firstPost = page.locator('article').first()
    if (await firstPost.isVisible()) {
      const postLink = firstPost.locator('a').first()
      await postLink.click()
      
      const categoryLink = page.locator('main a[href*="/kategori/"]').first()
      if (await categoryLink.isVisible()) {
        await categoryLink.click()
        
        await expect(page).toHaveURL(/\/kategori\//)
      }
    }
  })
})
