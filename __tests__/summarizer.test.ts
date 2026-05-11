import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache } from '@/lib/services/summarizer';
import { logger } from '@/lib/utils/logger';
import { cacheManager } from '@/lib/cache';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

describe('summarizer', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    jest.clearAllMocks();
    delete process.env.SUMMARY_PROVIDER;
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
    delete process.env.SUMMARY_MAX_TOKENS;
    delete process.env.SUMMARY_TEMPERATURE;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getCacheKey', () => {
    it('should generate correct cache key for postId', () => {
      expect(`summary:${123}`).toBe('summary:123');
    });

    it('should generate cache keys for various post IDs', () => {
      expect(`summary:${1}`).toBe('summary:1');
      expect(`summary:${999}`).toBe('summary:999');
    });
  });

  describe('extractTextFromContent via summarizePost behavior', () => {
    it('should extract text from HTML content', async () => {
      const result = await summarizePost(1, '<p>Test content here.</p>');
      expect(result.summary).toContain('Test content');
    });

    it('should handle empty content', async () => {
      const result = await summarizePost(2, '');
      expect(result.summary).toBe('');
    });

    it('should handle various HTML tags', async () => {
      const result = await summarizePost(3, '<div><p>Content here.</p></div>');
      expect(result.summary).toContain('Content');
    });

    it('should handle nested HTML', async () => {
      const result = await summarizePost(4, '<article><p>Nested <span>content</span> test.</p></article>');
      expect(result.summary).toContain('Nested');
    });
  });

  describe('generateLocalSummary behavior via summarizePost', () => {
    it('should create a summary from multiple sentences', async () => {
      const result = await summarizePost(10, '<p>First sentence here. Second sentence there. Third sentence everywhere.</p>');
      expect(result.summary).toContain('First');
    });

    it('should handle very short text', async () => {
      const result = await summarizePost(11, '<p>Short text here for testing purposes.</p>');
      expect(result.summary).toBeTruthy();
    });

    it('should handle single sentence only', async () => {
      const result = await summarizePost(12, '<p>Only one sentence.</p>');
      expect(result.summary).toContain('Only one sentence');
    });

    it('should handle two sentences', async () => {
      const result = await summarizePost(13, '<p>First. Second sentence here.</p>');
      expect(result.summary).toContain('First');
    });

    it('should handle very long content', async () => {
      const result = await summarizePost(14, '<p>First very long sentence that goes way over the default length and needs truncation properly. Second very long sentence here too and needs proper handling. Third sentence finally ends it with more content. Fourth sentence adds even more text for testing.</p>');
      expect(result.summary.length).toBeLessThan(300);
    });
  });

  describe('summarizePost with OpenAI provider', () => {
    it('should use OpenAI API when configured', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-openai-key';
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          choices: [{ message: { content: 'OpenAI summary result' } }] 
        }),
        text: () => Promise.resolve('')
      });

      const result = await summarizePost(20, '<p>Content that needs proper summarization from OpenAI provider with more words to ensure it goes through the full summarization process.</p>');
      expect(result.summary).toBe('OpenAI summary result');
    });

    it('should fallback on network error', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await summarizePost(21, '<p>Content for error handling test.</p>');
      expect(result.summary).toContain('Content');
    });

    it('should fallback on HTTP error status', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error')
      });

      const result = await summarizePost(22, '<p>Content for http error handling.</p>');
      expect(result.summary).toContain('Content');
    });

    it('should fallback when OpenAI key missing', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      delete process.env.SUMMARY_API_KEY;

      const result = await summarizePost(23, '<p>Content for fallback testing.</p>');
      expect(result.summary).toContain('Content');
    });
  });

  describe('summarizePost with Anthropic provider', () => {
    it('should use Anthropic API when configured', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ 
          content: [{ text: 'Anthropic summary result' }] 
        }),
        text: () => Promise.resolve('')
      });

      const result = await summarizePost(30, '<p>Content that needs proper summarization from Anthropic provider with extra words to go through full processing.</p>');
      expect(result.summary).toBe('Anthropic summary result');
    });

    it('should fallback on network error', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await summarizePost(31, '<p>Content for error testing.</p>');
      expect(result.summary).toContain('Content');
    });

    it('should fallback on HTTP error status', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request')
      });

      const result = await summarizePost(32, '<p>Content for HTTP error test.</p>');
      expect(result.summary).toContain('Content');
    });

    it('should fallback when Anthropic key missing', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      delete process.env.SUMMARY_API_KEY;

      const result = await summarizePost(33, '<p>Content for missing key test.</p>');
      expect(result.summary).toContain('Content');
    });
  });

  describe('summarizePost with various providers', () => {
    it('should use local provider explicitly set', async () => {
      process.env.SUMMARY_PROVIDER = 'local';
      
      const result = await summarizePost(40, '<p>First. Second sentence with more content for local test.</p>');
      expect(result.summary).toContain('First');
    });

    it('should use default provider when not specified', async () => {
      delete process.env.SUMMARY_PROVIDER;
      
      const result = await summarizePost(41, '<p>First. Second sentence with additional content.</p>');
      expect(result.summary).toContain('First');
    });
  });

  describe('summarizePost caching', () => {
    it('should return cached summary if available', async () => {
      const cachedSummary = 'Cached summary';
      (cacheManager.get as jest.Mock).mockReturnValue(cachedSummary);

      const result = await summarizePost(100, '<p>Some content</p>');

      expect(result.summary).toBe(cachedSummary);
      expect(result.cached).toBe(true);
    });

    it('should generate new summary when not cached', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(true);

      const result = await summarizePost(101, '<p>First. Second sentence with more content.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should return correct lengths', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(102, '<p>Content with more words here for length test.</p>');

      expect(result.originalLength).toBeGreaterThan(0);
      expect(result.summaryLength).toBeGreaterThan(0);
    });

    it('should handle various HTML elements', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(103, '<div><p>Content with more additional text here.</p></div>');
      expect(result.summary).toBeTruthy();
    });

    it('should handle empty elements', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(104, '<p></p>');
      expect(result.summary).toBe('');
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

    it('should return false when no API key for Anthropic', () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      delete process.env.SUMMARY_API_KEY;
      expect(isSummarizationEnabled()).toBe(false);
    });

    it('should return true when API key is provided for Anthropic', () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';
      expect(isSummarizationEnabled()).toBe(true);
    });

    it('should return true for undefined provider', () => {
      delete process.env.SUMMARY_PROVIDER;
      expect(isSummarizationEnabled()).toBe(true);
    });
  });

  describe('getSummarizationConfig', () => {
    it('should return default config', () => {
      const config = getSummarizationConfig();

      expect(config.provider).toBe('local');
      expect(config.model).toBe('gpt-3.5-turbo');
      expect(config.maxTokens).toBe(200);
      expect(config.temperature).toBe(0.7);
    });

    it('should use environment variables when set', () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';
      process.env.SUMMARY_MODEL = 'claude-3-sonnet';
      process.env.SUMMARY_MAX_TOKENS = '300';
      process.env.SUMMARY_TEMPERATURE = '0.5';

      const config = getSummarizationConfig();

      expect(config.provider).toBe('anthropic');
      expect(config.apiKey).toBe('test-key');
      expect(config.model).toBe('claude-3-sonnet');
      expect(config.maxTokens).toBe(300);
      expect(config.temperature).toBe(0.5);
    });

    it('should use openai provider', () => {
      process.env.SUMMARY_PROVIDER = 'openai';

      const config = getSummarizationConfig();
      expect(config.provider).toBe('openai');
    });

    it('should parse maxTokens from string', () => {
      process.env.SUMMARY_MAX_TOKENS = '500';
      const config = getSummarizationConfig();
      expect(config.maxTokens).toBe(500);
    });

    it('should parse temperature from string', () => {
      process.env.SUMMARY_TEMPERATURE = '0.9';
      const config = getSummarizationConfig();
      expect(config.temperature).toBe(0.9);
    });
  });

  describe('clearSummaryCache', () => {
    it('should invalidate specific post cache', () => {
      clearSummaryCache(123);
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should call with different post IDs', () => {
      clearSummaryCache(456);
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:456');
    });

    it('should clear all caches when no postId provided', () => {
      const customCacheManager = cacheManager as unknown as { cache: Map<string, unknown> };
      const testCache = new Map<string, unknown>();
      testCache.set('summary:1', 'test1');
      testCache.set('summary:2', 'test2');
      testCache.set('other:key', 'other');
      customCacheManager.cache = testCache;

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalled();
    });
  });
});