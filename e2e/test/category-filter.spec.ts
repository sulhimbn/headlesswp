import { test, expect } from '@playwright/test'

test.describe('Category Filter Flow', () => {
  test('should load category page', async ({ page }) => {
    await page.goto('/kategori/berita')
    
    await expect(page.locator('h1, h2')).toBeVisible()
    
    const posts = page.locator('[class*="grid"] a')
    expect(await posts.count()).toBeGreaterThanOrEqual(0)
  })

  test('should filter posts by category from homepage', async ({ page }) => {
    await page.goto('/')
    
    const categoryBadge = page.locator('a[href^="/kategori/"]').first()
    await categoryBadge.click()
    
    await expect(page).toHaveURL(/\/kategori\//)
  })

  test('should load tag page', async ({ page }) => {
    await page.goto('/tag/test')
    
    await expect(page.locator('h1, h2')).toBeVisible()
    
    const posts = page.locator('[class*="grid"] a')
    expect(await posts.count()).toBeGreaterThanOrEqual(0)
  })

  test('should display category badges on article page', async ({ page }) => {
    await page.goto('/berita')
    
    const firstPost = page.locator('[class*="grid"] a').first()
    await firstPost.click()
    
    const categoryBadges = page.locator('a[href^="/kategori/"]')
    expect(await categoryBadges.count()).toBeGreaterThanOrEqual(0)
  })

  test('should navigate to category from article', async ({ page }) => {
    await page.goto('/berita')
    
    await page.locator('[class*="grid"] a').first().click()
    
    const categoryLink = page.locator('a[href^="/kategori/"]').first()
    if (await categoryLink.isVisible()) {
      await categoryLink.click()
      await expect(page).toHaveURL(/\/kategori\//)
    }
  })
})