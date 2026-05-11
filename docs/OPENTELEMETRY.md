# OpenTelemetry Setup Guide

**Version**: 1.0.0
**Last Updated**: 2026-05-11

## Overview

OpenTelemetry provides distributed tracing for observability across services. This guide covers setup, configuration, and usage for the HeadlessWP application.

## Installation

OpenTelemetry packages are installed via npm:

```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/api
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_ENABLED` | `true` | Enable/disable OpenTelemetry |
| `OTEL_SERVICE_NAME` | `headlesswp` | Service identifier in traces |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `""` (no-op) | OTLP endpoint for trace export |

### Quick Start

```bash
# Enable with default settings (no-op exporter, traces logged only)
export OTEL_ENABLED=true

# Enable with Jaeger
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318

# Enable with Zipkin
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Enable with DataDog
export OTEL_EXPORTER_OTLP_ENDPOINT=https://api.datadoghq.com
export DD_API_KEY=your-api-key
```

## Supported Backends

### Jaeger

1. Start Jaeger:
```bash
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

2. Configure:
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

3. Access UI at `http://localhost:16686`

### Zipkin

1. Start Zipkin:
```bash
docker run -d --name zipkin \
  -p 9411:9411 \
  openzipkin/zipkin:latest
```

2. Configure:
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:9411
```

3. Access UI at `http://localhost:9411`

### DataDog

1. Install DataDog agent or use cloud endpoint

2. Configure:
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=https://api.datadoghq.com
export DD_API_KEY=your-datadog-api-key
```

### Grafana Tempo

1. Start Tempo + Grafana:
```bash
docker run -d --name tempo -p 4318:4318 grafana/tempo:latest
docker run -d --name grafana -p 3000:3000 grafana/grafana:latest
```

2. Configure Grafana to use Tempo as data source

3. Export traces:
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

## Usage

### Basic Import

```typescript
import { traceWordPressAPI, traceCacheOperation, getTraceId } from '@/lib/telemetry'
```

### Tracing WordPress API Calls

```typescript
// Wrap any WordPress API call
const posts = await traceWordPressAPI('GET', '/wp/v2/posts', async () => {
  return standardizedAPI.getAllPosts({ perPage: 10 })
}, { retryCount: 0 })
```

### Tracing Cache Operations

```typescript
// Wrap cache get/set operations
const cached = traceCacheOperation('get', 'post:123', () => {
  return cacheManager.get<Post>('post:123')
})

// With TTL tracking
traceCacheOperation('set', 'post:123', () => {
  cacheManager.set('post:123', post, CACHE_TTL.POST)
}, { ttl: CACHE_TTL.POST, dependencies: ['category:5'] })
```

### Tracing Resilience Patterns

```typescript
import { traceCircuitBreaker, traceRetry, traceRateLimit } from '@/lib/telemetry'

// Circuit breaker
await traceCircuitBreaker('getPost', async () => {
  return getPostById(123)
}, { endpoint: '/wp/v2/posts/123', state: CircuitState.CLOSED })

// Retry strategy
await traceRetry('fetchPost', async () => {
  return apiClient.get('/wp/v2/posts/123')
}, { maxRetries: 3, currentRetry: 1 })

// Rate limiting
await traceRateLimit('apiCall', async () => {
  return apiClient.get('/wp/v2/posts')
})
```

### Tracing Page Rendering

```typescript
import { tracePageRendering } from '@/lib/telemetry'

// In page component
await tracePageRendering('/berita/[slug]', async () => {
  const post = await getPostBySlug(params.slug)
  return <PostPage post={post} />
}, { params: { slug: params.slug }, revalidate: 300 })
```

### Getting Current Trace ID

```typescript
import { getTraceId } from '@/lib/telemetry'

// In error handling
try {
  await fetchPosts()
} catch (error) {
  const traceId = getTraceId()
  logger.error('Failed to fetch posts', error, { traceId })
  throw error
}
```

### Getting Trace Context Headers

```typescript
import { getTraceContextHeaders } from '@/lib/telemetry'

