import { test, expect } from '@playwright/test'

test.describe('Post Detail Page', () => {
  test('should load post detail page correctly', async ({ page }) => {
    await page.goto('/berita')

    const firstPost = page.locator('article').first()
    if (await firstPost.isVisible()) {
      const postLink = firstPost.locator('a').first()
      await postLink.click()
      
      await expect(page).toHaveURL(/\/berita\/[^/]+/)
      await expect(page.locator('article')).toBeVisible()
    }
  })

  test('should display post content', async ({ page }) => {
    await page.goto('/berita')

    const firstPost = page.locator('article').first()
    if (await firstPost.isVisible()) {
      const postLink = firstPost.locator('a').first()
      await postLink.click()
      
      const article = page.locator('article')
      await expect(article).toBeVisible()
    }
  })

  test('should have back to home link', async ({ page }) => {
    await page.goto('/berita')

    const firstPost = page.locator('article').first()
    if (await firstPost.isVisible()) {
      const postLink = firstPost.locator('a').first()
      await postLink.click()
      
      const backLink = page.locator('text=Kembali ke Beranda')
      await expect(backLink).toBeVisible()
    }
  })
})
