# Troubleshooting Guide

Comprehensive troubleshooting guide for common issues in HeadlessWP development and deployment.

## Table of Contents

- [Docker & WordPress Issues](#docker--wordpress-issues)
- [Next.js & Frontend Issues](#nextjs--frontend-issues)
- [API & Data Issues](#api--data-issues)
- [Build & Deployment Issues](#build--deployment-issues)
- [Testing Issues](#testing-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)

---

## Docker & WordPress Issues

### WordPress container not starting

**Symptoms**:
- `docker-compose up -d` shows WordPress as "Exit" or "Restarting"
- Accessing http://localhost:8080 shows connection refused

**Diagnosis**:
```bash
# Check container status
docker-compose ps

# Check WordPress logs
docker-compose logs wordpress

# Check if port 8080 is already in use
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows
```

**Solutions**:

1. **Port conflict** - Change WordPress port in `docker-compose.yml`:
```yaml
services:
  wordpress:
    ports:
      - "8081:80"  # Use 8081 instead of 8080
```

2. **Database connection issue** - Check MySQL container is running:
```bash
docker-compose ps db
docker-compose logs db
```

3. **Volume permissions** - On Linux, fix volume permissions:
```bash
sudo chown -R 33:33 ./wp-content
```

4. **Recreate containers**:
```bash
docker-compose down
docker-compose up -d
```

---

### WordPress API returns 404

**Symptoms**:
- http://localhost:8080/wp-json/wp/v2/ returns 404
- API calls fail with "Not Found" error

**Diagnosis**:
```bash
# Check if WordPress REST API is enabled
curl http://localhost:8080/wp-json/

# Check WordPress rewrite rules
docker-compose exec wordpress wp rewrite flush
```

**Solutions**:

1. **Flush permalinks**:
```bash
docker-compose exec wordpress wp rewrite flush
```

2. **Check WordPress URL configuration** in `wp-config.php`:
```php
define('WP_HOME', 'http://localhost:8080');
define('WP_SITEURL', 'http://localhost:8080');
```

3. **Restart WordPress container**:
```bash
docker-compose restart wordpress
```

---

### phpMyAdmin cannot connect to MySQL

**Symptoms**:
- http://localhost:8081 shows "Connection for controluser as defined in your configuration failed"

**Solutions**:

1. **Check MySQL container is running**:
```bash
docker-compose ps db
```

2. **Wait for MySQL to fully start** (can take 30+ seconds):
```bash
# Check MySQL logs
docker-compose logs db | grep "ready for connections"
```

3. **Verify database credentials** in `docker-compose.yml` match phpMyAdmin configuration.

---

### Database connection errors

**Symptoms**:
- WordPress shows "Error establishing database connection"
- Frontend API calls fail with database errors

**Diagnosis**:
```bash
# Check MySQL container
docker-compose ps db

# Check MySQL logs
docker-compose logs db

# Test MySQL connection
docker-compose exec db mysql -u wordpress -pwordpress wordpress -e "SHOW TABLES;"
```

**Solutions**:

1. **Wait for MySQL initialization**:
```bash
# Monitor MySQL startup
docker-compose logs -f db
# Wait for "ready for connections" message
```

2. **Restart database**:
```bash
docker-compose restart db
```

3. **Check database credentials** in `docker-compose.yml`:
```yaml
services:
  db:
    environment:
      MYSQL_ROOT_PASSWORD: wordpress
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: wordpress
```

---

## Next.js & Frontend Issues

### Frontend not loading

**Symptoms**:
- http://localhost:3000 shows blank page or error
- Browser shows "This site can't be reached"

**Diagnosis**:
```bash
# Check Next.js dev server is running
lsof -i :3000  # macOS/Linux

# Check Next.js logs
npm run dev
```

**Solutions**:

1. **Start Next.js dev server**:
```bash
npm run dev
```

2. **Check for compilation errors**:
```bash
npm run typecheck
npm run lint
```

3. **Clear Next.js cache**:
```bash
rm -rf .next
npm run dev
```

---

### Build shows middleware deprecation warning

**Symptoms**:
- `npm run build` shows warning: "The 'middleware' file convention is deprecated. Please use 'proxy' instead"
- Build succeeds but shows deprecation warning

**Diagnosis**:
```bash
# Run build to see warnings
npm run build
```

**Solutions**:

The middleware file is currently using the deprecated convention. The migration to `proxy` file is planned for a future update. For now:

1. **Ignore the warning** - The middleware functionality works correctly despite the deprecation warning
2. **Monitor for updates** - Check Next.js documentation and repository for proxy file implementation

**Note**: The middleware provides security features (CSP headers, security headers) that are currently working. The deprecation warning does not affect functionality.

---

### Build fails with TypeScript errors

**Symptoms**:
- `npm run build` fails with TypeScript errors
- `npm run typecheck` shows type errors

**Diagnosis**:
```bash
# Run type checking
npm run typecheck

# Check specific errors
npm run typecheck -- --pretty
```

**Common Issues & Solutions**:

1. **Missing type definitions**:
```bash
# Install missing type packages
npm install --save-dev @types/package-name
```

2. **Implicit any error** - Add explicit types:
```typescript
// Bad
function processData(data) {
  return data
}

// Good
function processData(data: unknown) {
  return data
}
```

3. **Module resolution error** - Check `tsconfig.json` paths:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

4. **Clean and reinstall**:
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

---

### Page shows "Failed to fetch" error

**Symptoms**:
- Frontend shows error fetching posts
- Network tab shows failed API requests

**Diagnosis**:
```bash
# Check WordPress is running
curl http://localhost:8080/wp-json/wp/v2/posts

# Check environment variables
cat .env | grep WORDPRESS
```

**Solutions**:

1. **WordPress not running**:
```bash
docker-compose up -d
```

2. **Incorrect API URL** in `.env`:
```env
# Local development
NEXT_PUBLIC_WORDPRESS_API_URL=http://localhost:8080/wp-json

# Production
NEXT_PUBLIC_WORDPRESS_API_URL=https://mitrabantennews.com/wp-json
```

3. **CORS issues** - Check WordPress CORS headers or use proxy.

4. **Circuit breaker open** - Wait 60 seconds or check circuit breaker logs:
```typescript
// Check circuit breaker state in logs
import { getCircuitBreakerState } from '@/lib/api/circuitBreaker'
console.log(getCircuitBreakerState())
```

---

### Infinite loading state

**Symptoms**:
- Page shows loading skeleton forever
- No error displayed

**Diagnosis**:

1. Check browser DevTools Network tab for pending requests
2. Check console for JavaScript errors
3. Check API endpoint is responding

**Solutions**:

1. **API timeout** - Increase timeout or check WordPress performance:
```typescript
// src/lib/api/config.ts
export const API_TIMEOUT = 30000 // 30 seconds
```

2. **Component not rendering data** - Add error boundary:
```typescript
<ErrorBoundary fallback={<Error />}>
  <MyComponent />
</ErrorBoundary>
```

3. **Circuit breaker blocking requests**:
```bash
# Restart containers
docker-compose restart wordpress
```

---

## API & Data Issues

### API returns empty data

**Symptoms**:
- API calls succeed but return empty arrays
- No posts displayed on page

**Diagnosis**:
```bash
# Check WordPress has posts
curl http://localhost:8080/wp-json/wp/v2/posts

# Check post status
docker-compose exec wordpress wp post list --post_type=post
```

**Solutions**:

1. **No published posts** - Create test posts in WordPress admin:
```
http://localhost:8080/wp-admin
```

2. **Posts are drafts** - Publish posts in WordPress admin

3. **Category/tag filtering issue** - Check filter parameters:
```typescript
// Bad - Wrong category ID
const posts = await wordpressAPI.getPosts({ category: 999 })

// Good - Valid category ID
const posts = await wordpressAPI.getPosts({ category: 1 })
```

---

### Media images not loading

**Symptoms**:
- Posts display but images show broken link
- Console shows 404 for image URLs

**Diagnosis**:
```bash
# Check media endpoint
curl http://localhost:8080/wp-json/wp/v2/media

# Check specific media ID
curl http://localhost:8080/wp-json/wp/v2/media/123
```

**Solutions**:

1. **Featured media not set** - Set featured image in WordPress admin

2. **Media ID invalid** - Check post has valid `featured_media`:
```typescript
const post = await wordpressAPI.getPost('slug')
console.log(post.featured_media) // Should be a number, not 0
```

3. **Use enhancedPostService** - Automatically resolves media URLs:
```typescript
import { enhancedPostService } from '@/lib/services/enhancedPostService'

const posts = await enhancedPostService.getLatestPosts()
// Posts include mediaUrl property
```

---

### Rate limiting errors

**Symptoms**:
- API calls fail with 429 status
- Error message: "Rate limit exceeded"

**Diagnosis**:
```bash
# Check API logs
docker-compose logs wordpress | grep "rate limit"
```

**Solutions**:

1. **Reduce request frequency** - Implement client-side caching:
```typescript
// EnhancedPostService includes caching
const posts = await enhancedPostService.getLatestPosts()
// Subsequent calls use cache (5 minutes TTL)
```

2. **Batch requests**:
```typescript
// Good - Batch media fetching
const posts = await enhancedPostService.getLatestPosts()
// Media URLs fetched in single batch

// Bad - Sequential requests
for (const post of posts) {
  const media = await wordpressAPI.getMedia(post.featured_media)
}
```

3. **Increase rate limit** (if using production API):
```typescript
// src/lib/api/config.ts
export const RATE_LIMIT_MAX_REQUESTS = 100 // Increase from 60
```

---

## Build & Deployment Issues

### Build fails during static generation

**Symptoms**:
- `npm run build` fails with error
- Error mentions "Failed to fetch" or "Network error"

**Diagnosis**:
```bash
# Run build with verbose output
npm run build -- --debug

# Check build logs for API errors
```

**Solutions**:

1. **WordPress API unavailable during build**:
```env
# Set SKIP_RETRIES to true during CI/build
SKIP_RETRIES=true
```

2. **Use postService with fallbacks**:
```typescript
import { enhancedPostService } from '@/lib/services/enhancedPostService'

const posts = await enhancedPostService.getLatestPosts()
// Returns fallback posts if API fails
```

3. **Build with local WordPress**:
```bash
# Ensure WordPress is running
docker-compose up -d

# Wait for WordPress to be ready
curl http://localhost:8080/wp-json/wp/v2/posts

# Then build
npm run build
```

---

### Production build errors

**Symptoms**:
- Build succeeds but deployed site shows errors
- Static pages missing or broken

**Diagnosis**:
```bash
# Test production build locally
npm run build
npm run start

# Check build output
ls -la .next/static
```

**Solutions**:

1. **Missing environment variables** - Set production `.env`:
```env
WORDPRESS_URL=https://mitrabantennews.com
NEXT_PUBLIC_WORDPRESS_URL=https://mitrabantennews.com
NEXT_PUBLIC_WORDPRESS_API_URL=https://mitrabantennews.com/wp-json
```

2. **CORS issues with production API** - Configure WordPress CORS plugin

3. **Check build output files**:
```bash
# Verify static files were generated
ls -la .next/static/chunks
ls -la .next/server/app
```

---

### Docker build fails

**Symptoms**:
- `docker build` fails with error
- Error mentions "npm install" or "Module not found"

**Diagnosis**:
```bash
# Build with verbose output
docker build --progress=plain -t headlesswp .
```

**Solutions**:

1. **Clear Docker cache**:
```bash
docker builder prune
docker build --no-cache -t headlesswp .
```

2. **Check Dockerfile** for correct base image:
```dockerfile
FROM node:20-alpine AS deps
# Ensure correct Node.js version
```

3. **Verify package.json** exists in build context:
```dockerfile
# Dockerfile
COPY package*.json ./
RUN npm ci
```

---

## Testing Issues

### Tests timeout or fail intermittently

**Symptoms**:
- Tests pass sometimes, fail other times
- Timeout errors in test output

**Diagnosis**:
```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests with longer timeout
npm test -- --testTimeout=30000
```

**Solutions**:

1. **Async test not waiting properly**:
```typescript
// Bad - Not waiting
test('fetches posts', () => {
  fetchPosts()
  expect(screen.getByText('Post')).toBeInTheDocument()
})

// Good - Using async/await
test('fetches posts', async () => {
  await fetchPosts()
  expect(screen.getByText('Post')).toBeInTheDocument()
})
```

2. **Mock not set up correctly**:
```typescript
// Bad - Mock after import
import { fetchPosts } from '@/api'
jest.mock('@/api')

// Good - Mock before import
jest.mock('@/api')
import { fetchPosts } from '@/api'
```

3. **Flaky timing tests** - Use waitFor instead of fixed timeout:
```typescript
// Bad
setTimeout(() => {
  expect(element).toBeInTheDocument()
}, 1000)

// Good
await waitFor(() => {
  expect(element).toBeInTheDocument()
})
```

---

### Tests fail in CI but pass locally

**Symptoms**:
- Tests pass on local machine
- CI pipeline shows test failures

**Diagnosis**:
```bash
# Check CI logs for specific failures
# Look for environment differences
```

**Solutions**:

1. **WordPress API unavailable in CI**:
```env
# Set in CI environment
SKIP_RETRIES=true
WORDPRESS_API_AVAILABLE=false
```

2. **Time zone differences**:
```bash
# Set consistent timezone in CI
export TZ=UTC
```

3. **Node.js version mismatch**:
```json
// package.json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

4. **Skip integration tests in CI**:
```typescript
// __tests__/apiResilienceIntegration.test.ts
const skipIntegrationTests = process.env.WORDPRESS_API_AVAILABLE !== 'true'

describe.skipIf(skipIntegrationTests)('API Resilience Integration', () => {
  // Tests
})
```

---

## Performance Issues

### Slow page load times

**Symptoms**:
- Pages take > 3 seconds to load
- Initial bundle size > 200KB

**Diagnosis**:
```bash
# Analyze bundle size
npm run build
# Check build output for bundle sizes
```

**Solutions**:

1. **Enable ISR caching**:
```typescript
// In page file
export const revalidate = 300 // Revalidate every 5 minutes
```

2. **Optimize images**:
```tsx
import Image from 'next/image'

<Image
  src={post.featured_media_url}
  alt={post.title.rendered}
  width={800}
  height={600}
  loading="lazy"
/>
```

3. **Use dynamic imports**:
```tsx
const PostCard = dynamic(() => import('@/components/post/PostCard'), {
  loading: () => <Skeleton />
})
```

4. **Parallelize API calls**:
```typescript
// Good - Parallel
const [posts, categories, tags] = await Promise.all([
  enhancedPostService.getLatestPosts(),
  wordpressAPI.getCategories(),
  wordpressAPI.getTags(),
])

// Bad - Sequential
const posts = await enhancedPostService.getLatestPosts()
const categories = await wordpressAPI.getCategories()
const tags = await wordpressAPI.getTags()
```

---

### High memory usage

**Symptoms**:
- Node.js process uses > 500MB memory
- Memory leaks in development

**Diagnosis**:
```bash
# Check memory usage
ps aux | grep node

# Use Node.js profiler
node --inspect app.js
```

**Solutions**:

1. **Clear cache periodically**:
```typescript
// In production
import { clearCache } from '@/lib/cache'

setInterval(() => {
  clearCache()
}, 3600000) // Clear every hour
```

2. **Limit cache size**:
```typescript
// src/lib/cache.ts
export const MAX_CACHE_SIZE = 1000 // Limit cache entries
```

3. **Use production build**:
```bash
npm run build
npm run start  # Production build, not dev mode
```

---

## Security Issues

### XSS vulnerabilities detected

**Symptoms**:
- Security scanner finds XSS vulnerabilities
- Scripts executing in user content

**Diagnosis**:
```bash
# Run security audit
npm audit:security
```

**Solutions**:

1. **Always sanitize user content**:
```typescript
import { sanitizeHTML } from '@/lib/utils/sanitizeHTML'

// Good
const safeContent = sanitizeHTML(post.content.rendered, 'full')
<div dangerouslySetInnerHTML={{ __html: safeContent }} />

// Bad - No sanitization
<div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
```

2. **Check CSP violations**:
```bash
# Check CSP report endpoint logs
curl http://localhost:3000/api/csp-report
```

3. **Verify CSP headers**:
```typescript
// src/middleware.ts
// Check nonce is being generated and applied
```

---

### CSP violation errors

**Symptoms**:
- Browser console shows CSP violation errors
- Scripts or styles not loading

**Diagnosis**:
```bash
# Check CSP headers in browser DevTools
# Look for "Content-Security-Policy" header
```

**Solutions**:

1. **Add missing sources to CSP**:
```typescript
// src/middleware.ts
const scriptSrc = [
  "'self'",
  "'nonce-{nonce}'",
  'https://mitrabantennews.com',
  'https://cdn.example.com', // Add CDN if needed
].join(' ')
```

2. **Check for inline scripts**:
```tsx
// Bad - Inline script (violates CSP)
<script>
  console.log('inline script')
</script>

// Good - External script
<script src="/scripts/my-script.js" nonce={nonce}></script>
```

3. **Development mode** - CSP allows 'unsafe-inline' in development:
```typescript
// src/middleware.ts
const isDev = process.env.NODE_ENV === 'development'
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' 'unsafe-eval'"
  : "'self' 'nonce-{nonce}' https://mitrabantennews.com"
```

---

## Getting Help

If you can't resolve your issue:

1. **Search existing issues**: https://github.com/sulhimbn/headlesswp/issues
2. **Check documentation**:
   - [Architecture Blueprint](./blueprint.md)
   - [API Documentation](./api.md)
   - [Development Guide](./guides/development.md)
3. **Create a new issue**: Include:
   - Environment (OS, Node.js version)
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages and logs

## Quick Reference

### Common Commands

```bash
# Docker
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose ps                 # Check status
docker-compose logs [service]     # View logs

# Next.js
npm run dev                      # Start dev server
npm run build                    # Build for production
npm run start                    # Start production server
npm run lint                     # Check code style
npm run typecheck                # Check TypeScript
npm test                         # Run tests

# Troubleshooting
rm -rf .next node_modules        # Clean and reinstall
docker-compose restart [service]  # Restart service
docker-compose down -v           # Stop and remove volumes
```

### Useful Ports

| Service | Port | URL |
|---------|-------|-----|
| Next.js Frontend | 3000 | http://localhost:3000 |
| WordPress | 8080 | http://localhost:8080 |
| WordPress Admin | 8080 | http://localhost:8080/wp-admin |
| phpMyAdmin | 8081 | http://localhost:8081 |

### Log Locations

```bash
# Docker logs
docker-compose logs wordpress     # WordPress logs
docker-compose logs db           # MySQL logs
docker-compose logs phpmyadmin   # phpMyAdmin logs

# Next.js logs
npm run dev                    # Console output
.next/server.log               # Production logs (if configured)
```
