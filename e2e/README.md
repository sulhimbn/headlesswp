# E2E Testing

This directory contains end-to-end tests for the Mitra Banten News headless WordPress application.

## Testing Framework

We use [Playwright](https://playwright.dev/) for E2E testing.

## Running Tests

### Local Development

```bash
# Start development server
npm run dev

# Run tests (in another terminal)
npm run test:e2e
```

### With UI Mode

```bash
npm run test:e2e:ui
```

### Headed Mode (see browser)

```bash
npm run test:e2e:headed
```

## Test Coverage

### Homepage Tests (`homepage.spec.ts`)
- Page load and title verification
- Header and navigation display
- Featured posts section
- Latest posts section
- Search button functionality
- Dark mode toggle
- Footer display
- Accessibility features

### Post Detail Tests (`post-detail.spec.ts`)
- Navigation from homepage
- Post title display
- Breadcrumb navigation
- Article content
- Back to home link
- Social share buttons
- Related posts section
- Dark mode persistence

### Category Filtering Tests (`category-filtering.spec.ts`)
- News page navigation
- Category page access
- Post display in category
- Pagination functionality
- Empty state handling
- URL persistence on reload

### Search Tests (`search.spec.ts`)
- Search page navigation
- Empty state display
- Search bar functionality
- Search results display
- No results handling
- Pagination in results
- Post navigation from results
- Special character handling

### Dark Mode Tests (`dark-mode.spec.ts`)
- Toggle on different pages
- Persistence on navigation
- Persistence on page reload
- Correct aria labels
- Toggle back to light mode

## CI Integration

E2E tests run automatically in CI on pull requests after the build job completes. Results are uploaded as artifacts.

## Configuration

See `playwright.config.ts` for test configuration including:
- Base URL settings
- Browser targets
- Test timeouts
- Reporter settings
