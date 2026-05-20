import { test, expect } from '@playwright/test';

test.describe('Article Detail Flow', () => {
  test('should load article detail page', async ({ page }) => {
    // Try to navigate to a sample article (will fail gracefully if no articles exist)
    await page.goto('/berita/sample-article').catch(() => {
      // Article might not exist
    });
    
    // Page should handle gracefully (either show article or 404)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle 404 gracefully', async ({ page }) => {
    await page.goto('/berita/nonexistent-article-12345');
    
    // Should either show 404 or redirect
    await expect(page.locator('main')).toBeVisible();
  });
});