// For outgoing requests
const headers = getTraceContextHeaders()
// Returns: { 'x-trace-id': 'abc123...', 'x-span-id': 'def456...' }
```

## Span Attributes

### WordPress API Spans

| Attribute | Type | Description |
|-----------|------|-------------|
| `http.method` | string | HTTP method (GET, POST, etc.) |
| `http.url` | string | Full URL of the request |
| `wp.api.method` | string | WordPress API method |
| `wp.api.endpoint` | string | WordPress endpoint path |
| `wp.api.retry_count` | number | Current retry attempt |
| `cache.hit` | boolean | Whether result was cached |
| `http.status_code` | number | HTTP response code |
| `http.duration_ms` | number | Request duration in ms |

### Cache Spans

| Attribute | Type | Description |
|-----------|------|-------------|
| `cache.operation` | string | Operation (get, set, delete, invalidate) |
| `cache.key` | string | Cache key |
| `cache.ttl_ms` | number | TTL in milliseconds |
| `cache.hit` | boolean | Whether cache hit occurred |
| `cache.dependencies_count` | number | Number of dependencies |
| `cache.duration_ms` | number | Operation duration in ms |

### Resilience Pattern Spans

| Attribute | Type | Description |
|-----------|------|-------------|
| `resilience.pattern` | string | Pattern (circuit-breaker, retry, rate-limit) |
| `resilience.operation` | string | Operation name |
| `resilience.service` | string | Service class name |
| `resilience.endpoint` | string | API endpoint |
| `resilience.circuit_state` | string | Circuit breaker state |
| `resilience.success` | boolean | Operation success |
| `resilience.duration_ms` | number | Duration in ms |

## Error Handling

### Trace ID in Error Responses

When errors occur, trace IDs are automatically included:

```typescript
// Error response format
{
  "type": "SERVER_ERROR",
  "message": "Failed to fetch posts",
  "statusCode": 500,
  "retryable": true,
  "traceId": "abc123def456...",
  "spanId": "789abcdef012..."
}
```

### Manual Error Recording

```typescript
import { otelProvider } from '@/lib/telemetry'

const span = otelProvider.getActiveSpan()
if (span) {
  span.recordException(error)
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
}
```

## Performance Considerations

1. **Span Overhead**: Minimal overhead (~0.1ms per span)
2. **Batch Export**: Traces batched for efficient export
3. **No-op Mode**: When disabled, zero overhead (stub provider)
4. **Auto-instrumentation**: HTTP requests automatically traced

## Troubleshooting

### No Traces Appearing

1. Check `OTEL_ENABLED=true`
2. Verify endpoint connectivity
3. Check logs for initialization errors
4. Ensure service name is set

### Connection Issues

```bash
# Test endpoint
curl -X POST http://localhost:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[{"spans":[]}]}'
```

### Verify Initialization

Check logs for:
```
[OpenTelemetry] Initialized with service: headlesswp
[OpenTelemetry] Exporting to: http://localhost:4318
```

## Migration from Existing Telemetry

The existing `TelemetryCollector` continues to work. OpenTelemetry integration bridges to it:

```typescript
// Existing code works as-is
import { telemetryCollector } from '@/lib/api/telemetry'

telemetryCollector.record({
  type: 'my-event',
  category: 'api-request',
  data: { key: 'value' }
})

// OpenTelemetry spans are automatically recorded alongside
```

## Related Documentation

- [Blueprint](./blueprint.md) - Architecture overview
- [Monitoring Guide](./MONITORING.md) - Metrics and alerting
- [API Standardization](./API_STANDARDIZATION.md) - API patterns

## Support

For issues or questions, refer to:
- OpenTelemetry SDK: https://opentelemetry.io/docs/
- Next.js Integration: https://nextjs.org/docs/app/building-your-application/observability