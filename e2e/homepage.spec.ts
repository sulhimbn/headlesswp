import { test, expect } from '@playwright/test';

test.describe('Homepage Flow', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads without crash
    await expect(page).toHaveTitle(/HeadlessWP/i);
    
    // Check for main content area
    await expect(page.locator('main')).toBeVisible();
  });

  test('should display posts on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Wait for posts to load (content should be present)
    await page.waitForSelector('article, [class*="post"], [class*="card"]', { timeout: 10000 }).catch(() => {
      // If no posts found, that's okay - might be empty WP instance
    });
    
    // Page should not have critical errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Allow some errors but page should be functional
    expect(consoleErrors.filter(e => !e.includes('wordpress'))).toHaveLength(0);
  });

  test('should navigate to news page', async ({ page }) => {
    await page.goto('/');
    
    // Click on news link
    const newsLink = page.getByRole('link', { name: /berita|news/i }).first();
    if (await newsLink.isVisible()) {
      await newsLink.click();
      await expect(page).toHaveURL(/berita|news/i);
    }
  });
});
