import { test, expect } from '@playwright/test'

test.describe('Homepage Flow', () => {
  test('homepage loads and displays posts', async ({ page }) => {
    await page.goto('/')
    
    await expect(page).toHaveTitle(/Mitra Banten News/)
    
    await expect(page.getByRole('banner')).toBeVisible()
    
    await expect(page.getByRole('heading', { name: /Featured/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Latest/i })).toBeVisible()
    
    const postCards = page.locator('[class*="PostCard"]')
    await expect(postCards.first()).toBeVisible()
  })

  test('homepage displays navigation', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.getByRole('link', { name: /Mitra Banten News/i })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Beranda' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Berita' })).toBeVisible()
  })

  test('homepage displays footer', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })
})
