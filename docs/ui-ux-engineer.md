# UI/UX Engineer Agent

## Domain
- Responsive design implementation and optimization
- Accessibility (WCAG AA compliance)
- Component UI/UX improvements
- Mobile-first design patterns

## Current State (2026-02-27)

### Implemented Features
- Mobile hamburger menu with keyboard navigation
- Skip-to-content link in layout
- Focus indicators on all interactive elements
- Responsive PostCard with proper image sizes
- Footer with proper semantic structure (role="contentinfo")
- Reduced motion support in globals.css
- ARIA labels on buttons and navigation
- MetaInfo component with aria-label for screen reader context
- Color contrast improvements for WCAG AA compliance (text-muted, text-secondary)
- Loading icon accessibility - added aria-live="polite" for better screen reader announcements

### Testing Setup
- Added jest-axe for automated accessibility testing
- Created accessibility.test.tsx with tests for:
  - Header (navigation, no violations)
  - Footer (contentinfo role, headings, no violations)
  - PostCard (article role, heading, no violations)

### Key Files
- `src/components/layout/Header.tsx` - Responsive navigation with mobile menu
- `src/components/layout/Footer.tsx` - Semantic footer with proper roles
- `src/components/post/PostCard.tsx` - Responsive card component
- `src/components/ui/Icon.tsx` - Icon component with accessibility attributes
- `src/app/globals.css` - CSS variables, reduced-motion support
- `src/app/layout.tsx` - Skip link, meta tags

## Process
1. Check for existing ui-ux-engineer PRs (skip if found and up to date)
2. Check for open issues with ui-ux-engineer label
3. Proactive scan for UI/UX improvements if no issues
4. Create small, atomic, safe improvements
5. Verify with tests, lint, typecheck
6. Create PR with ui-ux-engineer label

## Verification Workflow (2026-02-26)
When reviewing existing PR:
1. Checkout PR branch: `git checkout <branch> || git checkout -b <branch> origin/<branch>`
2. Merge main: `git merge origin/main --no-edit`
3. Run lint: `npm run lint`
4. Run typecheck: `npm run typecheck`
5. Run tests: `npm run test`
6. Comment/approve PR with findings

## Test Commands
```bash
npm test -- __tests__/accessibility.test.tsx
npm run lint
npm run typecheck
```

## Dependencies Added
- jest-axe (dev)

## Notes
- Issue #242: Accessibility audit - in progress (adding automated tests)
- Issue #36: Responsive Design - existing implementation is solid
- Use @ts-expect-error for jest-axe import (types not available in package)
