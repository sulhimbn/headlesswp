import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache } from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/cache');

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

    it('should generate a local summary with multiple sentences', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(100, '<p>First sentence. Second sentence. Third sentence.</p>');

      expect(result.summary).toContain('First sentence');
      expect(result.summary.length).toBeLessThan(400);
    });

    it('should add ellipsis when truncating long summaries', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const longText = '<p>' + 'A'.repeat(500) + '. ' + 'B'.repeat(500) + '. ' + 'C'.repeat(500) + '.</p>';
      const result = await summarizePost(101, longText);

      expect(result.summary.length).toBeLessThan(400);
    });

    it('should handle exactly two sentences', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(103, '<p>First sentence. Second sentence.</p>');

      expect(result.summary).toContain('First sentence');
      expect(result.summary).toContain('Second sentence');
    });

    it('should handle single very long sentence', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(104, '<p>' + 'A'.repeat(400) + '.</p>');

      expect(result.summary.length).toBeLessThan(500);
    });

    it('should handle content with many sentences', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(105, '<p>One. Two. Three. Four. Five. Six. Seven. Eight. Nine. Ten.</p>');

      expect(result.summary).toContain('One');
      expect(result.summary.length).toBeLessThan(200);
    });



    it('should return original text for short content under 50 chars', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(102, '<p>Short content here.</p>');

      expect(result.summary).toBe('Short content here.');
      expect(result.originalLength).toBe(19);
    });
  });

  describe('summarizePost with different providers', () => {
    it('should throw when OpenAI provider has no API key', async () => {
      let result: { summary: string } | undefined;
      await jest.isolateModulesAsync(async () => {
        process.env.SUMMARY_PROVIDER = 'openai';
        delete process.env.SUMMARY_API_KEY;
        const { summarizePost } = await import('@/lib/services/summarizer');
        (cacheManager.get as jest.Mock).mockReturnValue(null);

        result = await summarizePost(110, '<p>Test content.</p>') as { summary: string } | undefined;
      });

      expect(result?.summary).toBeTruthy();
    });

    it('should throw when Anthropic provider has no API key', async () => {
      let result: { summary: string } | undefined;
      await jest.isolateModulesAsync(async () => {
        process.env.SUMMARY_PROVIDER = 'anthropic';
        delete process.env.SUMMARY_API_KEY;
        const { summarizePost } = await import('@/lib/services/summarizer');
        (cacheManager.get as jest.Mock).mockReturnValue(null);

        result = await summarizePost(111, '<p>Test content.</p>') as { summary: string } | undefined;
      });

      expect(result?.summary).toBeTruthy();
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

    it('should clear all summaries when no postId provided', () => {
      const mockCache = new Map<string, unknown>();
      mockCache.set('summary:1', 'test1');
      mockCache.set('summary:2', 'test2');
      mockCache.set('other:key', 'test3');

      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;
      (cacheManager.invalidate as jest.Mock).mockImplementation((key: string) => {
        mockCache.delete(key);
      });

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
      expect(cacheManager.invalidate).not.toHaveBeenCalledWith('other:key');
    });
  });

  describe('summarizePost error handling', () => {
    it('should fall back to local summary on cache set error', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockImplementation(() => {
        throw new Error('Cache error');
      });

      const result = await summarizePost(999, '<p>This is a test article with some content. It has multiple sentences that should be summarized.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });
  });
});
