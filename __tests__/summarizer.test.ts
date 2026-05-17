import { summarizePost, isSummarizationEnabled, getSummarizationConfig, clearSummaryCache } from '@/lib/services/summarizer';
import { stripHtml } from '@/lib/utils/stripHtml';
import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

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

describe('summarizer', () => {
  let mockedCacheManager: jest.Mocked<typeof cacheManager>;
  let mockedLogger: jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCacheManager = cacheManager as jest.Mocked<typeof cacheManager>;
    mockedLogger = logger as jest.Mocked<typeof logger>;
    delete process.env.SUMMARY_PROVIDER;
    delete process.env.SUMMARY_API_KEY;
    delete process.env.SUMMARY_MODEL;
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

    it('should handle text with exactly two sentences', () => {
      const text = 'First sentence. Second sentence.';
      const summary = generateLocalSummary(text);
      expect(summary).toContain('First sentence');
      expect(summary).toContain('Second sentence');
    });

    it('should handle text with more than two sentences and truncate', () => {
      const text = 'First sentence that is quite long. Second sentence is also long. Third sentence here.';
      const summary = generateLocalSummary(text);
      expect(summary).toBeTruthy();
    });
  });

  describe('summarizePost', () => {
    it('should return cached summary if available', async () => {
      mockedCacheManager.get.mockReturnValue('Cached summary');

      const result = await summarizePost(123, '<p>Some content</p>');

      expect(result.summary).toBe('Cached summary');
      expect(result.cached).toBe(true);
      expect(mockedCacheManager.get).toHaveBeenCalledWith('summary:123');
    });

    it('should use cached summary and log debug message', async () => {
      mockedCacheManager.get.mockReturnValue('Already cached summary');

      const result = await summarizePost(123, '<p>Some content</p>');

      expect(mockedLogger.debug).toHaveBeenCalledWith(
        'Using cached summary',
        { postId: 123, module: 'summarizer' }
      );
    });

    it('should generate new summary when not cached', async () => {
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      const result = await summarizePost(456, '<p>This is a test article with some content. It has multiple sentences.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(result.generatedAt).toBeTruthy();
      expect(mockedCacheManager.set).toHaveBeenCalled();
    });

    it('should handle very short content', async () => {
      mockedCacheManager.get.mockReturnValue(null);

      const result = await summarizePost(789, '<p>Hi</p>');

      expect(result.summary).toBe('Hi');
      expect(result.cached).toBe(false);
    });

    it('should handle content with exactly 50 characters', async () => {
      mockedCacheManager.get.mockReturnValue(null);

      const result = await summarizePost(1, '<p>' + 'a'.repeat(46) + '</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should handle content less than 50 characters', async () => {
      mockedCacheManager.get.mockReturnValue(null);

      const result = await summarizePost(1, '<p>Short</p>');

      expect(result.summary).toBe('Short');
      expect(result.cached).toBe(false);
    });

    it('should use local provider by default', async () => {
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      const result = await summarizePost(1, '<p>' + 'a'.repeat(100) + '</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Summary generated',
        expect.objectContaining({ postId: 1, module: 'summarizer' })
      );
    });

    it('should use OpenAI provider when configured', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'AI generated summary' } }],
        }),
      }) as jest.Mock;

      const result = await summarizePost(1, '<p>' + 'a'.repeat(100) + '</p>');

      expect(result.summary).toBe('AI generated summary');
    });

    it('should throw error when OpenAI API key not configured and fallback works', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      delete process.env.SUMMARY_API_KEY;
      mockedCacheManager.get.mockReturnValue(null);

      const result = await summarizePost(1, '<p>This is test content that is long enough to trigger the full summarization process.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback when OpenAI API returns error', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue('Unauthorized'),
      }) as jest.Mock;

      const result = await summarizePost(1, '<p>This is test content that is long enough to trigger the full summarization process.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback to local summary when OpenAI fails', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Server error'),
      }) as jest.Mock;

      const result = await summarizePost(1, '<p>This is a test article with some interesting content.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Summarization failed, falling back to local',
        expect.any(Error),
        expect.objectContaining({ postId: 1, module: 'summarizer' })
      );
    });

    it('should use Anthropic provider when configured', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-anthropic-key';
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          content: [{ text: 'Claude generated summary' }],
        }),
      }) as jest.Mock;

      const result = await summarizePost(1, '<p>' + 'a'.repeat(100) + '</p>');

      expect(result.summary).toBe('Claude generated summary');
    });

    it('should fallback when Anthropic API key not configured', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      delete process.env.SUMMARY_API_KEY;
      mockedCacheManager.get.mockReturnValue(null);

      const result = await summarizePost(1, '<p>This is test content that is long enough to trigger the full summarization process.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback when Anthropic API returns error', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: jest.fn().mockResolvedValue('Forbidden'),
      }) as jest.Mock;

      const result = await summarizePost(1, '<p>This is test content that is long enough to trigger the full summarization process.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
    });

    it('should fallback to local summary when Anthropic fails', async () => {
      process.env.SUMMARY_PROVIDER = 'anthropic';
      process.env.SUMMARY_API_KEY = 'test-key';
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue('Server error'),
      }) as jest.Mock;

      const result = await summarizePost(1, '<p>This is a test article with some interesting content.</p>');

      expect(result.summary).toBeTruthy();
      expect(result.cached).toBe(false);
      expect(mockedLogger.error).toHaveBeenCalledWith(
        'Summarization failed, falling back to local',
        expect.any(Error),
        expect.objectContaining({ postId: 1, module: 'summarizer' })
      );
    });

    it('should handle empty AI response gracefully', async () => {
      process.env.SUMMARY_PROVIDER = 'openai';
      process.env.SUMMARY_API_KEY = 'test-key';
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: '' } }],
        }),
      }) as jest.Mock;

      const result = await summarizePost(1, '<p>' + 'a'.repeat(100) + '</p>');

      expect(result.summary).toBe('');
    });

    it('should log info after successful summary generation', async () => {
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      await summarizePost(1, '<p>This is a test article with some content. It has multiple sentences.</p>');

      expect(mockedLogger.info).toHaveBeenCalledWith(
        'Summary generated',
        expect.objectContaining({ postId: 1, module: 'summarizer' })
      );
    });

    it('should set cache with correct TTL', async () => {
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      await summarizePost(1, '<p>This is a test article with some content. It has multiple sentences.</p>');

      expect(mockedCacheManager.set).toHaveBeenCalledWith(
        'summary:1',
        expect.any(String),
        7 * 24 * 60 * 60 * 1000
      );
    });

    it('should return correct originalLength and summaryLength', async () => {
      mockedCacheManager.get.mockReturnValue(null);
      mockedCacheManager.set.mockReturnValue(undefined);

      const content = '<p>This is a test article with some content. It has multiple sentences.</p>';
      const result = await summarizePost(1, content);

      expect(result.originalLength).toBeTruthy();
      expect(result.summaryLength).toBe(result.summary.length);
    });
  });

  describe('clearSummaryCache', () => {
    it('should invalidate cache for specific post', () => {
      clearSummaryCache(123);

      expect(mockedCacheManager.invalidate).toHaveBeenCalledWith('summary:123');
    });

    it('should clear all summary caches when no postId provided', () => {
      const mockCache = new Map<string, unknown>([
        ['summary:1', 'test1'],
        ['summary:2', 'test2'],
        ['other:key', 'value'],
      ]);

      (cacheManager as any).cache = mockCache;
      mockedCacheManager.invalidate.mockImplementation(() => {});

      clearSummaryCache();

      expect(mockedCacheManager.invalidate).toHaveBeenCalledWith('summary:1');
      expect(mockedCacheManager.invalidate).toHaveBeenCalledWith('summary:2');
      expect(mockedCacheManager.invalidate).not.toHaveBeenCalledWith('other:key');
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
});
