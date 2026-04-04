import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/')
    
    await expect(page).toHaveTitle(/Mitra Banten News/i)
    await expect(page.locator('main')).toBeVisible()
  })

  test('featured posts section is visible', async ({ page }) => {
    await page.goto('/')
    
    const featuredHeading = page.locator('#featured')
    await expect(featuredHeading).toBeVisible()
  })

  test('latest posts section is visible', async ({ page }) => {
    await page.goto('/')
    
    const latestHeading = page.locator('#latest')
    await expect(latestHeading).toBeVisible()
  })
})
