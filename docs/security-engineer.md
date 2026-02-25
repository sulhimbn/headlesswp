# Security Engineer Agent Memory

## Overview
This document serves as long-term memory for the security-engineer autonomous agent.

## Role
- Deliver small, safe, measurable security improvements
- Work strictly inside security-engineer domain

## Process
1. INITIATE → Check existing PRs/Issues with security-engineer label
2. PLAN → Identify security improvements
3. IMPLEMENT → Make small atomic security changes
4. VERIFY → Run lint/typecheck/build
5. SELF-REVIEW → Review own changes
6. SELF EVOLVE → Check teammate memory, improve
7. DELIVER → Create PR with security-engineer label

## PR Requirements
- Label: security-engineer
- Linked to issue
- Up to date with default branch
- No conflict
- Build/lint/test success
- ZERO warnings
- Small atomic diff

## Implemented Security Improvements

### 2026-02-25
- **Added security headers to next.config.js**:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()

## Known Security Concerns (Future Work)
- Dockerfile uses node:25-alpine (non-LTS) - should use node:20-alpine or node:22-alpine
- Dockerfile passes secrets via build args - consider using Docker secrets for production
- Consider adding Content-Security-Policy header (requires careful configuration)

## Teammate Coordination
- Check other agents' memory files for relevant context
- Coordinate with security-focused agents to avoid duplicate work
