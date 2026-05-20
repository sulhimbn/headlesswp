import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/berita')
  })

  test('should load the news page successfully', async ({ page }) => {
    await expect(page.locator('#main-content')).toBeAttached()
  })

  test('should display header with site name', async ({ page }) => {
    const siteName = page.locator('header a').first()
    await expect(siteName).toBeAttached()
  })

  test('should display main content area', async ({ page }) => {
    const main = page.locator('#main-content')
    await expect(main).toBeAttached()
  })

  test('should display post grid', async ({ page }) => {
    const grid = page.locator('[class*="grid"]')
    await expect(grid.first()).toBeAttached()
  })

  test('should display footer', async ({ page }) => {
    const footer = page.locator('footer').first()
    await expect(footer).toBeAttached()
  })

  test('should have navigation menu', async ({ page }) => {
    const nav = page.locator('nav').first()
    await expect(nav).toBeAttached()
  })
})
