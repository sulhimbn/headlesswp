# OpenAPI Specification for HeadlessWP API

**Version**: 1.0.0  
**Last Updated**: 2026-01-11  
**Status**: Draft  

## Purpose

This document provides OpenAPI 3.0 specifications for HeadlessWP standardized API endpoints. These specifications enable:

1. Machine-readable API documentation
2. Automatic API documentation generation (Swagger UI, Redoc)
3. API client code generation
4. API contract validation
5. Integration with API management platforms

**Note**: For the complete OpenAPI 3.0 YAML specification, see [docs/openapi.yaml](./openapi.yaml). This YAML file can be used directly with Swagger UI, Redoc, or API client generators.

## API Base URL

```
Development: http://localhost:3000/api
Production: https://mitrabantennews.com/api
```

## Standardized Response Format

### Success Response

```yaml
type: object
properties:
  data:
    type: object
  error:
    type: object
    nullable: true
  metadata:
    type: object
    properties:
      timestamp:
        type: string
        format: date-time
      endpoint:
        type: string
      cacheHit:
        type: boolean
      retryCount:
        type: integer
        minimum: 0
```

### Error Response

```yaml
type: object
properties:
  data:
    type: object
    nullable: true
  error:
    type: object
    required:
      - type
      - message
      - timestamp
    properties:
      type:
        type: string
        enum:
          - NETWORK_ERROR
          - TIMEOUT_ERROR
          - RATE_LIMIT_ERROR
          - SERVER_ERROR
          - CLIENT_ERROR
          - CIRCUIT_BREAKER_OPEN
          - UNKNOWN_ERROR
      message:
        type: string
      statusCode:
        type: integer
      retryable:
        type: boolean
      timestamp:
        type: string
        format: date-time
      endpoint:
        type: string
  metadata:
    type: object
    properties:
      timestamp:
        type: string
        format: date-time
      endpoint:
        type: string
```

## API Endpoints

### Health Endpoints

#### GET /health

**Description**: WordPress API health check for load balancer probes

**Tags**: Health

