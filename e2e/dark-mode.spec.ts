import { test, expect } from '@playwright/test'

test.describe('Dark Mode Toggle', () => {
  test('should toggle dark mode on homepage', async ({ page }) => {
    await page.goto('/')

    const darkModeButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1)
    const htmlElement = page.locator('html')

    const initialClass = await htmlElement.getAttribute('class')

    await darkModeButton.click()
    await page.waitForTimeout(500)

    const newClass = await htmlElement.getAttribute('class')
    expect(newClass).not.toBe(initialClass)
  })

  test('should toggle dark mode on post detail page', async ({ page }) => {
    await page.goto('/berita/test-post')
    await page.waitForLoadState('networkidle')

    const darkModeButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1)
    const htmlElement = page.locator('html')

    const initialClass = await htmlElement.getAttribute('class')

    await darkModeButton.click()
    await page.waitForTimeout(500)

    const newClass = await htmlElement.getAttribute('class')
    expect(newClass).not.toBe(initialClass)
  })

  test('should toggle dark mode on search page', async ({ page }) => {
    await page.goto('/cari')

    const darkModeButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1)
    const htmlElement = page.locator('html')

    const initialClass = await htmlElement.getAttribute('class')

    await darkModeButton.click()
    await page.waitForTimeout(500)

    const newClass = await htmlElement.getAttribute('class')
    expect(newClass).not.toBe(initialClass)
  })

  test('should persist dark mode on navigation', async ({ page, context }) => {
    await page.goto('/')

    const darkModeButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1)
    await darkModeButton.click()
    await page.waitForTimeout(500)

    const htmlElement = page.locator('html')
    const hasDarkClass = await htmlElement.evaluate((el) => el.classList.contains('dark'))

    await page.getByRole('link', { name: /Berita/i }).click()
    await expect(page).toHaveURL(/\/berita/)

    if (hasDarkClass) {
      await expect(htmlElement).toHaveClass(/dark/)
    }
  })

  test('should persist dark mode on page reload', async ({ page }) => {
    await page.goto('/')

    const darkModeButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1)
    await darkModeButton.click()
    await page.waitForTimeout(500)

    await page.reload()
    await page.waitForLoadState('networkidle')

    const htmlElement = page.locator('html')
    const hasDarkClass = await htmlElement.evaluate((el) => el.classList.contains('dark'))

    expect(hasDarkClass).toBe(true)
  })

  test('should have correct aria label for dark mode button', async ({ page }) => {
    await page.goto('/')

    const darkModeButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1)
    const ariaLabel = await darkModeButton.getAttribute('aria-label')
    expect(ariaLabel).toMatch(/mode/i)
  })

  test('should toggle back to light mode', async ({ page }) => {
    await page.goto('/')

    const darkModeButton = page.getByRole('button').filter({ has: page.locator('svg') }).nth(1)
    const htmlElement = page.locator('html')

    await darkModeButton.click()
    await page.waitForTimeout(500)
    const darkClass = await htmlElement.getAttribute('class')

    await darkModeButton.click()
    await page.waitForTimeout(500)
    const lightClass = await htmlElement.getAttribute('class')

    expect(darkClass).not.toBe(lightClass)
  })
})
