import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache, generateSummary } from '@/lib/services/summarizer';
import { stripHtml } from '@/lib/utils/stripHtml';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

function extractTextFromContent(htmlContent: string): string {
  return stripHtml(htmlContent).trim();
}

global.fetch = jest.fn();

describe('summarizer', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.Mock;
    delete process.env.SUMMARY_PROVIDER;
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
    delete process.env.SUMMARY_MAX_TOKENS;
    delete process.env.SUMMARY_TEMPERATURE;
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

    it('should handle complex HTML with multiple elements', () => {
      const html = '<div><h1>Title</h1><p>Paragraph with <a href="#">link</a></p></div>';
      expect(extractTextFromContent(html)).toBe('Title Paragraph with link');
    });
  });

  describe('generateSummary', () => {
    it('should call OpenAI provider when configured', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'OpenAI summary' } }]
        })
      });

      const result = await generateSummary('Test text', getSummarizationConfig());
      expect(result).toBe('OpenAI summary');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key'
          })
        })
      );
    });

    it('should call Anthropic provider when configured', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Anthropic summary' }]
        })
      });

      const result = await generateSummary('Test text', getSummarizationConfig());
      expect(result).toBe('Anthropic summary');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-anthropic-key'
          })
        })
      );
    });

    it('should use local provider by default', async () => {
      const text = 'This is the first sentence. This is the second sentence. This is the third sentence.';
      const result = await generateSummary(text, { provider: 'local' });
      expect(result).toBeTruthy();
      expect(result.length).toBeLessThan(text.length);
    });

    it('should throw error when OpenAI API key is missing', async () => {
      await expect(generateSummary('test', { provider: 'openai' }))
        .rejects.toThrow('OpenAI API key not configured');
    });

    it('should throw error when Anthropic API key is missing', async () => {
      await expect(generateSummary('test', { provider: 'anthropic' }))
        .rejects.toThrow('Anthropic API key not configured');
    });

    it('should handle OpenAI API error response', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      await expect(generateSummary('Test text', getSummarizationConfig()))
        .rejects.toThrow('OpenAI API error: 401');
    });

    it('should handle Anthropic API error response', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limited'
      });

      await expect(generateSummary('Test text', getSummarizationConfig()))
        .rejects.toThrow('Anthropic API error: 429');
    });

    it('should handle empty response from OpenAI', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '' } }]
        })
      });

      const result = await generateSummary('Test text', getSummarizationConfig());
      expect(result).toBe('');
    });

    it('should handle empty response from Anthropic', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          content: []
        })
      });

      const result = await generateSummary('Test text', getSummarizationConfig());
      expect(result).toBe('');
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

    it('should fall back to local summarization on API error', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Server error'
      });

      const result = await summarizePost(999, '<p>This is a longer piece of content that should be summarized. It has multiple sentences and needs to be processed.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should cache the generated summary with correct TTL', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      const setMock = cacheManager.set as jest.Mock;
      setMock.mockReturnValue(undefined);

      await summarizePost(111, '<p>Content here with more text to ensure summary generation happens. This is the second sentence.</p>');

      expect(setMock).toHaveBeenCalledWith(
        'summary:111',
        expect.any(String),
        7 * 24 * 60 * 60 * 1000
      );
    });

    it('should handle content that extracts to exactly 50 characters', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const content = '<p>' + 'a'.repeat(50) + '</p>';
      const result = await summarizePost(222, content);
      
      expect(result.summary).toBeTruthy();
    });

    it('should use cache key format correctly', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      await summarizePost(12345, '<p>Test content here</p>');

      expect(cacheManager.get).toHaveBeenCalledWith('summary:12345');
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
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
      expect(isSummarizationEnabled()).toBe(true);
    });

    it('should return false when no API key for Anthropic', () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      delete process.env.SUMMARY_API_KEY;
      expect(isSummarizationEnabled()).toBe(false);
    });

    it('should return true for local provider regardless of API key', () => {
      process.env.SUMMARY_PROVIDER = 'local';
      process.env.SUMMARY_API_KEY = undefined;
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

    it('should return NaN for invalid maxTokens', () => {
      process.env.SUMMARY_MAX_TOKENS = 'invalid';
      
      const config = getSummarizationConfig();
      
      expect(config.maxTokens).toBeNaN();
    });

    it('should return NaN for invalid temperature', () => {
      process.env.SUMMARY_TEMPERATURE = 'invalid';
      
      const config = getSummarizationConfig();
      
      expect(config.temperature).toBeNaN();
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear cache for specific post ID', () => {
      clearSummaryCache(123);
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      const mockCache = new Map();
      mockCache.set('summary:1', 'value1');
      mockCache.set('summary:2', 'value2');
      mockCache.set('other:key', 'value3');
      
      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;
      
      clearSummaryCache();
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
      expect(cacheManager.invalidate).not.toHaveBeenCalledWith('other:key');
    });
  });

  describe('local summarization edge cases', () => {
    it('should handle text with exactly 2 sentences', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const text = 'First sentence. Second sentence.';
      const result = await summarizePost(1, `<p>${text}</p>`);
      
      expect(result.summary).toContain('First sentence');
    });

    it('should handle text with one sentence', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const text = 'Just one sentence here.';
      const result = await summarizePost(2, `<p>${text}</p>`);
      
      expect(result.summary).toBe(text.substring(0, 300));
    });

    it('should handle text that needs truncation with ellipsis', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const text = 'First. Second sentence that is quite long and will need truncation because it exceeds the default length. Third.';
      const result = await summarizePost(3, `<p>${text}</p>`);
      
      expect(result.summary.length).toBeLessThanOrEqual(text.length);
    });

    it('should not add ellipsis if summary already ends with period', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const text = 'Short first. Short second.';
      const result = await summarizePost(4, `<p>${text}</p>`);
      
      expect(result.summary.endsWith('.')).toBe(true);
    });
  });
});
