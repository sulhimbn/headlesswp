import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load the homepage correctly', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Mitra Banten News/)
    
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('text=Mitra Banten News').first()).toBeVisible()
    
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('#main-content')).toBeVisible()
  })

  test('should display featured posts section', async ({ page }) => {
    await page.goto('/')
    
    const featuredHeading = page.locator('text=Berita Utama')
    await expect(featuredHeading).toBeVisible()
  })

  test('should display latest posts section', async ({ page }) => {
    await page.goto('/')
    
    const latestHeading = page.locator('text=Berita Terkini')
    await expect(latestHeading).toBeVisible()
  })

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/')
    
    const newsLink = page.locator('nav >> text=Berita')
    await expect(newsLink).toBeVisible()
    await newsLink.click()
    
    await expect(page).toHaveURL(/berita/)
    await expect(page.locator('h2:has-text("Semua Berita")')).toBeVisible()
  })

  test('should have site logo linking to homepage', async ({ page }) => {
    await page.goto('/berita')
    
    const logo = page.locator('header >> a:has-text("Mitra Banten News")').first()
    await expect(logo).toBeVisible()
    
    await logo.click()
    await expect(page).toHaveURL('/')
  })
})
