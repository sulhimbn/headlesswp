import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should have header with navigation links', async ({ page }) => {
    await page.goto('/')
    const header = page.locator('header')
    await expect(header).toBeVisible()
  })

  test('should navigate to category page', async ({ page }) => {
    await page.goto('/')
    const categoryLink = page.locator('a[href^="/kategori/"]').first()
    if (await categoryLink.isVisible()) {
      await categoryLink.click()
      await expect(page).toHaveURL(/\/kategori\/.+/)
    }
  })

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/')
    const searchLink = page.locator('a[href="/cari"]').first()
    if (await searchLink.isVisible()) {
      await searchLink.click()
      await expect(page).toHaveURL('/cari')
      await expect(page.locator('main')).toBeVisible()
    }
  })

  test('should navigate to berita page', async ({ page }) => {
    await page.goto('/berita')
    await expect(page.locator('main')).toBeVisible()
  })
})