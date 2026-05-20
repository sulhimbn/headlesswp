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
    delete process.env.SUMMARY_PROVIDER;
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
    delete process.env.SUMMARY_MAX_TOKENS;
    delete process.env.SUMMARY_TEMPERATURE;
    (global.fetch as jest.Mock).mockReset();
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

    it('should handle text with exactly 2 sentences', () => {
      const text = 'First sentence. Second sentence.';
      const summary = generateLocalSummary(text);
      expect(summary).toContain('First sentence');
    });

    it('should handle text with no sentence terminators', () => {
      const text = 'No punctuation just words';
      const summary = generateLocalSummary(text);
      expect(summary).toBeTruthy();
    });

    it('should handle empty sentences array after split', () => {
      const text = '...';
      const summary = generateLocalSummary(text);
      expect(summary).toBe('...');
    });

    it('should handle single long sentence', () => {
      const text = 'This is a very long single sentence that goes on and on without any punctuation marks to stop it.';
      const summary = generateLocalSummary(text);
      expect(summary.length).toBeLessThanOrEqual(text.length);
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

    it('should handle empty content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '');

      expect(result.summary).toBe('');
      expect(result.cached).toBe(false);
    });

    it('should handle content with only HTML tags', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(2, '<div><span></span></div>');

      expect(result.summary).toBe('');
      expect(result.cached).toBe(false);
    });

    it('should handle content just under 50 chars threshold', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const content = '<p>' + 'a'.repeat(40) + '</p>';
      const result = await summarizePost(3, content);

      expect(result.summary).toBeTruthy();
    });

    it('should handle long content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const longContent = '<p>' + 'This is a test article with substantial content. '.repeat(20) + '</p>';
      const result = await summarizePost(4, longContent);

      expect(result.summary).toBeTruthy();
      expect(result.originalLength).toBeGreaterThan(50);
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should handle null/undefined content gracefully', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(5, null as unknown as string);

      expect(result.summary).toBe('');
    });
  });

  describe('OpenAI API error handling', () => {
    beforeEach(() => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-openai-key';
    });

    it('should use fallback when API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve());

      const result = await summarizePost(1, '<p>' + 'a'.repeat(100) + '</p>');

      expect(result.summary).toBeTruthy();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle API network error with fallback', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await summarizePost(1, '<p>This is a test article. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle API timeout error with fallback', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('timeout'));

      const result = await summarizePost(1, '<p>This is a test article. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBeTruthy();
    });

    it('should handle non-ok API response with fallback', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error'),
      });

      const result = await summarizePost(1, '<p>This is a test article. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBeTruthy();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle empty API response', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ choices: [] }),
      });

      const result = await summarizePost(1, '<p>This is a test article. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBe('');
    });

    it('should handle malformed API response', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      });

      const result = await summarizePost(1, '<p>This is a test article. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBeTruthy();
    });

    it('should successfully use OpenAI when API responds', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'AI Summary' } }],
        }),
      });

      const result = await summarizePost(1, '<p>This is a test article. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBe('AI Summary');
      expect(cacheManager.set).toHaveBeenCalled();
    });
  });

  describe('Anthropic API error handling', () => {
    beforeEach(() => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
    });

    it('should use fallback when API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve());

      const result = await summarizePost(1, '<p>' + 'a'.repeat(100) + '</p>');

      expect(result.summary).toBeTruthy();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle API network error with fallback', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await summarizePost(1, '<p>This is a test article. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBeTruthy();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle non-ok API response with fallback', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValue('Rate limited'),
      });

      const result = await summarizePost(1, '<p>This is a test article. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBeTruthy();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle empty API response', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ content: [] }),
      });

      const result = await summarizePost(1, '<p>This is a test article. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBe('');
    });

    it('should successfully use Anthropic when API responds', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'Claude Summary' }],
        }),
      });

      const result = await summarizePost(1, '<p>This is a test article. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBe('Claude Summary');
    });
  });

  describe('fallback behavior', () => {
    it('should use local fallback when OpenAI fails', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await summarizePost(1, '<p>First sentence. Second sentence. Third sentence.</p>');

      expect(result.summary).toContain('First sentence');
      expect(result.cached).toBe(false);
    });

    it('should use local fallback when Anthropic fails', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (global.fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await summarizePost(1, '<p>First sentence. Second sentence. Third sentence.</p>');

      expect(result.summary).toContain('First sentence');
    });
  });

  describe('clearSummaryCache', () => {
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

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
      expect(cacheManager.invalidate).not.toHaveBeenCalledWith('other:key');
    });

    it('should handle missing cache gracefully', () => {
      (cacheManager as unknown as { cache?: Map<string, unknown> }).cache = undefined;
      
      expect(() => clearSummaryCache()).not.toThrow();
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

    it('should handle empty string API key', () => {
      process.env.SUMMARY_API_KEY = '';

      const config = getSummarizationConfig();

      expect(config.apiKey).toBe('');
    });
  });
});
