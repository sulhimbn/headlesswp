import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache, generateSummaryWithOpenAI, generateSummaryWithAnthropic, generateLocalSummary, extractTextFromContent, getCacheKey } from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';

const originalFetch = global.fetch;

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/stripHtml', () => ({
  stripHtml: jest.fn((html: string) => html.replace(/<[^>]*>/g, '')),
}));

describe('summarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('extractTextFromContent', () => {
    it('should strip HTML tags from content', () => {
      const html = '<p>This is <strong>bold</strong> text.</p>';
      expect(extractTextFromContent(html)).toBe('This is bold text.');
    });

    it('should handle empty content', () => {
      expect(extractTextFromContent('')).toBe('');
    });
  });

  describe('getCacheKey', () => {
    it('should return correct cache key format', () => {
      expect(getCacheKey(123)).toBe('summary:123');
      expect(getCacheKey(456)).toBe('summary:456');
    });
  });

  describe('generateLocalSummary', () => {
    it('should create a summary from multiple sentences', () => {
      const text = 'This is the first sentence. This is the second sentence. This is the third sentence.';
      const summary = generateLocalSummary(text);
      expect(summary).toContain('first sentence');
      expect(summary.length).toBeLessThan(text.length);
    });

    it('should handle short text', () => {
      const text = 'Short text.';
      const summary = generateLocalSummary(text);
      expect(summary).toBe(text);
    });

    it('should add ellipsis when truncating', () => {
      const text = 'First. Second sentence that is quite long and will need truncation. Third.';
      const summary = generateLocalSummary(text);
      expect(summary.length).toBeLessThanOrEqual(text.length * 1.5 + 3);
    });

    it('should handle text with exactly 2 sentences', () => {
      const text = 'First sentence. Second sentence.';
      const summary = generateLocalSummary(text);
      expect(summary).toContain('First sentence');
      expect(summary).toContain('Second sentence');
    });

    it('should truncate long text properly', () => {
      const text = 'Short. This is a much longer second sentence that goes on and on and should be truncated when it exceeds the default length limit. Third sentence here.';
      const summary = generateLocalSummary(text);
      expect(summary.length).toBeLessThan(text.length);
    });

    it('should handle empty text', () => {
      const summary = generateLocalSummary('');
      expect(summary).toBe('');
    });

    it('should handle text with only one sentence', () => {
      const text = 'Just one sentence here.';
      const summary = generateLocalSummary(text);
      expect(summary).toContain('Just one sentence here');
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

    it('should fall back to local summary when OpenAI API fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server Error',
      });
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(
        999,
        '<p>This is a test article with some content. It has multiple sentences. And even more sentences to make it longer.</p>'
      );

      expect(result.summary).toBeTruthy();
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

  describe('generateSummaryWithOpenAI', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockReset();
    });

    it('should throw error when API key is not provided', async () => {
      await expect(
        generateSummaryWithOpenAI('test text', { provider: 'openai' })
      ).rejects.toThrow('OpenAI API key not configured');
    });

    it('should return summary from OpenAI API', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test summary from OpenAI' } }],
        }),
      });

      const result = await generateSummaryWithOpenAI('test text', {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
      });

      expect(result).toBe('Test summary from OpenAI');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        })
      );
    });

    it('should throw error when API returns non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      await expect(
        generateSummaryWithOpenAI('test text', {
          provider: 'openai',
          apiKey: 'invalid-key',
        })
      ).rejects.toThrow('OpenAI API error: 401');
    });

    it('should handle empty response from OpenAI', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [],
        }),
      });

      const result = await generateSummaryWithOpenAI('test text', {
        provider: 'openai',
        apiKey: 'test-key',
      });

      expect(result).toBe('');
    });
  });

  describe('generateSummaryWithAnthropic', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockReset();
    });

    it('should throw error when API key is not provided', async () => {
      await expect(
        generateSummaryWithAnthropic('test text', { provider: 'anthropic' })
      ).rejects.toThrow('Anthropic API key not configured');
    });

    it('should return summary from Anthropic API', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Test summary from Anthropic' }],
        }),
      });

      const result = await generateSummaryWithAnthropic('test text', {
        provider: 'anthropic',
        apiKey: 'test-key',
        model: 'claude-3-sonnet',
      });

      expect(result).toBe('Test summary from Anthropic');
    });

    it('should throw error when API returns non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden',
      });

      await expect(
        generateSummaryWithAnthropic('test text', {
          provider: 'anthropic',
          apiKey: 'invalid-key',
        })
      ).rejects.toThrow('Anthropic API error: 403');
    });

    it('should handle empty response from Anthropic', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [],
        }),
      });

      const result = await generateSummaryWithAnthropic('test text', {
        provider: 'anthropic',
        apiKey: 'test-key',
      });

      expect(result).toBe('');
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear cache for specific post', () => {
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);
      
      clearSummaryCache(123);
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);
      
      const mockCache = new Map();
      mockCache.set('summary:1', 'test1');
      mockCache.set('summary:2', 'test2');
      mockCache.set('other:key', 'test3');
      
      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;
      
      clearSummaryCache();
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
      expect(cacheManager.invalidate).not.toHaveBeenCalledWith('other:key');
    });
  });
});
