import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache } from '@/lib/services/summarizer';

jest.mock('@/lib/cache', () => ({
  cacheManager: {
    get: jest.fn(),
    set: jest.fn(),
    invalidate: jest.fn(),
  },
}));

const { cacheManager } = require('@/lib/cache');

describe('Summary API Route Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SUMMARY_PROVIDER;
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
    delete process.env.SUMMARY_MAX_TOKENS;
    delete process.env.SUMMARY_TEMPERATURE;
  });

  describe('summarizePost function', () => {
    it('should return cached summary if available', async () => {
      cacheManager.get.mockReturnValue('Cached summary');

      const result = await summarizePost(123, '<p>Some content</p>');

      expect(result.summary).toBe('Cached summary');
      expect(result.cached).toBe(true);
    });

    it('should generate new summary when not cached', async () => {
      cacheManager.get.mockReturnValue(null);
      cacheManager.set.mockReturnValue(undefined);

      const result = await summarizePost(456, '<p>This is a test article with some content. It has multiple sentences.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should return summary for valid post', async () => {
      cacheManager.get.mockReturnValue(null);
      cacheManager.set.mockReturnValue(undefined);

      const result = await summarizePost(123, '<p>Test content with multiple sentences.</p>');

      expect(result.summary).toBeTruthy();
    });

    it('should handle very short content', async () => {
      cacheManager.get.mockReturnValue(null);

      const result = await summarizePost(789, '<p>Hi</p>');

      expect(result.summary).toBe('Hi');
      expect(result.cached).toBe(false);
    });

    it('should handle empty content', async () => {
      cacheManager.get.mockReturnValue(null);

      const result = await summarizePost(101, '');

      expect(result.summary).toBe('');
      expect(result.cached).toBe(false);
    });
  });

  describe('isSummarizationEnabled function', () => {
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

  describe('getSummarizationConfig function', () => {
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

    it('should parse maxTokens as integer', () => {
      process.env.SUMMARY_MAX_TOKENS = '150';
      const config = getSummarizationConfig();
      expect(config.maxTokens).toBe(150);
    });

    it('should parse temperature as float', () => {
      process.env.SUMMARY_TEMPERATURE = '0.9';
      const config = getSummarizationConfig();
      expect(config.temperature).toBe(0.9);
    });
  });

  describe('clearSummaryCache function', () => {
    it('should clear cache for specific post', () => {
      clearSummaryCache(123);
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });
  });
});
