import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test('should load search page correctly', async ({ page }) => {
    await page.goto('/cari')

    await expect(page).toHaveTitle(/cari/)
    await expect(page.locator('main')).toBeVisible()
  })

  test('should display search input', async ({ page }) => {
    await page.goto('/cari')

    await expect(page.locator('input[placeholder="Cari berita..."]')).toBeVisible()
  })

  test('should search for a term', async ({ page }) => {
    await page.goto('/cari')

    const searchInput = page.locator('input[placeholder="Cari berita..."]')
    await searchInput.fill('berita')
    await searchInput.press('Enter')

    await expect(page).toHaveURL(/q=berita/)
  })

  test('should display search results', async ({ page }) => {
    await page.goto('/cari?q=berita')

    const results = page.locator('main')
    await expect(results).toBeVisible()
  })

  test('should display empty state for no results', async ({ page }) => {
    await page.goto('/cari?q=nonexistentquery123456')

    await expect(page.locator('text=Tidak ada hasil')).toBeVisible()
  })

  test('should open search from header', async ({ page }) => {
    await page.goto('/')

    const searchButton = page.locator('header button[aria-label*="Buka pencarian"]').first()
    await searchButton.click()

    await expect(page.locator('input[placeholder="Cari berita..."]')).toBeVisible()
  })
})
