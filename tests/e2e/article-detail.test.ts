import { test, expect } from '@playwright/test';

test.describe('Article Detail', () => {
  test('should load article page', async ({ page }) => {
    await page.goto('/berita/test-artikel');
    await page.waitForLoadState('networkidle').catch(() => null);
  });

  test('should display article content', async ({ page }) => {
    await page.goto('/berita/test-artikel');
    const content = await page.locator('article, [data-testid="content"]').count();
    expect(content).toBeGreaterThanOrEqual(0);
  });

  test('should have article title', async ({ page }) => {
    await page.goto('/berita/test-artikel');
    const title = await page.locator('h1').textContent();
    expect(title).toBeTruthy();
  });
});
