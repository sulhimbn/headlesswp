import { popularityTracker, PopularityData } from '@/lib/predictor/popularityTracker';
import { cacheManager } from '@/lib/cache';

jest.mock('@/lib/cache');
jest.mock('@/lib/utils/logger');

describe('popularityTracker', () => {
  let mockCacheManager: jest.Mocked<typeof cacheManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheManager = cacheManager as jest.Mocked<typeof cacheManager>;
    mockCacheManager.get.mockReturnValue(null);
    mockCacheManager.set.mockReturnValue(undefined);
    mockCacheManager.delete.mockReturnValue(true);
    
    popularityTracker.clear();
  });

  describe('trackView()', () => {
    it('should track a new post view', () => {
      popularityTracker.trackView(1, 'test-post', [1, 2], [3, 4]);
      
      const data = popularityTracker.getPostPopularity(1);
      
      expect(data).not.toBeNull();
      expect(data?.postId).toBe(1);
      expect(data?.slug).toBe('test-post');
      expect(data?.viewCount).toBe(1);
      expect(data?.categories).toEqual([1, 2]);
      expect(data?.tags).toEqual([3, 4]);
    });

    it('should increment view count for existing post', () => {
      popularityTracker.trackView(1, 'test-post', [1], []);
      popularityTracker.trackView(1, 'test-post', [1], []);
      popularityTracker.trackView(1, 'test-post', [1], []);
      
      const data = popularityTracker.getPostPopularity(1);
      
      expect(data?.viewCount).toBe(3);
    });

    it('should update categories and tags on subsequent views', () => {
      popularityTracker.trackView(1, 'test-post', [1], []);
      popularityTracker.trackView(1, 'test-post', [1, 2], [3]);
      
      const data = popularityTracker.getPostPopularity(1);
      
      expect(data?.categories).toEqual([1, 2]);
      expect(data?.tags).toEqual([3]);
    });

    it('should update category affinity', () => {
      popularityTracker.trackView(1, 'post-1', [1], []);
      popularityTracker.trackView(2, 'post-2', [1], []);
      popularityTracker.trackView(3, 'post-3', [1], []);
      
      const affinity = popularityTracker.getCategoryAffinity(1);
      
      expect(affinity).not.toBeNull();
      expect(affinity?.totalViews).toBe(3);
      expect(affinity?.postsViewed).toBe(3);
    });

    it('should update tag affinity', () => {
      popularityTracker.trackView(1, 'post-1', [], [1]);
      popularityTracker.trackView(2, 'post-2', [], [1]);
      
      const affinity = popularityTracker.getTagAffinity(1);
      
      expect(affinity).not.toBeNull();
      expect(affinity?.totalViews).toBe(2);
      expect(affinity?.postsViewed).toBe(2);
    });
  });

  describe('getPostPopularity()', () => {
    it('should return null for non-tracked post', () => {
      const data = popularityTracker.getPostPopularity(999);
      
      expect(data).toBeNull();
    });

    it('should return popularity data for tracked post', () => {
      popularityTracker.trackView(1, 'test-post', [1], []);
      
      const data = popularityTracker.getPostPopularity(1);
      
      expect(data?.slug).toBe('test-post');
    });
  });

  describe('getPopularPosts()', () => {
    it('should return posts sorted by view count', () => {
      popularityTracker.trackView(1, 'post-1', [1], []);
      popularityTracker.trackView(1, 'post-1', [1], []);
      popularityTracker.trackView(2, 'post-2', [1], []);
      popularityTracker.trackView(3, 'post-3', [1], []);
      
      const popular = popularityTracker.getPopularPosts(2);
      
      expect(popular).toHaveLength(2);
      expect(popular[0].postId).toBe(1);
      expect(popular[1].postId).toBe(2);
    });

    it('should respect limit parameter', () => {
      for (let i = 1; i <= 10; i++) {
        popularityTracker.trackView(i, `post-${i}`, [], []);
      }
      
      const popular = popularityTracker.getPopularPosts(3);
      
      expect(popular).toHaveLength(3);
    });
  });

  describe('getPopularPostsByCategory()', () => {
    it('should filter posts by category', () => {
      popularityTracker.trackView(1, 'post-1', [1], []);
      popularityTracker.trackView(2, 'post-2', [2], []);
      popularityTracker.trackView(3, 'post-3', [1], []);
      
      const popular = popularityTracker.getPopularPostsByCategory(1);
      
      expect(popular).toHaveLength(2);
      expect(popular.every(p => p.categories.includes(1))).toBe(true);
    });
  });

  describe('isPopular()', () => {
    it('should return false for posts with less than 10 views', () => {
      for (let i = 0; i < 5; i++) {
        popularityTracker.trackView(1, 'post-1', [], []);
      }
      
      expect(popularityTracker.isPopular(1)).toBe(false);
    });

    it('should return true for posts with 10 or more views', () => {
      for (let i = 0; i < 10; i++) {
        popularityTracker.trackView(1, 'post-1', [], []);
      }
      
      expect(popularityTracker.isPopular(1)).toBe(true);
    });
  });

  describe('getScore()', () => {
    it('should return 0 for untracked posts', () => {
      const score = popularityTracker.getScore(999);
      
      expect(score).toBe(0);
    });

    it('should calculate score based on views and affinity', () => {
      popularityTracker.trackView(1, 'post-1', [1], [1]);
      for (let i = 0; i < 5; i++) {
        popularityTracker.trackView(1, 'post-1', [1], [1]);
      }
      popularityTracker.trackView(2, 'post-2', [1], []);
      
      const score = popularityTracker.getScore(1);
      
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('getTopCategories()', () => {
    it('should return categories sorted by total views', () => {
      popularityTracker.trackView(1, 'post-1', [1], []);
      popularityTracker.trackView(2, 'post-2', [1], []);
      popularityTracker.trackView(3, 'post-3', [1], []);
      popularityTracker.trackView(4, 'post-4', [2], []);
      
      const top = popularityTracker.getTopCategories(2);
      
      expect(top).toHaveLength(2);
      expect(top[0].categoryId).toBe(1);
    });
  });

  describe('getTopTags()', () => {
    it('should return tags sorted by total views', () => {
      popularityTracker.trackView(1, 'post-1', [], [1]);
      popularityTracker.trackView(2, 'post-2', [], [1]);
      popularityTracker.trackView(3, 'post-3', [], [2]);
      
      const top = popularityTracker.getTopTags(2);
      
      expect(top).toHaveLength(2);
      expect(top[0].tagId).toBe(1);
    });
  });

  describe('getStats()', () => {
    it('should return correct statistics', () => {
      popularityTracker.trackView(1, 'post-1', [1], [1]);
      popularityTracker.trackView(1, 'post-1', [1], [1]);
      popularityTracker.trackView(2, 'post-2', [2], []);
      
      const stats = popularityTracker.getStats();
      
      expect(stats.totalPosts).toBe(2);
      expect(stats.totalViews).toBe(3);
    });

    it('should count popular posts correctly', () => {
      for (let i = 0; i < 15; i++) {
        popularityTracker.trackView(1, 'post-1', [], []);
      }
      popularityTracker.trackView(2, 'post-2', [], []);
      
      const stats = popularityTracker.getStats();
      
      expect(stats.popularCount).toBe(1);
    });
  });

  describe('clear()', () => {
    it('should clear all tracked data', () => {
      popularityTracker.trackView(1, 'post-1', [1], []);
      
      popularityTracker.clear();
      
      expect(popularityTracker.getPostPopularity(1)).toBeNull();
      expect(mockCacheManager.delete).toHaveBeenCalled();
    });
  });

  describe('cache integration', () => {
    it('should load data from cache on initialization', () => {
      const cachedData = {
        posts: [[1, { postId: 1, slug: 'cached-post', viewCount: 5, lastViewed: Date.now(), categories: [1], tags: [] }]] as unknown as Map<number, PopularityData>,
        categoryAffinities: [[1, { categoryId: 1, totalViews: 5, postsViewed: 1 }]] as unknown as Map<number, { categoryId: number; totalViews: number; postsViewed: number }>,
        tagAffinities: new Map(),
      };
      
      mockCacheManager.get.mockReturnValue(cachedData);
      
      const tracker = new (require('@/lib/predictor/popularityTracker').popularityTracker.constructor)();
      
      expect(mockCacheManager.get).toHaveBeenCalled();
    });

    it('should save to cache after tracking', () => {
      popularityTracker.trackView(1, 'test-post', [], []);
      
      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });
});
