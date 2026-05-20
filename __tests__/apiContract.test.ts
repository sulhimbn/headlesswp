import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { GET as HealthGET } from '@/app/api/health/route';
import { GET as ReadinessGET } from '@/app/api/health/readiness/route';
import { GET as MetricsGET } from '@/app/api/observability/metrics/route';
import { telemetryCollector } from '@/lib/api/telemetry';
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware';

const ajv = new Ajv({ allErrors: true, coerceTypes: false });
addFormats(ajv, { mode: 'fast' });

const healthResponseSchema = {
  type: 'object',
  required: ['status', 'timestamp', 'latency', 'version', 'uptime'],
  properties: {
    status: { type: 'string', enum: ['healthy'] },
    timestamp: { type: 'string', format: 'date-time' },
    latency: { type: 'number' },
    version: { type: 'string' },
    uptime: { type: 'number' },
  },
};

const unhealthyResponseSchema = {
  type: 'object',
  required: ['status', 'timestamp', 'error', 'latency'],
  properties: {
    status: { type: 'string', enum: ['unhealthy'] },
    timestamp: { type: 'string', format: 'date-time' },
    error: { type: 'string' },
    latency: { type: 'number' },
  },
};

const readinessResponseSchema = {
  type: 'object',
  required: ['status', 'timestamp', 'uptime'],
  properties: {
    status: { type: 'string', enum: ['ready'] },
    timestamp: { type: 'string', format: 'date-time' },
    uptime: { type: 'number' },
    checks: {
      type: 'object',
      properties: {
        cache: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            message: { type: 'string' },
          },
        },
        memory: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'error'] },
            message: { type: 'string' },
          },
        },
      },
    },
  },
};

const notReadyResponseSchema = {
  type: 'object',
  required: ['status', 'error'],
  properties: {
    status: { type: 'string', enum: ['not-ready'] },
    error: { type: 'string' },
  },
};

const metricsResponseSchema = {
  type: 'object',
  required: ['summary', 'circuitBreaker', 'retry', 'rateLimit', 'healthCheck', 'apiRequest'],
  properties: {
    summary: {
      type: 'object',
      properties: {
        totalEvents: { type: 'number' },
        eventTypes: { type: 'number' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number' },
      },
    },
    circuitBreaker: {
      type: 'object',
      properties: {
        stateChanges: { type: 'number' },
        failures: { type: 'number' },
        successes: { type: 'number' },
        requestsBlocked: { type: 'number' },
        totalEvents: { type: 'number' },
      },
    },
    retry: {
      type: 'object',
      properties: {
        retries: { type: 'number' },
        retrySuccesses: { type: 'number' },
        retryExhausted: { type: 'number' },
        totalEvents: { type: 'number' },
      },
    },
    rateLimit: {
      type: 'object',
      properties: {
        exceeded: { type: 'number' },
        resets: { type: 'number' },
        totalEvents: { type: 'number' },
      },
    },
    healthCheck: {
      type: 'object',
      properties: {
        healthy: { type: 'number' },
        unhealthy: { type: 'number' },
        totalEvents: { type: 'number' },
      },
    },
    apiRequest: {
      type: 'object',
      properties: {
        totalRequests: { type: 'number' },
        successful: { type: 'number' },
        failed: { type: 'number' },
        averageDuration: { type: 'number' },
        cacheHits: { type: 'number' },
        cacheMisses: { type: 'number' },
        totalEvents: { type: 'number' },
      },
    },
  },
};

const validateHealthResponse = ajv.compile(healthResponseSchema);
const validateUnhealthyResponse = ajv.compile(unhealthyResponseSchema);
const validateReadinessResponse = ajv.compile(readinessResponseSchema);
const validateNotReadyResponse = ajv.compile(notReadyResponseSchema);
const validateMetricsResponse = ajv.compile(metricsResponseSchema);

const mockRequest = {} as any;

jest.mock('@/lib/api/client', () => ({
  checkApiHealth: jest.fn(),
}));

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: any, init?: any) => {
      const headersMap: Record<string, string> = { ...(init?.headers || {}) };
      return {
        status: init?.status || 200,
        json: () => Promise.resolve(body),
        headers: {
          get: (key: string) => headersMap[key] || null,
          set: (key: string, value: string) => {
            headersMap[key] = value;
          },
        },
      };
    }),
  },
}));

const { checkApiHealth } = require('@/lib/api/client');

