# Cache Behavior Documentation

**Last Updated**: 2026-04-09

## Overview

This document describes the caching architecture in the headless WordPress Next.js application.

## Current Implementation

### In-Memory Cache

The current cache implementation uses an in-memory `Map` data structure for storing cached data.

**Location**: `src/lib/cache.ts`

**Implementation**:
```typescript
private cache = new Map<string, CacheEntry<unknown>>();
```

### Behavior Characteristics

1. **Persistence**: None - Cache is not persisted to disk
2. **Lifecycle**: Resets on server restart/pod scaling
3. **Sharing**: Not shared across instances (each pod has its own cache)
4. **Memory**: Stored in Node.js heap memory

### Impact on Production

**During Rolling Deployments**:
- New pods start with empty cache
- First requests to each pod cause cache misses
- WordPress API receives higher load during deployment
- Cache warm-up process runs but doesn't survive restart

**In Multi-Pod Environments**:
- Each pod maintains its own cache
- No cache sharing between pods
- Inconsistent cache states possible

### Current TTL Values

From `src/lib/cache/cacheConfig.ts`:

| Entity Type | TTL |
|-------------|-----|
| POSTS | 600000ms (10 min) |
| POST | 600000ms (10 min) |
| CATEGORIES | 1800000ms (30 min) |
| TAGS | 1800000ms (30 min) |
| MEDIA | 3600000ms (1 hour) |
| SEARCH | 300000ms (5 min) |
| AUTHOR | 1800000ms (30 min) |

### Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js Application                    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │            CacheManager (in-memory)             │    │
│  │                                                  │    │
│  │  private cache = new Map<string, CacheEntry>    │    │
│  │                                                  │    │
│  │  - Dependency tracking                          │    │
│  │  - Cascade invalidation                         │    │
│  │  - TTL expiration                               │    │
│  │  - Memory cleanup                               │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Server Restart / Pod Scaling
                          ▼
              ┌─────────────────────┐
              │   Cache Cleared     │
              │   (Empty Map)       │
              └─────────────────────┘
```

## Limitations

### Known Issues

1. **No Persistence**: Cache data is lost on server restart
2. **No Cross-Instance Sharing**: Each pod maintains separate cache
3. **Deployment Impact**: Cache misses during rolling deployments
4. **Cold Start Penalty**: New pods need to rebuild cache from WordPress API

### Acceptable For Development/Tier

The in-memory cache is acceptable for:
- Local development
- Single-instance deployments
- Low-traffic staging environments
- Development/preview environments

## Redis Integration Plan

### Recommended Solution

**Upstash Redis** (Serverless Redis):
- Works well with Next.js/Vercel
- Serverless pricing
- Low latency globally
- TTL support built-in

**Alternative**: Self-hosted Redis
- For Kubernetes with existing Redis infrastructure
- Full control over configuration

### Implementation Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Next.js Application                    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Cache Adapter Layer                │    │
│  │                                                  │    │
│  │  ICacheManager (interface)                     │    │
│  │       ▲                     ▲                   │    │
│  │       │                     │                   │    │
│  │  ┌────┴─────┐      ┌────────┴────────┐         │    │
│  │  │ InMemory │      │   RedisAdapter  │         │    │
│  │  │ Cache    │      │   (upstash)     │         │    │
│  │  └──────────┘      └─────────────────┘         │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          │
                          │ Environment Variable
                          ▼
              ┌─────────────────────┐
              │   REDIS_URL          │
              └─────────────────────┘
```

### Migration Path

1. **Phase 1**: Document behavior (DONE)
2. **Phase 2**: Add Redis adapter with interface
3. **Phase 3**: Add environment variable configuration
4. **Phase 4**: Add health check for Redis connection

### Configuration

Environment variables needed:
- `REDIS_URL` - Redis connection string (Upstash or self-hosted)
- `CACHE_BACKEND` - Choose 'memory' or 'redis' (default: memory for backward compat)

### When to Use Redis

Consider Redis when:
- Running multi-pod production deployment
- Rolling deployments cause unacceptable cache miss rates
- Need cache persistence across restarts
- High traffic (>1000 req/min) where cold cache causes API overload
- Running on serverless platform (Vercel, AWS Lambda)

### When In-Memory is Acceptable

Continue using in-memory cache when:
- Single pod deployment
- Low traffic where cold start is acceptable
- Development/staging with ephemeral instances
- Budget constraints (no external service)
- Content changes infrequently (low cache churn)

## Recommendations

1. **Start with in-memory** for development/staging
2. **Monitor cache hit rate** during deployments
3. **Add Redis** when multi-pod or production traffic needs stability
4. **Use Upstash** for serverless-friendly Redis
5. **Keep TTLs** as configured - appropriate for content that doesn't change frequently

## Implementation Status

### Redis Adapter

A Redis cache adapter has been implemented at `src/lib/cache/redisCacheAdapter.ts`:

- **Status**: Infrastructure ready, not yet integrated
- **Location**: `src/lib/cache/redisCacheAdapter.ts`
- **Implementation**: `RedisCacheAdapter` class implements `ICacheManager` interface
- **Environment Variables**:
  - `REDIS_URL` - Redis connection string
  - `CACHE_BACKEND` - Set to 'redis' to enable

### To Enable Redis

1. Install Upstash Redis: `npm install @upstash/redis`
2. Set environment variable: `REDIS_URL=your-upstash-url`
3. Update `createCacheManager()` in redisCacheAdapter.ts to use RedisCacheAdapter when REDIS_URL is set
4. Implement the Redis sync methods (getFromRedisSync, setToRedisSync, etc.) using @upstash/redis

### Current Default

The application currently defaults to in-memory cache (`cacheManager` from `src/lib/cache.ts`).