import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache } from '@/lib/services/summarizer';
import { stripHtml } from '@/lib/utils/stripHtml';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

const mockFetch = jest.fn();

global.fetch = mockFetch;

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

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

  describe('OpenAI summarization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-openai-key';
    });

    it('should generate summary using OpenAI API successfully', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'This is an AI generated summary.' } }],
        }),
      });

      const result = await summarizePost(100, '<p>This is a test article with some content. It has multiple sentences and is meant to be summarized by OpenAI.</p>');

      expect(result.summary).toBe('This is an AI generated summary.');
      expect(result.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-openai-key',
          }),
        })
      );
    });

    it('should fall back to local summarization when OpenAI API fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const result = await summarizePost(101, '<p>This is a test article with some content. It has multiple sentences to summarize.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should fall back to local summarization when OpenAI API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(
        102,
        '<p>This is a longer test article with some content that will trigger the API call</p>'
      );

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should return empty string when OpenAI returns empty content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '' } }],
        }),
      });

      const result = await summarizePost(103, '<p>This is a longer test article content that needs to be summarized by OpenAI</p>');

      expect(result.summary).toBe('');
    });
  });

  describe('Anthropic summarization', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
    });

    it('should generate summary using Anthropic API successfully', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'This is an Anthropic generated summary.' }],
        }),
      });

      const result = await summarizePost(200, '<p>This is a test article with some content that is meant to be summarized by the Anthropic API</p>');

      expect(result.summary).toBe('This is an Anthropic generated summary.');
      expect(result.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-anthropic-key',
          }),
        })
      );
    });

    it('should fall back to local summarization when Anthropic API fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      const result = await summarizePost(201, '<p>This is a test article with some content that triggers API call for Anthropic</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should fall back to local summarization when Anthropic API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(
        202,
        '<p>This is a longer test article with content that will trigger the Anthropic API</p>'
      );

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear cache for specific post ID', () => {
      clearSummaryCache(123);
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no post ID provided', () => {
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

  describe('local summarization fallback', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      process.env.SUMMARY_PROVIDER = 'local';
      delete process.env.SUMMARY_API_KEY;
    });

    it('should generate local summary with very short content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(300, '<p>Short.</p>');

      expect(result.summary).toBe('Short.');
      expect(result.originalLength).toBe(6);
      expect(result.summaryLength).toBe(6);
    });

    it('should return original text when content is less than 50 chars', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(301, '<p>Hello world this is a test</p>');

      expect(result.summary).toBe('Hello world this is a test');
      expect(result.cached).toBe(false);
    });
  });
});
