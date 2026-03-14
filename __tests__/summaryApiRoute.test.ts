import { GET as SummaryGET } from '@/app/api/summary/[id]/route';
import { wordpressAPI } from '@/lib/wordpress';
import { summarizePost, isSummarizationEnabled, getSummarizationConfig } from '@/lib/services/summarizer';
import { logger } from '@/lib/utils/logger';
import { resetAllRateLimitState } from '@/lib/api/rateLimitMiddleware';
import type { WordPressPost } from '@/types/wordpress';

jest.mock('@/lib/wordpress');
jest.mock('@/lib/services/summarizer');
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

const mockedWordpressAPI = wordpressAPI as jest.Mocked<typeof wordpressAPI>;
const mockedLogger = logger as jest.Mocked<typeof logger>;

const createMockPost = (id: number): WordPressPost => ({
  id,
  title: { rendered: `Test Post ${id}` },
  content: { rendered: `<p>Test content ${id}</p>` },
  excerpt: { rendered: `<p>Excerpt ${id}</p>` },
  slug: `test-post-${id}`,
  date: '2026-03-09T10:00:00Z',
  modified: '2026-03-09T12:00:00Z',
  author: 1,
  featured_media: 0,
  categories: [],
  tags: [],
  status: 'publish',
  type: 'post',
  link: `https://example.com/post/${id}`
});

describe('Summary API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAllRateLimitState();
    (isSummarizationEnabled as jest.Mock).mockReturnValue(true);
    (getSummarizationConfig as jest.Mock).mockReturnValue({ provider: 'local' });
  });

  const mockRequest = (id: string) => ({
    url: `http://localhost:3000/api/summary/${id}`
  }) as any;

  describe('GET /api/summary/[id]', () => {
    it('should return 400 for invalid post ID (non-numeric)', async () => {
      const request = mockRequest('abc');
      const params = Promise.resolve({ id: 'abc' });

      const response = await SummaryGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid post ID');
    });

    it('should return 404 for non-existent post', async () => {
      mockedWordpressAPI.getPostById.mockResolvedValue(null as unknown as WordPressPost);
      const request = mockRequest('999');
      const params = Promise.resolve({ id: '999' });

      const response = await SummaryGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Post not found');
      expect(mockedWordpressAPI.getPostById).toHaveBeenCalledWith(999);
    });

    it('should return summary for valid post ID', async () => {
      const mockPost = createMockPost(123);
      const mockSummaryResult = {
        summary: 'This is a test summary.',
        originalLength: 100,
        summaryLength: 25,
        cached: false,
        generatedAt: '2026-03-09T10:00:00Z'
      };

      mockedWordpressAPI.getPostById.mockResolvedValue(mockPost);
      (summarizePost as jest.Mock).mockResolvedValue(mockSummaryResult);

      const request = mockRequest('123');
      const params = Promise.resolve({ id: '123' });

      const response = await SummaryGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.postId).toBe(123);
      expect(data.useAiSummary).toBe(true);
      expect(data.summary).toBe('This is a test summary.');
      expect(data.originalLength).toBe(100);
      expect(data.summaryLength).toBe(25);
      expect(data.cached).toBe(false);
      expect(data.config).toEqual({
        provider: 'local',
        enabled: true
      });
      expect(mockedWordpressAPI.getPostById).toHaveBeenCalledWith(123);
      expect(summarizePost).toHaveBeenCalledWith(123, '<p>Test content 123</p>');
    });

    it('should return cached summary when available', async () => {
      const mockPost = createMockPost(456);
      const mockSummaryResult = {
        summary: 'Cached summary.',
        originalLength: 50,
        summaryLength: 20,
        cached: true,
        generatedAt: '2026-03-09T09:00:00Z'
      };

      mockedWordpressAPI.getPostById.mockResolvedValue(mockPost);
      (summarizePost as jest.Mock).mockResolvedValue(mockSummaryResult);

      const request = mockRequest('456');
      const params = Promise.resolve({ id: '456' });

      const response = await SummaryGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cached).toBe(true);
    });

    it('should return 500 when summarizePost throws an error', async () => {
      const mockPost = createMockPost(789);
      
      mockedWordpressAPI.getPostById.mockResolvedValue(mockPost);
      (summarizePost as jest.Mock).mockRejectedValue(new Error('Summarization failed'));

      const request = mockRequest('789');
      const params = Promise.resolve({ id: '789' });

      const response = await SummaryGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate summary');
      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Summary API error',
        expect.any(Error),
        { module: 'summary-api' }
      );
    });

    it('should return 500 when getPostById throws an error', async () => {
      mockedWordpressAPI.getPostById.mockRejectedValue(new Error('WordPress API error'));

      const request = mockRequest('100');
      const params = Promise.resolve({ id: '100' });

      const response = await SummaryGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate summary');
    });

    it('should return 500 for negative post ID (ID is valid but post not found)', async () => {
      mockedWordpressAPI.getPostById.mockRejectedValue(new Error('WordPress API error'));

      const request = mockRequest('-1');
      const params = Promise.resolve({ id: '-1' });

      const response = await SummaryGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
    });

    it('should return 500 for zero post ID (ID is valid but post not found)', async () => {
      mockedWordpressAPI.getPostById.mockRejectedValue(new Error('WordPress API error'));

      const request = mockRequest('0');
      const params = Promise.resolve({ id: '0' });

      const response = await SummaryGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
    });

    it('should return 500 for floating point post ID (ID is valid but post not found)', async () => {
      mockedWordpressAPI.getPostById.mockRejectedValue(new Error('WordPress API error'));

      const request = mockRequest('12.5');
      const params = Promise.resolve({ id: '12.5' });

      const response = await SummaryGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
    });

    it('should handle empty string post ID', async () => {
      const request = mockRequest('');
      const params = Promise.resolve({ id: '' });

      const response = await SummaryGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid post ID');
    });

    it('should handle post with empty content', async () => {
      const mockPost = createMockPost(111);
      mockPost.content = { rendered: '' };
      
      const mockSummaryResult = {
        summary: '',
        originalLength: 0,
        summaryLength: 0,
        cached: false,
        generatedAt: '2026-03-09T10:00:00Z'
      };

      mockedWordpressAPI.getPostById.mockResolvedValue(mockPost);
      (summarizePost as jest.Mock).mockResolvedValue(mockSummaryResult);

      const request = mockRequest('111');
      const params = Promise.resolve({ id: '111' });

      const response = await SummaryGET(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.originalLength).toBe(0);
    });

    it('should log summary request with correct metadata', async () => {
      const mockPost = createMockPost(222);
      const mockSummaryResult = {
        summary: 'Summary',
        originalLength: 50,
        summaryLength: 10,
        cached: false,
        generatedAt: '2026-03-09T10:00:00Z'
      };

      mockedWordpressAPI.getPostById.mockResolvedValue(mockPost);
      (summarizePost as jest.Mock).mockResolvedValue(mockSummaryResult);

      const request = mockRequest('222');
      const params = Promise.resolve({ id: '222' });

      await SummaryGET(request, { params });

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Summary API request',
        { postId: 222, module: 'summary-api' }
      );
    });
  });
});
