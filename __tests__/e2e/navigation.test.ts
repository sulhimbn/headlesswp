import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('should navigate from homepage to news page', async ({ page }) => {
    await page.goto('/')
    
    const newsLink = page.locator('nav a:has-text("Berita")').first()
    await newsLink.click()
    
    await expect(page).toHaveURL(/\/berita/)
  })

  test('should navigate from news page back to homepage', async ({ page }) => {
    await page.goto('/berita')
    
    const homeLink = page.locator('header a').first()
    await homeLink.click()
    
    await expect(page).toHaveURL('/')
  })

  test('should display navigation menu items', async ({ page }) => {
    await page.goto('/berita')
    
    const nav = page.locator('nav').first()
    await expect(nav).toBeAttached()
  })

  test('should have accessible navigation links', async ({ page }) => {
    await page.goto('/berita')
    
    const navLinks = page.locator('nav a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})
