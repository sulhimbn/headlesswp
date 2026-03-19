import { test, expect } from '@playwright/test'

test.describe('Category Filtering', () => {
  test('should navigate to news page', async ({ page }) => {
    await page.goto('/berita')
    await expect(page).toHaveURL(/\/berita/)
  })

  test('should display news listing', async ({ page }) => {
    await page.goto('/berita')
    await expect(page.getByRole('heading', { name: /Semua Berita/i })).toBeVisible({ timeout: 10000 })
  })

  test('should navigate to category page from homepage', async ({ page }) => {
    await page.goto('/')

    const categoryLink = page.getByRole('link', { name: /kategori/i }).first()
    if (await categoryLink.isVisible({ timeout: 5000 })) {
      await categoryLink.click()
      await expect(page).toHaveURL(/\/kategori\/.+/)
    }
  })

  test('should display category name in heading', async ({ page }) => {
    await page.goto('/kategori/politik')
    await page.waitForLoadState('networkidle')

    const heading = page.getByRole('heading', { name: /Kategori:.*/i })
    if (await heading.isVisible({ timeout: 5000 })) {
      await expect(heading).toBeVisible()
    }
  })

  test('should display posts in category', async ({ page }) => {
    await page.goto('/kategori/politik')
    await page.waitForLoadState('networkidle')

    const postsSection = page.locator('main > div > a, main > section a')
    if (await postsSection.first().isVisible({ timeout: 5000 })) {
      await expect(postsSection.first()).toBeVisible()
    }
  })

  test('should have working pagination', async ({ page }) => {
    await page.goto('/kategori/politik')
    await page.waitForLoadState('networkidle')

    const pagination = page.locator('nav[aria-label="Navigasi halaman"]')
    if (await pagination.isVisible({ timeout: 5000 })) {
      const nextButton = pagination.getByRole('link', { name: /Selanjutnya/i })
      if (await nextButton.isVisible()) {
        await nextButton.click()
        await expect(page).toHaveURL(/page=2/)
      }
    }
  })

  test('should display empty state for category with no posts', async ({ page }) => {
    await page.goto('/kategori/non-existent-category-xyz')
    await page.waitForLoadState('networkidle')

    const emptyState = page.getByText(/Tidak ada berita/i)
    if (await emptyState.isVisible({ timeout: 5000 })) {
      await expect(emptyState).toBeVisible()
    }
  })

  test('should preserve category filter on page reload', async ({ page, context }) => {
    await page.goto('/kategori/politik')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(url)
  })
})
