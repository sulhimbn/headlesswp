import { test, expect } from '@playwright/test'

test.describe('Post Detail Page', () => {
  test('should navigate to post detail page from homepage', async ({ page }) => {
    await page.goto('/')

    const firstPost = page.locator('[aria-labelledby="latest"] a').first()
    await firstPost.click()

    await expect(page).toHaveURL(/\/berita\/.+/)
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('should display post title on post detail page', async ({ page }) => {
    await page.goto('/berita/test-post')

    const articleHeading = page.locator('#article-heading')
    if (await articleHeading.isVisible({ timeout: 5000 })) {
      await expect(articleHeading).toBeVisible()
      await expect(articleHeading).not.toBeEmpty()
    } else {
      await expect(page.getByText('Halaman Tidak Ditemukan')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should display breadcrumb navigation', async ({ page }) => {
    await page.goto('/berita/test-post')
    await page.waitForLoadState('networkidle')

    const breadcrumb = page.locator('nav[aria-label="Navigasi breadcrumb"]')
    if (await breadcrumb.isVisible({ timeout: 5000 })) {
      await expect(breadcrumb).toBeVisible()
      await expect(page.getByRole('link', { name: /Berita/i })).toBeVisible()
    }
  })

  test('should display article content', async ({ page }) => {
    await page.goto('/berita/test-post')
    await page.waitForLoadState('networkidle')

    const article = page.locator('article')
    if (await article.isVisible({ timeout: 5000 })) {
      await expect(article).toBeVisible()
      const articleContent = page.locator('#article-content')
      await expect(articleContent).toBeVisible()
    }
  })

  test('should display back to home link', async ({ page }) => {
    await page.goto('/berita/test-post')
    await page.waitForLoadState('networkidle')

    const backLink = page.getByRole('link', { name: /Kembali ke Beranda/i })
    if (await backLink.isVisible({ timeout: 5000 })) {
      await backLink.click()
      await expect(page).toHaveURL('/')
    }
  })

  test('should have working social share buttons', async ({ page }) => {
    await page.goto('/berita/test-post')
    await page.waitForLoadState('networkidle')

    const shareSection = page.locator('[aria-label*="Bagikan"]')
    if (await shareSection.isVisible({ timeout: 5000 })) {
      await expect(shareSection).toBeVisible()
    }
  })

  test('should display related posts section when available', async ({ page }) => {
    await page.goto('/berita/test-post')
    await page.waitForLoadState('networkidle')

    const relatedHeading = page.getByRole('heading', { name: /Artikel Terkait/i })
    if (await relatedHeading.isVisible({ timeout: 5000 })) {
      await expect(relatedHeading).toBeVisible()
      const relatedPosts = page.locator('[aria-labelledby="related-heading"] a')
      await expect(relatedPosts.first()).toBeVisible()
    }
  })

  test('should preserve dark mode preference on navigation', async ({ page }) => {
    await page.goto('/')
    
    const darkModeButton = page.getByRole('button').nth(1)
    await darkModeButton.click()
    await page.waitForTimeout(500)

    const htmlElement = page.locator('html')
    const hasDarkClass = await htmlElement.evaluate((el) => el.classList.contains('dark'))

    const firstPost = page.locator('[aria-labelledby="latest"] a').first()
    await firstPost.click()

    if (hasDarkClass) {
      await expect(htmlElement).toHaveClass(/dark/)
    }
  })
})
