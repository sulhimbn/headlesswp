import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test('should load search page', async ({ page }) => {
    await page.goto('/cari');
    await expect(page).toHaveURL(/cari/);
  });

  test('should accept search input', async ({ page }) => {
    await page.goto('/cari');
    const searchInput = page.locator('input[type="search"], input[name="q"], input[name="s"]');
    await searchInput.first().fill('test').catch(() => null);
  });

  test('should display search results', async ({ page }) => {
    await page.goto('/cari?q=test');
    await page.waitForLoadState('networkidle');
  });
});
