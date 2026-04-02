import { test, expect } from '@playwright/test';

test.describe('Article Reading', () => {
  test('should display article content', async ({ page }) => {
    await page.goto('/berita');
    const articleLink = page.locator('article a').first();
    await articleLink.click();
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('article')).toBeVisible();
  });

  test('should display article meta information', async ({ page }) => {
    await page.goto('/berita');
    const articleLink = page.locator('article a').first();
    await articleLink.click();
    
    await expect(page.locator('time')).toBeVisible();
  });

  test('should have working back navigation', async ({ page }) => {
    await page.goto('/berita');
    const articleLink = page.locator('article a').first();
    await articleLink.click();
    
    await page.goBack();
    await expect(page).toHaveURL(/\/berita/);
  });

  test('should load article images', async ({ page }) => {
    await page.goto('/berita');
    const articleLink = page.locator('article a').first();
    await articleLink.click();
    
    const images = page.locator('article img');
    const count = await images.count();
    if (count > 0) {
      await expect(images.first()).toBeVisible();
    }
  });
});