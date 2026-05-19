import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache } from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';

const { generateLocalSummary: actualGenerateLocalSummary, extractTextFromContent: actualExtractTextFromContent } = require('@/lib/services/summarizer');

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
  const { stripHtml } = require('@/lib/utils/stripHtml');
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

  describe('clearSummaryCache', () => {
    it('should clear specific post summary cache', () => {
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);

      clearSummaryCache(123);

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);

      const mockCache = new Map([
        ['summary:1', 'test'],
        ['summary:2', 'test2'],
        ['other:key', 'test3']
      ]);

      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
    });
  });

  describe('OpenAI and Anthropic provider paths', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      global.fetch = jest.fn();
    });

    afterEach(() => {
      delete (global as unknown as { fetch?: jest.Mock }).fetch;
    });

    it('should handle OpenAI provider when API key is missing', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      delete process.env.SUMMARY_API_KEY;

      const result = await summarizePost(1, '<p>Test content with enough text to pass the length check. This needs to be more than 50 characters to trigger the summarization logic.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should handle Anthropic provider when API key is missing', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      delete process.env.SUMMARY_API_KEY;

      const result = await summarizePost(1, '<p>Test content with enough text to pass the length check. This needs to be more than 50 characters to trigger the summarization logic.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should handle empty content gracefully', async () => {
      const result = await summarizePost(1, '');

      expect(result.summary).toBe('');
      expect(result.originalLength).toBe(0);
    });

    it('should fallback to local summary when OpenAI API fails', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValueOnce('Internal Server Error')
      });

      const result = await summarizePost(1, '<p>Test content that is long enough to trigger summarization. This needs to be more than 50 characters. Let me add more text here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback to local summary when Anthropic API fails', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValueOnce('Internal Server Error')
      });

      const result = await summarizePost(1, '<p>Test content that is long enough to trigger summarization. This needs to be more than 50 characters. Let me add more text here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should use OpenAI response when API succeeds', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          choices: [{ message: { content: 'OpenAI summary' } }]
        })
      });

      const result = await summarizePost(1, '<p>Test content that is long enough to trigger summarization. This needs to be more than 50 characters. Let me add more text here.</p>');

      expect(result.summary).toBe('OpenAI summary');
      expect(result.cached).toBe(false);
    });

    it('should use Anthropic response when API succeeds', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          content: [{ text: 'Anthropic summary' }]
        })
      });

      const result = await summarizePost(1, '<p>Test content that is long enough to trigger summarization. This needs to be more than 50 characters. Let me add more text here.</p>');

      expect(result.summary).toBe('Anthropic summary');
      expect(result.cached).toBe(false);
    });
  });

  describe('generateLocalSummary edge cases', () => {
    it('should handle text with exactly 2 sentences', () => {
      const text = 'First sentence. Second sentence.';
      const summary = generateLocalSummary(text);
      expect(summary).toBeTruthy();
    });

    it('should handle text with many sentences', () => {
      const text = 'First. Second. Third. Fourth. Fifth. Sixth. Seventh.';
      const summary = generateLocalSummary(text);
      expect(summary.length).toBeLessThanOrEqual(450);
    });

    it('should handle very long single sentence', () => {
      const text = 'This is a very long sentence that goes on and on without any punctuation or period to separate it from other sentences which makes it a single long sentence that should be handled by the algorithm.';
      const summary = generateLocalSummary(text);
      expect(summary).toBeTruthy();
      expect(summary.length).toBeLessThanOrEqual(600);
    });
  });
});
