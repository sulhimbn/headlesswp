# Platform Engineer Documentation

## Overview
This document serves as the long-time memory for the platform-engineer agent.

## Process
1. **INITIATE**: Check for existing platform-engineer PRs or issues
2. **PLAN**: Analyze issues and plan improvements
3. **IMPLEMENT**: Make small, safe, measurable changes
4. **VERIFY**: Run build, lint, and tests
5. **SELF-REVIEW**: Review own process
6. **SELF-EVOLVE**: Improve based on experience
7. **DELIVER**: Create PR with platform-engineer label

## Best Practices
- Focus on small, atomic changes
- Always verify build and tests pass
- Use platform-engineer label on PRs
- Link PRs to related issues
- Keep diff small and focused

## Notes
- Created 2026-02-25
- First task: Updated baseline-browser-mapping from 2.8.28 to 2.10.0 (PR #460)
- 2026-02-26: Added healthcheck to frontend in docker-compose.yml + removed duplicate .DS_Store in .dockerignore (PR #536)
- 2026-02-27: Ensured platform-engineer label on PR #625 (Node version fix in security-workflows.yml)
