import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Mitra Banten News/i)
    await expect(page.locator('#main-content')).toBeVisible()
  })

  test('should display skip to main content link', async ({ page }) => {
    const skipLink = page.locator('a:has-text("Langsung ke konten utama")')
    await expect(skipLink).toBeAttached()
  })

  test('should display featured posts section', async ({ page }) => {
    const featuredSection = page.locator('section[aria-labelledby="featured"]')
    await expect(featuredSection).toBeVisible()
  })

  test('should display latest posts section', async ({ page }) => {
    const latestSection = page.locator('section[aria-labelledby="latest"]')
    await expect(latestSection).toBeVisible()
  })

  test('should display header with logo and navigation', async ({ page }) => {
    const logo = page.locator('header a:has-text("Mitra Banten News")').first()
    await expect(logo).toBeVisible()
    
    const nav = page.locator('header nav')
    await expect(nav).toBeVisible()
  })

  test('should display search button in header', async ({ page }) => {
    const searchButton = page.locator('header button[aria-label*="cari"]').first()
    await expect(searchButton).toBeVisible()
  })

  test('should display dark mode toggle button', async ({ page }) => {
    const darkModeButton = page.locator('header button[aria-label*="mode"]').first()
    await expect(darkModeButton).toBeVisible()
  })

  test('should have working navigation links', async ({ page }) => {
    const newsLink = page.locator('header nav a:has-text("Berita")')
    await expect(newsLink).toBeVisible()
    
    await newsLink.click()
    await expect(page).toHaveURL(/\/berita/)
  })
})