**Responses**:
- **200**: API is healthy
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-01-11T10:00:00Z",
    "latency": 123,
    "version": "v2",
    "uptime": 3600
  }
  ```
- **503**: API is unhealthy
  ```json
  {
    "status": "unhealthy",
    "timestamp": "2026-01-11T10:00:00Z",
    "error": "Connection timeout"
  }
  ```

**Rate Limit**: 300 requests/minute (5/sec)

#### GET /health/readiness

**Description**: Kubernetes readiness probe

**Tags**: Health

**Responses**:
- **200**: Application is ready
  ```json
  {
    "status": "ready",
    "timestamp": "2026-01-11T10:00:00Z"
  }
  ```

**Rate Limit**: 300 requests/minute (5/sec)

### Observability Endpoints

#### GET /observability/metrics

**Description**: Export resilience pattern metrics for monitoring

**Tags**: Observability

**Responses**:
- **200**: Metrics exported successfully
  ```json
  {
    "summary": {
      "totalEvents": 1234,
      "eventTypes": 5,
      "timestamp": "2026-01-11T10:00:00Z",
      "uptime": 3600
    },
    "circuitBreaker": {
      "stateChanges": 5,
      "failures": 23,
      "successes": 1567,
      "requestsBlocked": 12,
      "totalEvents": 1607
    },
    "retry": {
      "retries": 45,
      "retrySuccesses": 38,
      "retryExhausted": 7,
      "totalEvents": 90
    },
    "rateLimit": {
      "exceeded": 3,
      "resets": 0,
      "totalEvents": 3
    },
    "healthCheck": {
      "healthy": 120,
      "unhealthy": 5,
      "totalEvents": 125
    },
    "apiRequest": {
      "totalRequests": 1600,
      "successful": 1590,
      "failed": 10,
      "averageDuration": 125,
      "cacheHits": 1200,
      "cacheMisses": 400,
      "totalEvents": 1600
    }
  }
  ```

**Rate Limit**: 60 requests/minute (1/sec)

### Cache Management Endpoints

#### GET /cache/stats

**Description**: Get cache performance statistics

**Tags**: Cache

**Responses**:
- **200**: Cache statistics
  ```json
  {
    "hits": 1200,
    "misses": 400,
    "hitRate": 0.75,
    "size": 150,
    "efficiency": "high"
  }
  ```

- **429**: Rate limit exceeded
  ```json
  {
    "error": "Too many requests",
    "retryAfter": 60
  }
  ```

**Rate Limit**: 10 requests/minute (0.16/sec)

#### POST /cache/warm

**Description**: Trigger cache warming for all endpoints

**Tags**: Cache

**Responses**:
- **200**: Cache warming started
  ```json
  {
    "status": "warming",
    "results": {
      "latestPosts": { "success": true, "latency": 150 },
      "categories": { "success": true, "latency": 50 },
      "tags": { "success": true, "latency": 50 }
    }
  }
  ```

**Rate Limit**: 10 requests/minute (0.16/sec)

#### POST /cache/clear

**Description**: Clear all cache entries

**Tags**: Cache

**Responses**:
- **200**: Cache cleared successfully
  ```json
  {
    "status": "cleared",
    "timestamp": "2026-01-11T10:00:00Z"
  }
  ```

**Rate Limit**: 10 requests/minute (0.16/sec)

### Security Endpoints

#### POST /csp-report

**Description**: Receive Content Security Policy violation reports

**Tags**: Security

**Request Body**:
```json
{
  "csp-report": {
    "document-uri": "https://example.com/",
    "referrer": "https://google.com/",
    "blocked-uri": "https://evil.com/script.js",
    "violated-directive": "script-src",
    "original-policy": "default-src 'self'; script-src 'self' 'nonce-...'"
  }
}
```

**Responses**:
- **204**: Report received (no content)

**Rate Limit**: 30 requests/minute (0.5/sec)

## Standardized Error Types

### Error Type Hierarchy

| Error Type | HTTP Status Code | Retryable | Description |
|------------|------------------|------------|-------------|
| `NETWORK_ERROR` | N/A | Yes (max 1 retry) | Connection issues |
| `TIMEOUT_ERROR` | 408 | Yes (max 1 retry) | Request timeout |
| `RATE_LIMIT_ERROR` | 429 | Yes | Rate limit exceeded |
| `SERVER_ERROR` | 500-599 | Yes | Server-side errors |
| `CLIENT_ERROR` | 400-499 | No | Client-side errors |
| `CIRCUIT_BREAKER_OPEN` | 503 | No | Circuit breaker blocking |
| `UNKNOWN_ERROR` | N/A | No | Unhandled errors |

### Error Response Example

```json
{
  "data": null,
  "error": {
    "type": "RATE_LIMIT_ERROR",
    "message": "Rate limit exceeded. Too many requests. Please wait 60 seconds before retrying.",
    "statusCode": 429,
    "retryable": true,
    "timestamp": "2026-01-11T10:00:00Z",
    "endpoint": "/wp/v2/posts"
  },
  "metadata": {
    "timestamp": "2026-01-11T10:00:00Z",
    "endpoint": "/wp/v2/posts"
  }
}
```

## Rate Limiting

### Rate Limit Headers

All API responses include rate limit headers:

| Header | Description | Example |
|--------|-------------|----------|
| `X-RateLimit-Limit` | Maximum requests allowed in window | `60` |
| `X-RateLimit-Remaining` | Remaining requests in current window | `45` |
| `X-RateLimit-Reset` | Unix timestamp of window reset | `1705161600` |
| `X-RateLimit-Reset-After` | Seconds until window resets | `60` |
| `Retry-After` | Seconds to wait before retry (429 only) | `60` |

### Rate Limit by Endpoint

| Endpoint Pattern | Limit | Window | Rate |
|-----------------|--------|--------|------|
| `/health`, `/health/readiness` | 300 | 1 minute | 5/sec |
| `/observability/metrics` | 60 | 1 minute | 1/sec |
| `/cache/*` | 10 | 1 minute | 0.16/sec |
| `/csp-report` | 30 | 1 minute | 0.5/sec |

## Pagination

### Pagination Parameters

| Parameter | Type | Default | Description |
|-----------|-------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `per_page` | integer | 10 | Items per page |
| `category` | integer | - | Filter by category ID |
| `tag` | integer | - | Filter by tag ID |
| `search` | string | - | Search query |

### Pagination Response

```json
{
  "data": [...],
  "error": null,
  "metadata": {
    "timestamp": "2026-01-11T10:00:00Z",
    "endpoint": "/wp/v2/posts",
    "cacheHit": false
  },
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

## Caching

### Cache Times

| Resource Type | TTL | Strategy |
|---------------|-----|----------|
| Homepage | 5 minutes | ISR |
| Post list | 5 minutes | ISR |
| Post detail | 1 hour | ISR |
| Categories | 30 minutes | Cache |
| Tags | 30 minutes | Cache |
| Media URLs | 10 minutes | Cache |

### Cache Metadata

All API responses include cache metadata:

```json
{
  "metadata": {
    "timestamp": "2026-01-11T10:00:00Z",
    "endpoint": "/wp/v2/posts",
    "cacheHit": true,
    "retryCount": 0
  }
}
```

## Resilience Patterns

### Circuit Breaker

- **Failure Threshold**: 5 failures before opening
- **Recovery Timeout**: 60 seconds
- **Success Threshold**: 2 successful requests to close

### Retry Strategy

- **Max Retries**: 3 attempts
- **Initial Delay**: 1000ms
- **Max Delay**: 30000ms
- **Backoff Multiplier**: 2x
- **Jitter**: Enabled (prevents thundering herd)

### Retry Conditions

| Error Type | Retry Behavior |
|------------|----------------|
| Rate limit (429) | Respects Retry-After header |
| Server errors (500-599) | Retries with exponential backoff |
| Network errors | Retries (max 1) |
| Timeout errors | Retries (max 1) |
| Client errors (4xx) | No retry |

## Security

### Content Security Policy

- Nonce-based CSP headers on all responses
- Development: Allows `'unsafe-inline'` and `'unsafe-eval'`
- Production: Removes `'unsafe-inline'` and `'unsafe-eval'`

### Security Headers

| Header | Value |
|--------|--------|
| `Strict-Transport-Security` | max-age=31536000; includeSubDomains; preload |
| `X-Frame-Options` | DENY |
| `X-Content-Type-Options` | nosniff |
| `X-XSS-Protection` | 1; mode=block |
| `Referrer-Policy` | strict-origin-when-cross-origin |
| `Permissions-Policy` | camera=(), microphone=(), geolocation=(), payment=(), usb=() |

### XSS Protection

- All user-generated content sanitized with DOMPurify
- Forbidden tags: script, style, iframe, object, embed
- Forbidden attributes: onclick, onload, onerror, onmouseover

## Type Safety

### TypeScript Types

All API methods use TypeScript generics for type-safe responses:

```typescript
// Single resource
ApiResult<WordPressPost>

// Collection
ApiListResult<WordPressPost>
```

### Type Guards

Use type guards for runtime type checking:

```typescript
if (isApiResultSuccessful(result)) {
  const post = result.data; // TypeScript knows post is WordPressPost
} else {
  const error = result.error; // TypeScript knows error is ApiError
}
```

## Monitoring and Observability

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Circuit Breaker State | CLOSED | OPEN |
| Circuit Failure Rate | < 10/min | > 10/min |
| Retry Rate | < 20% | > 20% |
| Retry Success Rate | > 80% | < 80% |
| Response Time | < 500ms | > 500ms |
| Error Rate | < 5% | > 5% |
| Cache Hit Rate | > 70% | < 50% |

### Telemetry Events

Categories:
- **circuit-breaker**: State changes, failures, successes
- **retry**: Retry attempts, successes, exhaustions
- **rate-limit**: Exceeded events, reset events
- **health-check**: Healthy/unhealthy checks
- **api-request**: Request completions with duration, cache hit/miss

## Best Practices

### 1. Always Handle Errors

```typescript
const result = await standardizedAPI.getPostById(123);
if (!isApiResultSuccessful(result)) {
  // Handle error based on type
  switch (result.error.type) {
    case ApiErrorType.CIRCUIT_BREAKER_OPEN:
      return <ServiceUnavailable />;
    case ApiErrorType.RATE_LIMIT_ERROR:
      return <RateLimitError retryAfter={result.error.retryAfter} />;
    default:
      return <ErrorDisplay message={result.error.message} />;
  }
}
```

### 2. Check Cache Metadata

```typescript
const result = await standardizedAPI.getAllPosts();
if (result.metadata.cacheHit) {
  console.log('Data loaded from cache');
} else {
  console.log('Data fetched from API');
}
```

### 3. Use Pagination Correctly

```typescript
const result = await standardizedAPI.getAllPosts({ page: 2, perPage: 20 });
if (isApiResultSuccessful(result)) {
  console.log(`Page ${result.pagination.page} of ${result.pagination.totalPages}`);
  console.log(`Total: ${result.pagination.total} posts`);
}
```

### 4. Respect Rate Limits

Check rate limit headers before making repeated requests:

```typescript
const response = await fetch('/api/observability/metrics');
const remaining = response.headers.get('X-RateLimit-Remaining');
const resetAfter = response.headers.get('X-RateLimit-Reset-After');

if (remaining === '0') {
  await new Promise(resolve => setTimeout(resolve, parseInt(resetAfter) * 1000));
}
```

## Future Enhancements

- [ ] Add GraphQL API specification
- [ ] Add WebSocket endpoint for real-time updates
- [ ] Add batch API endpoints for bulk operations
- [ ] Add API versioning strategy (v1, v2)
- [ ] Add API authentication for admin operations
- [ ] Add OpenAPI 3.1 specification

## References

- [OpenAPI Specification](https://swagger.io/specification/)
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Blueprint.md Integration Resilience Patterns](./blueprint.md#integration-resilience-patterns)
- [API Standardization Guidelines](./API_STANDARDIZATION.md)
- [Monitoring Guide](./MONITORING.md)
