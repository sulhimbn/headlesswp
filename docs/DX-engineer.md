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
- Standard npm scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `check`
- `check` script runs lint + typecheck + test in one command for quick verification

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

### 2026-02-27
- **PR #625**: Fix Node version mismatch in security workflows - resolves issue #608
  - Updated security-workflows.yml to use Node.js 20 (matching .nvmrc)
  - Changed `node-version` from '18' to '20' in dependency-check job

- **PR #XXX**: Add `check` npm script for combined lint + typecheck + test verification
  - Added `npm run check` script to package.json for quick local verification
  - Updated docs/DX-engineer.md with new script documentation

- **PR #580**: Add local Docker development environment with hot reload - resolves issue #551
  - Created `Dockerfile.dev` for development mode with Next.js hot reload
  - Created `docker-compose.dev.yml` override with source code volume mounting
  - Updated `docs/guides/development.md` with Docker dev workflow

- **PR #598**: Update Node.js version to 20+ in documentation
  - Updated README.md and CONTRIBUTING.md to reflect Node.js 20+ requirement
  - Aligns documentation with .nvmrc and CI configuration

### 2026-02-26
- **PR #522**: Dockerfile Node.js version alignment (commented - already resolved in main)
- **PR #541**: Add SEO static assets (favicon.ico, robots.txt) - resolves issue #513
- **PR #554**: Align .nvmrc with CI node-version (use 20 for latest 20.x) - resolves issue #549
