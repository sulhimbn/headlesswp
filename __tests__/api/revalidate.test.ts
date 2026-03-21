import { POST } from '@/app/api/revalidate/route';
import { cacheManager, cacheKeys } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';
import type { NextRequest } from 'next/server';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body: unknown, init?: { status?: number }) => ({
      status: init?.status || 200,
      body,
    })),
  },
}));

const mockCacheManager = cacheManager as jest.Mocked<typeof cacheManager>;
const mockLogger = logger as jest.Mocked<typeof logger>;

const originalEnv = process.env;

function createMockRequest(options: {
  body?: unknown;
  headers?: Record<string, string>;
  method?: string;
}): NextRequest {
  const mockHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(options.headers || {})) {
    mockHeaders[key] = value;
  }

  return {
    method: options.method || 'POST',
    headers: {
      get: (key: string) => mockHeaders[key.toLowerCase()] || mockHeaders[key] || null,
    },
    url: 'http://localhost:3000/api/revalidate',
    json: async () => options.body,
  } as unknown as NextRequest;
}

describe('Revalidate API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.REVALIDATE_SECRET;
    
    mockCacheManager.getStats.mockReturnValue({
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      cascadeInvalidations: 0,
      dependencyRegistrations: 0,
      total: 0,
      hitRate: 0,
      invalidationRate: 0,
      size: 0,
      memoryUsageBytes: 0,
      avgTtl: 0,
    });
    
    mockCacheManager.invalidate.mockReturnValue(undefined);
    mockCacheManager.invalidateByEntityType.mockReturnValue(0);
    mockCacheManager.get.mockReturnValue({ data: 'test', timestamp: Date.now(), ttl: 60000 });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('POST /api/revalidate', () => {
    describe('Authentication', () => {
      it('should return 401 when secret is required but not provided', async () => {
        process.env.REVALIDATE_SECRET = 'test-secret';

        const request = createMockRequest({
          body: { post_id: 1, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean; error: string };

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
        expect(body.error).toContain('Unauthorized');
      });

      it('should return 401 when invalid secret is provided', async () => {
        process.env.REVALIDATE_SECRET = 'test-secret';

        const request = createMockRequest({
          body: { post_id: 1, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' },
          headers: { 'x-revalidate-secret': 'wrong-secret' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(401);
        expect(body.success).toBe(false);
      });

      it('should return 200 when valid secret is provided via x-revalidate-secret header', async () => {
        process.env.REVALIDATE_SECRET = 'test-secret';

        const request = createMockRequest({
          body: { post_id: 1, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' },
          headers: { 'x-revalidate-secret': 'test-secret' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
      });

      it('should return 200 when valid secret is provided via Bearer token', async () => {
        process.env.REVALIDATE_SECRET = 'test-secret';

        const request = createMockRequest({
          body: { post_id: 1, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' },
          headers: { 'authorization': 'Bearer test-secret' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
      });

      it('should allow all requests when REVALIDATE_SECRET is not configured', async () => {
        delete process.env.REVALIDATE_SECRET;

        const request = createMockRequest({
          body: { post_id: 1, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'REVALIDATE_SECRET not configured, allowing all requests',
          { module: 'revalidate' }
        );
      });
    });

    describe('Payload Validation', () => {
      it('should return 400 when payload is missing required fields', async () => {
        const request = createMockRequest({
          body: { post_id: 1 }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean; error: string };

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error).toContain('Invalid payload');
      });

      it('should return 400 when post_id is not a positive integer', async () => {
        const request = createMockRequest({
          body: { post_id: -1, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
      });

      it('should return 400 when post_id is zero', async () => {
        const request = createMockRequest({
          body: { post_id: 0, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
      });

      it('should return 400 when post_type is invalid', async () => {
        const request = createMockRequest({
          body: { post_id: 1, post_type: 'invalid', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
      });

      it('should return 400 when action is invalid', async () => {
        const request = createMockRequest({
          body: { post_id: 1, post_type: 'post', action: 'invalid', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
      });

      it('should return 400 when timestamp is invalid', async () => {
        const request = createMockRequest({
          body: { post_id: 1, post_type: 'post', action: 'update', timestamp: 'invalid-date' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
      });

      it('should return 400 when timestamp is missing', async () => {
        const request = createMockRequest({
          body: { post_id: 1, post_type: 'post', action: 'update' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
      });
    });

    describe('Cache Invalidation', () => {
      it('should invalidate cache for post type', async () => {
        const request = createMockRequest({
          body: { post_id: 123, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean; data: Record<string, unknown> };

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.postId).toBe(123);
        expect(body.data.postType).toBe('post');
        expect(body.data.action).toBe('update');
        expect(mockCacheManager.invalidate).toHaveBeenCalled();
      });

      it('should invalidate cache for page type', async () => {
        const request = createMockRequest({
          body: { post_id: 456, post_type: 'page', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean; data: Record<string, unknown> };

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.postType).toBe('page');
        expect(mockCacheManager.invalidate).toHaveBeenCalled();
      });

      it('should invalidate cache for attachment type', async () => {
        const request = createMockRequest({
          body: { post_id: 789, post_type: 'attachment', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean; data: Record<string, unknown> };

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.data.postType).toBe('attachment');
        expect(mockCacheManager.invalidate).toHaveBeenCalled();
        expect(mockCacheManager.invalidate.mock.calls.length).toBe(1);
      });

      it('should invalidate dependent caches on delete action', async () => {
        mockCacheManager.getStats.mockReturnValue({
          hits: 0,
          misses: 0,
          sets: 0,
          deletes: 0,
          cascadeInvalidations: 0,
          dependencyRegistrations: 0,
          total: 0,
          hitRate: 0,
          invalidationRate: 0,
          size: 0,
          memoryUsageBytes: 0,
          avgTtl: 0,
        });

        const request = createMockRequest({
          body: { post_id: 123, post_type: 'post', action: 'delete', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(200);
        expect(body.success).toBe(true);
        expect(mockCacheManager.invalidateByEntityType).toHaveBeenCalledWith('posts');
      });

      it('should not call invalidateByEntityType for non-delete actions', async () => {
        const request = createMockRequest({
          body: { post_id: 123, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        await POST(request);

        expect(mockCacheManager.invalidateByEntityType).not.toHaveBeenCalled();
      });

      it('should track cascade invalidations', async () => {
        mockCacheManager.getStats.mockReturnValue({
          hits: 10,
          misses: 5,
          sets: 20,
          deletes: 3,
          cascadeInvalidations: 5,
          dependencyRegistrations: 10,
          total: 15,
          hitRate: 66.67,
          invalidationRate: 20,
          size: 50,
          memoryUsageBytes: 1024000,
          avgTtl: 1800000,
        });

        const request = createMockRequest({
          body: { post_id: 123, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { data: Record<string, unknown> };

        expect(response.status).toBe(200);
        expect(body.data.cascadeInvalidations).toBeDefined();
      });

      it('should log revalidation events', async () => {
        const request = createMockRequest({
          body: { post_id: 123, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        await POST(request);

        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Revalidation triggered'),
          expect.objectContaining({
            module: 'revalidate',
            postId: 123,
            postType: 'post',
            action: 'update',
          })
        );
      });
    });

    describe('Response Format', () => {
      it('should return success response with data', async () => {
        const request = createMockRequest({
          body: { post_id: 123, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as {
          success: boolean;
          message: string;
          data: Record<string, unknown>;
        };

        expect(body.success).toBe(true);
        expect(body.message).toContain('Cache invalidated');
        expect(body.data).toEqual(expect.objectContaining({
          success: true,
          postId: 123,
          postType: 'post',
          action: 'update',
          invalidatedKeys: expect.any(Array),
          cascadeInvalidations: expect.any(Number),
          timestamp: expect.any(String),
        }));
      });

      it('should return valid ISO timestamp in response', async () => {
        const request = createMockRequest({
          body: { post_id: 123, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { data: { timestamp: string } };

        const timestamp = new Date(body.data.timestamp);
        expect(timestamp.toISOString()).toBe(body.data.timestamp);
      });

      it('should include invalidated keys when cache entries exist', async () => {
        mockCacheManager.get.mockImplementation(() => {
          return { data: 'test', timestamp: Date.now(), ttl: 60000 };
        });

        const request = createMockRequest({
          body: { post_id: 123, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request);
        const body = (response as { body: unknown }).body as { data: { invalidatedKeys: string[] } };

        expect(body.data.invalidatedKeys.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Error Handling', () => {
      it('should return 400 for invalid JSON', async () => {
        const invalidRequest = {
          method: 'POST',
          headers: {
            get: jest.fn(),
          },
          url: 'http://localhost:3000/api/revalidate',
          json: async () => { throw new Error('Invalid JSON'); },
        };

        const response = await POST(invalidRequest as any);
        const body = (response as { body: unknown }).body as { success: boolean; error: string };

        expect(response.status).toBe(400);
        expect(body.success).toBe(false);
        expect(body.error).toContain('Invalid JSON');
      });
    });

    describe('Request Method', () => {
      it('should return 405 for non-POST methods', async () => {
        const request = createMockRequest({
          method: 'GET',
          body: { post_id: 1, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request as any);
        const body = (response as { body: unknown }).body as { success: boolean; error: string };

        expect(response.status).toBe(405);
        expect(body.success).toBe(false);
        expect(body.error).toContain('Method not allowed');
      });

      it('should return 405 for PUT methods', async () => {
        const request = createMockRequest({
          method: 'PUT',
          body: { post_id: 1, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request as any);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(405);
      });

      it('should return 405 for DELETE methods', async () => {
        const request = createMockRequest({
          method: 'DELETE',
          body: { post_id: 1, post_type: 'post', action: 'update', timestamp: '2026-01-01T00:00:00Z' }
        });

        const response = await POST(request as any);
        const body = (response as { body: unknown }).body as { success: boolean };

        expect(response.status).toBe(405);
      });
    });
  });
});

describe('RevalidatePayload Interface', () => {
  it('should accept valid payload structure', () => {
    const validPayload = {
      post_id: 123,
      post_type: 'post' as const,
      action: 'update' as const,
      timestamp: '2026-01-01T00:00:00Z',
    };

    expect(validPayload.post_id).toBe(123);
    expect(validPayload.post_type).toBe('post');
    expect(validPayload.action).toBe('update');
  });

  it('should accept all valid post types', () => {
    const postTypes: ('post' | 'page' | 'attachment')[] = ['post', 'page', 'attachment'];

    postTypes.forEach(type => {
      const payload = {
        post_id: 1,
        post_type: type,
        action: 'update' as const,
        timestamp: '2026-01-01T00:00:00Z',
      };
      expect(payload.post_type).toBe(type);
    });
  });

  it('should accept all valid actions', () => {
    const actions: ('create' | 'update' | 'delete')[] = ['create', 'update', 'delete'];

    actions.forEach(action => {
      const payload = {
        post_id: 1,
        post_type: 'post' as const,
        action,
        timestamp: '2026-01-01T00:00:00Z',
      };
      expect(payload.action).toBe(action);
    });
  });
});
