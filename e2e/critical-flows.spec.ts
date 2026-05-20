import { test, expect, Page } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HeadlessWP/i);
  });

  test('homepage displays main content', async ({ page }) => {
    await page.goto('/');
    const mainContent = page.locator('main, #main, .main-content, article');
    await expect(mainContent.first()).toBeVisible();
  });

  test('homepage displays navigation', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav, .nav, header nav, .navigation');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
    }
  });

  test('homepage displays footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer, .footer, #footer');
    if (await footer.count() > 0) {
      await expect(footer.first()).toBeVisible();
    }
  });

  test('navigates to post detail from homepage', async ({ page }) => {
    await page.goto('/');
    
    const firstPostLink = page.locator('article h2 a, article h3 a, .post-title a').first();
    if (await firstPostLink.count() > 0) {
      const postTitle = await firstPostLink.textContent();
      await firstPostLink.click();
      
      await expect(page).toHaveURL(/post|\/[\w-]+\/?$/);
      
      if (postTitle) {
        await expect(page.locator('h1')).toContainText(postTitle.trim());
      }
    }
  });

  test('displays post content', async ({ page }) => {
    await page.goto('/');
    
    const firstPostLink = page.locator('article h2 a, article h3 a, .post-title a').first();
    if (await firstPostLink.count() > 0) {
      await firstPostLink.click();
      
      await expect(page.locator('article, .post-content, .entry-content')).toBeVisible();
    }
  });

  test('filters posts by category', async ({ page }) => {
    await page.goto('/');
    
    const categoryLink = page.locator('.cat-links a, .category a, [class*="category"] a').first();
    if (await categoryLink.count() > 0) {
      const categoryName = await categoryLink.textContent();
      await categoryLink.click();
      
      await expect(page).toHaveURL(/category/);
      
      if (categoryName) {
        await expect(page.locator('h1, h2')).toContainText(categoryName.trim());
      }
    }
  });

  test('performs search', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.locator('input[type="search"], input[name="s"], input[name="q"]').first();
    const searchButton = page.locator('button[type="submit"], .search-submit').first();
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      
      if (await searchButton.count() > 0) {
        await searchButton.click();
      } else {
        await searchInput.press('Enter');
      }
      
      await expect(page).toHaveURL(/s=|search=/);
    }
  });

  test('navigates to about page', async ({ page }) => {
    await page.goto('/');
    
    const aboutLink = page.getByRole('link', { name: /about/i }).first();
    if (await aboutLink.count() > 0) {
      await aboutLink.click();
      await expect(page).toHaveURL(/about/);
    }
  });

  test('loads page within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(10000);
  });

  test('has proper heading structure', async ({ page }) => {
    await page.goto('/');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test('has alt text on images', async ({ page }) => {
    await page.goto('/');
    const images = page.locator('img');
    const totalImages = await images.count();
    
    if (totalImages > 0) {
      const imagesWithAlt = await images.evaluateAll((imgs) => 
        imgs.filter((img) => img instanceof HTMLImageElement && img.alt && img.alt.length > 0).length
      );
      expect(imagesWithAlt).toBeGreaterThan(0);
    }
  });

  test('has no critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('Warning')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
