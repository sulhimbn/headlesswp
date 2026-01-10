# Integration Monitoring Guide

**Version**: 1.0.0
**Created**: 2026-01-10
**Status**: Active

## Overview

This guide explains how to monitor and observe the integration resilience patterns in HeadlessWP. Monitoring is critical for understanding the health of WordPress API integration, detecting issues early, and making data-driven decisions about resilience configuration.

## Telemetry System

### Architecture

The telemetry system (`src/lib/api/telemetry.ts`) provides a centralized collection point for all resilience pattern events:

```
┌─────────────────┐
│   Application   │
│                 │
│  - Circuit      │
│    Breaker      │
│  - Retry        │───► TelemetryCollector
│  - Rate Limit   │         │
│  - Health Check │         │
│  - API Client   │         │
└─────────────────┘         │
                            ├──► In-Memory Buffer
                            ├──► Auto-Flush (60s)
                            └──► Event Callbacks
```

### Event Types

| Category | Type | Description |
|----------|-------|-------------|
| **Circuit Breaker** | `state-change` | Circuit state transition (CLOSED → OPEN → HALF_OPEN → CLOSED) |
| | `failure` | Failure recorded |
| | `success` | Success recorded |
| | `request-blocked` | Request blocked due to OPEN circuit |
| **Retry** | `retry` | Retry attempt initiated |
| | `retry-success` | Retry attempt succeeded |
| | `retry-exhausted` | All retry attempts exhausted |
| **Rate Limit** | `exceeded` | Rate limit exceeded (429) |
| | `reset` | Rate limit window reset |
| **Health Check** | `healthy` | Health check passed |
| | `unhealthy` | Health check failed |
| **API Request** | `request` | API request completed (success or failure) |

### Event Structure

```typescript
interface TelemetryEvent {
  timestamp: string      // ISO 8601 timestamp
  type: string         // Event type (e.g., 'state-change', 'retry')
  category: string      // Event category (e.g., 'circuit-breaker', 'retry')
  data: Record<string, unknown>  // Event-specific data
}
```

### Configuration

```typescript
// src/lib/api/telemetry.ts
const telemetryCollector = new TelemetryCollector({
  enabled: true,        // Enable/disable telemetry
  maxEvents: 1000,     // Max events before auto-flush
  flushInterval: 60000, // Auto-flush interval (60 seconds)
  onEvent: (event) => {  // Custom event callback
    // Send to APM (DataDog, New Relic, etc.)
  }
})
```

## Health Check Endpoints

### GET /api/health

**Purpose**: Check WordPress API health and availability.

**Usage**: Load balancer health probes, uptime monitoring.

**Response** (Healthy - 200):
```json
{
  "status": "healthy",
  "timestamp": "2026-01-10T10:00:00Z",
  "latency": 123,
  "version": "v2",
  "uptime": 3600
}
```

