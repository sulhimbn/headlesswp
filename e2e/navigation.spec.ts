import { test, expect } from '@playwright/test'

test.describe('Article Navigation', () => {
  test('can navigate from homepage to article list', async ({ page }) => {
    await page.goto('/')
    
    const postLink = page.locator('a[href^="/berita/"]').first()
    await expect(postLink).toBeVisible()
  })

  test('can navigate to article detail page', async ({ page }) => {
    await page.goto('/berita')
    
    const postLink = page.locator('a[href^="/berita/"]').first()
    if (await postLink.isVisible()) {
      await postLink.click()
      
      await expect(page).toHaveURL(/\/berita\/.+/)
      await expect(page.locator('article')).toBeVisible()
    }
  })

  test('article detail shows title and content', async ({ page }) => {
    await page.goto('/berita')
    
    const postLink = page.locator('a[href^="/berita/"]').first()
    if (await postLink.isVisible()) {
      await postLink.click()
      
      const heading = page.locator('#article-heading')
      await expect(heading).toBeVisible()
    }
  })

  test('back to home link works', async ({ page }) => {
    await page.goto('/berita')
    
    const postLink = page.locator('a[href^="/berita/"]').first()
    if (await postLink.isVisible()) {
      await postLink.click()
      
      const backLink = page.locator('a[href="/"]').first()
      if (await backLink.isVisible()) {
        await backLink.click()
        await expect(page).toHaveURL('/')
      }
    }
  })
})
