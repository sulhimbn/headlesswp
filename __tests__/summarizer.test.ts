import { 
  summarizePost, 
  isSummarizationEnabled, 
  getSummarizationConfig,
  clearSummaryCache
} from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

(global.fetch as jest.Mock) = jest.fn();

describe('summarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SUMMARY_PROVIDER;
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
    delete process.env.SUMMARY_MAX_TOKENS;
    delete process.env.SUMMARY_TEMPERATURE;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('summarizePost with cache', () => {
    it('should return cached summary if available', async () => {
      const cachedSummary = 'Cached summary';
      (cacheManager.get as jest.Mock).mockReturnValue(cachedSummary);

      const result = await summarizePost(123, '<p>Some content</p>');

      expect(result.summary).toBe(cachedSummary);
      expect(result.cached).toBe(true);
      expect(cacheManager.get).toHaveBeenCalledWith('summary:123');
    });

    it('should not call generateSummary when cached', async () => {
      const cachedSummary = 'Cached summary';
      (cacheManager.get as jest.Mock).mockReturnValue(cachedSummary);

      await summarizePost(123, '<p>Some content</p>');

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('summarizePost with OpenAI API', () => {
    beforeEach(() => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-openai-key';
    });

    it('should call OpenAI API and cache result', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'OpenAI summary' } }]
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await summarizePost(1, '<p>Long content here. More content. Even more content. Final content.</p>');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-openai-key'
          })
        })
      );
      expect(result.summary).toBe('OpenAI summary');
      expect(result.cached).toBe(false);
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should fallback to local when OpenAI API fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const mockResponse = {
        ok: false,
        text: jest.fn().mockResolvedValue('API Error')
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await summarizePost(1, '<p>Long content here. More content. Even more content. Final content.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback to local when OpenAI API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '<p>Long content here. More content. Even more content. Final content.</p>');

      expect(result.summary).toBeTruthy();
    });
  });

  describe('summarizePost with Anthropic API', () => {
    beforeEach(() => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
    });

    it('should call Anthropic API and cache result', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'Anthropic summary' }]
        })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await summarizePost(1, '<p>Long content here. More content. Even more content. Final content.</p>');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'test-anthropic-key',
            'anthropic-version': '2023-06-01'
          })
        })
      );
      expect(result.summary).toBe('Anthropic summary');
      expect(result.cached).toBe(false);
    });

    it('should fallback to local when Anthropic API fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const mockResponse = {
        ok: false,
        text: jest.fn().mockResolvedValue('API Error')
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await summarizePost(1, '<p>Long content here. More content. Even more content. Final content.</p>');

      expect(result.summary).toBeTruthy();
    });

    it('should fallback to local when Anthropic API key is missing', async () => {
      delete process.env.SUMMARY_API_KEY;
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '<p>Long content here. More content. Even more content. Final content.</p>');

      expect(result.summary).toBeTruthy();
    });
  });

  describe('summarizePost with local provider', () => {
    beforeEach(() => {
      process.env.SUMMARY_PROVIDER = 'local';
    });

    it('should use local summarization', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(1, '<p>Long content here. More content. Even more content. Final content.</p>');

      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });
  });

  describe('summarizePost edge cases', () => {
    it('should handle very short content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(789, '<p>Hi</p>');

      expect(result.summary).toBe('Hi');
      expect(result.cached).toBe(false);
    });

    it('should handle content with less than 50 characters', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '<p>Short</p>');

      expect(result.summary).toBe('Short');
      expect(result.cached).toBe(false);
    });

    it('should handle empty HTML content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '');

      expect(result.summary).toBe('');
      expect(result.originalLength).toBe(0);
    });

    it('should handle HTML with only tags', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(1, '<p></p><div></div>');

      expect(result.summary).toBe('');
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
      
      ;(cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
      expect(cacheManager.invalidate).not.toHaveBeenCalledWith('other:key');
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
});
