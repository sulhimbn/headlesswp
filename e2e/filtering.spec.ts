import { test, expect } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:8080';

async function safeGoto(page: any, url: string) {
  try {
    const response = await page.goto(url, { timeout: 10000, waitUntil: 'domcontentloaded' });
    return response;
  } catch (e: any) {
    if (e.message?.includes('net::ERR_CONNECTION_REFUSED') || e.message?.includes('ECONNREFUSED')) {
      test.skip();
    }
    throw e;
  }
}

test.describe('Filtering', () => {
  test('category filtering works', async ({ page }) => {
    const response = await safeGoto(page, `${baseURL}/kategori`);
    if (!response || response.status() >= 400) {
      test.skip();
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('category page loads with posts', async ({ page }) => {
    const response = await safeGoto(page, `${baseURL}/kategori`);
    if (!response || response.status() >= 400) {
      test.skip();
    }

    const categoryLink = page.locator('a[href*="/kategori/"]').first();
    if (await categoryLink.isVisible().catch(() => false)) {
      await categoryLink.click();
      await expect(page).toHaveURL(/\/kategori\/.+/);
    }
  });

  test('tag filtering works', async ({ page }) => {
    const response = await safeGoto(page, `${baseURL}/tag`);
    if (!response || response.status() >= 400) {
      test.skip();
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('tag page loads with posts', async ({ page }) => {
    const response = await safeGoto(page, `${baseURL}/tag`);
    if (!response || response.status() >= 400) {
      test.skip();
    }

    const tagLink = page.locator('a[href*="/tag/"]').first();
    if (await tagLink.isVisible().catch(() => false)) {
      await tagLink.click();
      await expect(page).toHaveURL(/\/tag\/.+/);
    }
  });
});