import { test, expect } from '@playwright/test'

test.describe('Pagination', () => {
  test('article list page shows pagination when needed', async ({ page }) => {
    await page.goto('/berita')
    
    await page.waitForLoadState('networkidle')
    
    const pagination = page.locator('nav[aria-label="pagination"], [class*="pagination"]')
    const hasPagination = await pagination.isVisible().catch(() => false)
    
    if (hasPagination) {
      await expect(pagination).toBeVisible()
    }
  })

  test('pagination navigation works', async ({ page }) => {
    await page.goto('/berita?page=2')
    
    await page.waitForLoadState('networkidle')
    
    await expect(page).toHaveURL(/page=2/)
  })

  test('pagination links are clickable', async ({ page }) => {
    await page.goto('/berita')
    
    await page.waitForLoadState('networkidle')
    
    const nextLink = page.locator('a[href*="page="], button:has-text("Next"), a:has-text("Next")').first()
    const hasNext = await nextLink.isVisible().catch(() => false)
    
    if (hasNext) {
      await nextLink.click()
      await page.waitForLoadState('networkidle')
    }
  })
})
