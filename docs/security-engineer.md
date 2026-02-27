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

### 2026-02-27
- **Replace hardcoded production URLs in .env.example** (PR #613):
  - Changed mitrabantennews.com to your-domain.com placeholders
  - Prevents information disclosure of production domain names
  - Developers should configure their own domain instead of seeing production defaults

- **Dockerfile.dev non-root user** (PR #597):
  - Added non-root user (nextjs) to development Docker container
  - Follows principle of least privilege
  - Aligns with production Dockerfile security practices

- **Extended Docker Compose security hardening** (PR #584):
  - Added no-new-privileges security option to WordPress, MySQL, and phpMyAdmin services
  - Added tmpfs mount for /tmp on all services (prevents temp file attacks)
  - Added read-only filesystem to phpMyAdmin service
  - Now all services have consistent security hardening

### 2026-02-26
- **Docker image hardening** (PR #565):
  - Added read-only root filesystem to frontend service in docker-compose.yml
  - Added tmpfs mount for temporary files
  - Added no-new-privileges security option
  - Added Trivy vulnerability scanner to security workflow

- **Docker update documentation** (PR #570):
  - Added Docker update guidelines section to docs/guides/development.md
  - Documents how Dependabot monitors Docker images
  - Provides instructions for reviewing and applying Docker updates
  - Addresses issue #521

- **Closed obsolete PR #542**: CSP already implemented in next.config.js, middleware.ts, and proxy.ts

### 2026-02-25
- **Added security headers to next.config.js**:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()

- **Added URL validation for environment variables** (PR #488):
  - validateUrl function ensures required NEXT_PUBLIC_* env vars are set
  - Enforces HTTPS for SITE_URL/SITE_URL_WWW in production

- **Added cross-origin isolation headers** (PR #507):
  - Cross-Origin-Opener-Policy: same-origin
  - Cross-Origin-Resource-Policy: same-origin
  - Cross-Origin-Embedder-Policy: require-corp

## Current Security Posture
The application has comprehensive security headers:
- CSP with nonce (proxy.ts middleware)
- HSTS with preload
- All recommended X-* headers
- Permissions-Policy
- COOP, CORP, COEP (cross-origin isolation)
- Rate limiting on all API routes
- HTML sanitization with DOMPurify
- Input validation for WordPress data

## Known Security Concerns (Future Work)
- Dockerfile passes secrets via build args - consider using Docker secrets for production

## Teammate Coordination
- Check other agents' memory files for relevant context
- Coordinate with security-focused agents to avoid duplicate work
