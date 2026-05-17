import { test, expect } from '@playwright/test'

test.describe('Navigation Flow', () => {
  test('should navigate from homepage to article detail', async ({ page }) => {
    await page.goto('/')
    
    const firstPost = page.locator('[class*="grid"] a').first()
    await firstPost.click()
    
    await expect(page).toHaveURL(/\/berita\//)
    
    const article = page.locator('article')
    await expect(article).toBeVisible()
  })

  test('should navigate to categories page', async ({ page }) => {
    await page.goto('/')
    
    const categoryLink = page.locator('a[href^="/kategori/"]').first()
    await categoryLink.click()
    
    await expect(page).toHaveURL(/\/kategori\//)
  })

  test('should navigate to berita listing page', async ({ page }) => {
    await page.goto('/berita')
    
    await expect(page.locator('h1, h2')).toBeVisible()
    
    const posts = page.locator('[class*="grid"] a')
    expect(await posts.count()).toBeGreaterThan(0)
  })

  test('should navigate using header links', async ({ page }) => {
    await page.goto('/')
    
    const header = page.locator('header')
    
    const beritaLink = header.locator('a:has-text("Berita")').first()
    await beritaLink.click()
    await expect(page).toHaveURL(/\/berita/)
  })
})