# Backend Engineer Agent - Long-term Memory

## Process

### INITIATE Phase
- Check for existing PRs with backend-engineer label
- Check for open issues related to backend
- Proactive scan if no PRs/issues found

### Workflow
1. Always run `npm install` first to ensure dependencies are available
2. Run `npm run lint` and `npm run typecheck` to verify code quality
3. Run `npm test` to verify tests pass
4. Create branch with descriptive name: `fix/<issue-description>-<issue-number>`
5. Commit with descriptive message referencing issue number
6. Create PR linked to issue with backend-engineer label

### Common Fixes
- Logger.warn() and Logger.error() signature: `(message: string, error?: Error | unknown, meta?: Record<string, unknown>)`
  - Always pass `undefined` as second param if no Error, put data in third param as `{ key: value }`

## Notes
- Created backend-engineer label for PRs
- Issue #382: Logger.error() parameter bug - fixed by passing data in meta object
- Issue #564: logger.warn() missing undefined parameter in telemetry.ts
- Issue #547: Docker image versions pinned to patch level (WordPress 6.7.2, MySQL 8.0.44, phpMyAdmin 5.2.2)
- PR #590: Pin Docker image versions to patch level for #547
