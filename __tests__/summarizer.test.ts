import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache } from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

describe('summarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SUMMARY_PROVIDER;
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
    delete process.env.SUMMARY_MAX_TOKENS;
    delete process.env.SUMMARY_TEMPERATURE;
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

      const result = await summarizePost(456, '<p>This is a test article with some content. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(result.generatedAt).toBeTruthy();
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should handle very short content without summarization', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(789, '<p>Hi</p>');

      expect(result.summary).toBe('Hi');
      expect(result.cached).toBe(false);
      expect(result.originalLength).toBeLessThan(50);
    });

    it('should use local provider by default', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(111, '<p>First sentence. Second sentence. Third sentence.</p>');

      expect(result.summary).toContain('First sentence');
      expect(result.summary).toContain('Second sentence');
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

    it('should handle invalid maxTokens gracefully', () => {
      process.env.SUMMARY_MAX_TOKENS = 'invalid';
      const config = getSummarizationConfig();
      expect(Number.isNaN(config.maxTokens)).toBe(true);
    });

    it('should handle invalid temperature gracefully', () => {
      process.env.SUMMARY_TEMPERATURE = 'invalid';
      const config = getSummarizationConfig();
      expect(Number.isNaN(config.temperature)).toBe(true);
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear cache for specific post', () => {
      (cacheManager.invalidate as jest.Mock).mockReturnValue(true);

      clearSummaryCache(123);

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      (cacheManager.invalidate as jest.Mock).mockReturnValue(true);

      const mockCache = new Map<string, unknown>();
      mockCache.set('summary:1', 'data');
      mockCache.set('summary:2', 'data');
      mockCache.set('other:key', 'data');

      Object.defineProperty(cacheManager, 'cache', {
        value: mockCache,
        writable: true
      });

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledTimes(2);
    });
  });

  describe('summarizePost edge cases', () => {
    it('should handle empty HTML content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(222, '<div><p></p></div>');

      expect(result.summary).toBe('');
    });

    it('should handle content with only whitespace', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(333, '<p>   </p>');

      expect(result.summary).toBe('');
    });

    it('should log when summary is generated', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const longContent = '<p>First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.</p>';
      await summarizePost(444, longContent);

      expect(logger.info).toHaveBeenCalled();
    });
  });
});