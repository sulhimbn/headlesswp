import { contentPredictor } from '@/lib/predictor/contentPredictor';
import { popularityTracker } from '@/lib/predictor/popularityTracker';
import { wordpressAPI } from '@/lib/wordpress';
import { cacheManager } from '@/lib/cache';

jest.mock('@/lib/predictor/popularityTracker');
jest.mock('@/lib/wordpress');
jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

describe('contentPredictor', () => {
  let mockedWordpressAPI: jest.Mocked<typeof wordpressAPI>;
  let mockedCacheManager: jest.Mocked<typeof cacheManager>;
  let mockedPopularityTracker: jest.Mocked<typeof popularityTracker>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedWordpressAPI = wordpressAPI as jest.Mocked<typeof wordpressAPI>;
    mockedCacheManager = cacheManager as jest.Mocked<typeof cacheManager>;
    mockedPopularityTracker = popularityTracker as jest.Mocked<typeof popularityTracker>;
    
    contentPredictor.clearCache();
  });

  describe('getPrefetchCandidates()', () => {
    it('should return empty array when no popular posts', () => {
      mockedPopularityTracker.getPopularPosts.mockReturnValue([]);
      mockedPopularityTracker.getPopularPostsByCategory.mockReturnValue([]);
      mockedPopularityTracker.getTagAffinity.mockReturnValue(null);
      mockedPopularityTracker.getScore.mockReturnValue(0);
      
      const candidates = contentPredictor.getPrefetchCandidates([1], [1], 'current-post');
      
      expect(candidates).toEqual([]);
    });

    it('should return candidates based on popular posts', () => {
      mockedPopularityTracker.getPopularPosts.mockReturnValue([
        { postId: 1, slug: 'popular-1', viewCount: 100, lastViewed: Date.now(), categories: [], tags: [] },
        { postId: 2, slug: 'popular-2', viewCount: 50, lastViewed: Date.now(), categories: [], tags: [] },
      ]);
      mockedPopularityTracker.getPopularPostsByCategory.mockReturnValue([]);
      mockedPopularityTracker.getTagAffinity.mockReturnValue(null);
      mockedPopularityTracker.getScore.mockReturnValue(3);
      
      const candidates = contentPredictor.getPrefetchCandidates([1], [1], 'current-post');
      
      expect(candidates.length).toBeGreaterThan(0);
    });

    it('should exclude current post from candidates', () => {
      mockedPopularityTracker.getPopularPosts.mockReturnValue([
        { postId: 1, slug: 'current-post', viewCount: 100, lastViewed: Date.now(), categories: [1], tags: [1] },
        { postId: 2, slug: 'other-post', viewCount: 50, lastViewed: Date.now(), categories: [1], tags: [] },
      ]);
      mockedPopularityTracker.getPopularPostsByCategory.mockReturnValue([]);
      mockedPopularityTracker.getTagAffinity.mockReturnValue(null);
      mockedPopularityTracker.getScore.mockReturnValue(3);
      
      const candidates = contentPredictor.getPrefetchCandidates([1], [1], 'current-post');
      
      expect(candidates.every(c => c.slug !== 'current-post')).toBe(true);
    });

    it('should assign high priority to high-scoring posts', () => {
      mockedPopularityTracker.getPopularPosts.mockReturnValue([
        { postId: 1, slug: 'high-score', viewCount: 100, lastViewed: Date.now(), categories: [], tags: [] },
      ]);
      mockedPopularityTracker.getPopularPostsByCategory.mockReturnValue([]);
      mockedPopularityTracker.getTagAffinity.mockReturnValue(null);
      mockedPopularityTracker.getScore.mockReturnValue(5);
      
      const candidates = contentPredictor.getPrefetchCandidates([], [], 'current');
      
      expect(candidates[0]?.priority).toBe('high');
    });

    it('should assign medium priority to medium-scoring posts', () => {
      mockedPopularityTracker.getPopularPosts.mockReturnValue([
        { postId: 1, slug: 'medium-score', viewCount: 20, lastViewed: Date.now(), categories: [], tags: [] },
      ]);
      mockedPopularityTracker.getPopularPostsByCategory.mockReturnValue([]);
      mockedPopularityTracker.getTagAffinity.mockReturnValue(null);
      mockedPopularityTracker.getScore.mockReturnValue(2);
      
      const candidates = contentPredictor.getPrefetchCandidates([], [], 'current');
      
      expect(candidates[0]?.priority).toBe('medium');
    });

    it('should assign low priority to low-scoring posts', () => {
      mockedPopularityTracker.getPopularPosts.mockReturnValue([
        { postId: 1, slug: 'low-score', viewCount: 5, lastViewed: Date.now(), categories: [], tags: [] },
      ]);
      mockedPopularityTracker.getPopularPostsByCategory.mockReturnValue([]);
      mockedPopularityTracker.getTagAffinity.mockReturnValue(null);
      mockedPopularityTracker.getScore.mockReturnValue(0.8);
      
      const candidates = contentPredictor.getPrefetchCandidates([], [], 'current');
      
      expect(candidates[0]?.priority).toBe('low');
    });

    it('should filter out candidates below threshold', () => {
      mockedPopularityTracker.getPopularPosts.mockReturnValue([
        { postId: 1, slug: 'below-threshold', viewCount: 1, lastViewed: Date.now(), categories: [], tags: [] },
      ]);
      mockedPopularityTracker.getPopularPostsByCategory.mockReturnValue([]);
      mockedPopularityTracker.getTagAffinity.mockReturnValue(null);
      mockedPopularityTracker.getScore.mockReturnValue(0.3);
      
      const candidates = contentPredictor.getPrefetchCandidates([], [], 'current');
      
      expect(candidates).toEqual([]);
    });
  });

  describe('getPopularPostsFromCache()', () => {
    it('should return popular posts from tracker', () => {
      mockedPopularityTracker.getPopularPosts.mockReturnValue([
        { postId: 1, slug: 'post-1', viewCount: 100, lastViewed: Date.now(), categories: [], tags: [] },
        { postId: 2, slug: 'post-2', viewCount: 50, lastViewed: Date.now(), categories: [], tags: [] },
      ]);
      mockedPopularityTracker.getScore.mockReturnValue(5);
      
      const posts = contentPredictor.getPopularPostsFromCache();
      
      expect(posts).toHaveLength(2);
      expect(posts[0].reason).toBe('popular');
    });

    it('should respect limit parameter', () => {
      mockedPopularityTracker.getPopularPosts.mockImplementation((limit?: number) => {
        const allPosts = [
          { postId: 1, slug: 'post-1', viewCount: 100, lastViewed: Date.now(), categories: [], tags: [] },
          { postId: 2, slug: 'post-2', viewCount: 50, lastViewed: Date.now(), categories: [], tags: [] },
          { postId: 3, slug: 'post-3', viewCount: 25, lastViewed: Date.now(), categories: [], tags: [] },
        ];
        return allPosts.slice(0, limit);
      });
      mockedPopularityTracker.getScore.mockReturnValue(5);
      
      const posts = contentPredictor.getPopularPostsFromCache(2);
      
      expect(posts).toHaveLength(2);
    });
  });

  describe('clearCache()', () => {
    it('should clear prediction cache', () => {
      contentPredictor.clearCache();
      
      expect(mockedPopularityTracker.clear).not.toHaveBeenCalled();
    });
  });

  describe('prefetchPredictedPosts()', () => {
    it('should prefetch high priority posts immediately', async () => {
      mockedCacheManager.get.mockReturnValue(null);
      mockedWordpressAPI.getPost.mockResolvedValue({ id: 1, title: { rendered: 'Test' }, content: { rendered: '' }, excerpt: { rendered: '' }, slug: 'test', date: '', modified: '', author: 1, featured_media: 0, categories: [], tags: [], status: 'publish', type: 'post', link: '' } as any);
      mockedCacheManager.set.mockReturnValue(undefined);
      
      const candidates = [
        { postId: 1, slug: 'test-post', url: '/berita/test-post', priority: 'high' as const, score: 5 },
      ];
      
      await contentPredictor.prefetchPredictedPosts(candidates);
      
      expect(mockedWordpressAPI.getPost).toHaveBeenCalledWith('test-post');
      expect(mockedCacheManager.set).toHaveBeenCalled();
    });

    it('should not prefetch already cached posts', async () => {
      mockedCacheManager.get.mockReturnValue({ id: 1 } as any);
      
      const candidates = [
        { postId: 1, slug: 'cached-post', url: '/berita/cached-post', priority: 'high' as const, score: 5 },
      ];
      
      await contentPredictor.prefetchPredictedPosts(candidates);
      
      expect(mockedWordpressAPI.getPost).not.toHaveBeenCalled();
    });

    it('should handle prefetch errors gracefully', async () => {
      mockedCacheManager.get.mockReturnValue(null);
      mockedWordpressAPI.getPost.mockRejectedValue(new Error('Network error'));
      
      const candidates = [
        { postId: 1, slug: 'fail-post', url: '/berita/fail-post', priority: 'high' as const, score: 5 },
      ];
      
      await expect(contentPredictor.prefetchPredictedPosts(candidates)).resolves.not.toThrow();
    });
  });

  describe('predictNextPosts()', () => {
    it('should return cached predictions when available', async () => {
      const cachedPredictions = [
        { postId: 1, slug: 'cached-prediction', score: 5, reason: 'popular' as const },
      ];
      
      const predictor = contentPredictor as any;
      predictor.predictionCache.set('predictions:slug:1:1', { 
        predictions: cachedPredictions, 
        timestamp: Date.now() 
      });
      
      const result = await contentPredictor.predictNextPosts('slug', [1], [1]);
      
      expect(result).toEqual(cachedPredictions);
      expect(mockedWordpressAPI.getPosts).not.toHaveBeenCalled();
    });
  });
});
