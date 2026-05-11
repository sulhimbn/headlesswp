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

### Security Measures

This project implements several security measures:
- Regular dependency audits
- Automated security scanning
- Secure workflow configurations
- Environment variable protection

## Security Best Practices

- Keep dependencies updated
- Use environment variables for sensitive data
- Enable security headers in production
- Regular security audits
- Follow principle of least privilege

## Security.txt Endpoint

This project implements RFC 9116 security.txt specification to provide security researchers with a standardized way to contact the security team.

### Endpoints

- `/.well-known/security.txt` - Main security.txt file (preferred location per RFC 9116)
- `/security.txt` - Redirects to `/.well-known/security.txt`

### Configuration

The following environment variables can be used to configure the security.txt endpoint:

| Variable | Description | Default |
|----------|-------------|---------|
| `SECURITY_TXT_CONTACT` | Contact email for security researchers | `security@mitrabantennews.com` |
| `SECURITY_TXT_ENCRYPTION` | URL to public encryption key (PGP, etc.) | (none) |
| `SECURITY_TXT_LANGUAGES` | Preferred languages (comma-separated) | `en` |
| `SECURITY_TXT_POLICY` | URL to security policy | (none) |
| `SECURITY_TXT_EXPIRES` | Expiration date (ISO 8601 format) | (none) |

### Example

```
Contact: security@example.com
Encryption: https://example.com/pgp-key.txt
Preferred-Languages: en, id
Policy: https://example.com/security-policy
Expires: 2026-12-31T23:59:59Z
```

### Implementation

- Endpoint is dynamic and not cached
- Returns `Content-Type: text/plain`
- Accessible at `/.well-known/security.txt` (RFC 9116 recommended path)
- `/security.txt` redirects to the canonical location