import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to category page', async ({ page }) => {
    await page.goto('/');
    const categoryLink = page.locator('a[href^="/kategori/"]').first();
    await categoryLink.click();
    await expect(page).toHaveURL(/\/kategori\/.+/);
  });

  test('should navigate to article page from homepage', async ({ page }) => {
    await page.goto('/');
    const articleLink = page.locator('article a').first();
    await articleLink.click();
    await expect(page).toHaveURL(/\/berita\/.+/);
  });

  test('should navigate to all articles page', async ({ page }) => {
    await page.goto('/');
    const allArticlesLink = page.locator('a[href="/berita"]').first();
    if (await allArticlesLink.isVisible()) {
      await allArticlesLink.click();
      await expect(page).toHaveURL(/\/berita(\?.*)?$/);
    }
  });

  test('should navigate through pagination', async ({ page }) => {
    await page.goto('/berita');
    const nextButton = page.locator('a[rel="next"]').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await expect(page).toHaveURL(/page=\d+/);
    }
  });
});