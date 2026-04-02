import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('should access search page', async ({ page }) => {
    await page.goto('/cari');
    await expect(page.locator('input[name="q"], input[type="search"]')).toBeVisible();
  });

  test('should perform search query', async ({ page }) => {
    await page.goto('/cari');
    const searchInput = page.locator('input[name="q"], input[type="search"]').first();
    await searchInput.fill('test');
    await searchInput.press('Enter');
    
    await expect(page).toHaveURL(/q=.+/);
  });

  test('should display search results', async ({ page }) => {
    await page.goto('/cari?q=test');
    const results = page.locator('article, .results, .search-results');
    await expect(results.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle empty search results', async ({ page }) => {
    await page.goto('/cari?q=nonexistentsearchterm12345');
    await page.waitForTimeout(2000);
    const noResults = page.locator('text=Tidak ada hasil, text=No results, text=tidak ditemukan');
    const hasResults = await page.locator('article').count() > 0;
    if (!hasResults) {
      await expect(page.locator('main')).toBeVisible();
    }
  });
});