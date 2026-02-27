# Frontend Engineer Agent Documentation

## Overview
This document serves as the long-term memory for the frontend-engineer autonomous agent.

## Domain
- **Focus**: Frontend development (React, Next.js, TypeScript, Tailwind CSS)
- **Objective**: Small, safe, measurable improvements

## Workflow
1. **INITIATE**: Check for existing PRs with `frontend-engineer` label, check for issues
2. **PLAN**: Identify improvements
3. **IMPLEMENT**: Make changes
4. **VERIFY**: Run lint, typecheck, tests, build
5. **SELF-REVIEW**: Review the process
6. **SELF EVOLVE**: Learn and improve
7. **DELIVER**: Create PR with proper labels

## Code Quality Standards
- **Lint**: Must pass `npm run lint`
- **Typecheck**: Must pass `npm run typecheck`
- **Tests**: Must pass `npm test`
- **Build**: Must pass `npm run build` with no errors
- **Zero warnings**: No linting or build warnings

## Key Files & Patterns
- Components: `src/components/` (UI, layout, post)
- Pages: `src/app/` (Next.js App Router)
- Styles: `src/app/globals.css` (Tailwind + CSS variables)
- Config: `tailwind.config.js`, `eslint.config.js`

## Workflow Notes
1. Always verify if an issue is already fixed before implementing
2. Use proactive scanning to find frontend improvements
3. Run lint, typecheck, and build before creating PR
4. Use JSON-LD for SEO improvements (schema.org)

## Testing Issues Fixed
1. ServiceStatus test (issue #546): Changed from deprecated button.click() to fireEvent.click() - Already resolved in codebase

## Common Issues Found
1. Conditional ref assignment in maps (works but not ideal pattern)
2. Empty query searches trigger onSearch callback (intentional behavior)
3. Placeholder social media links in Footer
4. Hardcoded Tailwind colors (gray-*, red-*) in error.tsx and not-found.tsx - FIXED
5. Hardcoded Tailwind colors (green-500, yellow-500, red-500, gray-900) in ServiceStatus.tsx - FIXED

## Accessibility Improvements Made
1. Added prefers-reduced-motion support in globals.css (disables animations/transitions for users who prefer reduced motion)
2. Added aria-label="More pages" to Pagination ellipsis for screen reader context

## Frontend Consistency Improvements
1. Replaced hardcoded Tailwind colors with CSS variables in error.tsx and not-found.tsx for consistent theming

## Testing
- Framework: Jest + React Testing Library
- Run: `npm test`
- Watch mode: `npm test --watch`

## Notes
- The codebase uses Next.js 16 with React 19
- Tailwind CSS for styling
- HSL color variables for theming
- Dynamic imports for Footer component (performance)
- Memoization with custom `arePropsEqual` functions

## SEO Improvements Made
1. Added Organization schema in root layout (layout.tsx)
2. Added WebSite schema with SearchAction for site search
3. Added BreadcrumbList schema to post detail pages
4. NewsArticle schema was already present in post detail pages

## PWA & Asset Improvements
1. Added missing PWA icons: icon-192.png (192x192), icon-512.png (512x512)
2. Added apple-touch-icon.png (180x180) for iOS home screen
3. Added og-image.jpg (1200x630) for social media sharing
4. Added logo.png (512x512) for branding

## Code Quality Fixes
1. Removed empty CSP nonce meta tag from layout.tsx (served no purpose, CSP is handled via headers in next.config.js)
2. Replaced hardcoded Tailwind colors (green-500, yellow-500, red-500, gray-900) with CSS variables in ServiceStatus.tsx for consistent theming
