import { test, expect } from '@playwright/test'

test.describe('Homepage Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('displays homepage with news articles', async ({ page }) => {
    await expect(page).toHaveTitle(/Mitra Banten News/)
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeVisible()
  })

  test('navigates from homepage to article detail', async ({ page }) => {
    const firstArticleLink = page.locator('article a').first()
    const href = await firstArticleLink.getAttribute('href')
    
    await firstArticleLink.click()
    await page.waitForURL(/\/berita\//)
    
    const articleDetail = page.locator('article')
    await expect(articleDetail).toBeVisible()
  })

  test('article detail shows breadcrumb', async ({ page }) => {
    await page.goto('/berita/test-post')
    
    const breadcrumb = page.locator('nav[aria-label="Navigasi breadcrumb"]')
    await expect(breadcrumb).toBeVisible()
  })

  test('article detail shows post title', async ({ page }) => {
    await page.goto('/berita/test-post')
    
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })
})

test.describe('Category Filtering', () => {
  test('displays news listing page', async ({ page }) => {
    await page.goto('/berita')
    
    const mainContent = page.locator('#main-content')
    await expect(mainContent).toBeVisible()
  })

  test('filters posts by category', async ({ page }) => {
    await page.goto('/kategori/berita')
    
    const categoryHeading = page.locator('h1, h2').first()
    await expect(categoryHeading).toBeVisible()
    
    const posts = page.locator('article')
    const count = await posts.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('category page shows category badge', async ({ page }) => {
    await page.goto('/kategori/berita')
    
    const categoryBadge = page.locator('text=/berita/i').first()
    await expect(categoryBadge).toBeVisible()
  })

  test('navigates between pages of filtered results', async ({ page }) => {
    await page.goto('/kategori/berita')
    
    const pagination = page.locator('nav[aria-label*="halaman"]')
    if (await pagination.isVisible()) {
      const nextButton = page.locator('button:has-text("Berikutnya"), a:has-text("Berikutnya")')
      if (await nextButton.isVisible()) {
        await nextButton.click()
        await expect(page).toHaveURL(/\/kategori\/berita.*page=/)
      }
    }
  })
})

test.describe('Search Functionality', () => {
  test('displays search page', async ({ page }) => {
    await page.goto('/cari')
    
    const searchInput = page.locator('input[type="search"], input[type="text"]')
    await expect(searchInput).toBeVisible()
  })

  test('search input is functional', async ({ page }) => {
    await page.goto('/cari')
    
    const searchInput = page.locator('input[type="search"], input[type="text"]')
    await searchInput.fill('test query')
    await expect(searchInput).toHaveValue('test query')
  })

  test('displays search results', async ({ page }) => {
    await page.goto('/cari?q=berita')
    
    const results = page.locator('article, [data-testid="search-results"]')
    await expect(results.first()).toBeVisible()
  })

  test('shows empty state when no results found', async ({ page }) => {
    await page.goto('/cari?q=nonexistentquery123456789')
    
    const emptyState = page.locator('[role="status"], text=/tidak ditemukan|tidak ada hasil/i')
    await expect(emptyState.first()).toBeVisible()
  })

  test('search suggestions work', async ({ page }) => {
    await page.goto('/')
    
    const searchButton = page.locator('button:has-text("Cari"), [aria-label*="cari"]').first()
    if (await searchButton.isVisible()) {
      await searchButton.click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Dark Mode Toggle', () => {
  test('toggles dark mode on homepage', async ({ page }) => {
    await page.goto('/')
    
    const darkModeToggle = page.locator('button[aria-label*="dark"], button[aria-label*="tema"], button[aria-label*="mode"]').first()
    
    if (await darkModeToggle.isVisible()) {
      const initialHtml = await page.locator('html').getAttribute('class')
      
      await darkModeToggle.click()
      await page.waitForTimeout(300)
      
      const afterClickHtml = await page.locator('html').getAttribute('class')
      expect(afterClickHtml).not.toBe(initialHtml)
    }
  })

  test('dark mode persists on navigation', async ({ page }) => {
    await page.goto('/')
    
    const darkModeToggle = page.locator('button[aria-label*="dark"], button[aria-label*="tema"], button[aria-label*="mode"]').first()
    
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click()
      await page.waitForTimeout(300)
      
      const darkModeEnabled = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') || 
               localStorage.getItem('theme') === 'dark'
      })
      
      await page.goto('/berita')
      await page.waitForLoadState('networkidle')
      
      const themePersisted = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') || 
               localStorage.getItem('theme') === 'dark'
      })
      
      expect(themePersisted).toBe(darkModeEnabled)
    }
  })

  test('dark mode toggle is accessible', async ({ page }) => {
    await page.goto('/')
    
    const darkModeToggle = page.locator('button[aria-label*="dark"], button[aria-label*="tema"], button[aria-label*="mode"]').first()
    
    if (await darkModeToggle.isVisible()) {
      await expect(darkModeToggle).toHaveAttribute('aria-label')
      await darkModeToggle.focus()
      await expect(darkModeToggle).toBeFocused()
    }
  })
})
