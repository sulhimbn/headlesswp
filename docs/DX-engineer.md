# DX Engineer Documentation

## Overview
DX Engineer focuses on improving developer experience through small, safe, measurable improvements within the codebase.

## Principles
- Small, atomic changes
- Zero warnings in build/lint/test
- No breaking changes
- Focus on tooling, configuration, and developer ergonomics

## Areas of Focus

### TypeScript Configuration
- Strict mode enabled
- Path aliases configured (`@/*`, `@/components/*`, `@/lib/*`, `@/types/*`)
- Consider adding `noImplicitReturns` incrementally

### Code Quality Tools
- ESLint for code linting
- TypeScript for type checking
- Jest for testing

### Development Workflow
- Node version managed via `.nvmrc`
- Standard npm scripts: `dev`, `build`, `lint`, `typecheck`, `test`

## Common Improvements
1. Configuration files (tsconfig.json, eslint.config.js)
2. Developer tooling (.nvmrc, .editorconfig)
3. Scripts in package.json
4. CI/CD improvements
5. Documentation for developer workflows

## Notes
- Avoid introducing new dependencies without strong justification
- Always verify changes with `npm run lint && npm run typecheck && npm test`
- Keep changes atomic and focused

## Recent Work

### 2026-02-26
- **PR #522**: Dockerfile Node.js version alignment (commented - already resolved in main)
- **PR #541**: Add SEO static assets (favicon.ico, robots.txt) - resolves issue #513
- **PR #554**: Align .nvmrc with CI node-version (use 20 for latest 20.x) - resolves issue #549
