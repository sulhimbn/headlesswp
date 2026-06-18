import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache, generateLocalSummary, extractTextFromContent } from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

describe('summarizer', () => {
  const originalFetch = global.fetch;
  
  beforeEach(() => {
    jest.clearAllMocks();
    delete (cacheManager as unknown as { cache?: Map<string, unknown> }).cache;
  });

  afterAll(() => {
    global.fetch = originalFetch;
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

  describe('generateLocalSummary edge cases', () => {
    it('should handle single sentence', () => {
      const text = 'Only one sentence here without punctuation';
      const summary = generateLocalSummary(text);
      expect(summary).toBe(text.substring(0, 600));
    });

    it('should handle two sentences', () => {
      const text = 'First sentence. Second sentence.';
      const summary = generateLocalSummary(text);
      expect(summary).toContain('First sentence');
    });

    it('should handle very long sentence', () => {
      const text = 'A'.repeat(500) + '.';
      const summary = generateLocalSummary(text);
      expect(summary.length).toBeLessThan(500 * 1.5);
    });
  });

  describe('OpenAI summarization', () => {
    it('should throw when no API key', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      delete process.env.SUMMARY_API_KEY;
      
      const { generateSummaryWithOpenAI } = await import('@/lib/services/summarizer');
      
      await expect(generateSummaryWithOpenAI('test text', { provider: 'openai' })).rejects.toThrow('OpenAI API key not configured');
    });

    it('should call OpenAI API correctly', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: 'AI summary' } }] }),
      });

      const { generateSummaryWithOpenAI } = await import('@/lib/services/summarizer');
      
      const result = await generateSummaryWithOpenAI('test text', { 
        provider: 'openai', 
        apiKey: 'test-key',
        model: 'gpt-4',
        maxTokens: 300,
        temperature: 0.5,
      });
      
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBe('AI summary');
    });

    it('should throw on API error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server error'),
      });

      const { generateSummaryWithOpenAI } = await import('@/lib/services/summarizer');
      
      await expect(generateSummaryWithOpenAI('test text', { 
        provider: 'openai', 
        apiKey: 'test-key',
      })).rejects.toThrow('OpenAI API error: 500');
    });
  });

  describe('Anthropic summarization', () => {
    it('should throw when no API key', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      delete process.env.SUMMARY_API_KEY;
      
      const { generateSummaryWithAnthropic } = await import('@/lib/services/summarizer');
      
      await expect(generateSummaryWithAnthropic('test text', { provider: 'anthropic' })).rejects.toThrow('Anthropic API key not configured');
    });

    it('should call Anthropic API correctly', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ content: [{ text: 'Claude summary' }] }),
      });

      const { generateSummaryWithAnthropic } = await import('@/lib/services/summarizer');
      
      const result = await generateSummaryWithAnthropic('test text', { 
        provider: 'anthropic', 
        apiKey: 'test-key',
        model: 'claude-3-sonnet',
        maxTokens: 300,
        temperature: 0.5,
      });
      
      expect(global.fetch).toHaveBeenCalled();
      expect(result).toBe('Claude summary');
    });

    it('should throw on API error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: () => Promise.resolve('Rate limited'),
      });

      const { generateSummaryWithAnthropic } = await import('@/lib/services/summarizer');
      
      await expect(generateSummaryWithAnthropic('test text', { 
        provider: 'anthropic', 
        apiKey: 'test-key',
      })).rejects.toThrow('Anthropic API error: 429');
    });
  });

  describe('summarizePost fallback', () => {
    it('should fallback to local on API error', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await summarizePost(123, '<p>Some content here. More content. And even more content to ensure sufficient length.</p>');
      
      expect(result.cached).toBe(false);
      expect(result.summary).toBeTruthy();
      expect(logger.error).toHaveBeenCalledWith(
        'Summarization failed, falling back to local',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear specific post cache', () => {
      const mockCache = new Map<string, unknown>();
      mockCache.set('summary:123', 'test summary');
      mockCache.set('summary:456', 'another summary');
      
      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;
      
      clearSummaryCache(123);
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
      expect(cacheManager.invalidate).not.toHaveBeenCalledWith('summary:456');
    });

    it('should clear all summary caches when no postId provided', () => {
      const mockCache = new Map<string, unknown>();
      mockCache.set('summary:123', 'test summary');
      mockCache.set('summary:456', 'another summary');
      mockCache.set('other:key', 'not a summary');
      
      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;
      
      clearSummaryCache();
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:456');
    });
  });
});
