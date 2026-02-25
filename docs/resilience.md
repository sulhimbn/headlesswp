# API Resilience Guide

This guide covers the resilience patterns implemented in the headless WordPress project.

## Table of Contents

- [Overview](#overview)
- [Circuit Breaker](#circuit-breaker)
- [Retry Strategy](#retry-strategy)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Monitoring](#monitoring)

---

## Overview

The project implements several resilience patterns to handle API failures gracefully:

- **Circuit Breaker**: Prevents cascading failures by stopping requests to failing services
- **Retry Strategy**: Automatically retries failed requests with exponential backoff
- **Rate Limiting**: Prevents overwhelming external APIs with too many requests

All patterns are pre-configured in the API client and work automatically.

---

## Circuit Breaker

The circuit breaker pattern prevents repeated calls to a failing service.

### How It Works

```
CLOSED (Normal) → failures increase → OPEN (Blocked)
OPEN → timeout passes → HALF_OPEN (Testing)
HALF_OPEN → successes increase → CLOSED (Normal)
```

### States

| State | Description |
|-------|-------------|
| **CLOSED** | Normal operation, requests pass through |
| **OPEN** | Service is failing, requests are blocked |
| **HALF_OPEN** | Testing if service recovered, limited requests allowed |

### Default Configuration

```typescript
// From src/lib/api/config.ts
{
  failureThreshold: 5,      // Open after 5 failures
  recoveryTimeout: 60000,  // Try again after 60 seconds
  successThreshold: 2      // Close after 2 successes
}
```

### Using Circuit Breaker

The circuit breaker is already integrated into the API client:

```typescript
import { circuitBreaker, CircuitState } from '@/lib/api/circuitBreaker';

// Check circuit state
const state = circuitBreaker.getState();
console.log(state); // 'CLOSED' | 'OPEN' | 'HALF_OPEN'

// Get statistics
const stats = circuitBreaker.getStats();
console.log(stats);
// {
//   state: 'CLOSED',
//   failureCount: 0,
//   successCount: 0,
//   lastFailureTime: 1234567890,
//   nextAttemptTime: 0,
//   failureThreshold: 5,
//   recoveryTimeout: 60000,
//   successThreshold: 2
// }

// Reset circuit breaker
circuitBreaker.reset();
```

### Custom Circuit Breaker

```typescript
import { CircuitBreaker, CircuitState } from '@/lib/api/circuitBreaker';

const customBreaker = new CircuitBreaker({
  failureThreshold: 3,      // Open after 3 failures
  recoveryTimeout: 30000,  // Try again after 30 seconds
  successThreshold: 3,     // Close after 3 successes
  onStateChange: (state) => {
    console.log(`Circuit breaker state: ${state}`);
  },
  endpoint: '/custom-api'
});

// Record success/failure
customBreaker.recordSuccess();
customBreaker.recordFailure();

// Check if open
if (customBreaker.isOpen()) {
  console.log('Circuit is open, skip request');
}
```

---

## Retry Strategy

The retry strategy automatically retries failed requests with exponential backoff.

### How It Works

1. Request fails
2. Check if error is retryable
3. Calculate delay with exponential backoff
4. Wait and retry
5. Repeat until success or max retries

### Retryable Errors

The following errors trigger retries:

- **HTTP 429** (Too Many Requests) - Always retry
- **HTTP 5xx** (Server Errors) - Always retry
- **Timeout errors** - Retry once
- **Network errors** (ECONNREFUSED) - Retry once

### Default Configuration

```typescript
// From src/lib/api/config.ts
{
  maxRetries: 3,           // Maximum 3 retries
  initialDelay: 1000,      // Start with 1 second
  maxDelay: 30000,         // Cap at 30 seconds
  backoffMultiplier: 2,    // Double delay each retry
  jitter: true             // Add randomness to prevent thundering herd
}
```

### Retry Delays

With default settings (jitter enabled):

| Attempt | Base Delay | With Jitter |
|---------|------------|-------------|
| 1 | 1000ms | 500-1000ms |
| 2 | 2000ms | 1000-2000ms |
| 3 | 4000ms | 2000-4000ms |
| 4 | 8000ms | 4000-8000ms |

### Using Retry Strategy

The retry strategy is already integrated into the API client:

```typescript
import { retryStrategy } from '@/lib/api/client';

// Check if should retry
const shouldRetry = retryStrategy.shouldRetry(error, retryCount);

// Get delay for retry
const delay = retryStrategy.getRetryDelay(retryCount, error);

// Execute with automatic retries
const result = await retryStrategy.execute(
  () => fetch('/api/data'),
  'Fetching data'
);
```

### Custom Retry Strategy

```typescript
import { RetryStrategy } from '@/lib/api/retryStrategy';

const customRetry = new RetryStrategy({
  maxRetries: 5,
  initialDelay: 500,
  maxDelay: 10000,
  backoffMultiplier: 1.5,
  jitter: false
});

// Execute with custom strategy
const result = await customRetry.execute(
  async () => {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Request failed');
    return response.json();
  },
  'Custom operation'
);
```

---

## Rate Limiting

The rate limiter prevents overwhelming external APIs.

### How It Works

1. Request comes in
2. Check if under limit
3. If yes, allow and track request
4. If no, throw rate limit error

### Default Configuration

```typescript
// From src/lib/api/config.ts
{
  maxRequests: 60,    // 60 requests
  windowMs: 60000     // Per minute
}
```

### Using Rate Limiter

```typescript
import { rateLimiterManager } from '@/lib/api/client';

// Check limit for default endpoint
await rateLimiterManager.checkLimit();

// Check limit for specific endpoint
await rateLimiterManager.checkLimit('/api/posts');

// Get rate limit info
const info = rateLimiterManager.getInfo();
console.log(info);
// {
//   remainingRequests: 45,
//   resetTime: 1234567890000,
//   windowMs: 60000,
//   maxRequests: 60
// }

// Reset limit
rateLimiterManager.reset();
```

### Custom Rate Limiter

```typescript
import { RateLimiter } from '@/lib/api/rateLimiter';

const customLimiter = new RateLimiter({
  maxRequests: 10,    // 10 requests
  windowMs: 60000     // Per minute
});

// Check before making request
try {
  await customLimiter.checkLimit();
  // Make your API call here
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    const waitTime = error.message; // "Please try again in X seconds"
    console.log(waitTime);
  }
}

// Get current status
const info = customLimiter.getInfo();
console.log(`Remaining: ${info.remainingRequests}/${info.maxRequests}`);
```

### Rate Limit Headers

When rate limited, the API returns these headers:

```
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1234567890
X-RateLimit-Reset-After: 30
Retry-After: 30
```

---

## Error Handling

### Error Types

```typescript
import { ApiErrorType, isApiError } from '@/lib/api/errors';

try {
  const posts = await enhancedPostService.getLatestPosts();
} catch (error) {
  if (isApiError(error)) {
    switch (error.type) {
      case ApiErrorType.NETWORK_ERROR:
        console.log('Network issue:', error.message);
        break;
      case ApiErrorType.RATE_LIMIT_ERROR:
        console.log('Rate limited, retry after:', error.retryAfter);
        break;
      case ApiErrorType.CIRCUIT_BREAKER_ERROR:
        console.log('Circuit breaker open');
        break;
      case ApiErrorType.TIMEOUT_ERROR:
        console.log('Request timed out');
        break;
      case ApiErrorType.VALIDATION_ERROR:
        console.log('Validation failed:', error.errors);
        break;
      default:
        console.log('API error:', error.message);
    }
  }
}
```

### Handling in Components

```tsx
import { enhancedPostService } from '@/lib/services/enhancedPostService';
import EmptyState from '@/components/ui/EmptyState';

async function PostsSection() {
  try {
    const posts = await enhancedPostService.getLatestPosts();
    return (
      <div>
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    );
  } catch (error) {
    const isRateLimited = error.message?.includes('Rate limit');
    const isNetworkError = error.message?.includes('network');
    
    return (
      <EmptyState
        title={isRateLimited ? "Too many requests" : "Failed to load posts"}
        description={error.message}
        action={{
          label: "Try again",
          href: "/"
        }}
      />
    );
  }
}
```

---

## Monitoring

### Telemetry

All resilience events are tracked via telemetry:

```typescript
import { telemetryCollector } from '@/lib/api/telemetry';

// Get events by category
const circuitBreakerEvents = telemetryCollector.getEventsByCategory('circuit-breaker');
const retryEvents = telemetryCollector.getEventsByCategory('retry');
const rateLimitEvents = telemetryCollector.getEventsByCategory('rate-limit');

// Get event counts
const stats = telemetryCollector.getStats();
console.log(stats);
// {
//   'circuit-breaker.state-change': 5,
//   'retry.retry-success': 10,
//   'retry.retry-exhausted': 2,
//   'rate-limit.exceeded': 3
// }
```

### Metrics Endpoint

The observability metrics endpoint includes resilience data:

```bash
GET /api/observability/metrics
```

Response includes:

```json
{
  "circuitBreaker": {
    "state": "CLOSED",
    "failureCount": 0,
    "successCount": 10,
    "totalEvents": 15,
    "recentEvents": [...]
  },
  "retry": {
    "retries": 5,
    "retrySuccesses": 4,
    "retryExhausted": 1,
    "totalEvents": 10
  },
  "rateLimit": {
    "currentUsage": 45,
    "maxRequests": 60,
    "windowMs": 60000,
    "totalEvents": 3
  }
}
```

---

## Best Practices

1. **Let defaults work**: The resilience patterns are pre-configured and work automatically.

2. **Handle errors gracefully**: Always show user-friendly error messages.

3. **Use circuit breaker state**: Check circuit state before making batch requests.

4. **Respect rate limits**: Don't ignore rate limit errors - wait and retry.

5. **Monitor telemetry**: Keep an eye on resilience metrics for issues.

6. **Customize when needed**: Use custom configurations for specific use cases.

7. **Test resilience**: Verify your app handles failures correctly.
