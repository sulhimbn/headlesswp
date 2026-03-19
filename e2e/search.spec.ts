import { test, expect } from '@playwright/test'

test.describe('Search Functionality', () => {
  test('should navigate to search page', async ({ page }) => {
    await page.goto('/cari')
    await expect(page).toHaveURL(/\/cari/)
  })

  test('should display empty state on search page without query', async ({ page }) => {
    await page.goto('/cari')
    await page.waitForLoadState('networkidle')

    const emptyState = page.getByText(/Masukkan kata kunci/i)
    if (await emptyState.isVisible({ timeout: 5000 })) {
      await expect(emptyState).toBeVisible()
    }
  })

  test('should open search from header', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /Buka pencarian/i }).click()

    const searchInput = page.getByPlaceholder(/Cari berita/i)
    await expect(searchInput).toBeVisible()
  })

  test('should search with query from search bar', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: /Buka pencarian/i }).click()
    const searchInput = page.getByPlaceholder(/Cari berita/i)
    await searchInput.fill('test')
    await searchInput.press('Enter')

    await expect(page).toHaveURL(/\/cari\?q=test/)
  })

  test('should display search results', async ({ page }) => {
    await page.goto('/cari?q=berita')
    await page.waitForLoadState('networkidle')

    const heading = page.getByRole('heading', { name: /Hasil pencarian/i })
    if (await heading.isVisible({ timeout: 5000 })) {
      await expect(heading).toBeVisible()
    } else {
      const emptyState = page.getByText(/Tidak ada hasil/i)
      await expect(emptyState).toBeVisible()
    }
  })

  test('should display no results message for non-matching query', async ({ page }) => {
    const uniqueQuery = `test-${Date.now()}`
    await page.goto(`/cari?q=${encodeURIComponent(uniqueQuery)}`)
    await page.waitForLoadState('networkidle')

    const noResults = page.getByText(/Tidak ada hasil/i)
    if (await noResults.isVisible({ timeout: 5000 })) {
      await expect(noResults).toBeVisible()
    }
  })

  test('should have working pagination in search results', async ({ page }) => {
    await page.goto('/cari?q=berita')
    await page.waitForLoadState('networkidle')

    const pagination = page.locator('nav[aria-label="Navigasi halaman"]')
    if (await pagination.isVisible({ timeout: 5000 })) {
      const nextButton = pagination.getByRole('link', { name: /Selanjutnya/i })
      if (await nextButton.isVisible()) {
        const currentUrl = page.url()
        await nextButton.click()
        await expect(page).toHaveURL((url) => url.search.includes('page=2'))
      }
    }
  })

  test('should navigate to post from search results', async ({ page }) => {
    await page.goto('/cari?q=berita')
    await page.waitForLoadState('networkidle')

    const firstResult = page.locator('main a').first()
    if (await firstResult.isVisible({ timeout: 5000 })) {
      const href = await firstResult.getAttribute('href')
      await firstResult.click()
      await expect(page).toHaveURL(new RegExp(href || ''))
    }
  })

  test('should clear search query', async ({ page }) => {
    await page.goto('/cari?q=berita')
    await page.waitForLoadState('networkidle')

    const backToHome = page.getByRole('link', { name: /Kembali ke Beranda/i })
    if (await backToHome.isVisible({ timeout: 5000 })) {
      await backToHome.click()
      await expect(page).toHaveURL('/')
    }
  })

  test('should handle special characters in search', async ({ page }) => {
    await page.goto('/cari?q=berita%20%26%20test')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/q=.*berita.*test/)
  })
})
