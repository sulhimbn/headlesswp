# Architecture Blueprint

**Version**: 1.1.0  
**Last Updated**: 2025-01-07

## System Architecture

```
┌─────────────┐     REST API      ┌──────────────┐
│   Next.js   │ ◄──────────────► │  WordPress   │
│  Frontend   │   (wp-json)      │   Backend    │
└─────────────┘                  └──────────────┘
     │                                 │
     │                                 │
┌─────────────┐                  ┌──────────────┐
│   Docker    │                  │   MySQL      │
│  Container  │                  │  Database    │
└─────────────┘                  └──────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: CSS Modules (to be confirmed)
- **HTTP Client**: Axios 1.7
- **Security**: DOMPurify 3.3

### Backend
- **CMS**: WordPress
- **API Strategy**: REST API (wp-json/wp/v2/)
- **Database**: MySQL
- **Containerization**: Docker + Docker Compose

### Development
- **Testing**: Jest 30 + React Testing Library 16
- **Linting**: ESLint 8 with Next.js config
- **Version Control**: Git

## Design Principles

1. **REST API Only**: Use WordPress REST API exclusively (no GraphQL)
2. **Security First**: Sanitize all user inputs, implement CSP
3. **Performance**: Optimize bundle size, implement caching
4. **Type Safety**: Strong TypeScript coverage
5. **Test Coverage**: Comprehensive unit and integration tests

## API Standards

### Base URL
```
Development: http://localhost:8080/wp-json/wp/v2/
```

### Standard Endpoints
| Endpoint | Purpose | Usage | Optimization |
|----------|---------|-------|-------------|
| `/posts` | News articles | List/detail pages | Batch requests |
| `/categories` | Categories | Navigation/filtering | Cached 30min |
| `/tags` | Tags | Content organization | Cached 30min |
| `/media` | Images/media | Media assets | Batch fetching |
| `/users` | Authors | Author profiles | Cached 30min |

### Batch Operations
- **Media Batch**: `getMediaBatch(ids)` - Fetch multiple media items
- **Media URL Batch**: `getMediaUrlsBatch(ids)` - Resolve URLs in batch
- Reduces API calls from N to 1 for N media items

### Response Format
```typescript
interface Post {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  date: string
  modified: string
  author: number
  categories: number[]
  tags: number[]
  featured_media: number
  // ... additional fields
}
```

### API Standardization

**Principles**:
- **Backward Compatibility**: Never break existing API consumers
- **Consistent Naming**: `getById<T>()`, `getBySlug<T>()`, `getAll<T>()`, `search<T>()`
- **Consistent Error Handling**: All methods return `ApiResult<T>` or `ApiListResult<T>` with consistent error handling
- **Consistent Response Format**: Data, error, metadata, pagination
- **Type Safety**: TypeScript interfaces and type guards
- **Error Types**: `NETWORK_ERROR`, `TIMEOUT_ERROR`, `RATE_LIMIT_ERROR`, `SERVER_ERROR`, `CLIENT_ERROR`, `CIRCUIT_BREAKER_OPEN`, `UNKNOWN_ERROR`
- **Retry Flags**: Each error type has a retryable flag
- **Metadata**: Timestamp, endpoint, cacheHit, retryCount
- **Pagination**: Page, perPage, total, totalPages

**Standardized Response Wrapper** (`src/lib/api/response.ts`):
```typescript
interface ApiResult<T> {
  data: T
  error: ApiError | null
  metadata: ApiMetadata
  pagination?: ApiPaginationMetadata
}

