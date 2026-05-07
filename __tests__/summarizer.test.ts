import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache, SummarizationConfig } from '@/lib/services/summarizer';
import { stripHtml } from '@/lib/utils/stripHtml';
import { cacheManager } from '@/lib/cache';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

function extractTextFromContent(htmlContent: string): string {
  return stripHtml(htmlContent).trim();
}

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('summarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.SUMMARY_PROVIDER = 'local';
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
    delete process.env.SUMMARY_MAX_TOKENS;
    delete process.env.SUMMARY_TEMPERATURE;
  });

  describe('extractTextFromContent', () => {
    it('should strip HTML tags from content', () => {
      const html = '<p>This is <strong>bold</strong> text.</p>';
      expect(extractTextFromContent(html)).toBe('This is bold text.');
    });

    it('should handle empty content', () => {
      expect(extractTextFromContent('')).toBe('');
      expect(extractTextFromContent(null as unknown as string)).toBe('');
    });

    it('should decode HTML entities', () => {
      const html = '<p>Hello &amp; World &lt;test&gt;</p>';
      expect(extractTextFromContent(html)).toBe('Hello & World <test>');
    });
  });

  describe('generateLocalSummary via summarizePost', () => {
    it('should create a summary from multiple sentences using local provider', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const longContent = '<p>First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.</p>';
      const result = await summarizePost(1, longContent);

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(result.summary.length).toBeLessThan(result.originalLength);
    });

    it('should handle text with exactly two sentences', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const content = '<p>First sentence. Second sentence.</p>';
      const result = await summarizePost(2, content);

      expect(result.summary).toBeTruthy();
      expect(result.summary.endsWith('.')).toBe(true);
    });

    it('should handle text with many long sentences', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const content = '<p>This is a very long first sentence that contains lots of words. This is another very long second sentence that also contains lots of words and will be combined together. This is the third sentence that is also quite long but not as long as the others.</p>';
      const result = await summarizePost(3, content);

      expect(result.summary).toBeTruthy();
      if (result.summary.length > 225) {
        expect(result.summary.endsWith('...')).toBe(true);
      }
    });

    it('should return short content as-is without summarization', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const shortContent = '<p>Short content.</p>';
      const result = await summarizePost(4, shortContent);

      expect(result.summary).toBe('Short content.');
      expect(result.cached).toBe(false);
    });
  });

  describe('generateSummaryWithOpenAI', () => {
    it('should fallback to local summary when API key is missing', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(1, '<p>Content for testing fallback. More content here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should call OpenAI API and return summary', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-api-key';
      process.env.SUMMARY_MODEL = 'gpt-4';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'AI generated summary' } }]
        })
      });

      const result = await summarizePost(5, '<p>This is a long article content with many words. It needs to be summarized by AI.</p>');

      expect(result.summary).toBe('AI generated summary');
      expect(mockFetch).toHaveBeenCalledWith('https://api.openai.com/v1/chat/completions', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key'
        })
      }));
    });

    it('should fallback when OpenAI API returns error response', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-api-key';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const result = await summarizePost(6, '<p>Some content that needs AI summarization. More sentences here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should handle OpenAI API empty response', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-api-key';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '' } }]
        })
      });

      const result = await summarizePost(61, '<p>Some content that needs AI summarization. More sentences here.</p>');

      expect(result.summary).toBe('');
    });
  });

  describe('generateSummaryWithAnthropic', () => {
    it('should fallback to local summary when API key is missing', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(2, '<p>Content for testing fallback. More content here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should call Anthropic API and return summary', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'anthropic-api-key';
      process.env.SUMMARY_MODEL = 'claude-3-sonnet';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Anthropic generated summary' }]
        })
      });

      const result = await summarizePost(7, '<p>This is a long article content with many words. It needs to be summarized by AI.</p>');

      expect(result.summary).toBe('Anthropic generated summary');
      expect(mockFetch).toHaveBeenCalledWith('https://api.anthropic.com/v1/messages', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-api-key': 'anthropic-api-key',
          'anthropic-version': '2023-06-01'
        })
      }));
    });

    it('should fallback when Anthropic API returns error response', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'anthropic-api-key';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request'
      });

      const result = await summarizePost(8, '<p>Some content that needs AI summarization. More sentences here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should handle Anthropic API empty response', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'anthropic-api-key';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: '' }]
        })
      });

      const result = await summarizePost(81, '<p>Some content that needs AI summarization. More sentences here.</p>');

      expect(result.summary).toBe('');
    });
  });

  describe('summarizePost', () => {
    it('should return cached summary if available', async () => {
      const cachedSummary = 'Cached summary';
      (cacheManager.get as jest.Mock).mockReturnValue(cachedSummary);

      const result = await summarizePost(123, '<p>Some content</p>');

      expect(result.summary).toBe(cachedSummary);
      expect(result.cached).toBe(true);
      expect(cacheManager.get).toHaveBeenCalledWith('summary:123');
    });

    it('should generate new summary when not cached', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(456, '<p>This is a test article with some content. It has multiple sentences.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(result.generatedAt).toBeTruthy();
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should handle very short content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(789, '<p>Hi</p>');

      expect(result.summary).toBe('Hi');
      expect(result.cached).toBe(false);
    });

    it('should include originalLength and summaryLength in result', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const content = '<p>This is a test article. It has multiple sentences. For testing purposes.</p>';
      const result = await summarizePost(999, content);

      expect(result.originalLength).toBeGreaterThan(0);
      expect(result.summaryLength).toBeGreaterThan(0);
      expect(result.originalLength).toBeGreaterThanOrEqual(result.summaryLength);
    });

    it('should include generatedAt timestamp', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const before = new Date().toISOString();
      const result = await summarizePost(111, '<p>Content for timestamp test. Multiple sentences here.</p>');
      const after = new Date().toISOString();

      expect(result.generatedAt).toBeTruthy();
      expect(result.generatedAt >= before).toBe(true);
      expect(result.generatedAt <= after).toBe(true);
    });

    it('should handle complex HTML content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const complexHtml = '<article><h1>Title</h1><p>First paragraph with <strong>bold</strong> text.</p><p>Second paragraph with <em>italic</em> text.</p></article>';
      const result = await summarizePost(222, complexHtml);

      expect(result.summary).toBeTruthy();
      expect(result.originalLength).toBeGreaterThan(0);
    });
  });

  describe('isSummarizationEnabled', () => {
    it('should return true for local provider', () => {
      process.env.SUMMARY_PROVIDER = 'local';
      expect(isSummarizationEnabled()).toBe(true);
    });

    it('should return true when API key is provided for OpenAI', () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      expect(isSummarizationEnabled()).toBe(true);
    });

    it('should return false when no API key for OpenAI', () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      delete process.env.SUMMARY_API_KEY;
      expect(isSummarizationEnabled()).toBe(false);
    });

    it('should return true when API key is provided for Anthropic', () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'anthropic-key';
      expect(isSummarizationEnabled()).toBe(true);
    });

    it('should return false when no API key for Anthropic', () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      delete process.env.SUMMARY_API_KEY;
      expect(isSummarizationEnabled()).toBe(false);
    });
  });

  describe('getSummarizationConfig', () => {
    it('should return default config', () => {
      delete process.env.SUMMARY_PROVIDER;
      delete process.env.SUMMARY_API_KEY;
      delete process.env.SUMMARY_MODEL;

      const config = getSummarizationConfig();

      expect(config.provider).toBe('local');
      expect(config.model).toBe('gpt-3.5-turbo');
      expect(config.maxTokens).toBe(200);
      expect(config.temperature).toBe(0.7);
    });

    it('should use environment variables when set', () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
      process.env.SUMMARY_MODEL = 'claude-3-sonnet';
      process.env.SUMMARY_MAX_TOKENS = '300';
      process.env.SUMMARY_TEMPERATURE = '0.5';

      const config = getSummarizationConfig();

      expect(config.provider).toBe('anthropic');
      expect(config.apiKey).toBe('test-anthropic-key');
      expect(config.model).toBe('claude-3-sonnet');
      expect(config.maxTokens).toBe(300);
      expect(config.temperature).toBe(0.5);
    });

    it('should parse maxTokens from env variable', () => {
      process.env.SUMMARY_MAX_TOKENS = '500';
      const config = getSummarizationConfig();
      expect(config.maxTokens).toBe(500);
    });

    it('should parse temperature from env variable', () => {
      process.env.SUMMARY_TEMPERATURE = '0.9';
      const config = getSummarizationConfig();
      expect(config.temperature).toBe(0.9);
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear cache for specific post', () => {
      clearSummaryCache(123);
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      const mockCache = new Map();
      mockCache.set('summary:1', 'data1');
      mockCache.set('summary:2', 'data2');
      mockCache.set('other:key', 'data3');

      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledTimes(2);
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
    });

    it('should handle empty cache gracefully', () => {
      const mockCache = new Map();
      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;

      expect(() => clearSummaryCache()).not.toThrow();
    });

    it('should not clear non-summary cache entries', () => {
      const mockCache = new Map();
      mockCache.set('summary:1', 'data1');
      mockCache.set('user:123', 'userData');
      mockCache.set('other:key', 'otherData');

      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).not.toHaveBeenCalledWith('user:123');
      expect(cacheManager.invalidate).not.toHaveBeenCalledWith('other:key');
    });
  });
});
