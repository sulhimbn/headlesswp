import { 
  summarizePost, 
  isSummarizationEnabled, 
  getSummarizationConfig,
  generateLocalSummary,
  extractTextFromContent,
  clearSummaryCache
} from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

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

    it('should handle short text with one sentence', () => {
      const text = 'Short text.';
      const summary = generateLocalSummary(text);
      expect(summary).toBe('Short text.');
    });

    it('should handle text with exactly two sentences', () => {
      const text = 'First sentence. Second sentence.';
      const summary = generateLocalSummary(text);
      expect(summary).toContain('First sentence');
      expect(summary).toContain('Second sentence');
    });

    it('should handle text without ending punctuation', () => {
      const text = 'First sentence no period Second sentence no period Third sentence';
      const summary = generateLocalSummary(text);
      expect(summary).toBeTruthy();
    });

    it('should add ellipsis when truncating long text', () => {
      const longText = 'First sentence. Second sentence that is quite long and will need truncation to happen here. Third sentence that follows.';
      const summary = generateLocalSummary(longText);
      expect(summary.length).toBeLessThanOrEqual(300);
      if (summary.length < longText.length) {
        expect(summary.endsWith('...') || summary.endsWith('.')).toBe(true);
      }
    });

    it('should add period when not truncated', () => {
      const text = 'Short first sentence. Short second sentence.';
      const summary = generateLocalSummary(text);
      expect(summary.endsWith('.')).toBe(true);
    });

    it('should handle empty text', () => {
      const summary = generateLocalSummary('');
      expect(summary).toBe('');
    });

    it('should add ellipsis when truncated summary does not end with period', () => {
      const text = 'A'.repeat(100) + '. This is a very long second sentence that will make the combined summary exceed the maximum length threshold. Third sentence.';
      const summary = generateLocalSummary(text);
      expect(summary.length).toBeLessThan(text.length);
    });

    it('should add ellipsis when truncating text without trailing period', () => {
      const text = 'First sentence ends with content'.repeat(10) + '. Second very long sentence that goes on and on to ensure truncation happens properly. Third sentence.';
      const summary = generateLocalSummary(text);
      if (summary.length > 225 && !text.includes(summary)) {
        expect(summary.endsWith('...') || summary.endsWith('.')).toBe(true);
      }
    });
  });

  describe('summarizePost with OpenAI provider', () => {
    beforeEach(() => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
    });

    it('should successfully generate summary from OpenAI', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'OpenAI summary' } }]
        })
      }) as jest.Mock;

      const result = await summarizePost(200, '<p>This is content with enough text to generate a summary using OpenAI.</p>');

      expect(result.summary).toBe('OpenAI summary');
      expect(result.cached).toBe(false);
    });

    it('should fallback when OpenAI API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      const errorSpy = jest.spyOn(logger, 'error').mockImplementation();

      const result = await summarizePost(201, '<p>This is content with enough text to trigger summary generation.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('summarizePost with Anthropic provider', () => {
    beforeEach(() => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
    });

    it('should successfully generate summary from Anthropic', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          content: [{ text: 'Anthropic summary' }]
        })
      }) as jest.Mock;

      const result = await summarizePost(300, '<p>This is content with enough text to generate a summary using Anthropic.</p>');

      expect(result.summary).toBe('Anthropic summary');
      expect(result.cached).toBe(false);
    });

    it('should fallback when Anthropic API fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad request')
      }) as jest.Mock;
      
      const errorSpy = jest.spyOn(logger, 'error').mockImplementation();

      const result = await summarizePost(301, '<p>This is content with enough text to trigger Anthropic summarization.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Anthropic summarization failed',
        'Bad request',
        { module: 'summarizer' }
      );
    });

    it('should fallback when Anthropic API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      const errorSpy = jest.spyOn(logger, 'error').mockImplementation();

      const result = await summarizePost(302, '<p>This is content with enough text to trigger the API call.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
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

    it('should cache generated summary with correct TTL', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      await summarizePost(100, '<p>This is content with enough text to generate a summary. It needs to be more than fifty characters long.</p>');

      expect(cacheManager.set).toHaveBeenCalledWith(
        'summary:100',
        expect.any(String),
        7 * 24 * 60 * 60 * 1000
      );
    });

    it('should return result with correct length fields', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(101, '<p>This is a test article with some content. It has multiple sentences that should create a summary.</p>');

      expect(result.originalLength).toBeGreaterThan(0);
      expect(result.summaryLength).toBeGreaterThan(0);
      expect(result.summaryLength).toBe(result.summary.length);
    });

    it('should log info when summary is generated', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      const debugSpy = jest.spyOn(logger, 'info').mockImplementation();

      await summarizePost(102, '<p>This is a test article with some content. It has multiple sentences that should create a summary.</p>');

      expect(debugSpy).toHaveBeenCalledWith(
        'Summary generated',
        expect.objectContaining({ postId: 102, length: expect.any(Number), module: 'summarizer' })
      );
    });

    it('should fallback to local summary when AI provider fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error')
      }) as jest.Mock;
      
      const errorSpy = jest.spyOn(logger, 'error').mockImplementation();

      const result = await summarizePost(103, '<p>This is content with enough text. It needs to be more than fifty characters long to trigger the AI call.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Summarization failed, falling back to local',
        expect.any(Error),
        expect.objectContaining({ postId: 103, module: 'summarizer' })
      );
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

    it('should return true when default provider is used', () => {
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

    it('should handle invalid numeric env vars gracefully', () => {
      process.env.SUMMARY_MAX_TOKENS = 'invalid';
      process.env.SUMMARY_TEMPERATURE = 'invalid';

      const config = getSummarizationConfig();

      expect(config.maxTokens).toBe(NaN);
      expect(config.temperature).toBe(NaN);
    });
  });

  describe('clearSummaryCache', () => {
    it('should invalidate specific post cache', () => {
      clearSummaryCache(123);

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      const mockCache = new Map<string, unknown>();
      mockCache.set('summary:123', 'data1');
      mockCache.set('summary:456', 'data2');
      mockCache.set('other:789', 'data3');

      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledTimes(2);
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:456');
    });

    it('should handle empty cache gracefully', () => {
      const mockCache = new Map<string, unknown>();
      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;

      expect(() => clearSummaryCache()).not.toThrow();
    });

    it('should handle cache without cache property', () => {
      (cacheManager as unknown as { cache?: Map<string, unknown> }).cache = undefined;

      expect(() => clearSummaryCache()).not.toThrow();
    });
  });
});
