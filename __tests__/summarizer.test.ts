import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache } from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('summarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SUMMARY_PROVIDER;
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
    delete process.env.SUMMARY_MAX_TOKENS;
    delete process.env.SUMMARY_TEMPERATURE;
  });

  describe('summarizePost with cache', () => {
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

    it('should handle very short content without generation', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(789, '<p>Hi</p>');

      expect(result.summary).toBe('Hi');
      expect(result.cached).toBe(false);
    });

    it('should calculate correct lengths for generated summary', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(222, '<p>This is a longer test article with much more content to process properly here.</p>');

      expect(result.originalLength).toBeGreaterThan(0);
      expect(result.summaryLength).toBe(result.summary.length);
    });

    it('should return correct original content length for cached', async () => {
      const cachedSummary = 'Cached summary';
      (cacheManager.get as jest.Mock).mockReturnValue(cachedSummary);

      const result = await summarizePost(100, '<p>Some longer content here with more text</p>');

      expect(result.originalLength).toBeGreaterThan(0);
      expect(cachedSummary).toBe(result.summary);
    });
  });

  describe('summarizePost with OpenAI provider', () => {
    beforeEach(() => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-openai-key';
    });

    it('should call OpenAI API for longer content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'OpenAI generated summary' } }] })
      });

      const result = await summarizePost(101, '<p>Test article content here that needs to be summarized properly. This is much longer content to ensure more than 50 characters after HTML stripping to trigger the API call path.</p>');

      expect(result.summary).toBe('OpenAI generated summary');
      expect(result.cached).toBe(false);
    });

    it('should fallback to local on OpenAI API error', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error'
      });

      const result = await summarizePost(102, '<p>Test article content here that needs to be summarized properly. This is much longer content to ensure more than 50 characters after HTML stripping to trigger the API call path.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should fallback on fetch rejection', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      const result = await summarizePost(103, '<p>Test article content here that needs to be summarized properly. This is much longer content to ensure more than 50 characters after HTML stripping to trigger the API call path.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('summarizePost with Anthropic provider', () => {
    beforeEach(() => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
    });

    it('should call Anthropic API for longer content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: [{ text: 'Anthropic generated summary' }] })
      });

      const result = await summarizePost(201, '<p>Test article content here that needs to be summarized properly. This is much longer content to ensure more than 50 characters after HTML stripping to trigger the API call path.</p>');

      expect(result.summary).toBe('Anthropic generated summary');
      expect(result.cached).toBe(false);
    });

    it('should fallback to local on Anthropic API error', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limited'
      });

      const result = await summarizePost(202, '<p>Test article content here that needs to be summarized properly. This is much longer content to ensure more than 50 characters after HTML stripping to trigger the API call path.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should use OpenAI when configured', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'OpenAI summary' } }] })
      });

      const result = await summarizePost(203, '<p>This is a much longer test article content to trigger API call and fallback. Add more text to ensure we exceed the 50 character threshold.</p>');

      expect(result.summary).toBe('OpenAI summary');
    });
  });

  describe('summarizePost with local provider (default)', () => {
    it('should use local summarization', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(301, '<p>First sentence here. Second sentence here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeLessThan(300);
      expect(result.cached).toBe(false);
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
      process.env.SUMMARY_API_KEY = 'test-key';
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
  });

  describe('clearSummaryCache', () => {
    it('should clear specific post cache', () => {
      clearSummaryCache(123);
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary cache when no postId provided', () => {
      const mockCache = new Map([
        ['summary:1', 'value1'],
        ['summary:2', 'value2'],
        ['other:key', 'value3']
      ]);
      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;
      
      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
    });
  });
});