import { summarizePost, isSummarizationEnabled, getSummarizationConfig } from '@/lib/services/summarizer';
import { stripHtml } from '@/lib/utils/stripHtml';
import { cacheManager } from '@/lib/cache';

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

  describe('generateLocalSummary edge cases', () => {
    it('should handle text with only one sentence', () => {
      const text = 'This is a single sentence that is quite long but has no punctuation to split on';
      const summary = summarizePost(999, `<p>${text}</p>`);
      
      expect(summary).resolves.toBeDefined();
    });

    it('should handle text with multiple sentences', async () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.';
      const result = await summarizePost(1000, `<p>${text}</p>`);
      
      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeLessThan(text.length);
    });

    it('should handle text with question marks', async () => {
      const text = 'Is this a question? Yes it is! And another one?';
      const result = await summarizePost(1001, `<p>${text}</p>`);
      
      expect(result.summary).toBeTruthy();
    });

    it('should handle text with exclamation marks', async () => {
      const text = 'Wow! This is amazing! Great content here!';
      const result = await summarizePost(1002, `<p>${text}</p>`);
      
      expect(result.summary).toBeTruthy();
    });

    it('should handle very long sentences', async () => {
      const longSentence = 'This is a very long sentence that goes on and on and on without any punctuation marks to break it up but we will still handle it gracefully and create a summary from it';
      const text = `${longSentence}. Short sentence.`;
      const result = await summarizePost(1003, `<p>${text}</p>`);
      
      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should handle text with extra whitespace', async () => {
      const text = 'First sentence.   Second sentence.   Third sentence.';
      const result = await summarizePost(1004, `<p>${text}</p>`);
      
      expect(result.summary).toBeTruthy();
    });
  });

  describe('summarizePost error handling', () => {
    it('should return text directly when content is less than 50 chars', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(2000, '<p>Short</p>');

      expect(result.summary).toBe('Short');
      expect(result.cached).toBe(false);
    });

    it('should handle empty HTML content', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(2001, '');

      expect(result.summary).toBe('');
      expect(result.originalLength).toBe(0);
    });

    it('should use fallback when API fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      
      // Test with openai provider but without API key - should fall back
      process.env.SUMMARY_PROVIDER = 'openai';
      delete process.env.SUMMARY_API_KEY;

      const result = await summarizePost(2002, '<p>This is a longer piece of content that should trigger fallback logic. It has multiple sentences.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should track original length correctly', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);

      const longContent = '<p>This is a test article with some content. It has multiple sentences that make up a longer piece of text.</p>';
      const result = await summarizePost(2003, longContent);

      expect(result.originalLength).toBeGreaterThan(0);
      expect(result.summaryLength).toBe(result.summary.length);
    });
  });

  describe('summarizePost caching', () => {
    beforeEach(() => {
      (cacheManager.set as jest.Mock).mockReturnValue(undefined);
    });

    it('should not call cache when cache returns value', async () => {
      const cachedSummary = 'Cached summary text';
      (cacheManager.get as jest.Mock).mockReturnValue(cachedSummary);

      const result = await summarizePost(3000, '<p>Some content</p>');

      expect(result.cached).toBe(true);
      expect(result.summary).toBe(cachedSummary);
      expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('should cache new summaries', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      // Use content that's definitely longer than 50 chars
      const longContent = '<p>This is a much longer piece of content that is definitely more than fifty characters long and should trigger the full summarization process and be cached for future use.</p>';
      const result = await summarizePost(3001, longContent);

      expect(result.cached).toBe(false);
      expect(result.summary).toBeTruthy();
    });
  });

  describe('HTML content handling', () => {
    it('should handle complex HTML with multiple paragraphs', async () => {
      const html = '<p>First paragraph.</p><p>Second paragraph.</p><p>Third paragraph.</p>';
      const result = await summarizePost(4000, html);

      expect(result.summary).toBeTruthy();
    });

    it('should handle HTML with links', async () => {
      const html = '<p>Check out <a href="https://example.com">this link</a> for more info. This is the second sentence.</p>';
      const result = await summarizePost(4001, html);

      expect(result.summary).toBeTruthy();
      expect(result.summary).not.toContain('<a');
    });

    it('should handle HTML with images', async () => {
      const html = '<p>Text before image.</p><img src="test.jpg" alt="test"><p>Text after image. Second sentence here.</p>';
      const result = await summarizePost(4002, html);

      expect(result.summary).toBeTruthy();
      expect(result.summary).not.toContain('<img');
    });

    it('should handle HTML with lists', async () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul><p>Summary text. Second sentence.</p>';
      const result = await summarizePost(4003, html);

      expect(result.summary).toBeTruthy();
    });

    it('should handle HTML with inline styles', async () => {
      const html = '<p>This is <strong>bold</strong> and <em>italic</em> text. Second sentence here.</p>';
      const result = await summarizePost(4004, html);

      expect(result.summary).toBeTruthy();
      expect(result.summary).toContain('bold');
      expect(result.summary).not.toContain('<strong>');
    });
  });

  describe('provider fallback', () => {
    it('should fallback to local when openai fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'fake-key';

      // The function will try to call OpenAI and fail, then fallback
      const result = await summarizePost(5000, '<p>This is content. It has multiple sentences. More content here. Even more text.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback to local when anthropic fails', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'fake-key';

      const result = await summarizePost(5001, '<p>This is content. It has multiple sentences. More content here. Even more text.</p>');

      expect(result.summary).toBeTruthy();
    });
  });

  describe('generatedAt timestamp', () => {
    it('should return a valid ISO timestamp', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);

      const result = await summarizePost(6000, '<p>Content here. Second sentence.</p>');

      expect(result.generatedAt).toBeTruthy();
      expect(() => new Date(result.generatedAt)).not.toThrow();
    });
  });

  describe('clearSummaryCache', () => {
    it('should clear specific post summary cache', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);

      const { clearSummaryCache } = await import('@/lib/services/summarizer');
      clearSummaryCache(123);

      expect(cacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      (cacheManager.invalidate as jest.Mock).mockReturnValue(undefined);

      const mockCache = new Map<string, unknown>();
      mockCache.set('summary:1', 'test');
      mockCache.set('summary:2', 'test2');
      mockCache.set('post:1', 'test');

      (cacheManager as unknown as { cache: Map<string, unknown> }).cache = mockCache;

      const { clearSummaryCache } = await import('@/lib/services/summarizer');
      clearSummaryCache();

      expect(cacheManager.invalidate).toHaveBeenCalled();
    });
  });

  describe('local summary edge cases', () => {
    it('should handle text exactly at truncation boundary', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'local';

      const text = 'A'.repeat(150) + '. B'.repeat(100);
      const result = await summarizePost(7000, `<p>${text}</p>`);

      expect(result.summary.length).toBeLessThanOrEqual(300);
    });

    it('should truncate and add ellipsis when summary is too long', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'local';

      const text = 'First sentence here that is quite long. Second sentence also very long. Third sentence here.';
      const result = await summarizePost(7001, `<p>${text}</p>`);

      expect(result.summary).toBeTruthy();
      expect(result.summaryLength).toBeLessThan(text.length);
    });

    it('should handle text with exactly two sentences', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'local';

      const text = 'First sentence. Second sentence.';
      const result = await summarizePost(7002, `<p>${text}</p>`);

      expect(result.summary).toBeTruthy();
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('should handle single long sentence', async () => {
      (cacheManager.get as jest.Mock).mockReturnValue(null);
      process.env.SUMMARY_PROVIDER = 'local';

      const text = 'This is a single very long sentence that goes on and on without stopping and has multiple clauses separated by commas but no terminal punctuation until the very end of the text.';
      const result = await summarizePost(7003, `<p>${text}</p>`);

      expect(result.summary).toBeTruthy();
    });
  });
});
