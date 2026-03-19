import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Mitra Banten News/i)
  })

  test('should display header with site name', async ({ page }) => {
    const header = page.locator('header')
    await expect(header).toBeVisible()
    await expect(page.getByRole('link', { name: /Mitra Banten News/i })).toBeVisible()
  })

  test('should display featured posts section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Berita Utama/i })).toBeVisible()
    const featuredPosts = page.locator('[aria-labelledby="featured"] article, [aria-labelledby="featured"] a')
    await expect(featuredPosts.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display latest posts section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Berita Terkini/i })).toBeVisible()
    const latestPosts = page.locator('[aria-labelledby="latest"] article, [aria-labelledby="latest"] a')
    await expect(latestPosts.first()).toBeVisible({ timeout: 10000 })
  })

  test('should have working navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Beranda/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Berita/i })).toBeVisible()
  })

  test('should display footer', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toBeVisible({ timeout: 10000 })
  })

  test('should have skip to main content link', async ({ page }) => {
    const skipLink = page.locator('a[href="#main-content"]')
    await expect(skipLink).toHaveAttribute('href', '#main-content')
  })

  test('should display search button in header', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: /Buka pencarian/i })
    await expect(searchButton).toBeVisible()
  })

  test('should display dark mode toggle button', async ({ page }) => {
    const darkModeButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1)
    await expect(darkModeButton).toBeVisible()
  })

  test('should have working dark mode toggle', async ({ page }) => {
    const darkModeButton = page.getByRole('button').nth(1)
    const htmlElement = page.locator('html')

    const initialClass = await htmlElement.getAttribute('class')

    await darkModeButton.click()
    await page.waitForTimeout(500)

    const newClass = await htmlElement.getAttribute('class')
    expect(newClass).not.toBe(initialClass)
  })

  test('should open search when search button clicked', async ({ page }) => {
    const searchButton = page.getByRole('button', { name: /Buka pencarian/i })
    await searchButton.click()

    const searchInput = page.getByPlaceholder(/Cari berita/i)
    await expect(searchInput).toBeVisible()
  })

  test('should navigate to news page when clicking news link', async ({ page }) => {
    await page.getByRole('link', { name: /Berita/i }).click()
    await expect(page).toHaveURL(/\/berita/)
  })
})
