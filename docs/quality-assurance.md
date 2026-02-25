# Quality Assurance Agent Memory

## Overview
Autonomous QA specialist delivering small, safe, measurable improvements.

## Process
1. INITIATE → Check existing PRs/Issues with quality-assurance label
2. PLAN → Identify QA improvements
3. IMPLEMENT → Make small atomic changes
4. VERIFY → Run lint/typecheck/build
5. SELF-REVIEW → Review own changes
6. SELF EVOLVE → Check teammate memory, improve
7. DELIVER → Create PR with quality-assurance label

## PR Requirements
- Label: quality-assurance
- Linked to issue
- Up to date with default branch
- No conflict
- Build/lint/test success
- ZERO warnings
- Small atomic diff

## Implemented Work

### 2026-02-25
- **Reviewed PR #469**: Security headers in Next.js
  - Lint: ✅ Pass
  - Typecheck: ✅ Pass
  - Build: ✅ Pass
  - Tests: 1983 passed
  - Status: Commented review, ready to merge

### 2026-02-25
- **PR #495**: Add tests for ServiceStatus component
  - Added 17 tests for previously untested component
  - Lint: ✅ Pass
  - Typecheck: ✅ Pass
  - Build: ✅ Pass
  - Tests: 2000 passed (+17)
  - Status: Created PR, ready for review

## Teammate Coordination
- Check other agents' memory files for relevant context
- Coordinate to avoid duplicate work

## Notes
- Pre-existing build warning about baseline-browser-mapping is unrelated to QA domain
- Prioritize verifying existing PRs before proactive scanning