interface ApiListResult<T> extends ApiResult<T[]> {
  pagination: ApiPaginationMetadata
}
```

**Standardized Methods** (`src/lib/api/standardized.ts`):
- **Posts**: `getPostById()`, `getPostBySlug()`, `getAllPosts()`, `searchPosts()`
- **Categories**: `getCategoryById()`, `getCategoryBySlug()`, `getAllCategories()`
- **Tags**: `getTagById()`, `getTagBySlug()`, `getAllTags()`
- **Media**: `getMediaById()`
- **Authors**: `getAuthorById()`

**Implementation Status**:
- ✅ **Phase 1 Complete**: Documentation and `ApiResult<T>` interface defined
- ✅ **Phase 2 Complete**: Standardized methods implemented in `src/lib/api/standardized.ts`
   - 31 methods (getById, getBySlug, getAll, search)
   - All methods return `ApiResult<T>` or `ApiListResult<T>` with consistent error handling
- ✅ **Phase 2 Complete**: Error result helper extracted for collection methods (REFACTOR-008)
   - Created `createErrorListResult()` helper to eliminate 52 lines of duplicate error result structure
   - Applied to `getAllPosts`, `searchPosts`, `getAllCategories`, `getAllTags`
- ⏳ **Phase 3**: Migrate new code and critical paths to use standardized methods (future)
- ⏳ **Phase 4**: Deprecate old methods in major version (future)

**See Also**: [API Standardization Guidelines](./API_STANDARDIZATION.md)

## Integration Resilience Patterns

**Last Updated**: 2026-01-08 (Senior Integration Engineer)

**Integration Status**: ✅ Production-ready, all resilience patterns verified and tested

### Circuit Breaker
- **Purpose**: Prevent cascading failures by stopping calls to failing services
- **Configuration**:
  - Failure Threshold: 5 failures before opening circuit
  - Recovery Timeout: 60 seconds before attempting recovery
  - Success Threshold: 2 successful requests to close circuit
- **States**: CLOSED (normal), OPEN (blocking), HALF_OPEN (testing)
- **Implementation**: `src/lib/api/circuitBreaker.ts`

### Retry Strategy
- **Purpose**: Automatically retry failed requests with exponential backoff
- **Configuration**:
  - Max Retries: 3 attempts
  - Initial Delay: 1000ms
  - Max Delay: 30000ms
  - Backoff Multiplier: 2x per retry
  - Jitter: Enabled to prevent thundering herd
- **Retry Conditions**:
  - Rate limit errors (429) - respects Retry-After header
  - Server errors (500-599)
  - Network errors (max 1 retry)
  - Timeout errors (max 1 retry)
- **Implementation**: `src/lib/api/retryStrategy.ts`

### Error Handling
- **Error Types**:
  - `NETWORK_ERROR` - Connection issues
  - `TIMEOUT_ERROR` - Request timeouts
  - `RATE_LIMIT_ERROR` - Rate limiting (429)
  - `SERVER_ERROR` - Server-side errors (5xx)
  - `CLIENT_ERROR` - Client-side errors (4xx)
  - `CIRCUIT_BREAKER_OPEN` - Circuit is blocking requests
  - `UNKNOWN_ERROR` - Unhandled errors
- **Standardized Format**:
  ```typescript
  {
    type: ApiErrorType,
    message: string,
    statusCode?: number,
    retryable: boolean,
    timestamp: string,
    endpoint?: string
  }
  ```
- **Implementation**: `src/lib/api/errors.ts`

### Request Cancellation
- **Purpose**: Cancel stale requests to prevent unnecessary processing
- **Implementation**: AbortController integration in API client
- **Usage**: All API methods accept optional `signal` parameter

### Health Check
- **Purpose**: Monitor WordPress API availability and verify service health
- **Features**:
  - Simple health check to verify API responsiveness
  - Timeout support to prevent hanging requests
  - Automatic retry with configurable attempts and delays
  - Last check result storage for quick access
  - Integration with circuit breaker for smart recovery
- **HealthCheckResult Interface**:
  ```typescript
  {
    healthy: boolean,        // API health status
    timestamp: string,          // ISO 8601 timestamp
    latency: number,            // Response time in milliseconds
    message: string,            // Status message
    version?: string,           // WordPress API version (if available)
    error?: string              // Error details (if unhealthy)
  }
  ```
- **Implementation**: `src/lib/api/healthCheck.ts`
- **Circuit Breaker Integration**:
  - When circuit breaker is in HALF_OPEN state, health check is performed before each request
  - If health check passes → Request proceeds, circuit may close
  - If health check fails → Request blocked with helpful error message
  - Prevents unnecessary API calls to recovering service
- **Usage Examples**:
  ```typescript
  // Basic health check
  const result = await checkApiHealth();
  if (result.healthy) {
    console.log(`API is healthy (${result.latency}ms)`);
  }

  // Health check with timeout
  const result = await checkApiHealthWithTimeout(5000);

  // Health check with retry
  const result = await checkApiHealthRetry(3, 1000);

  // Get last check result
  const lastCheck = getLastHealthCheck();
  ```

### Rate Limiting
- **Purpose**: Protect API from overload by limiting request rate
- **Configuration**:
  - Max Requests: 60 requests per window
  - Window: 60000ms (1 minute)
  - Algorithm: Token bucket with sliding window
- **Features**:
  - Per-key limiting (supports multiple rate limiters)
  - Automatic window expiration
  - Graceful degradation with helpful error messages
  - Rate limit info (remaining requests, reset time)
- **Implementation**: `src/lib/api/rateLimiter.ts`

## Security Standards

1. **XSS Protection**: DOMPurify on all user-generated content with centralized `sanitizeHTML()` utility
2. **CSP**: Nonce-based Content Security Policy headers configured in middleware.ts
   - Development: Allows `'unsafe-inline'` and `'unsafe-eval'` for hot reload
   - Production: Removes `'unsafe-inline'` and `'unsafe-eval'` for maximum security
   - Report-uri endpoint for violation monitoring in development
3. **Rate Limiting**: API rate limiting (60 requests/minute with sliding window token bucket algorithm)
4. **Authentication**: JWT or session-based (if needed)
5. **Input Validation**: TypeScript + runtime validation with dataValidator.ts at API boundaries
6. **Security Headers**:
   - Strict-Transport-Security (HSTS): max-age=31536000; includeSubDomains; preload
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), etc.
7. **Dependency Security**: Regular npm audits, keep all dependencies up to date
8. **Secrets Management**: Never commit secrets, use .env.example for placeholder values

### Security Configuration Details

**Content Security Policy (CSP)**:
- Configuration location: `src/middleware.ts`
- Implementation: Nonce-based CSP generated per request
- Script sources: Self, nonce, WordPress domains (mitrabantennews.com, www.mitrabantennews.com)
- Style sources: Self, nonce, WordPress domains
- Object sources: none
- Frame ancestors: none
- Report endpoint: `/api/csp-report` (development only)

**XSS Protection**:
- Configuration location: `src/lib/utils/sanitizeHTML.ts`
- Implementation: DOMPurify with strict security policies
- Config modes: 'excerpt' (minimal tags) and 'full' (rich content)
- Forbidden tags: script, style, iframe, object, embed
- Forbidden attributes: onclick, onload, onerror, onmouseover

**Input Validation**:
- Configuration location: `src/lib/validation/dataValidator.ts`
- Implementation: Runtime validation at API boundaries
- Validated resources: Posts, Categories, Tags, Media, Authors
- Type guards: `isValidationResultValid<T>()`, `unwrapValidationResult<T>()`, `unwrapValidationResultSafe<T>()`
- Graceful degradation with fallback data on validation failures

**Rate Limiting**:
- Configuration location: `src/lib/api/rateLimiter.ts`
- Implementation: Token bucket algorithm with sliding window
- Max requests: 60 per minute
- Window size: 60000ms (1 minute)
- Per-key limiting supported
- Automatic window expiration

### Security Audit Checklist

- [ ] No hardcoded secrets in source code
- [ ] .env.example contains only placeholder values
- [ ] npm audit shows 0 vulnerabilities
- [ ] All dependencies up to date
- [ ] CSP headers configured with nonce support
- [ ] No 'unsafe-inline' or 'unsafe-eval' in production CSP
- [ ] All security headers present and correct
- [ ] XSS protection (DOMPurify) applied to all user content
- [ ] Input validation at API boundaries
- [ ] Rate limiting implemented for API endpoints
- [ ] .gitignore properly configured to exclude .env files
- [ ] Error messages don't expose sensitive data
- [ ] Logs don't contain secrets or passwords

## Performance Standards

1. **Bundle Size**: < 200KB initial JS
2. **Lighthouse**: > 90 performance score
3. **API Caching**: Implement response caching
4. **Image Optimization**: Next.js Image component
5. **Code Splitting**: Route-based splitting

## Data Architecture

### Data Models
- All data fetched from WordPress REST API
- TypeScript interfaces for type safety (compile-time)
- Runtime validation at API boundaries (dataValidator.ts)
- Enhanced data models with resolved relationships

### Data Validation
- **Runtime Validation**: `src/lib/validation/dataValidator.ts` validates all API responses
   - Posts, Categories, Tags, Media, Authors validated at boundaries
   - Type checking, required field verification, array validation
   - Graceful degradation with error logging
   - **Type Guards**: TypeScript type-safe validation helpers
     - `isValidationResultValid<T>()`: Type guard to narrow ValidationResult<T>
     - `unwrapValidationResult<T>()`: Extract data with error throwing
     - `unwrapValidationResultSafe<T>(): Extract data with fallback
