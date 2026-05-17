import { test, expect } from '@playwright/test'

test.describe('Article Detail Flow', () => {
  test('should load article detail page', async ({ page }) => {
    await page.goto('/berita')
    
    const firstPost = page.locator('[class*="grid"] a').first()
    const href = await firstPost.getAttribute('href')
    
    await firstPost.click()
    
    await expect(page).toHaveURL(new RegExp(href || ''))
    
    const article = page.locator('article')
    await expect(article).toBeVisible()
  })

  test('should display article title and content', async ({ page }) => {
    await page.goto('/berita')
    
    await page.locator('[class*="grid"] a').first().click()
    
    const heading = page.locator('h1[id="article-heading"]')
    await expect(heading).toBeVisible()
    
    const content = page.locator('article [class*="prose"]')
    await expect(content).toBeVisible()
  })

  test('should display article metadata', async ({ page }) => {
    await page.goto('/berita')
    
    await page.locator('[class*="grid"] a').first().click()
    
    const metaInfo = page.locator('[class*="meta"], time')
    expect(await metaInfo.count()).toBeGreaterThan(0)
  })

  test('should display related posts', async ({ page }) => {
    await page.goto('/berita')
    
    await page.locator('[class*="grid"] a').first().click()
    
    const relatedSection = page.locator('section[aria-labelledby="related-heading"]')
    await expect(relatedSection).toBeVisible()
  })

  test('should navigate back to home from article', async ({ page }) => {
    await page.goto('/berita')
    
    await page.locator('[class*="grid"] a').first().click()
    
    const backLink = page.locator('a:has-text("Kembali")')
    await expect(backLink).toBeVisible()
  })
})