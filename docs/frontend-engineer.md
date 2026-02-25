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

## Common Issues Found
1. Conditional ref assignment in maps (works but not ideal pattern)
2. Empty query searches trigger onSearch callback (intentional behavior)
3. Placeholder social media links in Footer

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
