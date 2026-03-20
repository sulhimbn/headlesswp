import { test, expect, devices } from '@playwright/test'

test.describe('Mobile Responsiveness', () => {
  test.use({
    ...devices['iPhone 12'],
  })

  test('should display mobile menu button on small screens', async ({ page }) => {
    await page.goto('/')
    
    const menuButton = page.locator('header button[aria-label*="enu"]')
    await expect(menuButton).toBeVisible()
  })

  test('should open mobile menu when clicking hamburger', async ({ page }) => {
    await page.goto('/')
    
    const menuButton = page.locator('header button[aria-label*="enu"]')
    await menuButton.click()
    
    await page.waitForTimeout(300)
    
    const mobileMenu = page.locator('#mobile-menu')
    await expect(mobileMenu).toBeVisible()
  })

  test('should close mobile menu when clicking close', async ({ page }) => {
    await page.goto('/')
    
    const menuButton = page.locator('header button[aria-label*="enu"]')
    await menuButton.click()
    
    await page.waitForTimeout(300)
    
    const closeButton = page.locator('header button[aria-label*="utup"]')
    await closeButton.click()
    
    await page.waitForTimeout(300)
    
    const mobileMenu = page.locator('#mobile-menu')
    await expect(mobileMenu).not.toBeVisible()
  })

  test('should navigate using mobile menu', async ({ page }) => {
    await page.goto('/')
    
    const menuButton = page.locator('header button[aria-label*="enu"]')
    await menuButton.click()
    
    await page.waitForTimeout(300)
    
    const newsLink = page.locator('#mobile-menu a:has-text("Berita")')
    await newsLink.click()
    
    await expect(page).toHaveURL(/\/berita/)
  })

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/')
    
    const buttons = page.locator('header button')
    const count = await buttons.count()
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const boundingBox = await button.boundingBox()
      
      if (boundingBox) {
        const minHeight = 44
        expect(boundingBox.height).toBeGreaterThanOrEqual(minHeight)
      }
    }
  })

  test('should display readable text on mobile', async ({ page }) => {
    await page.goto('/')
    
    const body = page.locator('body')
    const fontSize = await body.evaluate(el => {
      const style = window.getComputedStyle(el)
      return parseFloat(style.fontSize)
    })
    
    expect(fontSize).toBeGreaterThanOrEqual(14)
  })

  test('should handle orientation changes', async ({ page }) => {
    await page.goto('/')
    
    await page.setViewportSize({ width: 375, height: 812 })
    await expect(page.locator('#main-content')).toBeVisible()
    
    await page.setViewportSize({ width: 812, height: 375 })
    await expect(page.locator('#main-content')).toBeVisible()
  })
})
