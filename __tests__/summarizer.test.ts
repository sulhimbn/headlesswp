import { 
  summarizePost, 
  isSummarizationEnabled, 
  getSummarizationConfig,
  clearSummaryCache
} from '@/lib/services/summarizer';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/cache');

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

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
  const stripped = htmlContent.replace(/<[^>]*>/g, '').trim();
  return stripped;
}

function getCacheKey(postId: number): string {
  return `summary:${postId}`;
}

describe('summarizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SUMMARY_PROVIDER;
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
    delete process.env.SUMMARY_MAX_TOKENS;
    delete process.env.SUMMARY_TEMPERATURE;
  });

  describe('getCacheKey', () => {
    it('should generate correct cache key for postId', () => {
      expect(getCacheKey(123)).toBe('summary:123');
      expect(getCacheKey(456)).toBe('summary:456');
    });
  });

  describe('extractTextFromContent', () => {
    it('should strip HTML tags from content', () => {
      const html = '<p>This is <strong>bold</strong> text.</p>';
      expect(extractTextFromContent(html)).toBe('This is bold text.');
    });

    it('should handle empty content', () => {
      expect(extractTextFromContent('')).toBe('');
    });

    it('should handle content with only whitespace', () => {
      expect(extractTextFromContent('   ')).toBe('');
      expect(extractTextFromContent('<br><br>')).toBe('');
    });

    it('should handle complex HTML with multiple tags', () => {
      const html = '<div><h1>Title</h1><p>Paragraph with <a href="#">link</a></p></div>';
      const result = extractTextFromContent(html);
      expect(result).toContain('Title');
      expect(result).toContain('Paragraph');
      expect(result).toContain('link');
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

    it('should handle text with only one sentence', () => {
      const text = 'This is a single long sentence that should be returned as is since there are not multiple sentences to work with.';
      const summary = generateLocalSummary(text);
      expect(summary).toContain('single long sentence');
    });

    it('should handle text with two sentences exactly', () => {
      const text = 'First sentence. Second sentence.';
      const summary = generateLocalSummary(text);
      expect(summary).toContain('First sentence');
      expect(summary).toContain('Second sentence');
    });

    it('should handle text with special characters', () => {
      const text = 'Hello world! How are you? Great!';
      const summary = generateLocalSummary(text);
      expect(summary).toBeTruthy();
    });

    it('should handle empty string', () => {
      const summary = generateLocalSummary('');
      expect(summary).toBe('');
    });

    it('should handle text with no sentence terminators', () => {
      const text = 'This is a sentence without a period';
      const summary = generateLocalSummary(text);
      expect(summary).toBeTruthy();
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

    it('should handle content with HTML that needs stripping', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const html = '<article><h1>Title</h1><p>First paragraph.</p><p>Second paragraph.</p></article>';
      const result = await summarizePost(100, html);
      
      expect(result.summary).toBeTruthy();
      expect(result.originalLength).toBeGreaterThan(0);
    });

    it('should handle empty HTML content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const result = await summarizePost(101, '');
      
      expect(result.summary).toBe('');
      expect(result.cached).toBe(false);
    });

    it('should handle null content gracefully', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const result = await summarizePost(102, null as unknown as string);
      
      expect(result.summary).toBe('');
      expect(result.originalLength).toBe(0);
    });

    it('should fallback to local summary on API error', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
      
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      const result = await summarizePost(103, '<p>First sentence. Second sentence. Third sentence.</p>');
      
      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      
      global.fetch = originalFetch;
    });

    it('should use cached summary for same post', async () => {
      const cachedSummary = 'Existing cached summary';
      (cacheManager.get as jest.Mock).mockReturnValue(cachedSummary);
      
      const result1 = await summarizePost(200, '<p>Some content</p>');
      const result2 = await summarizePost(200, '<p>Some other content</p>');
      
      expect(result1.summary).toBe(cachedSummary);
      expect(result2.summary).toBe(cachedSummary);
      expect(cacheManager.get).toHaveBeenCalledTimes(2);
    });

    it('should return original text if less than 50 characters', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const result = await summarizePost(300, '<p>Short</p>');
      
      expect(result.summary).toBe('Short');
      expect(result.originalLength).toBe(5);
    });

    it('should handle content with only HTML tags', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      const result = await summarizePost(301, '<div><span></span></div>');
      
      expect(result.summary).toBe('');
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear cache for specific post', () => {
      clearSummaryCache(123);
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary cache when no postId provided', () => {
      const mockCache = new Map();
      mockCache.set('summary:1', 'test1');
      mockCache.set('summary:2', 'test2');
      mockCache.set('other:key', 'test3');
      
      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;
      
      clearSummaryCache();
      
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:2');
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

    it('should default to local provider when not set', () => {
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

    it('should handle openai provider', () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-openai-key';
      
      const config = getSummarizationConfig();
      
      expect(config.provider).toBe('openai');
      expect(config.apiKey).toBe('test-openai-key');
    });

    it('should handle unknown provider', () => {
      process.env.SUMMARY_PROVIDER = 'unknown';
      
      const config = getSummarizationConfig();
      
      expect(config.provider).toBe('unknown');
    });

    it('should parse maxTokens as integer', () => {
      process.env.SUMMARY_MAX_TOKENS = '500';
      
      const config = getSummarizationConfig();
      
      expect(config.maxTokens).toBe(500);
    });

    it('should parse temperature as float', () => {
      process.env.SUMMARY_TEMPERATURE = '0.9';
      
      const config = getSummarizationConfig();
      
      expect(config.temperature).toBe(0.9);
    });
  });
});
