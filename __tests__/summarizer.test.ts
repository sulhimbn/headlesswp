import { 
  summarizePost, 
  isSummarizationEnabled, 
  getSummarizationConfig,
  generateLocalSummary,
  generateSummaryWithOpenAI,
  generateSummaryWithAnthropic,
  generateSummary,
  clearSummaryCache
} from '@/lib/services/summarizer';
import { stripHtml } from '@/lib/utils/stripHtml';
import { cacheManager } from '@/lib/cache';

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

  describe('generateSummaryWithOpenAI', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should throw error when API key is not configured', async () => {
      const { generateSummaryWithOpenAI } = await import('@/lib/services/summarizer');
      
      await expect(
        generateSummaryWithOpenAI('test text', { provider: 'openai' })
      ).rejects.toThrow('OpenAI API key not configured');
    });

    it('should call OpenAI API and return summary', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test summary from AI' } }]
        })
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const { generateSummaryWithOpenAI } = await import('@/lib/services/summarizer');
      
      const result = await generateSummaryWithOpenAI('test text', { 
        provider: 'openai', 
        apiKey: 'test-key',
        model: 'gpt-4',
        maxTokens: 100,
        temperature: 0.5
      });

      expect(result).toBe('Test summary from AI');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key'
          })
        })
      );
    });

    it('should throw error when API returns error status', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Internal Server Error')
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const { generateSummaryWithOpenAI } = await import('@/lib/services/summarizer');
      
      await expect(
        generateSummaryWithOpenAI('test text', { 
          provider: 'openai', 
          apiKey: 'test-key' 
        })
      ).rejects.toThrow('OpenAI API error: 500');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: []
        })
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const { generateSummaryWithOpenAI } = await import('@/lib/services/summarizer');
      
      const result = await generateSummaryWithOpenAI('test text', { 
        provider: 'openai', 
        apiKey: 'test-key' 
      });

      expect(result).toBe('');
    });
  });

  describe('generateSummaryWithAnthropic', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should throw error when API key is not configured', async () => {
      const { generateSummaryWithAnthropic } = await import('@/lib/services/summarizer');
      
      await expect(
        generateSummaryWithAnthropic('test text', { provider: 'anthropic' })
      ).rejects.toThrow('Anthropic API key not configured');
    });

    it('should call Anthropic API and return summary', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'Test summary from Claude' }]
        })
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const { generateSummaryWithAnthropic } = await import('@/lib/services/summarizer');
      
      const result = await generateSummaryWithAnthropic('test text', { 
        provider: 'anthropic', 
        apiKey: 'test-key',
        model: 'claude-3-sonnet',
        maxTokens: 100,
        temperature: 0.5
      });

      expect(result).toBe('Test summary from Claude');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'test-key',
            'anthropic-version': '2023-06-01'
          })
        })
      );
    });

    it('should throw error when API returns error status', async () => {
      const mockResponse = {
        ok: false,
        status: 429,
        text: jest.fn().mockResolvedValue('Rate limited')
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const { generateSummaryWithAnthropic } = await import('@/lib/services/summarizer');
      
      await expect(
        generateSummaryWithAnthropic('test text', { 
          provider: 'anthropic', 
          apiKey: 'test-key' 
        })
      ).rejects.toThrow('Anthropic API error: 429');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: []
        })
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const { generateSummaryWithAnthropic } = await import('@/lib/services/summarizer');
      
      const result = await generateSummaryWithAnthropic('test text', { 
        provider: 'anthropic', 
        apiKey: 'test-key' 
      });

      expect(result).toBe('');
    });
  });

  describe('generateSummary', () => {
    it('should route to OpenAI provider', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'OpenAI summary' } }]
        })
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await generateSummary('test text', { 
        provider: 'openai', 
        apiKey: 'test-key' 
      });

      expect(result).toBe('OpenAI summary');
    });

    it('should route to Anthropic provider', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'Test summary from Claude' }]
        })
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      const result = await generateSummary('test text', { 
        provider: 'anthropic', 
        apiKey: 'test-key' 
      });

      expect(result).toBe('Test summary from Claude');
    });

    it('should default to local provider for unknown provider', async () => {
      const result = await generateSummary('test text', { 
        provider: 'unknown' as any
      });

      expect(result).toBeTruthy();
    });
  });

  describe('summarizePost error handling', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      jest.clearAllMocks();
      (cacheManager.get as jest.Mock).mockReturnValue(null);
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('should fallback to local summary when OpenAI fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Server error')
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const result = await summarizePost(123, '<p>This is a test article. It has multiple sentences. More content here.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });
  });

  describe('clearSummaryCache', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should invalidate specific post summary cache', () => {
      clearSummaryCache(123);

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      const mockCache = new Map([
        ['summary:1', 'value1'],
        ['summary:2', 'value2'],
        ['other:key', 'value3']
      ]);
      
      (cacheManager as any).cache = mockCache;
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);

      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
      expect(cacheManager.invalidate).not.toHaveBeenCalledWith('other:key');
    });
  });
});
