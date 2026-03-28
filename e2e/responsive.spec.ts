import { test, expect } from '@playwright/test'

test.describe('Responsive Design', () => {
  test('homepage works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    
    const menuButton = page.getByRole('button', { name: /Buka menu/i })
    await expect(menuButton).toBeVisible()
  })

  test('homepage works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await page.goto('/')
    
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('homepage works on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    await page.goto('/')
    
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('article page responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/berita')
    
    const firstPost = page.locator('[class*="PostCard"] a').first()
    const href = await firstPost.getAttribute('href')
    
    if (href) {
      await firstPost.click()
      await expect(page.getByRole('banner')).toBeVisible()
    }
  })
})
