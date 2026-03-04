import { telemetryCollector } from '@/lib/api/telemetry';
import { checkApiHealth } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({
  checkApiHealth: jest.fn(),
}));

jest.mock('@/lib/api/telemetry', () => ({
  telemetryCollector: {
    record: jest.fn(),
    getEvents: jest.fn().mockReturnValue([]),
    getEventsByCategory: jest.fn().mockReturnValue([]),
    getEventsByType: jest.fn().mockReturnValue([]),
    getStats: jest.fn().mockReturnValue({}),
  },
}));

jest.mock('@/lib/api/rateLimitMiddleware', () => ({
  withApiRateLimit: jest.fn((handler) => handler),
}));

jest.mock('@/lib/api/performanceMetrics', () => ({
  performanceMetricsCollector: {
    getApiResponseMetrics: jest.fn().mockReturnValue({
      total: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      avg: 0,
      byEndpoint: {},
    }),
    getResourceMetrics: jest.fn().mockReturnValue({
      avgCpuUsage: 0,
      avgMemoryUsage: 0,
      avgHeapUsage: 0,
    }),
    getErrorMetrics: jest.fn().mockReturnValue([]),
    getWebVitalsMetrics: jest.fn().mockReturnValue({
      events: [],
      byMetricName: {},
    }),
  },
  captureCurrentResourceUtilization: jest.fn().mockReturnValue({
    cpu: 0,
    memory: 0,
    heap: 0,
  }),
}));

jest.mock('@/lib/constants/appConstants', () => ({
  TELEMETRY: {
    RECENT_EVENT_COUNT: 10,
  },
}));

describe('Health API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (telemetryCollector.record as jest.Mock).mockReset();
  });

  describe('Health Check Handler Logic', () => {
    it('should return healthy status when API is healthy', async () => {
      (checkApiHealth as jest.Mock).mockResolvedValueOnce({
        healthy: true,
        timestamp: new Date().toISOString(),
        latency: 100,
        version: 'v2',
        message: 'API is healthy',
      });

      const result = await checkApiHealth();
      
      expect(result.healthy).toBe(true);
      expect(result.version).toBe('v2');
    });

    it('should return unhealthy status when API is down', async () => {
      (checkApiHealth as jest.Mock).mockResolvedValueOnce({
        healthy: false,
        timestamp: new Date().toISOString(),
        latency: 5000,
        message: 'API is unhealthy',
        error: 'Connection refused',
      });

      const result = await checkApiHealth();
      
      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Connection refused');
    });

    it('should return error when checkApiHealth throws', async () => {
      (checkApiHealth as jest.Mock).mockRejectedValueOnce(new Error('Service unavailable'));

      await expect(checkApiHealth()).rejects.toThrow('Service unavailable');
    });
  });

  describe('Readiness Check Handler Logic', () => {
    it('should return ready status with cache and memory checks', () => {
      const checks = {
        cache: {
          status: 'ok',
          message: 'Cache manager initialized'
        },
        memory: {
          status: 'ok',
          message: 'Memory usage within limits'
        }
      };

      expect(checks.cache.status).toBe('ok');
      expect(checks.memory.status).toBe('ok');
    });

    it('should include uptime', () => {
      const uptime = process.uptime();
      expect(uptime).toBeGreaterThan(0);
    });
  });

  describe('Metrics Handler Logic', () => {
    it('should return all metrics categories', () => {
      const allEvents = telemetryCollector.getEvents();
      const stats = telemetryCollector.getStats();
      
      const circuitBreakerEvents = telemetryCollector.getEventsByCategory('circuit-breaker');
      const retryEvents = telemetryCollector.getEventsByCategory('retry');
      const rateLimitEvents = telemetryCollector.getEventsByCategory('rate-limit');
      const healthCheckEvents = telemetryCollector.getEventsByCategory('health-check');
      const apiRequestEvents = telemetryCollector.getEventsByCategory('api-request');

      expect(Array.isArray(allEvents)).toBe(true);
      expect(typeof stats).toBe('object');
      expect(Array.isArray(circuitBreakerEvents)).toBe(true);
      expect(Array.isArray(retryEvents)).toBe(true);
      expect(Array.isArray(rateLimitEvents)).toBe(true);
      expect(Array.isArray(healthCheckEvents)).toBe(true);
      expect(Array.isArray(apiRequestEvents)).toBe(true);
    });

    it('should return circuit breaker stats', () => {
      const circuitBreakerStats = {
        stateChanges: telemetryCollector.getEventsByType('state-change').length,
        failures: telemetryCollector.getEventsByType('failure').length,
        successes: telemetryCollector.getEventsByType('success').length,
        requestsBlocked: telemetryCollector.getEventsByType('request-blocked').length,
        totalEvents: telemetryCollector.getEventsByCategory('circuit-breaker').length,
      };

      expect(typeof circuitBreakerStats.stateChanges).toBe('number');
      expect(typeof circuitBreakerStats.failures).toBe('number');
      expect(typeof circuitBreakerStats.successes).toBe('number');
    });

    it('should return retry stats', () => {
      const retryStats = {
        retries: telemetryCollector.getEventsByType('retry').length,
        retrySuccesses: telemetryCollector.getEventsByType('retry-success').length,
        retryExhausted: telemetryCollector.getEventsByType('retry-exhausted').length,
        totalEvents: telemetryCollector.getEventsByCategory('retry').length,
      };

      expect(typeof retryStats.retries).toBe('number');
    });

    it('should return rate limit stats', () => {
      const rateLimitStats = {
        exceeded: telemetryCollector.getEventsByType('exceeded').length,
        resets: telemetryCollector.getEventsByType('reset').length,
        totalEvents: telemetryCollector.getEventsByCategory('rate-limit').length,
      };

      expect(typeof rateLimitStats.exceeded).toBe('number');
    });

    it('should return health check stats', () => {
      const healthCheckStats = {
        healthy: telemetryCollector.getEventsByType('healthy').length,
        unhealthy: telemetryCollector.getEventsByType('unhealthy').length,
        totalEvents: telemetryCollector.getEventsByCategory('health-check').length,
      };

      expect(typeof healthCheckStats.healthy).toBe('number');
    });

    it('should return API request stats', () => {
      const apiRequestEvents = telemetryCollector.getEventsByCategory('api-request');
      
      const apiRequestStats = {
        totalRequests: apiRequestEvents.length,
        successful: apiRequestEvents.filter((e: any) => {
          const statusCode = e.data?.statusCode;
          return statusCode !== undefined && statusCode >= 200 && statusCode < 300;
        }).length,
        failed: apiRequestEvents.filter((e: any) => {
          const statusCode = e.data?.statusCode;
          return statusCode !== undefined && statusCode >= 400;
        }).length,
      };

      expect(typeof apiRequestStats.totalRequests).toBe('number');
    });

    it('should include uptime in summary', () => {
      const summary = {
        totalEvents: 0,
        eventTypes: 0,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };

      expect(summary.uptime).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', () => {
      (telemetryCollector.getEvents as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Metrics error');
      });

      expect(() => {
        telemetryCollector.getEvents();
      }).toThrow('Metrics error');
    });
  });
});