**Response** (Unhealthy - 503):
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-10T10:00:00Z",
  "message": "API is unhealthy",
  "error": "ECONNREFUSED",
  "latency": 5000
}
```

**Response** (Error - 500):
```json
{
  "status": "error",
  "error": "Network error"
}
```

### GET /api/health/readiness

**Purpose**: Check if application is ready to receive traffic (Kubernetes-style readiness probe).

**Usage**: Kubernetes readiness probes, deployment verification.

**Response** (Ready - 200):
```json
{
  "status": "ready",
  "checks": {
    "cache": {
      "status": "ok",
      "message": "Cache manager initialized"
    },
    "memory": {
      "status": "ok",
      "message": "Memory usage within limits"
    }
  },
  "timestamp": "2026-01-10T10:00:00Z",
  "uptime": 3600
}
```

**Response** (Not Ready - 503):
```json
{
  "status": "not-ready",
  "error": "Cache manager not initialized"
}
```

## Observability Endpoints

### GET /api/observability/metrics

**Purpose**: Export all resilience pattern metrics for monitoring dashboards and alerting.

**Usage**: Monitoring dashboards (Grafana, DataDog, New Relic), custom monitoring tools.

**Response**:
```json
{
  "summary": {
    "totalEvents": 1234,
    "eventTypes": 5,
    "timestamp": "2026-01-10T10:00:00Z",
    "uptime": 3600
  },
  "stats": {
    "circuit-breaker.state-change": 5,
    "circuit-breaker.failure": 23,
    "circuit-breaker.success": 1567,
    "circuit-breaker.request-blocked": 12,
    "retry.retry": 45,
    "retry.retry-success": 38,
    "retry.retry-exhausted": 7,
    "rate-limit.exceeded": 3,
    "health-check.healthy": 120,
    "health-check.unhealthy": 5,
    "api-request.request": 1600
  },
  "circuitBreaker": {
    "stateChanges": 5,
    "failures": 23,
    "successes": 1567,
    "requestsBlocked": 12,
    "totalEvents": 1607,
    "recentEvents": [...]
  },
  "retry": {
    "retries": 45,
    "retrySuccesses": 38,
    "retryExhausted": 7,
    "totalEvents": 90,
    "recentEvents": [...]
  },
  "rateLimit": {
    "exceeded": 3,
    "resets": 0,
    "totalEvents": 3,
    "recentEvents": [...]
  },
  "healthCheck": {
    "healthy": 120,
    "unhealthy": 5,
    "totalEvents": 125,
    "recentEvents": [...]
  },
  "apiRequest": {
    "totalRequests": 1600,
    "successful": 1590,
    "failed": 10,
    "averageDuration": 125,
    "cacheHits": 1200,
    "cacheMisses": 400,
    "totalEvents": 1600,
    "recentEvents": [...]
  }
}
```

## Monitoring Metrics

### Key Metrics to Monitor

| Metric | Description | Healthy Range | Alert Threshold |
|--------|-------------|----------------|-----------------|
| **Circuit Breaker State** | Current circuit state | CLOSED | OPEN (alert immediately) |
| **Circuit Failures** | Number of failures recorded | < 10/minute | > 10/minute |
| **Circuit Successes** | Number of successes recorded | > 100/minute | < 100/minute (degraded) |
| **Circuit Blocked Requests** | Requests blocked by OPEN circuit | 0 | > 5/minute |
| **Retry Rate** | Retry attempts / total requests | < 10% | > 20% |
| **Retry Success Rate** | Successful retries / total retries | > 80% | < 60% |
| **Retry Exhaustions** | Exhausted retries / total requests | < 1% | > 5% |
| **Rate Limit Hits** | Rate limit exceeded events | 0 | > 10/hour |
| **Health Check Status** | Health check pass/fail | Healthy | 3+ consecutive failures |
| **API Response Time** | Average API request duration | < 200ms | > 500ms |
| **API Error Rate** | Failed requests / total requests | < 1% | > 5% |
| **Cache Hit Rate** | Cache hits / total requests | > 70% | < 50% |

### Alerting Rules

#### Circuit Breaker Alerts

**Alert**: Circuit Breaker Open
```
WHEN: circuitBreaker.stateChanges > 0 AND latest state = OPEN
FOR: 1 minute
SEVERITY: CRITICAL
ACTION: Investigate WordPress API availability, check for outages
```

**Alert**: High Circuit Failure Rate
```
WHEN: circuitBreaker.failures > 10 per minute
FOR: 5 minutes
SEVERITY: WARNING
ACTION: Check WordPress API health, review error logs
```

#### Retry Alerts

**Alert**: High Retry Rate
```
WHEN: retry.retries / apiRequest.totalRequests > 0.20
FOR: 5 minutes
SEVERITY: WARNING
ACTION: Check WordPress API performance, network connectivity
```

**Alert**: Low Retry Success Rate
```
WHEN: retry.retrySuccesses / retry.retries < 0.60
FOR: 10 minutes
SEVERITY: WARNING
ACTION: Review retry configuration, check error types
```

**Alert**: High Retry Exhaustion Rate
```
WHEN: retry.retryExhausted / apiRequest.totalRequests > 0.05
FOR: 10 minutes
SEVERITY: CRITICAL
ACTION: Investigate persistent failures, consider increasing retries
```

#### Rate Limit Alerts

**Alert**: Rate Limit Exceeded
```
WHEN: rateLimit.exceeded > 0
FOR: 1 minute
SEVERITY: INFO
ACTION: Monitor traffic patterns, consider increasing limits
```

#### Health Check Alerts

**Alert**: Health Check Failed
```
WHEN: healthCheck.unhealthy > 0
FOR: 1 minute
SEVERITY: WARNING
```

**Alert**: Health Check Failed (Critical)
```
WHEN: healthCheck.unhealthy > 2 consecutive failures
FOR: 5 minutes
SEVERITY: CRITICAL
ACTION: Immediate investigation of WordPress API availability
```

#### API Performance Alerts

**Alert**: High Response Time
```
WHEN: apiRequest.averageDuration > 500ms
FOR: 5 minutes
SEVERITY: WARNING
```

**Alert**: High Error Rate
```
WHEN: apiRequest.failed / apiRequest.totalRequests > 0.05
FOR: 5 minutes
SEVERITY: WARNING
```

**Alert**: Low Cache Hit Rate
```
WHEN: apiRequest.cacheHits / apiRequest.totalRequests < 0.50
FOR: 10 minutes
SEVERITY: INFO
ACTION: Review cache TTL configuration, traffic patterns
```

## External APM Integration

### DataDog Integration

```typescript
import { telemetryCollector } from '@/lib/api/telemetry'

telemetryCollector = new TelemetryCollector({
  enabled: true,
  onEvent: (event) => {
    // Send to DataDog
    fetch('https://http-intake.logs.datadoghq.com/v1/input/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': process.env.DATADOG_API_KEY
      },
      body: JSON.stringify({
        ddsource: 'headlesswp',
        ddtags: `category:${event.category},type:${event.type}`,
        hostname: 'headlesswp-frontend',
        message: event.type,
        telemetry: event
      })
    })
  }
})
```

### New Relic Integration

```typescript
import { telemetryCollector } from '@/lib/api/telemetry'
const { recordMetric } = require('newrelic')

