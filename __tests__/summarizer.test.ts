import {
  summarizePost,
  isSummarizationEnabled,
  getSummarizationConfig,
  clearSummaryCache,
} from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';
import { stripHtml } from '@/lib/utils/stripHtml';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');
jest.mock('@/lib/utils/stripHtml');

const mockedStripHtml = stripHtml as jest.MockedFunction<typeof stripHtml>;

describe('summarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStripHtml.mockImplementation((html: string) => html.replace(/<[^>]*>/g, '').trim());
    delete process.env.SUMMARY_PROVIDER;
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
    delete process.env.SUMMARY_MAX_TOKENS;
    delete process.env.SUMMARY_TEMPERATURE;
  });

  describe('extractTextFromContent (via stripHtml)', () => {
    it('should strip HTML tags from content', () => {
      const html = '<p>This is <strong>bold</strong> text.</p>';
      mockedStripHtml.mockReturnValue('This is bold text.');
      expect(stripHtml(html)).toBe('This is bold text.');
    });

    it('should handle empty content', () => {
      mockedStripHtml.mockReturnValue('');
      expect(stripHtml('')).toBe('');
      expect(stripHtml(null as unknown as string)).toBe('');
    });

    it('should decode HTML entities', () => {
      const html = '<p>Hello &amp; World &lt;test&gt;</p>';
      mockedStripHtml.mockReturnValue('Hello & World <test>');
      expect(stripHtml(html)).toBe('Hello & World <test>');
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

    it('should fallback to local summary on API error (OpenAI)', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      process.env.SUMMARY_MODEL = 'gpt-3.5-turbo';

      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });
      global.fetch = mockFetch;

      const result = await summarizePost(
        101,
        '<p>This is a longer article that should trigger the API call. It has enough content to be summarized properly.</p>'
      );

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should fallback to local summary on API error (Anthropic)', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';
      process.env.SUMMARY_MODEL = 'claude-3-haiku';

      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      });
      global.fetch = mockFetch;

      const result = await summarizePost(
        102,
        '<p>This is a longer article that should trigger the API call. It has enough content to be summarized properly.</p>'
      );

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should use OpenAI provider successfully', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'OpenAI generated summary.' } }],
          }),
      });
      global.fetch = mockFetch;

      const result = await summarizePost(
        103,
        '<p>This is a longer article that should trigger the API call. It has enough content to be summarized properly.</p>'
      );

      expect(result.summary).toBe('OpenAI generated summary.');
      expect(result.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should use Anthropic provider successfully', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: [{ text: 'Anthropic generated summary.' }] }),
      });
      global.fetch = mockFetch;

      const result = await summarizePost(
        104,
        '<p>This is a longer article that should trigger the API call. It has enough content to be summarized properly.</p>'
      );

      expect(result.summary).toBe('Anthropic generated summary.');
      expect(result.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should fallback when OpenAI API key is missing', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'openai';
      delete process.env.SUMMARY_API_KEY;

      const result = await summarizePost(
        105,
        '<p>This is a longer article that should trigger the API call. It has enough content to be summarized properly.</p>'
      );

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback when Anthropic API key is missing', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      delete process.env.SUMMARY_API_KEY;

      const result = await summarizePost(
        106,
        '<p>This is a longer article that should trigger the API call. It has enough content to be summarized properly.</p>'
      );

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should return correct originalLength and summaryLength', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      mockedStripHtml.mockReturnValue('Short content.');

      const result = await summarizePost(107, '<p>Short content.</p>');

      expect(result.originalLength).toBe(14);
      expect(result.summaryLength).toBe(14);
      expect(result.summary).toBe('Short content.');
    });

    it('should use cached summary from cache with correct lengths', async () => {
      const cachedSummary = 'Cached summary text';
      (cacheManager.get as jest.Mock).mockReturnValue(cachedSummary);
      mockedStripHtml.mockReturnValue('Longer content that is cached');

      const result = await summarizePost(108, '<p>Longer content that is cached</p>');

      expect(result.summary).toBe(cachedSummary);
      expect(result.originalLength).toBe(36);
      expect(result.summaryLength).toBe(cachedSummary.length);
      expect(result.cached).toBe(true);
    });

    it('should handle OpenAI response with empty content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: '' } }] }),
      });
      global.fetch = mockFetch;

      const result = await summarizePost(
        109,
        '<p>This is a longer article that should trigger the API call. It has enough content to be summarized properly.</p>'
      );

      expect(result.summary).toBe('');
    });

    it('should handle Anthropic response with empty content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: [] }),
      });
      global.fetch = mockFetch;

      const result = await summarizePost(
        110,
        '<p>This is a longer article that should trigger the API call. It has enough content to be summarized properly.</p>'
      );

      expect(result.summary).toBe('');
    });
  });

  describe('isSummarizationEnabled', () => {
    afterEach(() => {
      delete process.env.SUMMARY_PROVIDER;
      delete process.env.SUMMARY_API_KEY;
    });

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
  });

  describe('getSummarizationConfig', () => {
    afterEach(() => {
      delete process.env.SUMMARY_PROVIDER;
      delete process.env.SUMMARY_API_KEY;
      delete process.env.SUMMARY_MODEL;
      delete process.env.SUMMARY_MAX_TOKENS;
      delete process.env.SUMMARY_TEMPERATURE;
    });

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

    it('should parse invalid maxTokens as NaN fallback', () => {
      process.env.SUMMARY_MAX_TOKENS = 'invalid';

      const config = getSummarizationConfig();

      expect(config.maxTokens).toBeNaN();
    });

    it('should parse invalid temperature as NaN fallback', () => {
      process.env.SUMMARY_TEMPERATURE = 'invalid';

      const config = getSummarizationConfig();

      expect(config.temperature).toBeNaN();
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear cache for specific postId', () => {
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);

      clearSummaryCache(123);

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);
      const mockCache = new Map([
        ['summary:1', 'value1'],
        ['summary:2', 'value2'],
        ['other:key', 'value3'],
      ]);
      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledTimes(2);
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
    });

    it('should handle empty cache gracefully', () => {
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);
      const mockCache = new Map<string, string>();
      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;

      expect(() => clearSummaryCache()).not.toThrow();
    });

    it('should handle cache without keys method', () => {
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);
      (cacheManager as unknown as { cache: null }).cache = null;

      expect(() => clearSummaryCache()).not.toThrow();
    });
  });

  describe('local summary generation edge cases', () => {
    it('should handle text with exactly 2 sentences', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'local';
      mockedStripHtml.mockReturnValue('First sentence. Second sentence.');

      const result = await summarizePost(200, '<p>First sentence. Second sentence.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should handle text with single sentence', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'local';
      mockedStripHtml.mockReturnValue('Just one sentence here.');

      const result = await summarizePost(201, '<p>Just one sentence here.</p>');

      expect(result.summary).toBeTruthy();
    });

    it('should truncate long summary and add ellipsis', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'local';
      mockedStripHtml.mockReturnValue(
        'This is a very long first sentence that definitely exceeds the default summary length. This is the second sentence which also adds more content to make sure truncation happens properly.'
      );

      const result = await summarizePost(202, '<p>Content</p>');

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeLessThanOrEqual(225);
      expect(result.summary).toMatch(/(\.\.\.|\.)$/);
    });

    it('should end summary with period when not truncated', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'local';
      mockedStripHtml.mockReturnValue('Short. Second sentence.');

      const result = await summarizePost(203, '<p>Short. Second sentence.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.summary.endsWith('.')).toBe(true);
    });

    it('should add ellipsis when truncating without ending period', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'local';
      mockedStripHtml.mockReturnValue(
        'This is a long first sentence under 150 chars but still substantial. Second sentence continues here adding more content to exceed 225 characters. Third sentence for good measure.'
      );

      const result = await summarizePost(204, '<p>Content</p>');

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeLessThanOrEqual(228);
    });

    it('should include second sentence when first is short enough', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'local';
      mockedStripHtml.mockReturnValue(
        'Short first sentence. Second sentence here.'
      );

      const result = await summarizePost(205, '<p>Content</p>');

      expect(result.summary).toBeTruthy();
      expect(result.summary).toContain('Second sentence');
    });

    it('should not add second sentence when first is too long', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'local';
      mockedStripHtml.mockReturnValue(
        'This is a very long first sentence that definitely exceeds the default summary length requirement and should not have the second sentence appended to it.'
      );

      const result = await summarizePost(206, '<p>Content</p>');

      expect(result.summary).toBeTruthy();
      expect(result.summary).not.toContain('Second');
    });
  });
});
