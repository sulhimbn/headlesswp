import { test, expect } from '@playwright/test'

test.describe('Search Flow', () => {
  test('search bar opens on button click', async ({ page }) => {
    await page.goto('/')
    
    const searchButton = page.getByRole('button', { name: /Buka pencarian/i })
    await searchButton.click()
    
    await expect(page.getByRole('searchbox', { name: /Cari berita/i })).toBeVisible()
  })

  test('search input accepts text', async ({ page }) => {
    await page.goto('/')
    
    const searchButton = page.getByRole('button', { name: /Buka pencarian/i })
    await searchButton.click()
    
    const searchInput = page.getByRole('searchbox', { name: /Cari berita/i })
    await searchInput.fill('test')
    
    await expect(searchInput).toHaveValue('test')
  })

  test('search closes on escape key', async ({ page }) => {
    await page.goto('/')
    
    const searchButton = page.getByRole('button', { name: /Buka pencarian/i })
    await searchButton.click()
    
    const searchInput = page.getByRole('searchbox', { name: /Cari berita/i })
    await expect(searchInput).toBeVisible()
    
    await searchInput.press('Escape')
    await expect(searchInput).not.toBeVisible()
  })

  test('search page loads', async ({ page }) => {
    await page.goto('/cari')
    
    await expect(page.getByRole('heading', { name: /Cari/i })).toBeVisible()
    await expect(page.getByRole('searchbox')).toBeVisible()
  })
})
