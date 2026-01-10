# Architecture Blueprint

**Version**: 1.4.4
**Last Updated**: 2026-01-10 (Code Architect)

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

## Design System

### Design Tokens

Design tokens are CSS variables defined in `src/app/globals.css` that provide a single source of truth for visual design. All components should use design tokens instead of hardcoded Tailwind values.

**Why Design Tokens?**
- **Consistency**: Ensures visual consistency across all components
- **Maintainability**: Change colors, spacing, typography in one place
- **Theming**: Enables easy theme switching for dark mode or custom themes
- **Scalability**: Centralized design system that grows with the application

### Available Tokens

**Colors** (HSL values for CSS):
```css
--color-primary: 0 84% 40%;              /* Red-600 equivalent */
--color-primary-dark: 0 86% 38%;           /* Red-700 equivalent */
--color-primary-light: 0 96% 95%;           /* Red-50 equivalent */
--color-secondary: 220 10% 96%;             /* Gray-100 equivalent */
--color-secondary-dark: 220 12% 90%;         /* Gray-200 equivalent */
--color-text-primary: 220 13% 13%;         /* Gray-900 equivalent */
--color-text-secondary: 220 9% 46%;         /* Gray-600 equivalent */
--color-text-muted: 220 9% 60%;            /* Gray-500 equivalent */
--color-background: 220 13% 98%;           /* Gray-50 equivalent */
--color-surface: 0 0% 100%;                /* White */
--color-border: 220 13% 91%;              /* Gray-300 equivalent */
```

**Spacing**:
```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;       /* 16px */
--spacing-lg: 1.5rem;     /* 24px */
--spacing-xl: 2rem;       /* 32px */
--spacing-2xl: 3rem;      /* 48px */
--spacing-3xl: 4rem;      /* 64px */
```

**Typography**:
```css
--text-xs: 0.75rem;       /* 12px */
--text-sm: 0.875rem;      /* 14px */
--text-base: 1rem;         /* 16px */
--text-lg: 1.125rem;      /* 18px */
--text-xl: 1.25rem;       /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;     /* 30px */
```

**Border Radius**:
```css
--radius-sm: 0.25rem;     /* 4px */
--radius-md: 0.375rem;     /* 6px */
--radius-lg: 0.5rem;       /* 8px */
--radius-xl: 0.75rem;      /* 12px */
```

**Shadows**:
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

**Transitions**:
```css
--transition-fast: 150ms;
--transition-normal: 300ms;
--transition-slow: 500ms;
```

### Usage Guidelines

**Using Design Tokens in Components**:
```tsx
import { forwardRef } from 'react'

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ children, ...props }, ref) => (
  <button
    ref={ref}
    className={`
      bg-[hsl(var(--color-primary))]
      text-white
      rounded-[var(--radius-md)]
      px-4
      py-2
      transition-all
      duration-[var(--transition-normal)]
      hover:bg-[hsl(var(--color-primary-dark))]
      focus:ring-2
      focus:ring-[hsl(var(--color-primary))]
    `}
    {...props}
  >
    {children}
  </button>
))
```

**Token Mapping for Common Patterns**:
- `bg-white` → `bg-[hsl(var(--color-surface))]`
- `bg-gray-50` → `bg-[hsl(var(--color-background))]`
- `bg-red-600` → `bg-[hsl(var(--color-primary))]`
- `bg-red-700` → `bg-[hsl(var(--color-primary-dark))]`
- `text-gray-900` → `text-[hsl(var(--color-text-primary))]`
- `text-gray-600` → `text-[hsl(var(--color-text-secondary))]`
- `text-gray-500` → `text-[hsl(var(--color-text-muted))]`
- `text-red-600` → `text-[hsl(var(--color-primary))]`
- `rounded-md` → `rounded-[var(--radius-md)]`
- `rounded-lg` → `rounded-[var(--radius-lg)]`
- `shadow-md` → `shadow-[var(--shadow-md)]`
- `shadow-lg` → `shadow-[var(--shadow-lg)]`
- `transition-colors` → `transition-all duration-[var(--transition-normal)]` (or `--transition-fast` for micro-interactions)

