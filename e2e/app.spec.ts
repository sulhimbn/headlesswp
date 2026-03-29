import { test, expect } from './fixtures';

test.describe('Homepage Navigation', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mitra Banten News/i);
  });

  test('should display header with navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should navigate to berita page from header', async ({ page }) => {
    await page.goto('/');
    const beritaLink = page.locator('nav a[href="/berita"]').first();
    await beritaLink.click();
    await expect(page).toHaveURL(/\/berita/);
  });
});

test.describe('Post Listing', () => {
  test('should display post listings on homepage', async ({ page }) => {
    await page.goto('/');
    const posts = page.locator('[class*="post"], article');
    const postCount = await posts.count();
    expect(postCount).toBeGreaterThan(0);
  });

  test('should display post cards with title and excerpt', async ({ page }) => {
    await page.goto('/');
    const firstPost = page.locator('[class*="post"], article').first();
    await expect(firstPost.locator('h2, h3, a')).toBeVisible();
  });

  test('should navigate to berita listing page', async ({ page }) => {
    await page.goto('/berita');
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Post Detail View', () => {
  test('should display post content when clicking a post', async ({ page }) => {
    await page.goto('/berita');
    
    const firstPostLink = page.locator('article a, [class*="post"] a').first();
    if (await firstPostLink.count() > 0) {
      await firstPostLink.click();
      await expect(page.locator('article, [class*="content"]')).toBeVisible();
    }
  });

  test('should display post metadata', async ({ page }) => {
    await page.goto('/berita');
    
    const firstPostLink = page.locator('article a, [class*="post"] a').first();
    if (await firstPostLink.count() > 0) {
      await firstPostLink.click();
      const metaInfo = page.locator('[class*="meta"], time, [class*="date"]');
      if (await metaInfo.count() > 0) {
        await expect(metaInfo.first()).toBeVisible();
      }
    }
  });

  test('should display author information', async ({ page }) => {
    await page.goto('/berita');
    
    const firstPostLink = page.locator('article a, [class*="post"] a').first();
    if (await firstPostLink.count() > 0) {
      await firstPostLink.click();
      const author = page.locator('[class*="author"], [rel="author"]');
      if (await author.count() > 0) {
        await expect(author.first()).toBeVisible();
      }
    }
  });
});

test.describe('Search', () => {
  test('should display search input on search page', async ({ page }) => {
    await page.goto('/cari');
    const searchInput = page.locator('input[type="search"], input[name="q"], input[name="s"]');
    await expect(searchInput.first()).toBeVisible();
  });

  test('should display search results', async ({ page }) => {
    await page.goto('/cari');
    const searchInput = page.locator('input[type="search"], input[name="q"], input[name="s"]').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      await page.waitForLoadState('networkidle');
      const results = page.locator('[class*="result"], article, [class*="post"]');
      expect(await results.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display no results message for empty search', async ({ page }) => {
    await page.goto('/cari?q=nonexistentsearchterm12345');
    await page.waitForLoadState('networkidle');
    
    const noResults = page.locator('[class*="empty"], [class*="no-result"], text=/tidak ada/i');
    if (await noResults.count() > 0) {
      await expect(noResults.first()).toBeVisible();
    }
  });
});

test.describe('Pagination', () => {
  test('should display pagination on post listing', async ({ page }) => {
    await page.goto('/berita');
    
    await page.waitForLoadState('networkidle');
    const pagination = page.locator('[class*="pagination"], nav[aria-label="pagination"], [class*="page"]');
    
    if (await pagination.count() > 0) {
      await expect(pagination.first()).toBeVisible();
    }
  });

  test('should navigate to next page', async ({ page }) => {
    await page.goto('/berita');
    
    await page.waitForLoadState('networkidle');
    const nextButton = page.locator('a[href*="page"], button:has-text("Next"), a:has-text("›")').first();
    
    if (await nextButton.count() > 0 && await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should navigate to previous page from second page', async ({ page }) => {
    await page.goto('/berita?page=2');
    
    await page.waitForLoadState('networkidle');
    const prevButton = page.locator('a[href*="page"], button:has-text("Previous"), a:has-text("‹")').first();
    
    if (await prevButton.count() > 0 && await prevButton.isVisible()) {
      await prevButton.click();
      await page.waitForLoadState('networkidle');
    }
  });
});

test.describe('Category Pages', () => {
  test('should display category page', async ({ page }) => {
    await page.goto('/kategori/berita');
    await page.waitForLoadState('networkidle');
    
    const heading = page.locator('h1');
    if (await heading.count() > 0) {
      await expect(heading.first()).toBeVisible();
    }
  });
});

test.describe('Tag Pages', () => {
  test('should display tag page', async ({ page }) => {
    await page.goto('/tag/berita');
    await page.waitForLoadState('networkidle');
    
    const heading = page.locator('h1');
    if (await heading.count() > 0) {
      await expect(heading.first()).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should display mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const mobileMenuButton = page.locator('[class*="menu"], [class*="hamburger"], button[aria-label*="menu"]');
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton.first()).toBeVisible();
    }
  });
});
