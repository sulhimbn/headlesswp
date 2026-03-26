import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load the homepage correctly', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Mitra Banten News|Banten News/i)
    await expect(page.locator('main')).toBeVisible()
  })

  test('should display featured posts section', async ({ page }) => {
    await page.goto('/')
    const featuredSection = page.locator('section').first()
    await expect(featuredSection).toBeVisible()
  })

  test('should display latest posts section', async ({ page }) => {
    await page.goto('/')
    const latestSection = page.locator('section').nth(1)
    await expect(latestSection).toBeVisible()
  })

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toBeVisible()
  })
})