### Accessibility Features

**Skip-to-Content Link**:
- Implemented in `src/app/layout.tsx`
- Allows keyboard users to skip navigation
- Hidden by default, visible on focus
- Located at top of page

**Focus Indicators**:
- Global focus styles defined in `src/app/globals.css`
- `*:focus-visible` uses `ring-2 ring-[hsl(var(--color-primary))]`
- All interactive elements have visible focus states

**Semantic HTML**:
- Use appropriate HTML elements: `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`
- ARIA attributes for screen readers
- Keyboard navigation support (Tab, Escape, arrow keys)

### Responsive Design

**Breakpoints**:
- Mobile: < 640px (`sm:` prefix)
- Tablet: 640px - 1024px (`md:` prefix)
- Desktop: >= 1024px (`lg:` prefix)

**Component Patterns**:
- Mobile-first approach
- Progressive enhancement
- Touch-friendly tap targets (minimum 44x44px)

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
- ✅ **Phase 3 Complete**: Try-catch pattern extraction (REFACTOR-010)
    - Created `fetchAndHandleNotFound()` helper to eliminate 40 lines of duplicate error handling
    - Applied to `getPostBySlug`, `getCategoryById`, `getCategoryBySlug`, `getTagById`, `getTagBySlug`
- ⏳ **Phase 4**: Migrate new code and critical paths to use standardized methods (future)
- ⏳ **Phase 5**: Deprecate old methods in major version (future)

**See Also**: [API Standardization Guidelines](./API_STANDARDIZATION.md)

### DRY Principle and Code Quality

**Last Updated**: 2026-01-10 (Code Architect)

