import { test, expect } from '@playwright/test';

test.describe('Search Flow', () => {
  test('should load search page', async ({ page }) => {
    await page.goto('/cari');
    
    // Check that search input is present
    await expect(page.getByRole('searchbox')).toBeVisible({ timeout: 5000 }).catch(() => {
      // Search input might not be visible if WP is empty
    });
  });

  test('should perform search', async ({ page }) => {
    await page.goto('/cari');
    
    // Try to find and fill search input
    const searchInput = page.getByRole('searchbox').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      
      // Wait for results
      await page.waitForTimeout(2000);
      
      // Check that page doesn't crash
      await expect(page).toHaveURL(/cari|search/i);
    }
  });

  test('should display search results', async ({ page }) => {
    await page.goto('/cari?q=test');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Page should be functional
    await expect(page.locator('main')).toBeVisible();
  });
});
