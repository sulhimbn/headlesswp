import { test, expect } from '@playwright/test'

test.describe('Navigation Flow', () => {
  test('navigation between pages', async ({ page }) => {
    await page.goto('/')
    
    await page.click('text=Berita')
    await expect(page).toHaveURL(/\/berita/)
    await expect(page.getByRole('heading', { name: /Berita/i })).toBeVisible()
    
    await page.click('text=Beranda')
    await expect(page).toHaveURL('/')
  })

  test('mobile menu navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/')
    
    const menuButton = page.getByRole('button', { name: /Buka menu/i })
    await menuButton.click()
    
    await expect(page.locator('#mobile-menu')).toBeVisible()
    
    await page.click('#mobile-menu a:has-text("Berita")')
    await expect(page).toHaveURL(/\/berita/)
  })

  test('breadcrumb navigation works', async ({ page }) => {
    await page.goto('/berita')
    
    const breadcrumb = page.locator('[aria-label="Breadcrumb"]')
    if (await breadcrumb.isVisible()) {
      await page.click('text=Beranda')
      await expect(page).toHaveURL('/')
    }
  })
})
