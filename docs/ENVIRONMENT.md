# Environment Variables Reference

This document lists all environment variables used in the headless WordPress/Next.js project.

## Quick Reference

| Variable | Required | Default | Category |
|----------|----------|---------|----------|
| `NEXT_PUBLIC_WORDPRESS_URL` | Yes | - | API |
| `NEXT_PUBLIC_WORDPRESS_API_URL` | Yes | - | API |
| `NEXT_PUBLIC_SITE_URL` | No | `https://mitrabantennews.com` | API |
| `NEXT_PUBLIC_SITE_URL_WWW` | No | `https://www.mitrabantennews.com` | API |
| `SKIP_RETRIES` | No | `false` | API |
| `NEXT_PUBLIC_FEATURE_PERSONALIZED_RECOMMENDATIONS` | No | `false` | Feature |
| `NEXT_PUBLIC_FEATURE_RECOMMENDATION_ANALYTICS` | No | `false` | Feature |
| `SENTRY_DSN` | No | - | Telemetry |
| `NEXT_PUBLIC_SENTRY_DSN` | No | - | Telemetry |
| `SENTRY_ORG` | No | - | Telemetry |
| `SENTRY_PROJECT` | No | - | Telemetry |
| `NEXT_PUBLIC_CSP_REPORT_ENDPOINT` | No | `/api/csp-report` | Security |
| `SECURITY_HEADERS_ENABLED` | No | `true` | Security |
| `CSP_ENABLED` | No | `true` | Security |
| `WP_AUTH_KEY` | No | - | Security |
| `WP_SECURE_AUTH_KEY` | No | - | Security |
| `WP_LOGGED_IN_KEY` | No | - | Security |
| `WP_NONCE_KEY` | No | - | Security |
| `WP_AUTH_SALT` | No | - | Security |
| `WP_SECURE_AUTH_SALT` | No | - | Security |
| `WP_LOGGED_IN_SALT` | No | - | Security |
| `WP_NONCE_SALT` | No | - | Security |
| `WP_USERNAME` | No | - | Auth |
| `WP_PASSWORD` | No | - | Auth |
| `MYSQL_DATABASE` | No | `wordpress` | Database |
| `MYSQL_USER` | No | `wordpress` | Database |
| `MYSQL_PASSWORD` | No | - | Database |
| `MYSQL_ROOT_PASSWORD` | No | - | Database |
| `SUMMARY_PROVIDER` | No | `local` | AI |
| `SUMMARY_API_KEY` | No | - | AI |
| `SUMMARY_MODEL` | No | `gpt-3.5-turbo` (OpenAI) / `claude-3-haiku-20240307` (Anthropic) | AI |
| `SUMMARY_MAX_TOKENS` | No | `200` | AI |
| `SUMMARY_TEMPERATURE` | No | `0.7` | AI |
| `WP_DEBUG` | No | `false` | Development |
| `WP_DEBUG_LOG` | No | `false` | Development |
| `WP_DEBUG_DISPLAY` | No | `false` | Development |
| `NODE_ENV` | No | `development` | Development |

---

## Required Variables

### API Configuration

#### `NEXT_PUBLIC_WORDPRESS_URL`
- **Type**: URL string
- **Required**: Yes
- **Description**: The public URL of the WordPress site
- **Example**: `https://example.com`
- **Source**: `src/lib/config/envValidation.ts:15-18`

#### `NEXT_PUBLIC_WORDPRESS_API_URL`
- **Type**: URL string
- **Required**: Yes
- **Description**: The WordPress REST API URL
- **Example**: `https://example.com/wp-json`
- **Source**: `src/lib/config/envValidation.ts:20-23`

---

## Optional Variables

### API Configuration

#### `NEXT_PUBLIC_SITE_URL`
- **Type**: URL string
- **Required**: No
- **Default**: `https://mitrabantennews.com`
- **Description**: The public URL of this Next.js site
- **Example**: `https://example.com`
- **Source**: `src/lib/api/config.ts:3`

#### `NEXT_PUBLIC_SITE_URL_WWW`
- **Type**: URL string
- **Required**: No
- **Default**: `https://www.mitrabantennews.com`
- **Description**: The www URL of this Next.js site
- **Example**: `https://www.example.com`
- **Source**: `src/lib/api/config.ts:4`

#### `SKIP_RETRIES`
- **Type**: boolean (`true` | `false`)
- **Required**: No
- **Default**: `false`
- **Description**: Skip retries for API requests. Set to `true` during CI/build when WordPress backend is not available to skip API retry delays during static generation
- **Example**: `true`
- **Source**: `src/lib/api/config.ts:24`