- **Compile-time Safety**: TypeScript provides static type checking
- **Fallback Data**: Invalid data triggers fallback mechanisms

### Data Fetching Strategies
- **Batch Operations**: Eliminates N+1 queries
  - `getMediaBatch()`: Fetch multiple media items in single request
  - `getMediaUrlsBatch()`: Batch URL resolution with caching
  - Reduces API calls by 80%+ for media assets
- **Parallel Fetching**: Independent API calls executed concurrently
- **Caching**: Three-tier caching strategy with advanced dependency tracking
   - In-memory cache (cacheManager) for frequent queries
   - **Dependency Tracking**: Bi-directional graph of cache relationships
   - **Cascade Invalidation**: Automatic invalidation of dependent caches
   - ISR for page-level caching
   - HTTP caching headers

**Cache Architecture Enhancements**:
- **Dependency-Aware Caching**: `cacheManager.set(key, data, ttl, dependencies)` supports explicit dependency tracking
- **Automatic Cascade Invalidation**: When a dependency is invalidated, all dependents are automatically cleared
- **Enhanced Telemetry**: Performance metrics, efficiency scoring, memory usage tracking
- **Smart Invalidation**: `invalidateByEntityType()` clears all caches for specific entity type
- **Orphan Cleanup**: Automatic removal of broken dependency references
- **Debug Tools**: `getDependencies()`, `getKeysByPattern()` for cache inspection

