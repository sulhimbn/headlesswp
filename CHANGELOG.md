# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-21

### Added

- Initial production release for mitrabantennews.com
- Headless WordPress architecture with Next.js frontend
- AI-powered content summarization for article excerpts
- AI-powered semantic search with OpenAI embeddings and relevance scoring
- Progressive Web App (PWA) support with service worker and offline capabilities
- Automated OG image generation for social sharing
- JSON-LD structured data (Organization, WebSite, Breadcrumbs)
- hreflang tags for multilingual SEO support
- RSS feed endpoints for content distribution
- Author profile pages for content discovery
- Related articles on post detail pages
- Reading progress bar and reading time estimate
- Social sharing buttons
- Category and tag pages with linked badges
- Table of contents for article pages
- Dark mode support with design tokens
- Loading skeletons for Category, Tag, Author, and Search pages
- Personalized content recommendations based on reading patterns
- Predictive content prefetching with ML-based popularity scoring
- On-Demand ISR endpoint for WordPress webhook cache invalidation
- Redis cache adapter for multi-instance deployments
- Cache export/import functionality for debugging
- Bundle size monitoring
- Keyboard shortcuts for power users
- Storybook for component documentation
- E2E tests with Playwright for critical user flows
- Comprehensive API response caching strategy
- Page view analytics for user behavior insights
- Core Web Vitals real-time monitoring dashboard

### Security

- Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- Rate limiting on all API routes
- Input validation and sanitization
- Axios SSRF vulnerability fixes
- XSS sanitization for JSON-LD
- Runtime environment validation module

### Performance

- Next.js Image optimization for WordPress media
- Lazy loading with blur placeholders
- Code deduplication (SanitizeHTML utility)
- Tag page data fetching optimization
- Dynamic imports for SearchBar component

### Bug Fixes

- API error handling improvements
- Return proper HTTP status codes for API errors
- CORS headers on API routes
- Duplicate stripHtml function consolidation
- Type safety improvements (strict null checks)
- Middleware/proxy build conflict resolution
- Multiple npm audit vulnerability resolutions