### Feature Flags

#### `NEXT_PUBLIC_FEATURE_PERSONALIZED_RECOMMENDATIONS`
- **Type**: boolean (`true` | `false`)
- **Required**: No
- **Default**: `false`
- **Description**: Enable personalized recommendations feature
- **Example**: `true`
- **Source**: `src/lib/config/envValidation.ts:38-41`
- **Source**: `src/lib/api/config.ts:58`

#### `NEXT_PUBLIC_FEATURE_RECOMMENDATION_ANALYTICS`
- **Type**: boolean (`true` | `false`)
- **Required**: No
- **Default**: `false`
- **Description**: Enable recommendation analytics feature
- **Example**: `true`
- **Source**: `src/lib/config/envValidation.ts:43-46`
- **Source**: `src/lib/api/config.ts:59`

### Telemetry

#### `SENTRY_DSN`
- **Type**: string
- **Required**: No
- **Description**: Sentry server-side DSN for error tracking. Leave empty to disable
- **Example**: `https://xxx@sentry.io/xxx`
- **Source**: `sentry.server.config.ts:4`
- **Source**: `sentry.edge.config.ts:4`
- **Source**: `next.config.js:98`

#### `NEXT_PUBLIC_SENTRY_DSN`
- **Type**: string
- **Required**: No
- **Description**: Sentry client-side DSN for browser error tracking. Leave empty to disable
- **Example**: `https://xxx@sentry.io/xxx`
- **Source**: `sentry.client.config.ts:4`

#### `SENTRY_ORG`
- **Type**: string
- **Required**: No (only if Sentry enabled)
- **Description**: Sentry organization name
- **Example**: `my-org`
- **Source**: `.env.example:68`

#### `SENTRY_PROJECT`
- **Type**: string
- **Required**: No (only if Sentry enabled)
- **Description**: Sentry project name
- **Example**: `my-project`
- **Source**: `.env.example:69`

### Security

#### `NEXT_PUBLIC_CSP_REPORT_ENDPOINT`
- **Type**: string
- **Required**: No
- **Default**: `/api/csp-report`
- **Description**: CSP Report Endpoint for security headers
- **Example**: `/api/csp-report`
- **Source**: `.env.example:59`

#### `SECURITY_HEADERS_ENABLED`
- **Type**: boolean (`true` | `false`)
- **Required**: No
- **Default**: `true`
- **Description**: Enable security headers
- **Example**: `true`
- **Source**: `.env.example:62`

#### `CSP_ENABLED`
- **Type**: boolean (`true` | `false`)
- **Required**: No
- **Default**: `true`
- **Description**: Enable Content Security Policy
- **Example**: `true`
- **Source**: `.env.example:63`

#### WordPress Authentication Keys and Salts

These variables are **critical for production security**. Generate secure keys using: https://api.wordpress.org/secret-key/1.1/salt/

| Variable | Description |
|----------|-------------|
| `WP_AUTH_KEY` | Authentication unique key |
| `WP_SECURE_AUTH_KEY` | Secure authentication key |
| `WP_LOGGED_IN_KEY` | Logged in key |
| `WP_NONCE_KEY` | Nonce key |
| `WP_AUTH_SALT` | Authentication salt |
| `WP_SECURE_AUTH_SALT` | Secure authentication salt |
| `WP_LOGGED_IN_SALT` | Logged in salt |
| `WP_NONCE_SALT` | Nonce salt |

**Source**: `.env.example:24-31`

### Authentication

#### `WP_USERNAME`
- **Type**: string
- **Required**: No
- **Description**: WordPress username for authenticated API requests
- **Example**: `admin`
- **Source**: `.env.example:17`

#### `WP_PASSWORD`
- **Type**: string
- **Required**: No
- **Description**: WordPress application password for authenticated API requests
- **Example**: `xxxx xxxx xxxx xxxx`
- **Source**: `.env.example:18`

### Database

#### `MYSQL_DATABASE`
- **Type**: string
- **Required**: No
- **Default**: `wordpress`
- **Description**: MySQL database name
- **Example**: `wordpress`
- **Source**: `.env.example:34`

#### `MYSQL_USER`
- **Type**: string
- **Required**: No
- **Default**: `wordpress`
- **Description**: MySQL database user
- **Example**: `wordpress`
- **Source**: `.env.example:35`