telemetryCollector = new TelemetryCollector({
  enabled: true,
  onEvent: (event) => {
    recordMetric({
      name: `HeadlessWP/${event.category}/${event.type}`,
      value: 1,
      attributes: event.data
    })
  }
})
```

### Prometheus Integration

```typescript
import { telemetryCollector } from '@/lib/api/telemetry'

// Counter metrics
export const circuitBreakerFailures = new Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total circuit breaker failures',
  labelNames: ['endpoint']
})

telemetryCollector = new TelemetryCollector({
  enabled: true,
  onEvent: (event) => {
    if (event.category === 'circuit-breaker' && event.type === 'failure') {
      circuitBreakerFailures.inc({ endpoint: event.data.endpoint })
    }
  }
})
```

## Kubernetes Probes

### Liveness Probe

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: headlesswp
spec:
  containers:
  - name: headlesswp
    image: headlesswp:latest
    livenessProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
```

### Readiness Probe

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: headlesswp
spec:
  containers:
  - name: headlesswp
    image: headlesswp:latest
    readinessProbe:
      httpGet:
        path: /api/health/readiness
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
```

## Troubleshooting

### Circuit Breaker Stays Open

**Symptoms**: Requests blocked with `CIRCUIT_BREAKER_OPEN` error.

**Diagnosis**:
```bash
# Check circuit breaker state
curl http://localhost:3000/api/observability/metrics | jq '.circuitBreaker'
```

**Solutions**:
1. Check WordPress API availability
2. Verify network connectivity
3. Review circuit breaker configuration (`CIRCUIT_BREAKER_FAILURE_THRESHOLD`)
4. Wait for recovery timeout (60s by default)
5. Manually reset via deployment restart

### High Retry Rate

**Symptoms**: High `retry.retries` count, degraded performance.

**Diagnosis**:
```bash
# Check retry metrics
curl http://localhost:3000/api/observability/metrics | jq '.retry'

# Check API request duration
curl http://localhost:3000/api/observability/metrics | jq '.apiRequest.averageDuration'
```

**Solutions**:
1. Check WordPress API response times
2. Verify network latency
3. Review `RETRY_INITIAL_DELAY` configuration
4. Consider increasing `MAX_RETRIES` if transient errors are common

### Rate Limit Exceeded

**Symptoms**: `RATE_LIMIT_ERROR` errors, `rateLimit.exceeded` events.

**Diagnosis**:
```bash
# Check rate limit metrics
curl http://localhost:3000/api/observability/metrics | jq '.rateLimit'
```

**Solutions**:
1. Review traffic patterns (sudden spikes?)
2. Increase `RATE_LIMIT_MAX_REQUESTS` if WordPress can handle more
3. Reduce `RATE_LIMIT_WINDOW_MS` for tighter control
4. Implement caching to reduce API calls
5. Review API usage for optimization opportunities

### Health Check Failures

**Symptoms**: `healthCheck.unhealthy` events, 503 responses from `/api/health`.

**Diagnosis**:
```bash
# Check health status directly
curl http://localhost:8080/wp-json/wp/v2/

# Check error logs
kubectl logs <pod-name> | grep "healthCheck"
```

**Solutions**:
1. Verify WordPress API is running
2. Check network connectivity to WordPress
3. Verify `WORDPRESS_API_URL` environment variable
4. Check firewall rules (port 8080)
5. Review WordPress API error logs

## Best Practices

### 1. Set Up Alerts Early

Configure alerts as soon as monitoring is deployed:
- Circuit breaker OPEN (CRITICAL)
- Health check failed (CRITICAL)
- High error rate (WARNING)
- High response time (WARNING)

### 2. Monitor Trends

Don't just react to alerts - monitor trends over time:
- Track circuit breaker state changes (should be rare)
- Monitor retry rates (should be low and stable)
- Review error rates (should be consistently < 1%)
- Track response time baselines

### 3. Correlate Metrics

Look for correlations between metrics:
- High response time → High retry rate?
- Circuit breaker OPEN → Increased error rate?
- Low cache hit rate → Higher API requests?

### 4. Document Incidents

For every incident:
1. What metrics alerted?
2. What was the root cause?
3. What fixed it?
4. How can we prevent it?

### 5. Adjust Configuration

Use metrics to tune resilience patterns:
- Increase `MAX_RETRIES` if retry success rate is high (> 90%)
- Decrease `CIRCUIT_BREAKER_FAILURE_THRESHOLD` if circuit opens too late
- Increase `RATE_LIMIT_MAX_REQUESTS` if rate limits are rarely hit

## References

- [Architecture Blueprint - Integration Resilience Patterns](../blueprint.md#integration-resilience-patterns)
- [API Documentation](../api.md)
- [Integration Testing Guide](../INTEGRATION_TESTING.md)
- [Telemetry Module](../src/lib/api/telemetry.ts)
