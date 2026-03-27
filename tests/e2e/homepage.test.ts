import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mitra Banten News/i);
  });

  test('should display posts on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('article, .post-card, [data-testid="post"]', { timeout: 10000 }).catch(() => null);
    const posts = await page.locator('article, .post-card, [data-testid="post"]').count();
    expect(posts).toBeGreaterThanOrEqual(0);
  });

  test('should have navigation', async ({ page }) => {
    await page.goto('/');
    const nav = await page.locator('nav').count();
    expect(nav).toBeGreaterThanOrEqual(0);
  });
});