#### `MYSQL_PASSWORD`
- **Type**: string
- **Required**: No
- **Description**: MySQL database password
- **Example**: `your_secure_password`
- **Source**: `.env.example:36`

#### `MYSQL_ROOT_PASSWORD`
- **Type**: string
- **Required**: No
- **Description**: MySQL root password
- **Example**: `your_secure_root_password`
- **Source**: `.env.example:37`

### AI Content Summarization

#### `SUMMARY_PROVIDER`
- **Type**: string (`openai` | `anthropic` | `local`)
- **Required**: No
- **Default**: `local`
- **Description**: AI provider for content summarization
- **Example**: `openai`
- **Source**: `.env.example:74`

#### `SUMMARY_API_KEY`
- **Type**: string
- **Required**: Only if using `openai` or `anthropic` provider
- **Description**: API key for OpenAI or Anthropic
- **Example**: `sk-...`
- **Source**: `.env.example:76`

#### `SUMMARY_MODEL`
- **Type**: string
- **Required**: No
- **Default**: `gpt-3.5-turbo` (OpenAI) / `claude-3-haiku-20240307` (Anthropic)
- **Description**: AI model to use for summarization
- **Example**: `gpt-4`
- **Source**: `.env.example:78`

#### `SUMMARY_MAX_TOKENS`
- **Type**: number
- **Required**: No
- **Default**: `200`
- **Description**: Maximum tokens for summary generation
- **Example**: `300`
- **Source**: `.env.example:80`

#### `SUMMARY_TEMPERATURE`
- **Type**: number (0-1)
- **Required**: No
- **Default**: `0.7`
- **Description**: Temperature for AI generation
- **Example**: `0.5`
- **Source**: `.env.example:82`

### Development

#### `NODE_ENV`
- **Type**: string (`development` | `production` | `test`)
- **Required**: No
- **Default**: `development`
- **Description**: Node environment
- **Example**: `production`
- **Source**: `.env.example:45`

#### `WP_DEBUG`
- **Type**: boolean (`true` | `false`)
- **Required**: No
- **Default**: `false`
- **Description**: WordPress debug mode. **WARNING: Disable in production!**
- **Example**: `false`
- **Source**: `.env.example:48`

#### `WP_DEBUG_LOG`
- **Type**: boolean (`true` | `false`)
- **Required**: No
- **Default**: `false`
- **Description**: WordPress debug logging. **WARNING: Disable in production!**
- **Example**: `false`
- **Source**: `.env.example:49`

#### `WP_DEBUG_DISPLAY`
- **Type**: boolean (`true` | `false`)
- **Required**: No
- **Default**: `false`
- **Description**: WordPress debug display. **WARNING: Disable in production!**
- **Example**: `false`
- **Source**: `.env.example:50`

---

## Validation

Environment variables are validated at runtime via `src/lib/config/envValidation.ts`.

### Required Variables Check

The application validates required variables on startup. If any required variables are missing, the application will throw an error with a list of missing variables.

You can manually check the environment status:

```typescript
import { getEnvironmentStatus } from '@/lib/config/envValidation';

const status = getEnvironmentStatus();
console.log(status);
```

### Validation Result Structure

```typescript
interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}
```

---

## Configuration Examples

### Local Development

```bash
# WordPress API
NEXT_PUBLIC_WORDPRESS_URL=http://localhost:8080
NEXT_PUBLIC_WORDPRESS_API_URL=http://localhost:8080/wp-json
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL_WWW=http://localhost:3000

# Development mode
NODE_ENV=development
SKIP_RETRIES=false
```

### Production

```bash
# WordPress API
NEXT_PUBLIC_WORDPRESS_URL=https://example.com
NEXT_PUBLIC_WORDPRESS_API_URL=https://example.com/wp-json
NEXT_PUBLIC_SITE_URL=https://example.com
NEXT_PUBLIC_SITE_URL_WWW=https://www.example.com

# Production mode
NODE_ENV=production
SKIP_RETRIES=false

# Security headers
SECURITY_HEADERS_ENABLED=true
CSP_ENABLED=true

# Sentry (optional)
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### CI/Build Environment

```bash
# Skip API retries when WordPress is unavailable
SKIP_RETRIES=true
NODE_ENV=production
```

---

## Related Files

- `src/lib/config/envValidation.ts` - Environment variable validation
- `src/lib/api/config.ts` - API configuration constants
- `.env.example` - Example environment file
- `sentry.client.config.ts` - Client-side Sentry configuration
- `sentry.server.config.ts` - Server-side Sentry configuration
- `next.config.js` - Next.js configuration with Sentry integration