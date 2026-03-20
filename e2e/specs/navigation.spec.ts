import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate from homepage to news page', async ({ page }) => {
    await page.goto('/')
    
    const newsLink = page.locator('header nav a:has-text("Berita")')
    await newsLink.click()
    
    await expect(page).toHaveURL(/\/berita/)
    await expect(page.locator('#main-content')).toBeVisible()
  })

  test('should navigate from homepage to post detail page', async ({ page }) => {
    await page.goto('/')
    
    const firstPost = page.locator('article a[href^="/berita/"]').first()
    const href = await firstPost.getAttribute('href')
    
    if (href) {
      await firstPost.click()
      await expect(page).toHaveURL(new RegExp(href))
      await expect(page.locator('article')).toBeVisible()
    }
  })

  test('should display breadcrumb navigation on post detail', async ({ page }) => {
    await page.goto('/')
    
    const firstPost = page.locator('article a[href^="/berita/"]').first()
    const href = await firstPost.getAttribute('href')
    
    if (href) {
      await firstPost.click()
      
      const breadcrumb = page.locator('nav[aria-label="breadcrumb"], .breadcrumb, nav a[href="/"]')
      await expect(breadcrumb.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should navigate back to homepage from post', async ({ page }) => {
    await page.goto('/berita')
    
    const firstPost = page.locator('article a[href^="/berita/"]').first()
    const href = await firstPost.getAttribute('href')
    
    if (href) {
      await firstPost.click()
      
      const homeLink = page.locator('a[href="/"]').first()
      await homeLink.click()
      
      await expect(page).toHaveURL('/')
    }
  })

  test('should maintain URL state when navigating', async ({ page }) => {
    await page.goto('/berita?page=2')
    
    await expect(page).toHaveURL(/\/berita.*page=2/)
  })
})
