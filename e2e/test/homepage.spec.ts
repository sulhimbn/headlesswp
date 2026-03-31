import { test, expect } from '@playwright/test'

test.describe('Homepage Flow', () => {
  test('should load homepage and display posts', async ({ page }) => {
    await page.goto('/')
    
    await expect(page).toHaveTitle(/Mitra Banten News/i)
    
    const featuredSection = page.locator('section[aria-labelledby="featured"]')
    await expect(featuredSection).toBeVisible()
    
    const latestSection = page.locator('section[aria-labelledby="latest"]')
    await expect(latestSection).toBeVisible()
    
    const postCards = page.locator('[class*="grid"] > a')
    const count = await postCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should display header and footer', async ({ page }) => {
    await page.goto('/')
    
    const header = page.locator('header')
    await expect(header).toBeVisible()
    
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
  })
})