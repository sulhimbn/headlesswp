import { test, expect } from '@playwright/test'

/**
 * E2E-002 flow 1: homepage → article detail.
 * Fallback-safe: asserts structure, not live content.
 */
test.describe('Homepage → article flow', () => {
  test('homepage renders header, nav, and main content', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('link', { name: /Beranda/ }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Berita' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Kategori' }).first()).toBeVisible()
    await expect(page.locator('#main-content')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('homepage → berita list → article detail navigation works', async ({ page }) => {
    await page.goto('/berita')

    await expect(page.locator('#main-content')).toBeVisible()

    const articleLinks = page.locator('#main-content article a[href*="/berita/"]')
    const count = await articleLinks.count()

    if (count === 0) {
      // Backend unreachable and no fallback posts: empty state must render.
      await expect(page.locator('#main-content')).toContainText(/tidak ada berita/i)
      return
    }

    await articleLinks.first().click()
    await expect(page).toHaveURL(/\/berita\/.+/)
    await expect(page.locator('article').first()).toBeVisible()
  })

  test('category index lists categories or renders empty state', async ({ page }) => {
    await page.goto('/kategori')

    await expect(page.locator('#main-content')).toBeVisible()

    const categoryLinks = page.locator('#main-content a[href*="/kategori/"]')
    const count = await categoryLinks.count()

    if (count === 0) {
      await expect(page.locator('#main-content')).toContainText(/tidak ada kategori/i)
      return
    }

    await categoryLinks.first().click()
    await expect(page).toHaveURL(/\/kategori\/.+/)
  })
})
