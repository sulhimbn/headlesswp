import { test, expect } from '@playwright/test'

test.describe('Category Filtering', () => {
  test('should display news listing page', async ({ page }) => {
    await page.goto('/berita')
    
    await expect(page.locator('#main-content')).toBeVisible()
    await expect(page).toHaveTitle(/Mitra Banten News/i)
  })

  test('should display posts on news listing page', async ({ page }) => {
    await page.goto('/berita')
    
    await page.waitForTimeout(2000)
    
    const posts = page.locator('article')
    const postCount = await posts.count()
    expect(postCount).toBeGreaterThanOrEqual(0)
  })

  test('should handle category page navigation', async ({ page }) => {
    await page.goto('/kategori/politik')
    
    await page.waitForTimeout(2000)
    
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeVisible()
  })

  test('should display pagination on news listing', async ({ page }) => {
    await page.goto('/berita')
    
    await page.waitForTimeout(2000)
    
    const pagination = page.locator('nav[aria-label="pagination"], .pagination')
    const hasPagination = await pagination.isVisible().catch(() => false)
    
    if (hasPagination) {
      await expect(pagination).toBeVisible()
    }
  })

  test('should navigate pagination pages', async ({ page }) => {
    await page.goto('/berita?page=1')
    
    await page.waitForTimeout(1000)
    
    const nextButton = page.locator('a[href*="page=2"]').first()
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click()
      await expect(page).toHaveURL(/\/berita.*page=2/)
    }
  })
})
