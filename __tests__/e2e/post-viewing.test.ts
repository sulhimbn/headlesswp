import { test, expect } from '@playwright/test'

test.describe('Post Viewing', () => {
  test('should navigate to post detail page from news page', async ({ page }) => {
    await page.goto('/berita')
    
    const firstPost = page.locator('[class*="grid"] a[href^="/berita/"]').first()
    if (await firstPost.count() > 0) {
      await firstPost.click()
      await expect(page).toHaveURL(/\/berita\/.+/)
      await expect(page.locator('#article-content')).toBeAttached()
    }
  })

  test('should display post title on detail page', async ({ page }) => {
    await page.goto('/berita/fallback-cat-1')
    
    const title = page.locator('h1').first()
    await expect(title).toBeAttached()
  })

  test('should display 404 for non-existent post', async ({ page }) => {
    await page.goto('/berita/non-existent-post-12345')
    
    const notFound = page.locator('h2:has-text("Tidak Ditemukan")').first()
    await expect(notFound).toBeAttached()
  })
})
