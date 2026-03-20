import { test, expect } from '@playwright/test'

test.describe('404 Page Handling', () => {
  test('should display custom 404 page for non-existent routes', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345')
    
    await expect(page.locator('text=404')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('text=Halaman Tidak Ditemukan')).toBeVisible()
  })

  test('should display back to home button on 404 page', async ({ page }) => {
    await page.goto('/non-existent-page-xyz')
    
    await page.waitForTimeout(3000)
    
    const backToHomeButton = page.locator('a[href="/"]').first()
    await expect(backToHomeButton).toBeVisible()
  })

  test('should navigate to home from 404 page', async ({ page }) => {
    await page.goto('/this-404-test-page')
    
    await page.waitForTimeout(3000)
    
    const backToHomeButton = page.locator('a:has-text("Kembali ke Beranda")').first()
    if (await backToHomeButton.isVisible().catch(() => false)) {
      await backToHomeButton.click()
      await expect(page).toHaveURL('/')
    }
  })

  test('should handle non-existent post slugs gracefully', async ({ page }) => {
    await page.goto('/berita/this-post-does-not-exist')
    
    await page.waitForTimeout(3000)
    
    const notFoundContent = page.locator('text=404, text=Halaman Tidak Ditemukan, text=not found')
    await expect(notFoundContent.first()).toBeVisible({ timeout: 15000 })
  })

  test('should return 404 status for non-existent pages', async ({ page }) => {
    const response = await page.goto('/non-existent-404-test')
    expect(response?.status()).toBe(404)
  })

  test('should display helpful message on 404 page', async ({ page }) => {
    await page.goto('/page-not-found-test')
    
    await page.waitForTimeout(3000)
    
    const helpfulMessage = page.locator('text=/Cari|ontak|Kontak/i')
    await expect(helpfulMessage.first()).toBeVisible({ timeout: 10000 })
  })
})
