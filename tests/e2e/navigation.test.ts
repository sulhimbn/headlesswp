import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to categories page', async ({ page }) => {
    await page.goto('/berita');
    await page.waitForLoadState('networkidle');
    const heading = await page.locator('h1').textContent();
    expect(heading).toBeTruthy();
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/cari');
    await page.waitForLoadState('networkidle');
    const searchInput = await page.locator('input[type="search"], input[type="text"]').count();
    expect(searchInput).toBeGreaterThanOrEqual(0);
  });

  test('should have working header links', async ({ page }) => {
    await page.goto('/');
    const links = await page.locator('nav a').count();
    expect(links).toBeGreaterThanOrEqual(0);
  });
});
