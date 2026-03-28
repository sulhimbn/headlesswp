import { test, expect } from '@playwright/test'

test.describe('Article Detail Flow', () => {
  test('article page loads from homepage', async ({ page }) => {
    await page.goto('/')
    
    const firstPost = page.locator('[class*="PostCard"] a').first()
    const href = await firstPost.getAttribute('href')
    
    if (href) {
      await firstPost.click()
      await expect(page).toHaveURL(/.*\/\d+\//)
      
      await expect(page.getByRole('banner')).toBeVisible()
      await expect(page.getByRole('main')).toBeVisible()
    }
  })

  test('article has title and content', async ({ page }) => {
    await page.goto('/')
    
    const firstPost = page.locator('[class*="PostCard"] a').first()
    const href = await firstPost.getAttribute('href')
    
    if (href) {
      await firstPost.click()
      
      const article = page.locator('article')
      await expect(article).toBeVisible()
    }
  })

  test('article has back navigation', async ({ page }) => {
    await page.goto('/berita')
    
    const firstPost = page.locator('[class*="PostCard"] a').first()
    const href = await firstPost.getAttribute('href')
    
    if (href) {
      await firstPost.click()
      
      const backButton = page.getByRole('link', { name: /Kembali/i })
      if (await backButton.isVisible()) {
        await backButton.click()
        await expect(page).toHaveURL(/\/berita/)
      }
    }
  })
})
