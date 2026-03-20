# E2E Tests

This directory contains end-to-end tests for the Mitra Banten News headless WordPress site using Playwright.

## Test Structure

```
e2e/
├── helpers/
│   ├── global-setup.ts      # Global test setup
│   ├── global-teardown.ts   # Global test cleanup
│   └── page-objects.ts      # Page object models
├── specs/
│   ├── homepage.spec.ts      # Homepage tests
│   ├── navigation.spec.ts   # Navigation tests
│   ├── search.spec.ts       # Search functionality tests
│   ├── category.spec.ts     # Category filtering tests
│   ├── darkmode.spec.ts     # Dark mode toggle tests
│   ├── mobile.spec.ts       # Mobile responsiveness tests
│   └── notfound.spec.ts     # 404 page tests
└── README.md
```

## E2E Test Scenarios

### 1. Homepage Tests (`homepage.spec.ts`)
- Homepage loads successfully with correct title
- Skip to main content link is accessible
- Featured posts section displays correctly
- Latest posts section displays correctly
- Header displays logo and navigation links
- Search button is visible and functional
- Dark mode toggle button is visible
- Navigation links work correctly

### 2. Navigation Tests (`navigation.spec.ts`)
- Navigation from homepage to news page works
- Navigation from homepage to post detail page works
- Breadcrumb navigation displays on post detail
- Back navigation to homepage works
- URL state maintains during navigation

### 3. Search Tests (`search.spec.ts`)
- Search opens when clicking search button
- Search with valid query works
- Empty state displays for no query
- Search results display when available
- Special characters in search are handled
- Direct navigation to search page with query works

### 4. Category Tests (`category.spec.ts`)
- News listing page displays correctly
- Posts display on news listing page
- Category page navigation works
- Pagination displays on news listing
- Pagination navigation works

### 5. Dark Mode Tests (`darkmode.spec.ts`)
- Dark mode toggle button is present
- Dark mode toggles on click
- Dark mode preference persists on navigation
- Correct icon displays based on current mode

### 6. Mobile Tests (`mobile.spec.ts`)
- Mobile menu button displays on small screens
- Mobile menu opens when clicking hamburger
- Mobile menu closes when clicking close
- Navigation works using mobile menu
- Touch-friendly button sizes (min 44px)
- Text is readable on mobile
- Orientation changes are handled

### 7. 404 Page Tests (`notfound.spec.ts`)
- Custom 404 page displays for non-existent routes
- Back to home button displays on 404 page
- Navigation to home from 404 page works
- Non-existent post slugs handled gracefully
- 404 status returned for non-existent pages
- Helpful message displays on 404 page

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run E2E tests in UI mode
```bash
npm run test:e2e:ui
```

### Run E2E tests in headed mode
```bash
npm run test:e2e:headed
```

### Debug E2E tests
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

## Configuration

Playwright configuration is in `playwright.config.ts`. Key settings:

- **Base URL**: Configurable via `E2E_BASE_URL` environment variable (default: `http://localhost:3000`)
- **Browsers**: Tests run on Chromium (desktop and mobile)
- **Retries**: 2 retries in CI, 0 locally
- **Reporters**: HTML and list reporters

## CI Integration

E2E tests are automatically run in the CI pipeline after the build job succeeds. Reports are uploaded as artifacts for debugging.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `E2E_BASE_URL` | Base URL for tests | `http://localhost:3000` |
| `WORDPRESS_URL` | WordPress backend URL | (required in CI) |
