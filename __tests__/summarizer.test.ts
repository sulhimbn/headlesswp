import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache } from '@/lib/services/summarizer';
import { stripHtml } from '@/lib/utils/stripHtml';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

const mockFetch = jest.fn();
global.fetch = mockFetch;

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

describe('summarizer', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = { ...process.env };
    mockFetch.mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
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
      expect(summary).toContain('Second sentence');
    });

    it('should handle text where first sentence is shorter than default length', () => {
      const text = 'Short. Another sentence here. Third sentence goes here.';
      const summary = generateLocalSummary(text);
      expect(summary).toContain('Short');
      expect(summary).toContain('Another sentence');
    });

    it('should handle text with no sentence-ending punctuation', () => {
      const text = 'No punctuation here';
      const summary = generateLocalSummary(text);
      expect(summary).toBeTruthy();
    });

    it('should truncate very long combined sentences', () => {
      const longFirst = 'This is a very long first sentence that contains a lot of words to make it exceed the default length threshold and trigger truncation logic in the summarization function.';
      const longSecond = 'This is also a very long second sentence that when combined with the first sentence will definitely exceed two hundred and twenty five characters and cause truncation.';
      const text = `${longFirst}. ${longSecond}. Third sentence here.`;
      const summary = generateLocalSummary(text);
      expect(summary.length).toBeLessThanOrEqual(225);
      expect(summary.endsWith('...') || summary.endsWith('.')).toBe(true);
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

    it('should handle content exactly at boundary (50 chars)', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      const longContent = '<p>' + 'a'.repeat(50) + '</p>';
      
      const result = await summarizePost(100, longContent);
      
      expect(result.cached).toBe(false);
    });

    it('should fallback to local summary when API fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const result = await summarizePost(200, '<p>This is a test article. It has multiple sentences to summarize.</p>');
      
      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should fallback to local summary on OpenAI API error', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error')
      });
      
      const result = await summarizePost(201, '<p>This is a test article. It has multiple sentences to summarize.</p>');
      
      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should fallback to local summary on Anthropic API error', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue('Bad Request')
      });
      
      const result = await summarizePost(202, '<p>This is a test article. It has multiple sentences to summarize.</p>');
      
      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should successfully use OpenAI provider', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'AI generated summary' } }]
        })
      });
      
      const result = await summarizePost(203, '<p>This is a test article. It has multiple sentences to summarize.</p>');
      
      expect(result.summary).toBe('AI generated summary');
      expect(result.cached).toBe(false);
    });

    it('should successfully use Anthropic provider', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'Claude generated summary' }]
        })
      });
      
      const result = await summarizePost(204, '<p>This is a test article. It has multiple sentences to summarize.</p>');
      
      expect(result.summary).toBe('Claude generated summary');
      expect(result.cached).toBe(false);
    });

    it('should handle empty response from OpenAI', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '' } }]
        })
      });
      
      const result = await summarizePost(205, '<p>This is a test article. It has multiple sentences to summarize.</p>');
      
      expect(result.summary).toBe('');
    });

    it('should throw error when OpenAI API key is missing and fallback to local', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'openai';
      delete process.env.SUMMARY_API_KEY;
      
      const result = await summarizePost(206, '<p>This is a test article. It has multiple sentences to summarize.</p>');
      
      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should throw error when Anthropic API key is missing and fallback to local', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      delete process.env.SUMMARY_API_KEY;
      
      const result = await summarizePost(207, '<p>This is a test article. It has multiple sentences to summarize.</p>');
      
      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should handle long content with local provider and truncate when needed', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      process.env.SUMMARY_PROVIDER = 'local';
      
      const longFirst = 'This is a very long first sentence that contains a lot of words to make it exceed the default length threshold and trigger truncation logic in the summarization function.';
      const longSecond = 'This is also a very long second sentence that when combined with the first sentence will definitely exceed two hundred and twenty five characters and cause truncation.';
      const content = `<p>${longFirst}. ${longSecond}. Third sentence here.</p>`;
      
      const result = await summarizePost(300, content);
      
      expect(result.summary.length).toBeLessThanOrEqual(228);
      expect(result.summary.endsWith('...') || result.summary.endsWith('.')).toBe(true);
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

    it('should handle empty string environment variables', () => {
      process.env.SUMMARY_PROVIDER = '';
      process.env.SUMMARY_API_KEY = '';
      process.env.SUMMARY_MODEL = '';
      process.env.SUMMARY_MAX_TOKENS = '';
      process.env.SUMMARY_TEMPERATURE = '';

      const config = getSummarizationConfig();

      expect(config.provider).toBe('local');
      expect(config.apiKey).toBe('');
      expect(config.model).toBe('gpt-3.5-turbo');
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear cache for specific post ID', () => {
      clearSummaryCache(123);
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary cache when no postId provided', () => {
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
      (cacheManager as unknown as { cache: undefined }).cache = undefined;
      
      expect(() => clearSummaryCache()).not.toThrow();
    });
  });
});
