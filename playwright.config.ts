import { defineConfig, devices } from '@playwright/test'

/**
 * E2E-001: Playwright end-to-end testing framework.
 *
 * - Chromium only in CI (headless shell). Firefox/WebKit intentionally
 *   excluded: critical flows are structural (navigation, SSR content) and
 *   Chromium coverage is sufficient for a content portal.
 * - Tests are fallback-safe: WordPress API calls happen server-side, so
 *   specs assert on structure (header, nav, headings, links) rather than
 *   specific live content. They pass with live WP data AND with fallback
 *   posts when the backend is unreachable.
 * - Runs on schedule (weekly), NOT on every commit — see
 *   .github/workflows/e2e.yml (E2E-003).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
        env: {
          NEXT_PUBLIC_WORDPRESS_URL: 'https://example.com',
          NEXT_PUBLIC_WORDPRESS_API_URL: 'https://example.com/wp-json',
          NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
        },
      },
})