describe('API Contract Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    telemetryCollector.clear();
    resetAllRateLimitState();
  });

  afterEach(() => {
    telemetryCollector.clear();
  });

  describe('GET /health - Schema Validation', () => {
    it('should return response matching OpenAPI schema for 200', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-11T10:00:00Z',
        latency: 123,
        message: 'API is healthy',
        version: 'v2',
      });

      const response = await HealthGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      const valid = validateHealthResponse(data);
      expect(valid).toBe(true);
    });

    it('should return response matching OpenAPI schema for 503', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: false,
        timestamp: '2026-01-11T10:00:00Z',
        latency: 5000,
        message: 'Connection timeout',
        error: 'ECONNREFUSED',
      });

      const response = await HealthGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(503);
      const valid = validateUnhealthyResponse(data);
      expect(valid).toBe(true);
    });

    it('should validate required fields in healthy response', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-11T10:00:00Z',
        latency: 100,
        version: 'v2',
        uptime: 3600,
      });

      const response = await HealthGET(mockRequest);
      const data = await response.json();

      expect(data.status).toBe('healthy');
      expect(data.timestamp).toBeDefined();
      expect(data.latency).toBeDefined();
      expect(data.version).toBeDefined();
      expect(data.uptime).toBeDefined();
      expect(typeof data.latency).toBe('number');
      expect(typeof data.uptime).toBe('number');
    });

    it('should validate field types match schema', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-11T10:00:00Z',
        latency: 100,
        version: 'v2',
        uptime: 3600,
      });

      const response = await HealthGET(mockRequest);
      const data = await response.json();

      const valid = validateHealthResponse(data);
      expect(valid).toBe(true);
    });
  });

  describe('GET /health/readiness - Schema Validation', () => {
    it('should return response matching OpenAPI schema for 200', async () => {
      const response = await ReadinessGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      const valid = validateReadinessResponse(data);
      expect(valid).toBe(true);
    });

    it('should validate required fields in readiness response', async () => {
      const response = await ReadinessGET(mockRequest);
      const data = await response.json();

      expect(data.status).toBe('ready');
      expect(data.timestamp).toBeDefined();
      expect(data.uptime).toBeDefined();
      expect(data.checks).toBeDefined();
      expect(data.checks.cache).toBeDefined();
      expect(data.checks.memory).toBeDefined();
    });

    it('should return response matching OpenAPI schema for 503', async () => {
      let callCount = 0;
      const originalRecord = telemetryCollector.record.bind(telemetryCollector);
      jest.spyOn(telemetryCollector, 'record').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('System not ready');
        }
        return originalRecord({ type: 'state-change', category: 'circuit-breaker', data: {} });
      });

      const response = await ReadinessGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(503);
      const valid = validateNotReadyResponse(data);
      expect(valid).toBe(true);
    });
  });

  describe('GET /observability/metrics - Schema Validation', () => {
    it('should return response matching OpenAPI schema', async () => {
      telemetryCollector.record({
        type: 'request',
        category: 'api-request',
        data: { test: true },
      });

      const response = await MetricsGET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      const valid = validateMetricsResponse(data);
      expect(valid).toBe(true);
    });

    it('should validate all required metrics sections', async () => {
      telemetryCollector.record({
        type: 'request',
        category: 'api-request',
        data: { method: 'GET', endpoint: '/wp/v2/posts', statusCode: 200, duration: 100 },
      });

      const response = await MetricsGET(mockRequest);
      const data = await response.json();

      expect(data.summary).toBeDefined();
      expect(data.circuitBreaker).toBeDefined();
      expect(data.retry).toBeDefined();
      expect(data.rateLimit).toBeDefined();
      expect(data.healthCheck).toBeDefined();
      expect(data.apiRequest).toBeDefined();
    });

    it('should validate field types in metrics response', async () => {
      telemetryCollector.record({
        type: 'request',
        category: 'api-request',
        data: { method: 'GET', endpoint: '/wp/v2/posts', statusCode: 200, duration: 100, cacheHit: true },
      });

      const response = await MetricsGET(mockRequest);
      const data = await response.json();

      const valid = validateMetricsResponse(data);
      expect(valid).toBe(true);
    });

    it('should validate all required fields in metrics response', async () => {
      const response = await MetricsGET(mockRequest);
      const data = await response.json();

      const valid = validateMetricsResponse(data);
      expect(valid).toBe(true);

      expect(data.summary.totalEvents).toBeDefined();
      expect(data.circuitBreaker.totalEvents).toBeDefined();
      expect(data.retry.totalEvents).toBeDefined();
      expect(data.rateLimit.totalEvents).toBeDefined();
      expect(data.healthCheck.totalEvents).toBeDefined();
      expect(data.apiRequest.totalEvents).toBeDefined();
    });
  });

  describe('Response Field Validation', () => {
    it('should validate timestamp format in responses', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: new Date().toISOString(),
        latency: 100,
        version: 'v2',
        uptime: 3600,
      });

      const response = await HealthGET(mockRequest);
      const data = await response.json();

      const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      expect(data.timestamp).toMatch(isoDateRegex);
    });

    it('should validate status enums in responses', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-11T10:00:00Z',
        latency: 100,
        version: 'v2',
        uptime: 3600,
      });

      const response = await HealthGET(mockRequest);
      const data = await response.json();

      expect(['healthy', 'unhealthy']).toContain(data.status);
    });

    it('should validate latency is non-negative', async () => {
      checkApiHealth.mockResolvedValue({
        healthy: true,
        timestamp: '2026-01-11T10:00:00Z',
        latency: 100,
        version: 'v2',
        uptime: 3600,
      });

      const response = await HealthGET(mockRequest);
      const data = await response.json();

      expect(data.latency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Schema Validation Errors', () => {
    it('should fail validation when required field is missing', () => {
      const invalidData = {
        status: 'healthy',
        timestamp: '2026-01-11T10:00:00Z',
      };

      const valid = validateHealthResponse(invalidData);
      expect(valid).toBe(false);
      expect(validateHealthResponse.errors).toContainEqual(
        expect.objectContaining({ keyword: 'required' })
      );
    });

    it('should fail validation when status enum is invalid', () => {
      const invalidData = {
        status: 'invalid-status',
        timestamp: '2026-01-11T10:00:00Z',
        latency: 100,
        version: 'v2',
        uptime: 3600,
      };

      const valid = validateHealthResponse(invalidData);
      expect(valid).toBe(false);
      expect(validateHealthResponse.errors).toContainEqual(
        expect.objectContaining({ keyword: 'enum' })
      );
    });

    it('should fail validation when timestamp format is invalid', () => {
      const invalidData = {
        status: 'healthy',
        timestamp: 'not-a-date',
        latency: 100,
        version: 'v2',
        uptime: 3600,
      };

      const valid = validateHealthResponse(invalidData);
      expect(valid).toBe(false);
      expect(validateHealthResponse.errors).toContainEqual(
        expect.objectContaining({ keyword: 'format' })
      );
    });
  });
});
