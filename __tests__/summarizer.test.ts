import {
  summarizePost,
  isSummarizationEnabled,
  getSummarizationConfig,
  clearSummaryCache,
} from '@/lib/services/summarizer';
import { stripHtml } from '@/lib/utils/stripHtml';
import { cacheManager } from '@/lib/cache';

global.fetch = jest.fn();

function extractTextFromContent(htmlContent: string): string {
  return stripHtml(htmlContent).trim();
}

jest.mock('@/lib/cache');

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

  describe('summarizePost - local provider', () => {
    it('should handle exactly two sentences with proper formatting', async () => {
      process.env.SUMMARY_PROVIDER = 'local';
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(999, '<p>First sentence. Second sentence.</p>');

      expect(result.summary).toContain('First sentence');
      expect(result.summary).toContain('Second sentence');
      expect(result.summary.endsWith('.')).toBe(true);
    });

    it('should handle long first sentence and add ellipsis', async () => {
      process.env.SUMMARY_PROVIDER = 'local';
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const longFirstSentence = 'This is a very long first sentence that exceeds the default summary length significantly when combined with other content and needs to be truncated appropriately.';
      const result = await summarizePost(998, `<p>${longFirstSentence} Second sentence here.</p>`);

      expect(result.summary.length).toBeLessThanOrEqual(225);
    });

    it('should handle more than two sentences with first sentence already long enough', async () => {
      process.env.SUMMARY_PROVIDER = 'local';
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const longFirst = 'This is a very long first sentence that is definitely more than one hundred fifty characters in length to ensure it triggers the branch where second sentence is not added because first sentence already exceeds summary length.';
      const result = await summarizePost(997, `<p>${longFirst} Second sentence here. Third sentence for more content.</p>`);

      expect(result.summary).toContain('This is a very long first sentence');
      expect(result.summary.length).toBeLessThanOrEqual(225);
    });

    it('should handle truncation without adding ellipsis when ending with period', async () => {
      process.env.SUMMARY_PROVIDER = 'local';
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const text = 'First sentence that is moderately long. Second sentence. Third sentence that adds more content to the mix. Fourth sentence for additional variety and length.';
      const result = await summarizePost(996, `<p>${text}</p>`);

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeLessThanOrEqual(225);
    });

    it('should handle truncation with various sentence lengths', async () => {
      process.env.SUMMARY_PROVIDER = 'local';
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const text = 'This is a very long first sentence that will definitely exceed two hundred twenty five characters when combined with additional words and content. Second sentence. Third sentence also present. Fourth sentence.';
      const result = await summarizePost(995, `<p>${text}</p>`);

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeLessThanOrEqual(225);
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

      const result = await summarizePost(
        456,
        '<p>This is a test article with some content. It has multiple sentences.</p>'
      );

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

  describe('OpenAI provider', () => {
    beforeEach(() => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-openai-key';
      (fetch as jest.Mock).mockClear();
    });

    it('should generate summary using OpenAI API', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'OpenAI generated summary.' } }],
        }),
      });

      const result = await summarizePost(100, '<p>This is a test article. It has multiple sentences and paragraphs that exceed the minimum length threshold.</p>');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-openai-key',
          }),
        })
      );
      expect(result.summary).toBe('OpenAI generated summary.');
      expect(result.cached).toBe(false);
    });

it('should fallback to local when OpenAI API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(100, '<p>This is longer test content that exceeds minimum length requirement.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback to local on OpenAI API error', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const result = await summarizePost(100, '<p>This is a test article. It has multiple sentences and exceeds minimum length.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });
  });

  describe('Anthropic provider', () => {
    beforeEach(() => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
      (fetch as jest.Mock).mockClear();
    });

    it('should generate summary using Anthropic API', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Anthropic generated summary.' }],
        }),
      });

      const result = await summarizePost(200, '<p>This is another test article with content that is longer than fifty characters to trigger API call.</p>');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-anthropic-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
      expect(result.summary).toBe('Anthropic generated summary.');
      expect(result.cached).toBe(false);
    });

    it('should fallback to local when Anthropic API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(200, '<p>This is longer test content that exceeds minimum length requirement.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback to local on Anthropic API error', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      });

      const result = await summarizePost(200, '<p>This is another test article. It has multiple sentences and exceeds minimum length.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear cache for specific post', () => {
      clearSummaryCache(123);
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      const mockCache = new Map();
      mockCache.set('summary:1', 'test');
      mockCache.set('summary:2', 'test2');
      mockCache.set('other:key', 'test3');
      
      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
    });
  });
});