import {
  summarizePost,
  isSummarizationEnabled,
  getSummarizationConfig,
  clearSummaryCache,
  generateLocalSummary,
  extractTextFromContent,
} from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';

jest.mock('@/lib/cache');

describe('summarizer', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    delete process.env.SUMMARY_PROVIDER;
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
    delete process.env.SUMMARY_MAX_TOKENS;
    delete process.env.SUMMARY_TEMPERATURE;
  });

  afterEach(() => {
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

    it('should handle text with no sentence terminators', () => {
      const text = 'No sentence terminators here';
      const summary = generateLocalSummary(text);
      expect(summary).toBe(text);
    });
  });

  describe('generateSummaryWithOpenAI', () => {
    it('should throw error when API key is not configured', async () => {
      const { generateSummaryWithOpenAI } = await import('@/lib/services/summarizer');
      const config = { provider: 'openai' as const, apiKey: undefined };
      
      await expect(generateSummaryWithOpenAI('test text', config)).rejects.toThrow('OpenAI API key not configured');
    });

    it('should return summary from OpenAI API', async () => {
      const { generateSummaryWithOpenAI } = await import('@/lib/services/summarizer');
      const config = { provider: 'openai' as const, apiKey: 'test-key', model: 'gpt-4' };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'AI generated summary' } }],
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      const result = await generateSummaryWithOpenAI('test text', config);
      
      expect(result).toBe('AI generated summary');
      expect(fetchMock).toHaveBeenCalledWith(
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
      const { generateSummaryWithOpenAI } = await import('@/lib/services/summarizer');
      const config = { provider: 'openai' as const, apiKey: 'test-key' };
      const mockResponse = {
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue('Unauthorized'),
      };
      fetchMock.mockResolvedValue(mockResponse);

      await expect(generateSummaryWithOpenAI('test text', config)).rejects.toThrow('OpenAI API error: 401');
    });
  });

  describe('generateSummaryWithAnthropic', () => {
    it('should throw error when API key is not configured', async () => {
      const { generateSummaryWithAnthropic } = await import('@/lib/services/summarizer');
      const config = { provider: 'anthropic' as const, apiKey: undefined };
      
      await expect(generateSummaryWithAnthropic('test text', config)).rejects.toThrow('Anthropic API key not configured');
    });

    it('should return summary from Anthropic API', async () => {
      const { generateSummaryWithAnthropic } = await import('@/lib/services/summarizer');
      const config = { provider: 'anthropic' as const, apiKey: 'test-anthropic-key', model: 'claude-3-sonnet' };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'Anthropic generated summary' }],
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      const result = await generateSummaryWithAnthropic('test text', config);
      
      expect(result).toBe('Anthropic generated summary');
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-anthropic-key',
          }),
        })
      );
    });

    it('should throw error when API returns non-ok response', async () => {
      const { generateSummaryWithAnthropic } = await import('@/lib/services/summarizer');
      const config = { provider: 'anthropic' as const, apiKey: 'test-key' };
      const mockResponse = {
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValue('Rate limited'),
      };
      fetchMock.mockResolvedValue(mockResponse);

      await expect(generateSummaryWithAnthropic('test text', config)).rejects.toThrow('Anthropic API error: 429');
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

    it('should handle very short content (less than 50 chars)', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(789, '<p>Hi</p>');

      expect(result.summary).toBe('Hi');
      expect(result.cached).toBe(false);
    });

    it('should handle content that results in short text after HTML stripping', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(101, '<p>Short</p>');

      expect(result.summary).toBe('Short');
      expect(result.cached).toBe(false);
    });

    it('should use OpenAI provider when configured', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'OpenAI summary' } }],
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      const result = await summarizePost(111, '<p>This is a longer piece of content that needs summarization. It has many sentences and should be processed by the AI.</p>');

      expect(result.summary).toBe('OpenAI summary');
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should use Anthropic provider when configured', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'Anthropic summary' }],
        }),
      };
      fetchMock.mockResolvedValue(mockResponse);

      const result = await summarizePost(222, '<p>This is a longer piece of content that needs summarization. It has many sentences and should be processed by the AI.</p>');

      expect(result.summary).toBe('Anthropic summary');
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should fallback to local summary when AI provider fails', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      
      const mockResponse = {
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Server error'),
      };
      fetchMock.mockResolvedValue(mockResponse);

      const result = await summarizePost(333, '<p>This is a longer piece of content that needs summarization. It has many sentences and should be processed by the AI.</p>');

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
    it('should clear cache for specific post', () => {
      clearSummaryCache(123);
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      const mockCache = new Map<string, unknown>();
      mockCache.set('summary:1', 'data1');
      mockCache.set('summary:2', 'data2');
      mockCache.set('other:key', 'data3');
      
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
