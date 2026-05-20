# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately before disclosing it publicly.

### How to Report

1. **Private Disclosure**: Send an email to security@mitrabantennews.com
2. **GitHub Security Advisory**: Use GitHub's [Private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) feature

### What to Include

- Detailed description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes or mitigations

### Response Time

We aim to respond to security reports within 48 hours and provide a fix within 7 days, depending on complexity.

## Security Measures

This project implements several security measures:
- Regular dependency audits (npm audit)
- Automated security scanning
- Secure workflow configurations
- Environment variable protection
- Security headers
- Rate limiting

## Security Headers

All responses include the following security headers via `src/middleware.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| X-DNS-Prefetch-Control | on | Enable DNS prefetching |
| X-Frame-Options | DENY | Prevent clickjacking |
| X-Content-Type-Options | nosniff | Prevent MIME type sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Control referrer info |
| Strict-Transport-Security | max-age=31536000; includeSubDomains | Enforce HTTPS |
| Content-Security-Policy | default-src 'self'... | Prevent XSS/injection |
| X-XSS-Protection | 1; mode=block | Legacy XSS filter |
| Permissions-Policy | interest-cohort=() | Disable FLoC |

### Content Security Policy (CSP)

The CSP policy restricts resource loading to:
- Scripts: 'self' with unsafe-inline/eval allowed for compatibility
- Styles: 'self' with unsafe-inline
- Images: 'self', data: URIs, and https:
- Connect: 'self' and https:
- Fonts: 'self'
- Frames: none (frame-ancestors: 'none')

## Rate Limiting

API routes implement rate limiting to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/posts | 60 | 60s |
| /api/summary | 30 | 60s |
| /api/cache | 30 | 60s |
| /api/rss | 30 | 60s |
| /api/media | 60 | 60s |
| /api/health | 120 | 60s |
| /api/metrics | 30 | 60s |

Rate limit headers returned:
- X-RateLimit-Limit: Maximum requests allowed
- X-RateLimit-Remaining: Remaining requests in window
- X-RateLimit-Reset: Unix timestamp when limit resets
- Retry-After: Seconds to wait (on 429 responses)

## Input Validation

All API endpoints validate:
- Numeric parameters (post IDs, page numbers)
- String parameters (slugs, categories)
- Query parameter bounds (per_page max: 100)

Invalid inputs return 400 Bad Request with descriptive error messages.

## XSS Prevention

- DOMPurify (isomorphic-dompurify) sanitizes HTML content
- Input validation on all user-facing parameters
- Output encoding in React components
- Content Security Policy blocks inline scripts

## Current Vulnerability Status

### Resolved
- Handlebars.js GHSA-3mfm-83xf-c92r (2026-04-21)
- Axios NO_PROXY bypass (2026-04-21)
- DOMPurify bypass (2026-04-21)

### Mitigated (via overrides)
- brace-expansion DoS: override in package.json
- serialize-javascript DoS: override in package.json
- follow-redirects header leak: override in package.json

## Security Best Practices

- Keep dependencies updated (run `npm audit`)
- Use environment variables for sensitive data
- Enable security headers in production
- Regular security audits
- Follow principle of least privilege
- Never commit secrets to version control
