import { smartPrefetchEngine, type PrefetchPrediction, type PrefetchResult } from '../src/lib/services/smartPrefetch';
import * as readingHistory from '../src/lib/utils/readingHistory';

jest.mock('../src/lib/utils/readingHistory');
jest.mock('../src/lib/wordpress');
jest.mock('../src/lib/cache', () => ({
  cacheManager: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
  },
  CACHE_TTL: {
    POSTS: 300000,
  },
  cacheKeys: {
    category: (id: string) => `category:${id}`,
    tag: (slug: string) => `tag:${slug}`,
    posts: (params?: string) => params ? `posts:${params}` : 'posts',
  },
}));

describe('SmartPrefetchEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('predictNextPages', () => {
    it('should return default predictions for empty history', async () => {
      (readingHistory.getReadingHistory as jest.Mock).mockReturnValue({
        items: [],
        categoryPreferences: new Map(),
        tagPreferences: new Map(),
      });
      (readingHistory.getTopCategories as jest.Mock).mockReturnValue([]);
      (readingHistory.getTopTags as jest.Mock).mockReturnValue([]);

      const predictions = await smartPrefetchEngine.predictNextPages();

      expect(predictions).toHaveLength(1);
      expect(predictions[0].targetUrl).toBe('/berita');
      expect(predictions[0].priority).toBe('low');
    });

    it('should predict based on category preferences', async () => {
      (readingHistory.getReadingHistory as jest.Mock).mockReturnValue({
        items: [
          { postId: 1, slug: 'post-1', title: 'Post 1', categoryIds: [5], tagIds: [1], timestamp: Date.now() },
          { postId: 2, slug: 'post-2', title: 'Post 2', categoryIds: [5], tagIds: [2], timestamp: Date.now() },
          { postId: 3, slug: 'post-3', title: 'Post 3', categoryIds: [5], tagIds: [1], timestamp: Date.now() },
        ],
        categoryPreferences: new Map([[5, 3], [6, 1]]),
        tagPreferences: new Map([[1, 2], [2, 1]]),
      });
      (readingHistory.getTopCategories as jest.Mock).mockReturnValue([5, 6]);
      (readingHistory.getTopTags as jest.Mock).mockReturnValue([1, 2]);

      const predictions = await smartPrefetchEngine.predictNextPages(3, 'post-3');

      const categoryPred = predictions.find(p => p.targetUrl === '/kategori/5');
      expect(categoryPred).toBeDefined();
      expect(categoryPred?.priority).toBe('high');
      expect(categoryPred?.confidence).toBeGreaterThan(0.5);
    });

    it('should predict based on tag preferences', async () => {
      (readingHistory.getReadingHistory as jest.Mock).mockReturnValue({
        items: [
          { postId: 1, slug: 'post-1', title: 'Post 1', categoryIds: [1], tagIds: [10], timestamp: Date.now() },
        ],
        categoryPreferences: new Map([[1, 1]]),
        tagPreferences: new Map([[10, 1], [11, 1]]),
      });
      (readingHistory.getTopCategories as jest.Mock).mockReturnValue([1]);
      (readingHistory.getTopTags as jest.Mock).mockReturnValue([10, 11]);

      const predictions = await smartPrefetchEngine.predictNextPages(1, 'post-1');

      const tagPred = predictions.find(p => p.targetUrl === '/tag/10');
      expect(tagPred).toBeDefined();
    });

    it('should limit predictions to MAX_PREFETCHES', async () => {
      (readingHistory.getReadingHistory as jest.Mock).mockReturnValue({
        items: [
          { postId: 1, slug: 'post-1', title: 'Post 1', categoryIds: [1], tagIds: [1], timestamp: Date.now() },
          { postId: 2, slug: 'post-2', title: 'Post 2', categoryIds: [2], tagIds: [2], timestamp: Date.now() },
          { postId: 3, slug: 'post-3', title: 'Post 3', categoryIds: [3], tagIds: [3], timestamp: Date.now() },
          { postId: 4, slug: 'post-4', title: 'Post 4', categoryIds: [4], tagIds: [4], timestamp: Date.now() },
          { postId: 5, slug: 'post-5', title: 'Post 5', categoryIds: [5], tagIds: [5], timestamp: Date.now() },
          { postId: 6, slug: 'post-6', title: 'Post 6', categoryIds: [6], tagIds: [6], timestamp: Date.now() },
        ],
        categoryPreferences: new Map([
          [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1]
        ]),
        tagPreferences: new Map([
          [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1]
        ]),
      });
      (readingHistory.getTopCategories as jest.Mock).mockReturnValue([1, 2, 3, 4, 5, 6]);
      (readingHistory.getTopTags as jest.Mock).mockReturnValue([1, 2, 3, 4, 5, 6]);

      const predictions = await smartPrefetchEngine.predictNextPages();

      expect(predictions.length).toBeLessThanOrEqual(5);
    });

    it('should deduplicate prediction URLs', async () => {
      (readingHistory.getReadingHistory as jest.Mock).mockReturnValue({
        items: [
          { postId: 1, slug: 'post-1', title: 'Post 1', categoryIds: [5], tagIds: [5], timestamp: Date.now() },
        ],
        categoryPreferences: new Map([[5, 1]]),
        tagPreferences: new Map([[5, 1]]),
      });
      (readingHistory.getTopCategories as jest.Mock).mockReturnValue([5]);
      (readingHistory.getTopTags as jest.Mock).mockReturnValue([5]);

      const predictions = await smartPrefetchEngine.predictNextPages();

      const urls = predictions.map(p => p.targetUrl);
      const uniqueUrls = new Set(urls);
      expect(urls.length).toBe(uniqueUrls.size);
    });
  });

  describe('getLastPredictions', () => {
    it('should return predictions after predictNextPages is called', async () => {
      (readingHistory.getReadingHistory as jest.Mock).mockReturnValue({
        items: [{ postId: 1, slug: 'post-1', title: 'Post 1', categoryIds: [1], tagIds: [1], timestamp: Date.now() }],
        categoryPreferences: new Map([[1, 1]]),
        tagPreferences: new Map(),
      });
      (readingHistory.getTopCategories as jest.Mock).mockReturnValue([1]);
      (readingHistory.getTopTags as jest.Mock).mockReturnValue([]);

      await smartPrefetchEngine.predictNextPages();
      const predictions = smartPrefetchEngine.getLastPredictions();

      expect(predictions.length).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    it('should return stats object', () => {
      const stats = smartPrefetchEngine.getStats();

      expect(stats).toHaveProperty('lastPredictionCount');
      expect(stats).toHaveProperty('predictions');
      expect(Array.isArray(stats.predictions)).toBe(true);
    });
  });

  describe('prefetchPredictedContent', () => {
    it('should return empty array for empty predictions', async () => {
      const results = await smartPrefetchEngine.prefetchPredictedContent([]);
      expect(results).toEqual([]);
    });

    it('should return results for valid predictions', async () => {
      const predictions: PrefetchPrediction[] = [
        { targetUrl: '/berita', priority: 'high', confidence: 0.8, reason: 'test' }
      ];
      const results = await smartPrefetchEngine.prefetchPredictedContent(predictions);
      expect(results).toHaveLength(1);
    });
  });

  describe('confidence threshold', () => {
    it('should exclude predictions below confidence threshold', async () => {
      (readingHistory.getReadingHistory as jest.Mock).mockReturnValue({
        items: [
          { postId: 1, slug: 'post-1', title: 'Post 1', categoryIds: [1], tagIds: [1], timestamp: Date.now() },
        ],
        categoryPreferences: new Map([[99, 1]]),
        tagPreferences: new Map([[99, 1]]),
      });
      (readingHistory.getTopCategories as jest.Mock).mockReturnValue([99]);
      (readingHistory.getTopTags as jest.Mock).mockReturnValue([99]);

      const predictions = await smartPrefetchEngine.predictNextPages();

      predictions.forEach(p => {
        expect(p.confidence).toBeGreaterThanOrEqual(0.3);
      });
    });
  });
});