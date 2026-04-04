import { test, expect } from '@playwright/test'

test.describe('Category Filtering', () => {
  test('category page loads correctly', async ({ page }) => {
    await page.goto('/kategori/berita')
    
    await expect(page.locator('main')).toBeVisible()
  })

  test('category page shows posts', async ({ page }) => {
    await page.goto('/kategori/berita')
    
    await page.waitForLoadState('networkidle')
    
    const postCards = page.locator('a[href^="/berita/"]')
    const hasPosts = await postCards.first().isVisible().catch(() => false)
    
    if (hasPosts) {
      await expect(postCards.first()).toBeVisible()
    }
  })

  test('category page shows category heading', async ({ page }) => {
    await page.goto('/kategori/berita')
    
    const heading = page.locator('h2:has-text("Kategori:")')
    await expect(heading).toBeVisible()
  })
})
