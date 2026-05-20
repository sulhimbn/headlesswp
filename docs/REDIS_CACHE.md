# Redis Cache Adapter

This document describes the Redis cache adapter implementation for multi-instance Next.js deployments.

## Overview

The Redis cache adapter provides a distributed caching solution using Redis, enabling cache sharing across multiple Next.js instances. This is essential for deployments with multiple server instances where in-memory cache would be inconsistent.

## Configuration

### Environment Variables

```bash
# Cache adapter selection: 'memory' (default) or 'redis'
CACHE_ADAPTER=redis

# Redis connection settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=headlesswp:
```

### Programmatic Configuration

```typescript
import { createCacheManager, RedisCacheAdapter } from '@/lib/cache/cacheFactory';

const cache = createCacheManager('redis', {
  host: 'redis-host',
  port: 6379,
  password: 'secret',
  db: 0,
  keyPrefix: 'myapp:',
  maxRetriesPerRequest: 3,
  connectTimeout: 10000,
  commandTimeout: 5000,
});
```

## Features

### Connection Management

- Automatic connection on adapter creation
- Automatic reconnection with exponential backoff (max 10 retries)
- Connection status tracking via `isConnected()` method
- Lazy connection support

### Redis-Specific Metrics

The adapter tracks Redis-specific metrics:

```typescript
interface RedisMetrics {
  connected: boolean;
  reconnectAttempts: number;
  lastConnectedAt: number | null;
  lastErrorAt: number | null;
  lastErrorMessage: string | null;
  commandsExecuted: number;
  commandsFailed: number;
}

const metrics = adapter.getRedisMetrics();
```

### Cache Operations

All standard cache operations are supported:
- `get(key)` / `set(key, data, ttl, dependencies)`
- `delete(key)` / `invalidate(key)`
- `clearAll()` / `clearPattern(pattern)`
- `getStats()` / `getPerformanceMetrics()`
- Dependency tracking for cascade invalidation

### Key Prefix

All cache keys are prefixed (default: `cache:`) to avoid conflicts with other Redis data.

## Usage

### Switching Between Memory and Redis

The adapter can be switched via environment:

```bash
# Development (in-memory)
CACHE_ADAPTER=memory

# Production (Redis)
CACHE_ADAPTER=redis
```

### Monitoring

Access Redis metrics via the adapter:

```typescript
import { createCacheManager } from '@/lib/cache/cacheFactory';

const cache = createCacheManager();

const redisMetrics = cache.getRedisMetrics ? cache.getRedisMetrics() : null;
const cacheStats = await cache.getStats();
```

## Performance Considerations

- Redis connection timeout: 10s (configurable)
- Command timeout: 5s (configurable)
- Offline queue disabled by default for fail-fast behavior
- Key prefix prevents namespace conflicts

## Error Handling

The adapter handles common Redis errors gracefully:
- Connection failures: Logs error, continues with degraded performance
- Command failures: Increments `commandsFailed` metric, returns appropriate fallback values
- Reconnection: Automatic with configurable retry strategy
