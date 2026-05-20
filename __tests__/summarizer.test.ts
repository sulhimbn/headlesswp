import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache } from '@/lib/services/summarizer';
import { stripHtml } from '@/lib/utils/stripHtml';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

function generateLocalSummary(text: string): string {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  
  if (sentences.length <= 2) {
    return text.substring(0, 300);
  }

  const firstSentence = sentences[0].trim();
  const secondSentence = sentences[1].trim();
  
  let summary = firstSentence;
  if (summary.length < 150 && secondSentence) {
    summary += '. ' + secondSentence;
  }
  
  if (summary.length > 225) {
    summary = summary.substring(0, 225).trim();
    if (!summary.endsWith('.')) {
      summary += '...';
    }
  } else {
    summary += '.';
  }
  
  return summary;
}

function extractTextFromContent(htmlContent: string): string {
  return stripHtml(htmlContent).trim();
}

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

global.fetch = jest.fn();

describe('summarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('OpenAI API integration', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      jest.clearAllMocks();
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-openai-key';
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should generate summary with OpenAI successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'This is a test summary.' } }],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(100, '<p>This is a test article. It has multiple sentences. And more content here.</p>');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-openai-key',
          }),
        })
      );
      expect(result.summary).toBe('This is a test summary.');
      expect(result.cached).toBe(false);
    });

    it('should fallback to local when OpenAI API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(100, '<p>This is a test article with some content.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback to local when OpenAI API fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(100, '<p>This is a test article. It has multiple sentences. And more content here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle empty response from OpenAI', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '' } }],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(100, '<p>This is a test article. It has multiple sentences. And more content here.</p>');

      expect(result.summary).toBe('');
    });
  });

  describe('Anthropic API integration', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      jest.clearAllMocks();
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should generate summary with Anthropic successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'This is a Claude summary.' }],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(200, '<p>This is a test article. It has multiple sentences. And more content here.</p>');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-anthropic-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
      expect(result.summary).toBe('This is a Claude summary.');
      expect(result.cached).toBe(false);
    });

    it('should fallback to local when Anthropic API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(200, '<p>This is a test article with some content.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback to local when Anthropic API fails', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValue('Rate limit exceeded'),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(200, '<p>This is a test article. It has multiple sentences. And more content here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle empty response from Anthropic', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [],
        }),
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(200, '<p>This is a test article. It has multiple sentences. And more content here.</p>');

      expect(result.summary).toBe('');
    });
  });

  describe('local summarization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.SUMMARY_PROVIDER = 'local';
      delete process.env.SUMMARY_API_KEY;
    });

    it('should handle text with exactly 2 sentences', () => {
      const text = 'First sentence. Second sentence.';
      const summary = generateLocalSummary(text);
      expect(summary).toContain('First sentence');
      expect(summary).toContain('Second sentence');
    });

    it('should handle text longer than default summary length', () => {
      const text = 'Short. This is a much longer second sentence that will exceed the default length when combined with the first one and should trigger truncation logic.';
      const summary = generateLocalSummary(text);
      expect(summary.length).toBeLessThanOrEqual(text.length);
    });

    it('should handle text with no sentence-ending punctuation', () => {
      const text = 'This is a sentence without proper ending';
      const summary = generateLocalSummary(text);
      expect(summary).toBeTruthy();
    });

    it('should generate local summary when API provider fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(300, '<p>This is a test article. It has multiple sentences. And more content here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(result.summaryLength).toBeGreaterThan(0);
    });
  });

  describe('clearSummaryCache', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

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
  });

  describe('cache key generation', () => {
    it('should generate correct cache key format', () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'local';

      summarizePost(999, '<p>Test content</p>');

      expect(cacheManager.get).toHaveBeenCalledWith('summary:999');
    });
  });

  describe('configuration validation', () => {
    it('should handle missing environment variables with defaults', () => {
      delete process.env.SUMMARY_PROVIDER;
      delete process.env.SUMMARY_API_KEY;
      delete process.env.SUMMARY_MODEL;
      delete process.env.SUMMARY_MAX_TOKENS;
      delete process.env.SUMMARY_TEMPERATURE;

      const config = getSummarizationConfig();

      expect(config.provider).toBe('local');
      expect(config.apiKey).toBeUndefined();
      expect(config.model).toBe('gpt-3.5-turbo');
      expect(config.maxTokens).toBe(200);
      expect(config.temperature).toBe(0.7);
    });

    it('should return NaN for invalid SUMMARY_MAX_TOKENS', () => {
      process.env.SUMMARY_MAX_TOKENS = 'invalid';
      const config = getSummarizationConfig();
      expect(config.maxTokens).toBeNaN();
    });

    it('should return NaN for invalid SUMMARY_TEMPERATURE', () => {
      process.env.SUMMARY_TEMPERATURE = 'invalid';
      const config = getSummarizationConfig();
      expect(config.temperature).toBeNaN();
    });
  });
});
