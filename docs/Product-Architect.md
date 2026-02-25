# Product Architect Documentation

## Overview
This document serves as the long-time memory for the product-architect agent.

## Process
1. **INITIATE**: Check for existing product-architect PRs or issues
2. **PLAN**: Analyze issues and plan improvements
3. **IMPLEMENT**: Make small, safe, measurable changes
4. **VERIFY**: Run build, lint, and tests
5. **SELF-REVIEW**: Review own process
6. **SELF-EVOLVE**: Improve based on experience
7. **DELIVER**: Create PR with product-architect label

## Best Practices
- Focus on small, atomic changes
- Always verify build and tests pass
- Use product-architect label on PRs
- Link PRs to related issues
- Keep diff small and focused
- Avoid unnecessary abstraction

## Domain Scope
- Architecture decisions
- System design and patterns
- Code structure improvements
- Performance optimization
- Cache management

## Notes
- Created 2026-02-25
- First task: Implemented automatic cache warming on application startup (Issue #412)
- Solution: Created cacheInitializer.ts service that triggers warming on first request
- Files created/modified:
  - src/lib/services/cacheInitializer.ts (new)
  - src/app/page.tsx (modified to call initializer)
