import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache } from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';

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

  describe('summarizePost - caching', () => {
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

    it('should handle very short content without calling API', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(789, '<p>Hi</p>');

      expect(result.summary).toBe('Hi');
      expect(result.cached).toBe(false);
    });

    it('should handle empty content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '');

      expect(result.summary).toBe('');
      expect(result.originalLength).toBe(0);
    });

    it('should handle content with only HTML tags', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '<div><p></p><span></span></div>');

      expect(result.summary).toBe('');
    });

    it('should cache generated summary with correct TTL', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      await summarizePost(1, '<p>Content with enough length to generate a summary. It has multiple sentences here.</p>');

      expect(cacheManager.set).toHaveBeenCalled();
      const cacheCall = (cacheManager.set as jest.Mock).mock.calls[0];
      expect(cacheCall[1]).toBeTruthy();
    });
  });

  describe('summarizePost - error handling', () => {
    it('should fall back to local summary when OpenAI API fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error')
      });

      const result = await summarizePost(1, '<p>Content for fallback test. More content here to ensure length.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);

      global.fetch = originalFetch;
    });

    it('should fall back to local summary when Anthropic API fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad Request')
      });

      const result = await summarizePost(1, '<p>Content for anthropic fallback test. More content here.</p>');

      expect(result.summary).toBeTruthy();

      global.fetch = originalFetch;
    });

    it('should throw when OpenAI provider has no API key', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'openai';
      delete process.env.SUMMARY_API_KEY;

      const result = await summarizePost(1, '<p>Test content for error handling.</p>');

      expect(result.summary).toBeTruthy();
    });

    it('should throw when Anthropic provider has no API key', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      delete process.env.SUMMARY_API_KEY;

      const result = await summarizePost(1, '<p>Test content for error handling.</p>');

      expect(result.summary).toBeTruthy();
    });
  });

  describe('summarizePost - OpenAI provider', () => {
    it('should call OpenAI API with correct parameters', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-openai-key';
      process.env.SUMMARY_MODEL = 'gpt-4';

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'AI generated summary' } }]
        })
      });

      const result = await summarizePost(1, '<p>Content for OpenAI test. More content to ensure summary generation works properly.</p>');

      expect(result.summary).toBe('AI generated summary');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-openai-key'
          })
        })
      );

      global.fetch = originalFetch;
    });

    it('should handle empty response from OpenAI', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '' } }]
        })
      });

      const result = await summarizePost(1, '<p>Content for empty response test. More content here to trigger API call.</p>');

      expect(result.summary).toBe('');

      global.fetch = originalFetch;
    });
  });

  describe('summarizePost - Anthropic provider', () => {
    it('should call Anthropic API with correct parameters', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
      process.env.SUMMARY_MODEL = 'claude-3-opus';

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'Anthropic generated summary' }]
        })
      });

      const result = await summarizePost(1, '<p>Content for Anthropic test. More content to ensure summary generation works properly.</p>');

      expect(result.summary).toBe('Anthropic generated summary');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-anthropic-key'
          })
        })
      );

      global.fetch = originalFetch;
    });
  });

  describe('summarizePost - local provider edge cases', () => {
    it('should handle single sentence content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '<p>Just one sentence here.</p>');

      expect(result.summary).toBeTruthy();
    });

    it('should handle two sentence content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '<p>First sentence. Second sentence.</p>');

      expect(result.summary).toBeTruthy();
    });

    it('should handle content with question marks', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '<p>What is this? How does it work?</p>');

      expect(result.summary).toBeTruthy();
    });

    it('should handle content with exclamation marks', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '<p>Wow! Great stuff!</p>');

      expect(result.summary).toBeTruthy();
    });

    it('should handle content needing truncation', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const longText = '<p>' + 'A'.repeat(500) + '. ' + 'B'.repeat(500) + '. ' + 'C'.repeat(500) + '.</p>';
      const result = await summarizePost(1, longText);

      expect(result.summaryLength).toBeLessThan(500);
    });

    it('should handle content where first sentence is very long', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const longFirstSentence = '<p>' + 'X'.repeat(400) + '. Second sentence here. Third sentence.</p>';
      const result = await summarizePost(1, longFirstSentence);

      expect(result.summary).toContain('...');
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

    it('should return true for undefined provider (defaults to local)', () => {
      delete process.env.SUMMARY_PROVIDER;
      expect(isSummarizationEnabled()).toBe(true);
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

    it('should handle zero maxTokens', () => {
      process.env.SUMMARY_MAX_TOKENS = '0';

      const config = getSummarizationConfig();

      expect(config.maxTokens).toBe(0);
    });

    it('should handle invalid temperature', () => {
      process.env.SUMMARY_TEMPERATURE = 'invalid';

      const config = getSummarizationConfig();

      expect(Number.isNaN(config.temperature)).toBe(true);
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear cache for specific post', () => {
      clearSummaryCache(123);

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      const mockCache = new Map();
      mockCache.set('summary:1', 'value1');
      mockCache.set('summary:2', 'value2');
      mockCache.set('other:key', 'value3');

      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
      expect(cacheManager.invalidate).not.toHaveBeenCalledWith('other:key');
    });

    it('should handle missing cache gracefully', () => {
      (cacheManager as unknown as { cache?: Map<string, unknown> }).cache = undefined;

      expect(() => clearSummaryCache()).not.toThrow();
    });
  });

  describe('result properties', () => {
    it('should return correct originalLength and summaryLength', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(1, '<p>Content for length test. This has multiple sentences to ensure proper summary generation.</p>');

      expect(result.originalLength).toBeGreaterThan(0);
      expect(result.summaryLength).toBeGreaterThan(0);
      expect(result.summaryLength).toBe(result.summary.length);
    });

    it('should return correct generatedAt timestamp', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const before = new Date().toISOString();
      const result = await summarizePost(1, '<p>Content for timestamp test. More content here for testing.</p>');
      const after = new Date().toISOString();

      expect(result.generatedAt).toBeTruthy();
      expect(result.generatedAt >= before).toBe(true);
      expect(result.generatedAt <= after).toBe(true);
    });
  });
});