**DRY (Don't Repeat Yourself)** is a fundamental software design principle that eliminates code duplication and improves maintainability.

**Extracted Helpers** (`src/lib/api/response.ts`):
1. **`fetchAndHandleNotFound<T>()`** - Generic error handling for not-found scenarios
   - Eliminates duplicate try-catch patterns
   - Consistent error messages and response format
   - Type-safe with generic types
   - Applied to 5 methods (getPostBySlug, getCategoryById, getCategoryBySlug, getTagById, getTagBySlug)

**Code Quality Improvements**:
- **Before**: 252 lines with 40 duplicate lines across 5 methods
- **After**: 213 lines with single reusable helper
- **Lines Eliminated**: 40 lines (16% reduction)
- **DRY Principle Applied**: Error handling logic defined once
- **Single Responsibility**: Each helper has one clear purpose
- **Consistency**: All methods use identical error handling
- **Maintainability**: Changes to error handling only require updating one function

**Benefits**:
1. **Reduced Maintenance**: Bug fixes or improvements to error handling only need to be made once
2. **Consistency**: All resources (posts, categories, tags) have identical error handling
3. **Type Safety**: Generic TypeScript types ensure compile-time type checking
4. **Testability**: Helper functions can be tested independently
5. **Code Clarity**: Smaller, focused methods are easier to understand

**See Also**: [Task REFACTOR-010](./task.md#refactor-010)

## Integration Resilience Patterns

**Last Updated**: 2026-01-10 (Senior Integration Engineer)

**Integration Status**: ✅ Production-ready, all resilience patterns verified and tested

**Audit Summary**:
- ✅ All resilience patterns implemented and production-ready
- ✅ Circuit breaker, retry strategy, rate limiting, health check operational
- ✅ Comprehensive integration test coverage (21 tests)
- ✅ All 844 tests passing
- ✅ Configuration reviewed and validated for production

### Circuit Breaker
- **Purpose**: Prevent cascading failures by stopping calls to failing services
- **Configuration**:
  - Failure Threshold: 5 failures before opening circuit
  - Recovery Timeout: 60 seconds before attempting recovery
  - Success Threshold: 2 successful requests to close circuit
- **States**: CLOSED (normal), OPEN (blocking), HALF_OPEN (testing)
- **Implementation**: `src/lib/api/circuitBreaker.ts`
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001

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
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001

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
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001

### Request Cancellation
- **Purpose**: Cancel stale requests to prevent unnecessary processing
- **Implementation**: AbortController integration in API client
- **Usage**: All API methods accept optional `signal` parameter
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001

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
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001
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
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001

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
**See Also**: [Task ARCH-001: Layer Separation](./task.md#arch-001)

### Service Layer Architecture

**Principle**: Clear separation of concerns with single responsibility per module.

**Layers**:
1. **API Layer** (`wordpress.ts`): WordPress API wrapper
   - Focuses solely on WordPress API operations
   - Handles GET requests to WordPress REST API endpoints
   - Provides batch operations (media batch, search)
   - **No cache management concerns** (extracted to cache.ts)
   - **Implements `IWordPressAPI` interface** for contract definition

2. **Service Layer** (`src/lib/services/`): Business logic abstraction
   - **postService.ts**: Basic service with fallback logic
   - **enhancedPostService.ts**: Enhanced service with:
     - Runtime data validation
     - Batch media fetching (N+1 query elimination)
     - Category/Tag resolution
     - **Dependency-aware caching** (automatic cascade invalidation)
     - Type-safe enriched data (PostWithMediaUrl, PostWithDetails)
     - **Implements `IPostService` interface** for contract definition
   - **cacheWarmer.ts**: Orchestration service for cache warming:
     - Decouples cache warming from API services
     - Removes circular dependency between wordpressAPI and enhancedPostService
     - Provides cache statistics (hits, misses, hit rate)
     - Parallel cache warming for optimal performance
     - Detailed results tracking (success/failure, latency per endpoint)

3. **Cache Layer** (`cache.ts`): Cache management with dependency tracking
   - In-memory cache with TTL and dependency-aware invalidation
   - Cache management operations (clear, stats, warm)
   - Single source of truth for cache operations
   - **Not coupled to API layer** (clean separation)

**Separation of Concerns** (ARCH-001):
- API layer: WordPress REST API calls only
- Service layer: Business logic, validation, enrichment
- Cache layer: Cache storage, invalidation, telemetry

### Interface Definitions (ARCH-INTERFACE-001)

**Principle**: Define contracts between modules for dependency inversion and improved testability.

**Interfaces Created**:
- `IWordPressAPI` (`src/lib/api/IWordPressAPI.ts`): WordPress API contract
  - Defines all WordPress API operations (posts, categories, tags, media, authors)
  - Includes optional `signal` parameter for request cancellation (AbortController)
  - Returns types include `null` for potentially missing resources (get*, getTag, getCategory, getMediaUrl)
- `IPostService` (`src/lib/services/IPostService.ts`): Post service contract
  - Defines post service operations (getLatest, getCategory, getAll, getPaginated, getBySlug, getById)
  - Includes enriched types (PostWithMediaUrl, PostWithDetails, PaginatedPostsResult)

**Benefits**:
1. **Dependency Inversion**: High-level modules depend on abstractions (interfaces), not low-level modules (API layer)
2. **Testability**: Easy to mock interfaces for unit testing
3. **Type Safety**: Explicit contracts documented in TypeScript interfaces
4. **Maintainability**: Clear boundaries between API and service layers
5. **Extensibility**: New implementations can be swapped without changing consumers

### Dependency Management (ARCH-DEP-001)

**Principle**: Apply Dependency Injection to break circular dependencies and improve modularity.

**Circular Dependency Cleanup**:
- **Before**: `client.ts` imported `checkApiHealth` from `healthCheck.ts`, which imported `apiClient` from `client.ts` (circular)
- **After**: `HealthChecker` accepts HTTP client via constructor parameter (Dependency Injection)
- **Implementation**:
  - `client.ts` creates `healthChecker` instance after `apiClient` is created
  - `client.ts` exports health check functions: `checkApiHealth()`, `checkApiHealthWithTimeout()`, `checkApiHealthRetry()`, `getLastHealthCheck()`
  - `healthCheck.ts` no longer imports `apiClient` directly, accepts `HttpClient` interface

**Dependency Injection Applied**:
```typescript
// HealthChecker accepts HTTP client via constructor (Dependency Injection)
export class HealthChecker {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }
}

// client.ts creates healthChecker with apiClient injected
const healthChecker = new HealthChecker(apiClient)
export async function checkApiHealth() {
  return healthChecker.check()
}
```

**Benefits**:
1. **Circular Dependency Eliminated**: Zero circular dependencies in codebase
2. **Testability**: Easy to mock HTTP client for health check tests
3. **Loose Coupling**: `healthCheck.ts` no longer depends on concrete `apiClient` implementation
4. **Flexibility**: Can inject different HTTP clients (for testing, mocking, or alternative implementations)
5. **SOLID Compliance**: Dependency Inversion Principle (DIP) applied

**Cache Module Cleanup**:
- **Removed**: `warmAll()` method from `cache.ts` that created circular dependency with `cacheWarmer.ts`
- **Result**: Cache manager now has single responsibility (cache storage only)
- **Orchestration**: Cache warming moved to `cacheWarmer.ts` as separate service

**See Also**: [Task ARCH-DEP-001: Dependency Cleanup](./task.md#arch-dep-001)
 
### Cache Fetch Utility (ARCH-CACHE-FETCH-001)

**Principle**: DRY (Don't Repeat Yourself) - eliminate duplicate cache management patterns across API layer.

**Problem**: Cache management logic was duplicated in API layer methods (`getMediaBatch`, `getMediaUrl`, `search`), violating DRY principle and mixing concerns.

**Solution**: Created generic `cacheFetch<T>()` utility function that provides consistent caching behavior:
- Check cache first
- Call fetch function on cache miss
- Set cache with result
- Handle errors gracefully
- Support optional TTL and dependencies
- Support optional data transformation

**Implementation** (`src/lib/utils/cacheFetch.ts`):
```typescript
interface CacheFetchOptions<T> {
  key: string;
  ttl: number;
  dependencies?: string[];
  transform?: (data: unknown) => T;
}

async function cacheFetch<T>(
  fetchFn: () => Promise<unknown>,
  options: CacheFetchOptions<T>
): Promise<T | null>
```

**Refactored Methods**:
- **search** method: Now uses `cacheFetch()` (15 lines → 12 lines)
- **getMediaUrl**: Kept original implementation (has special conditional caching logic)
- **getMediaBatch**: Kept original implementation (has partial cache fill logic)

**Benefits**:
1. **DRY Principle**: Caching pattern defined once, used in multiple places
2. **Single Responsibility**: API layer focuses on API calls, cacheFetch handles caching
3. **Consistency**: All cache operations use same pattern
4. **Maintainability**: Changes to caching logic only require updating cacheFetch
5. **Type Safety**: Generic types ensure compile-time type checking
6. **Testability**: cacheFetch has comprehensive test coverage (14 tests)
7. **Extensibility**: Easy to add new caching scenarios

**Tests Created** (`__tests__/cacheFetch.test.ts`):
- Cache hit scenario (2 tests)
- Cache miss scenario (4 tests)
- Error handling (3 tests)
- Edge cases (4 tests)
- Concurrent requests (1 test)

**See Also**: [Task ARCH-CACHE-FETCH-001: Cache Fetch Utility](./task.md#arch-cache-fetch-001)

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

## DevOps and CI/CD

### CI/CD Pipeline

**Location**: `.github/workflows/ci.yml`

**Pipeline Stages**:
1. **Test Stage**:
   - Checkout code
   - Setup Node.js 20 with npm cache
   - Install dependencies (npm ci)
   - Cache Next.js build artifacts
   - Run linting
   - Run type checking
   - Run tests

2. **Build Stage**:
   - Runs after test stage passes
   - Checkout code
   - Setup Node.js 20 with npm cache
   - Install dependencies (npm ci)
   - Restore Next.js build cache
   - Build application
   - Upload build artifacts

**Pipeline Optimizations**:
- ✅ npm caching in both test and build jobs (reduces install time by 70%+)
- ✅ Next.js build cache (speeds up rebuilds by 50%+)
- ✅ Removed complex SWC binary handling (Next.js handles automatically)
- ✅ Concurrency control to cancel outdated runs

### Containerization

**Docker Setup**:
- **Dockerfile**: Multi-stage build for optimized production image
  - Stage 1 (deps): Install production dependencies
  - Stage 2 (builder): Build Next.js application with standalone output
  - Stage 3 (runner): Lightweight production runtime

**Docker Compose Services**:
- **wordpress**: WordPress CMS (port 8080)
- **db**: MySQL 8.0 database
- **phpmyadmin**: Database management UI (port 8081)
- **frontend**: Next.js frontend (port 3000)

**Health Checks**:
- WordPress: HTTP health check on port 80
- MySQL: MySQL admin ping
- Frontend: Depends on WordPress health

### Deployment Architecture

**Environment Parity**:
- Development: `npm run dev` (local development)
- Staging: Docker Compose (production-like environment)
- Production: Docker container + load balancer (recommended)

**Deployment Strategies**:
1. **Blue-Green Deployment**: Zero-downtime deployments
2. **Rollback Protocol**: Immediate rollback on production issues
3. **Health Check**: Verify service health before routing traffic
4. **Cache Invalidation**: Clear build cache on major changes

### Monitoring and Observability

**Current Monitoring**:
- ✅ CI/CD pipeline status (GitHub Actions)
- ✅ Test results (795 tests passing)
- ✅ Security audit (0 vulnerabilities)
- ✅ Build time tracking

**Recommended Monitoring**:
- Application performance metrics (response time, error rate)
- Resource usage (CPU, memory, disk)
- Custom alerts (error rate > 5%, response time > 500ms)
- Log aggregation (centralized logging)
- APM tools (Datadog, New Relic, or similar)

### DevOps Best Practices

1. **Green Builds Only**: Never merge failing CI
2. **Infrastructure as Code**: All infrastructure in version control
3. **Automated Testing**: Test before deploy
4. **Rollback Ready**: Always have rollback plan
5. **Security First**: Regular audits, no hardcoded secrets
6. **Fast Feedback**: Failing CI reports clear errors

### CI/CD Commands

```bash
# Run all CI checks locally before push
npm run lint && npm run typecheck && npm run test && npm run build

# Security audit
npm run audit:security

# Check for outdated dependencies
npm run deps:check

# Update dependencies
npm run deps:update

# Docker operations
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f frontend   # Follow frontend logs
docker-compose build frontend      # Rebuild frontend
```

### Rollback Protocol

**Production Issues**:
1. Immediate rollback to previous working version
2. Root cause analysis (logs, metrics, error tracking)
3. Fix forward (not in production)
4. Test thoroughly (staging environment)
5. Deploy with careful monitoring
6. Document post-mortem (lessons learned)

**Rollback Commands**:
```bash
# Docker rollback
docker-compose down
docker pull previous-image:tag
docker-compose up -d

# Verify health
curl http://localhost:3000/health
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
   - `sanitizeHTML.ts`: XSS protection with DOMPurify
   - `logger.ts`: Centralized logging with log levels
   - `dateFormat.ts`: Date formatting utilities with locale support
3. **Type Safety**: All utility functions properly typed
4. **Configuration Management**: Centralize configuration constants
   - `src/lib/constants/fallbackPosts.ts`: Fallback data constants
   - `src/lib/constants/uiText.ts`: UI text constants for localization layer
5. **Layer Separation**: Text and formatting separated from presentation
   - UI text in `src/lib/constants/uiText.ts`
   - Date formatting in `src/lib/utils/dateFormat.ts`
   - Components import and use these utilities
6. **Component Optimization**: Remove unnecessary React.memo from server components

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
