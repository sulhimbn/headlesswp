# E2E Test Scenarios

This document describes the E2E test scenarios implemented using Playwright.

## Test Configuration

- **Framework**: Playwright
- **Test Directory**: `e2e/`
- **Browser**: Chromium (primary for CI)
- **Base URL**: `http://localhost:3000` (configurable via `PLAYWRIGHT_BASE_URL`)

## Test Scenarios

### 1. Homepage (`e2e/homepage.spec.ts`)

| Test | Description | Expected Result |
|------|-------------|------------------|
| should load the homepage successfully | Access homepage | Page loads with title |
| should display hero section | Check main content | Main section visible |
| should display article list | Check articles | At least one article visible |
| should have navigation menu | Check nav element | Navigation visible |

### 2. Navigation (`e2e/navigation.spec.ts`)

| Test | Description | Expected Result |
|------|-------------|------------------|
| should navigate to category page | Click category link | URL contains `/kategori/` |
| should navigate to article page | Click article link | URL contains `/berita/` |
| should navigate to all articles page | Click articles link | Navigate to `/berita` |
| should navigate through pagination | Click next page | URL contains page parameter |

### 3. Article Reading (`e2e/article.spec.ts`)

| Test | Description | Expected Result |
|------|-------------|------------------|
| should display article content | View article | H1 and article visible |
| should display article meta | Check meta info | Publication date visible |
| should have working back navigation | Browser back button | Return to articles page |
| should load article images | Check images | Images load correctly |

### 4. Search (`e2e/search.spec.ts`)

| Test | Description | Expected Result |
|------|-------------|------------------|
| should access search page | Navigate to `/cari` | Search input visible |
| should perform search query | Enter search term | URL contains query param |
| should display search results | Search for term | Results visible |
| should handle empty search results | Search nonexistent term | Page loads gracefully |

## Running Tests

```bash
# Run all E2E tests
npm run e2e

# Run with UI
npm run e2e:ui

# Run in headed mode (visible browser)
npm run e2e:headed

# View test report
npm run e2e:report
```

## CI/CD Integration

E2E tests run as part of the CI pipeline after the build job completes. Test reports are uploaded as artifacts.

## Notes

- Tests use production build (`npm run start`) for accurate testing
- Retry mechanism enabled in CI (2 retries)
- Screenshots captured only on failure
- Traces captured on first retry for debugging