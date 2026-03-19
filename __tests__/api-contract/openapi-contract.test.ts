import * as jestOpenAPI from 'jest-openapi';
import path from 'path';

jestOpenAPI.default(path.join(process.cwd(), 'docs/openapi.yaml'));

describe('OpenAPI Specification Contract Tests', () => {
  describe('API Health Endpoint', () => {
    it('should satisfy OpenAPI spec for healthy response', () => {
      const healthyResponse = {
        status: 'healthy',
        timestamp: '2026-03-19T10:00:00Z',
        latency: 123,
        version: 'v2',
        uptime: 3600
      };

      expect(healthyResponse).toSatisfySchemaInApiSpec('HealthResponse');
    });

    it('should satisfy OpenAPI spec for unhealthy response', () => {
      const unhealthyResponse = {
        status: 'unhealthy',
        timestamp: '2026-03-19T10:00:00Z',
        error: 'Connection timeout',
        latency: 5000
      };

      expect(unhealthyResponse).toSatisfySchemaInApiSpec('UnhealthyResponse');
    });

    it('should satisfy OpenAPI spec for readiness response', () => {
      const readyResponse = {
        status: 'ready',
        timestamp: '2026-03-19T10:00:00Z',
        uptime: 3600,
        checks: {
          cache: { status: 'ok', message: 'Cache manager initialized' },
          memory: { status: 'ok', message: 'Memory usage within limits' }
        }
      };

      expect(readyResponse).toSatisfySchemaInApiSpec('ReadinessResponse');
    });
  });

  describe('Metrics Endpoint Schema', () => {
    it('should satisfy OpenAPI spec for metrics response', () => {
      const metricsResponse = {
        summary: {
          totalEvents: 1234,
          eventTypes: 5,
          timestamp: '2026-03-19T10:00:00Z',
          uptime: 3600
        },
        circuitBreaker: {
          stateChanges: 5,
          failures: 23,
          successes: 1567,
          requestsBlocked: 12,
          totalEvents: 1607
        },
        retry: {
          retries: 45,
          retrySuccesses: 38,
          retryExhausted: 7,
          totalEvents: 90
        },
        rateLimit: {
          exceeded: 3,
          resets: 0,
          totalEvents: 3
        },
        healthCheck: {
          healthy: 120,
          unhealthy: 5,
          totalEvents: 125
        },
        apiRequest: {
          totalRequests: 1600,
          successful: 1590,
          failed: 10,
          averageDuration: 125,
          cacheHits: 1200,
          cacheMisses: 400,
          totalEvents: 1600
        }
      };

      expect(metricsResponse).toSatisfySchemaInApiSpec('MetricsResponse');
    });
  });

  describe('Cache Endpoint Schemas', () => {
    it('should satisfy OpenAPI spec for cache stats response', () => {
      const cacheStatsResponse = {
        hits: 1500,
        misses: 300,
        hitRate: 0.833,
        size: 45,
        efficiency: 'high'
      };

      expect(cacheStatsResponse).toSatisfySchemaInApiSpec('CacheStatsResponse');
    });

    it('should satisfy OpenAPI spec for cache warm response', () => {
      const cacheWarmResponse = {
        status: 'warming',
        results: {
          posts: { success: true, latency: 150 },
          categories: { success: true, latency: 50 }
        }
      };

      expect(cacheWarmResponse).toSatisfySchemaInApiSpec('CacheWarmResponse');
    });

    it('should satisfy OpenAPI spec for cache clear response', () => {
      const cacheClearResponse = {
        status: 'cleared',
        timestamp: '2026-03-19T10:00:00Z'
      };

      expect(cacheClearResponse).toSatisfySchemaInApiSpec('CacheClearResponse');
    });
  });

  describe('Rate Limit Error Schema', () => {
    it('should satisfy OpenAPI spec for rate limit error', () => {
      const rateLimitError = {
        error: 'Rate limit exceeded',
        retryAfter: 60
      };

      expect(rateLimitError).toSatisfySchemaInApiSpec('RateLimitError');
    });
  });

  describe('CSP Report Schema', () => {
    it('should satisfy OpenAPI spec for CSP report', () => {
      const cspReport = {
        'csp-report': {
          'document-uri': 'https://example.com',
          'violated-directive': 'default-src',
          'effective-directive': 'default-src',
          'original-policy': "default-src 'self'",
          'disposition': 'enforce'
        }
      };

      expect(cspReport).toSatisfySchemaInApiSpec('CSPReport');
    });
  });

  describe('OpenAPI Specification Validation', () => {
  it('should validate schema structure for HealthResponse', () => {
    const validHealthResponse = {
      status: 'healthy',
      timestamp: '2026-03-19T10:00:00Z',
      latency: 123,
      version: 'v2',
      uptime: 3600
    };

    expect(validHealthResponse).toSatisfySchemaInApiSpec('HealthResponse');
  });

  it('should validate required fields for HealthResponse', () => {
    const invalidHealthResponse = {
      status: 'healthy'
    };

    expect(invalidHealthResponse).not.toSatisfySchemaInApiSpec('HealthResponse');
  });
});
});