**Cache Dependencies**:
- Posts depend on: categories, tags, media
- Posts lists depend on: categories, tags
- Categories, tags, media, authors are leaf nodes (no dependencies)

**Cache Performance Metrics**:
- Hit rate tracking with efficiency scoring (high/medium/low)
- Cascade invalidation count and rate
- Dependency registration tracking
- Average TTL calculation
- Memory usage estimation (bytes/MB)

**See Also**: [Task DATA-ARCH-006: Cache Strategy Enhancement](./task.md#data-arch-006)

### Service Layer
Service layers provide different levels of abstraction with clear separation of concerns:
1. **postService.ts**: Basic service with fallback logic
2. **enhancedPostService.ts**: Enhanced service with:
    - Runtime data validation
    - Batch media fetching (N+1 query elimination)
    - Category/Tag resolution
    - **Dependency-aware caching** (automatic cascade invalidation)
    - Type-safe enriched data (PostWithMediaUrl, PostWithDetails)
3. **cacheWarmer.ts**: Orchestration service for cache warming:
    - Decouples cache warming from API services
    - Removes circular dependency between wordpressAPI and enhancedPostService
    - Provides cache statistics (hits, misses, hit rate)
    - Parallel cache warming for optimal performance
    - Detailed results tracking (success/failure, latency per endpoint)

### Data Integrity
- Validation ensures data structure matches expected schema
- Fallback data provides graceful degradation
- Single source of truth for pagination limits
- No data duplication across layers

## Testing Standards

1. **Unit Tests**: > 80% coverage
2. **Integration Tests**: API resilience pattern integration tests (23 tests)
3. **E2E Tests**: Critical user flows (to be added)
4. **Test Types**: Jest + React Testing Library
5. **Resilience Tests**: Circuit breaker, retry strategy, error handling, rate limiting
6. **Data Validation Tests**: Runtime validation at API boundaries

### Integration Test Suite

**Location**: `__tests__/apiResilienceIntegration.test.ts` (23 tests)

**Purpose**: Verify that resilience patterns work together correctly

**Test Categories**:
1. Circuit Breaker + Retry Integration
2. Rate Limiting + Error Handling Integration
3. Retry Strategy + Error Classification Integration
4. Health Check + Circuit Breaker Integration
5. End-to-End API Request with All Resilience Patterns
6. Error Handling Across All Layers
7. Resilience Pattern Configuration Validation

**Running Integration Tests**:
```bash
# With WordPress API available
export WORDPRESS_API_AVAILABLE=true
npm test -- __tests__/apiResilienceIntegration.test.ts

# Without WordPress API (tests auto-skipped)
npm test -- __tests__/apiResilienceIntegration.test.ts
```

**Documentation**: [Integration Testing Guide](./INTEGRATION_TESTING.md)

## File Structure

```
src/
├── app/              # Next.js App Router
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Homepage
│   ├── error.tsx      # Error page
│   ├── not-found.tsx  # 404 page
│   ├── loading.tsx    # Loading page
│   ├── api/           # API routes
│   │   ├── cache/     # Cache management endpoint
│   │   └── csp-report/ # CSP violation report endpoint
│   └── berita/        # News post pages
│       ├── [slug]/    # Dynamic post slug
│       ├── page.tsx    # Post detail page
│       └── loading.tsx # Post loading skeleton
├── components/       # React components
│   ├── ClientLayout.tsx  # Client-side layout wrapper
│   ├── ErrorBoundary.tsx # Error boundary component
│   ├── layout/       # Layout components (Header, Footer)
│   ├── post/         # Post-related components
│   └── ui/           # UI components
├── lib/              # Utilities
│   ├── api/          # API layer (config, client, resilience)
│   │   ├── config.ts       # API configuration
│   │   ├── client.ts       # Axios client with interceptors & resilience
│   │   ├── errors.ts       # Standardized error types
│   │   ├── circuitBreaker.ts # Circuit breaker pattern
│   │   ├── retryStrategy.ts  # Retry strategy with backoff
│   │   ├── rateLimiter.ts    # Rate limiting with token bucket algorithm
│   │   ├── healthCheck.ts    # API health monitoring
│   │   ├── response.ts       # Standardized response wrappers
│   │   └── standardized.ts   # Standardized API methods
 │   ├── services/     # Business logic layer
 │   │   ├── cacheWarmer.ts # Cache warming orchestration service
 │   │   └── enhancedPostService.ts # Enhanced service with validation & batch operations
│   ├── validation/   # Data validation layer
│   │   └── dataValidator.ts # Runtime data validation at API boundaries
│   ├── utils/        # Utility functions
│   │   ├── logger.ts         # Centralized logging
│   │   ├── sanitizeHTML.ts   # XSS protection with DOMPurify
│   │   └── fallbackPost.ts  # Fallback post utilities
│   ├── constants/    # Constants
│   │   └── fallbackPosts.ts  # Fallback post data
│   ├── wordpress.ts  # WordPress API wrapper with batch operations
│   ├── cache.ts      # In-memory cache manager with TTL & dependency tracking
│   └── csp-utils.ts  # CSP utility functions
├── middleware.ts     # Next.js middleware for CSP & security
└── types/            # TypeScript definitions
    └── wordpress.ts  # WordPress type definitions
```

## Development Standards

1. **Git Flow**: Feature branches → Dev → Main
2. **Code Review**: Required for all PRs
3. **Linting**: Pass `npm run lint` before commit
4. **Type Checking**: Pass `npm run typecheck` before commit
5. **Testing**: Pass `npm run test` before commit
6. **Security**: Run `npm run audit:security` regularly

## Code Quality Standards

1. **DRY Principle**: No code duplication - extract shared logic to utilities
2. **Utility Functions**: Centralized utilities in `src/lib/utils/`
3. **Type Safety**: All utility functions properly typed
4. **Configuration Management**: Centralize configuration constants
5. **Component Optimization**: Remove unnecessary React.memo from server components

### Sanitization Standards

- All user-generated content must be sanitized before rendering
- Use centralized `sanitizeHTML()` utility from `src/lib/utils/sanitizeHTML`
- Two configuration modes: 'excerpt' (minimal) and 'full' (rich content)
- DOMPurify with strict security policies (no script/style/iframe tags)

## Future Considerations

- [ ] GraphQL integration (if REST proves insufficient)
- [ ] Static Site Generation (SSG) for better performance
- [ ] Internationalization (i18n)
- [ ] Analytics integration
- [ ] E2E testing with Playwright/Cypress
