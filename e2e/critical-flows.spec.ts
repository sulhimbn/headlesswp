import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Mitra Banten News/i);
    
    await expect(page.locator('header').first()).toBeVisible();
    
    await expect(page.locator('main').first()).toBeVisible();
    
    await expect(page.locator('footer').first()).toBeVisible();
  });

  test('navigation to /berita works', async ({ page }) => {
    await page.goto('/');
    
    const newsLink = page.locator('nav').first().locator('a[href="/berita"]');
    await expect(newsLink).toBeVisible();
    
    await newsLink.click();
    
    await expect(page).toHaveURL(/\/berita/);
    
    await expect(page.locator('main').first()).toBeVisible();
  });

  test('navigation back to home works', async ({ page }) => {
    await page.goto('/berita');
    
    const homeLink = page.locator('nav').first().locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
    
    await homeLink.click();
    
    await expect(page).toHaveURL('/');
  });

  test('footer is visible on homepage', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('footer').first()).toBeVisible();
  });
});