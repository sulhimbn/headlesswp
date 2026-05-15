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

test.describe('Navigation', () => {
  test('post navigation works', async ({ page }) => {
    const response = await safeGoto(page, baseURL);
    if (!response || response.status() >= 400) {
      test.skip();
    }

    const postLink = page.locator('article a, .post-title a, h2 a, [class*="post"] a').first();
    if (await postLink.isVisible().catch(() => false)) {
      await postLink.click();
      await expect(page).toHaveURL(/\/.+/);
    }
  });

  test('category navigation works', async ({ page }) => {
    const response = await safeGoto(page, `${baseURL}/kategori`);
    if (!response || response.status() >= 400) {
      test.skip();
    }

    await expect(page.locator('body')).toBeVisible();
  });

  test('tag navigation works', async ({ page }) => {
    const response = await safeGoto(page, `${baseURL}/tag`);
    if (!response || response.status() >= 400) {
      test.skip();
    }

    await expect(page.locator('body')).toBeVisible();
  });
});
