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
- **Framework**: Next.js 14.2 (App Router)
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

## Integration Resilience Patterns

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

1. **XSS Protection**: DOMPurify on all user-generated content
2. **CSP**: Content Security Policy headers
3. **Rate Limiting**: API rate limiting (60 requests/minute with sliding window)
4. **Authentication**: JWT or session-based (if needed)
5. **Input Validation**: TypeScript + runtime validation

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
- **Compile-time Safety**: TypeScript provides static type checking
- **Fallback Data**: Invalid data triggers fallback mechanisms

### Data Fetching Strategies
- **Batch Operations**: Eliminates N+1 queries
  - `getMediaBatch()`: Fetch multiple media items in single request
  - `getMediaUrlsBatch()`: Batch URL resolution with caching
  - Reduces API calls by 80%+ for media assets
- **Parallel Fetching**: Independent API calls executed concurrently
- **Caching**: Three-tier caching strategy
  - In-memory cache (cacheManager) for frequent queries
  - ISR for page-level caching
  - HTTP caching headers

### Service Layer
Two service layers provide different levels of abstraction:
1. **postService.ts**: Basic service with fallback logic
2. **enhancedPostService.ts**: Enhanced service with:
   - Runtime data validation
   - Batch media fetching (N+1 query elimination)
   - Category/Tag resolution
   - Automatic cache management
   - Type-safe enriched data (PostWithMediaUrl, PostWithDetails)

### Data Integrity
- Validation ensures data structure matches expected schema
- Fallback data provides graceful degradation
- Single source of truth for pagination limits
- No data duplication across layers

## Testing Standards

1. **Unit Tests**: > 80% coverage
2. **Integration Tests**: API endpoint tests, resilience pattern tests
3. **E2E Tests**: Critical user flows (to be added)
4. **Test Types**: Jest + React Testing Library
5. **Resilience Tests**: Circuit breaker, retry strategy, error handling, rate limiting
6. **Data Validation Tests**: Runtime validation at API boundaries

## File Structure

```
src/
├── app/              # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── posts/        # Posts pages
├── components/       # React components
│   ├── layout/       # Layout components (Header, Footer)
│   ├── post/         # Post-related components
│   └── ui/           # UI components
 ├── lib/              # Utilities
 │   ├── api/          # API layer (config, client, resilience)
 │   │   ├── config.ts # API configuration
 │   │   ├── client.ts # Axios client with interceptors & resilience
 │   │   ├── errors.ts # Standardized error types
 │   │   ├── circuitBreaker.ts # Circuit breaker pattern
 │   │   ├── retryStrategy.ts # Retry strategy with backoff
 │   │   └── rateLimiter.ts # Rate limiting with token bucket algorithm
│   ├── services/     # Business logic layer
│   │   ├── postService.ts # Post data service with fallback logic
│   │   └── enhancedPostService.ts # Enhanced service with validation & batch operations
│   ├── validation/   # Data validation layer
│   │   └── dataValidator.ts # Runtime data validation at API boundaries
│   ├── wordpress.ts # WordPress API wrapper with batch operations
│   ├── cache.ts      # In-memory cache manager with TTL
│   └── hooks/        # Custom React hooks
└── types/            # TypeScript definitions
```

## Development Standards

1. **Git Flow**: Feature branches → Dev → Main
2. **Code Review**: Required for all PRs
3. **Linting**: Pass `npm run lint` before commit
4. **Type Checking**: Pass `npm run typecheck` before commit
5. **Testing**: Pass `npm run test` before commit
6. **Security**: Run `npm run audit:security` regularly

## Future Considerations

- [ ] GraphQL integration (if REST proves insufficient)
- [ ] Static Site Generation (SSG) for better performance
- [ ] Internationalization (i18n)
- [ ] Analytics integration
- [ ] E2E testing with Playwright/Cypress
