import { GET as MediaGET } from '@/app/api/media/[id]/route';
import { standardizedAPI } from '@/lib/api/standardized';
import { logger } from '@/lib/utils/logger';
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware';
import { isApiResultSuccessful } from '@/lib/api/response';
import type { WordPressMedia } from '@/types/wordpress';

jest.mock('@/lib/api/standardized');
jest.mock('@/lib/utils/logger');
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
          }
        }
      };
    })
  }
}));

const mockedStandardizedAPI = standardizedAPI as jest.Mocked<typeof standardizedAPI>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

const createMockMediaResult = (media: WordPressMedia | null) => ({
  data: media,
  error: null,
  metadata: {
    endpoint: media ? `/wp/v2/media/${media.id}` : '',
    timestamp: '2026-03-09T10:00:00Z'
  }
} as any);

const createMockErrorResult = (error: Error) => ({
  data: null,
  error: {
    type: 'UNKNOWN_ERROR',
    message: error.message,
    statusCode: 500
  },
  metadata: {
    endpoint: '',
    timestamp: '2026-03-09T10:00:00Z'
  }
} as any);

describe('Media API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllRateLimitState();
  });

  const mockRequest = (id: string) => ({
    url: `http://localhost:3000/api/media/${id}`
  }) as any;

  describe('GET /api/media/[id]', () => {
    it('should return 200 with source_url: null for invalid media ID (non-numeric)', async () => {
      const request = mockRequest('abc');
      const params = Promise.resolve({ id: 'abc' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBeNull();
    });

    it('should return 200 with source_url: null for NaN media ID', async () => {
      const request = mockRequest('invalid');
      const params = Promise.resolve({ id: 'invalid' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBeNull();
    });

    it('should return media data for valid media ID', async () => {
      const mockMedia: WordPressMedia = {
        id: 123,
        source_url: 'https://example.com/image.jpg',
        title: { rendered: 'Test Image' },
        alt_text: 'Test alt text',
        media_type: 'image',
        mime_type: 'image/jpeg'
      };

      mockedStandardizedAPI.getMediaById.mockResolvedValue(createMockMediaResult(mockMedia));

      const request = mockRequest('123');
      const params = Promise.resolve({ id: '123' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBe('https://example.com/image.jpg');
      expect(data.alt_text).toBe('Test alt text');
      expect(mockedStandardizedAPI.getMediaById).toHaveBeenCalledWith(123);
    });

    it('should return 200 with source_url: null for non-existent media', async () => {
      mockedStandardizedAPI.getMediaById.mockResolvedValue(createMockMediaResult(null));

      const request = mockRequest('999');
      const params = Promise.resolve({ id: '999' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBeNull();
    });

    it('should return 200 with source_url: null when API returns unsuccessful result', async () => {
      const errorResult = createMockErrorResult(new Error('API Error'));
      (errorResult as any).data = null;
      
      mockedStandardizedAPI.getMediaById.mockResolvedValue(errorResult as any);

      const request = mockRequest('456');
      const params = Promise.resolve({ id: '456' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBeNull();
    });

    it('should return 200 with source_url: null when getMediaById throws an error', async () => {
      mockedStandardizedAPI.getMediaById.mockRejectedValue(new Error('Network error'));

      const request = mockRequest('789');
      const params = Promise.resolve({ id: '789' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBeNull();
      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Error in /api/media/[id]',
        expect.any(Error),
        { module: 'api/media' }
      );
    });

    it('should handle negative media ID', async () => {
      const request = mockRequest('-1');
      const params = Promise.resolve({ id: '-1' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBeNull();
    });

    it('should handle zero media ID', async () => {
      const request = mockRequest('0');
      const params = Promise.resolve({ id: '0' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBeNull();
    });

    it('should handle floating point media ID', async () => {
      const request = mockRequest('12.5');
      const params = Promise.resolve({ id: '12.5' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBeNull();
    });

    it('should handle empty string media ID', async () => {
      const request = mockRequest('');
      const params = Promise.resolve({ id: '' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBeNull();
    });

    it('should handle media without alt_text', async () => {
      const mockMedia: WordPressMedia = {
        id: 321,
        source_url: 'https://example.com/image2.png',
        title: { rendered: 'Image 2' },
        alt_text: '',
        media_type: 'image',
        mime_type: 'image/png'
      };

      mockedStandardizedAPI.getMediaById.mockResolvedValue(createMockMediaResult(mockMedia));

      const request = mockRequest('321');
      const params = Promise.resolve({ id: '321' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBe('https://example.com/image2.png');
      expect(data.alt_text).toBe('');
    });

    it('should handle large media ID', async () => {
      const mockMedia: WordPressMedia = {
        id: 999999999,
        source_url: 'https://example.com/large-image.jpg',
        title: { rendered: 'Large Image' },
        alt_text: 'Large image alt',
        media_type: 'image',
        mime_type: 'image/jpeg'
      };

      mockedStandardizedAPI.getMediaById.mockResolvedValue(createMockMediaResult(mockMedia));

      const request = mockRequest('999999999');
      const params = Promise.resolve({ id: '999999999' });

      const response = await MediaGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.source_url).toBe('https://example.com/large-image.jpg');
      expect(mockedStandardizedAPI.getMediaById).toHaveBeenCalledWith(999999999);
    });
  });
});
