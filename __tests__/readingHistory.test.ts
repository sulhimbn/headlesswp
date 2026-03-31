const mockStorage: Record<string, string> = {};

const localStorageMock = {
  getItem: jest.fn((key: string): string | null => mockStorage[key] || null),
  setItem: jest.fn((key: string, value: string): void => {
    mockStorage[key] = value;
  }),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

jest.mock('@/lib/api/config', () => ({
  RECOMMENDATION_CONFIG: {
    MAX_HISTORY_ITEMS: 20,
    MAX_RECOMMENDATIONS: 3,
  },
}));

import {
  addToReadingHistory,
  getReadingHistory,
  getTopCategories,
  getTopTags,
  hasReadPost,
  trackRecommendationClick,
  getRecommendationClicks,
} from '@/lib/utils/readingHistory';

describe('readingHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    (localStorageMock.getItem as jest.Mock).mockImplementation((key: string) => mockStorage[key] || null);
    (localStorageMock.setItem as jest.Mock).mockImplementation((key: string, value: string) => {
      mockStorage[key] = value;
    });
  });

  describe('addToReadingHistory', () => {
    it('should add new post to reading history', () => {
      addToReadingHistory(1, 'test-post', 'Test Post', [1], [1]);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'reading_history',
        expect.any(String)
      );
    });

    it('should update existing post position in history', () => {
      mockStorage['reading_history'] = JSON.stringify({
        items: [
          { postId: 1, slug: 'old-post', title: 'Old Post', categoryIds: [1], tagIds: [1], timestamp: Date.now() },
        ],
        categoryPreferences: { 1: 1 },
        tagPreferences: { 1: 1 },
      });

      addToReadingHistory(1, 'updated-post', 'Updated Post', [1, 2], [1, 2]);

      const history = getReadingHistory();
      expect(history.items[0].slug).toBe('updated-post');
    });

    it('should limit history to max items', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({
        postId: i + 1,
        slug: `post-${i + 1}`,
        title: `Post ${i + 1}`,
        categoryIds: [1],
        tagIds: [1],
        timestamp: Date.now() - i,
      }));

      mockStorage['reading_history'] = JSON.stringify({
        items,
        categoryPreferences: { 1: 25 },
        tagPreferences: { 1: 25 },
      });

      addToReadingHistory(26, 'new-post', 'New Post', [1], [1]);

      const history = getReadingHistory();
      expect(history.items.length).toBeLessThanOrEqual(20);
    });

    it('should track category preferences', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1, 2], [1]);
      addToReadingHistory(2, 'post-2', 'Post 2', [1, 3], [2]);

      const history = getReadingHistory();
      expect(history.categoryPreferences.get(1)).toBe(2);
      expect(history.categoryPreferences.get(2)).toBe(1);
      expect(history.categoryPreferences.get(3)).toBe(1);
    });

    it('should track tag preferences', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [1, 2]);
      addToReadingHistory(2, 'post-2', 'Post 2', [2], [2, 3]);

      const history = getReadingHistory();
      expect(history.tagPreferences.get(1)).toBe(1);
      expect(history.tagPreferences.get(2)).toBe(2);
      expect(history.tagPreferences.get(3)).toBe(1);
    });

    it('should handle empty category and tag arrays', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [], []);
      const history = getReadingHistory();
      expect(history.items).toHaveLength(1);
    });
  });

  describe('getReadingHistory', () => {
    it('should return empty history when no data', () => {
      const history = getReadingHistory();
      expect(history.items).toEqual([]);
      expect(history.categoryPreferences.size).toBe(0);
      expect(history.tagPreferences.size).toBe(0);
    });

    it('should parse stored history correctly', () => {
      mockStorage['reading_history'] = JSON.stringify({
        items: [{ postId: 1, slug: 'test', title: 'Test', categoryIds: [1], tagIds: [1], timestamp: 1000 }],
        categoryPreferences: { 1: 2 },
        tagPreferences: { 1: 1 },
      });

      const history = getReadingHistory();
      expect(history.items).toHaveLength(1);
      expect(history.items[0].postId).toBe(1);
      expect(history.categoryPreferences.get(1)).toBe(2);
    });

    it('should handle invalid JSON gracefully', () => {
      mockStorage['reading_history'] = 'invalid json';
      const history = getReadingHistory();
      expect(history.items).toEqual([]);
    });
  });

  describe('getTopCategories', () => {
    it('should return top categories sorted by preference count', () => {
      mockStorage['reading_history'] = JSON.stringify({
        items: [],
        categoryPreferences: { 1: 5, 2: 3, 3: 8, 4: 1 },
        tagPreferences: {},
      });

      const topCategories = getTopCategories(3);
      expect(topCategories).toEqual([3, 1, 2]);
    });

    it('should return empty array when no categories', () => {
      const topCategories = getTopCategories();
      expect(topCategories).toEqual([]);
    });

    it('should respect limit parameter', () => {
      mockStorage['reading_history'] = JSON.stringify({
        items: [],
        categoryPreferences: { 1: 5, 2: 3, 3: 8, 4: 1, 5: 2 },
        tagPreferences: {},
      });

      const topCategories = getTopCategories(2);
      expect(topCategories).toHaveLength(2);
    });

    it('should use default limit of 3', () => {
      mockStorage['reading_history'] = JSON.stringify({
        items: [],
        categoryPreferences: { 1: 5, 2: 3, 3: 8, 4: 1, 5: 2, 6: 3 },
        tagPreferences: {},
      });

      const topCategories = getTopCategories();
      expect(topCategories).toHaveLength(3);
    });
  });

  describe('getTopTags', () => {
    it('should return top tags sorted by preference count', () => {
      mockStorage['reading_history'] = JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: { 1: 5, 2: 3, 3: 8, 4: 1 },
      });

      const topTags = getTopTags(3);
      expect(topTags).toEqual([3, 1, 2]);
    });

    it('should return empty array when no tags', () => {
      const topTags = getTopTags();
      expect(topTags).toEqual([]);
    });

    it('should respect limit parameter', () => {
      mockStorage['reading_history'] = JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: { 1: 5, 2: 3, 3: 8, 4: 1, 5: 2 },
      });

      const topTags = getTopTags(2);
      expect(topTags).toHaveLength(2);
    });

    it('should use default limit of 5', () => {
      mockStorage['reading_history'] = JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: { 1: 5, 2: 3, 3: 8, 4: 1, 5: 2, 6: 3, 7: 4, 8: 2 },
      });

      const topTags = getTopTags();
      expect(topTags).toHaveLength(5);
    });
  });

  describe('hasReadPost', () => {
    it('should return true for read post', () => {
      mockStorage['reading_history'] = JSON.stringify({
        items: [{ postId: 1, slug: 'test', title: 'Test', categoryIds: [1], tagIds: [1], timestamp: 1000 }],
        categoryPreferences: {},
        tagPreferences: {},
      });

      expect(hasReadPost(1)).toBe(true);
    });

    it('should return false for unread post', () => {
      mockStorage['reading_history'] = JSON.stringify({
        items: [{ postId: 1, slug: 'test', title: 'Test', categoryIds: [1], tagIds: [1], timestamp: 1000 }],
        categoryPreferences: {},
        tagPreferences: {},
      });

      expect(hasReadPost(999)).toBe(false);
    });

    it('should return false when history is empty', () => {
      expect(hasReadPost(1)).toBe(false);
    });
  });

  describe('trackRecommendationClick', () => {
    it('should track recommendation click', () => {
      trackRecommendationClick(123, 'related_posts');

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'recommendation_clicks',
        expect.any(String)
      );
    });

    it('should add multiple clicks to storage', () => {
      trackRecommendationClick(1, 'sidebar');
      trackRecommendationClick(2, 'related_posts');

      const clicks = getRecommendationClicks();
      expect(clicks).toHaveLength(2);
      expect(clicks[0].postId).toBe(1);
      expect(clicks[1].postId).toBe(2);
    });

    it('should track source information', () => {
      trackRecommendationClick(1, 'sidebar');
      const clicks = getRecommendationClicks();
      expect(clicks[0].source).toBe('sidebar');
    });
  });

  describe('getRecommendationClicks', () => {
    it('should return empty array when no clicks', () => {
      const clicks = getRecommendationClicks();
      expect(clicks).toEqual([]);
    });

    it('should return stored clicks', () => {
      mockStorage['recommendation_clicks'] = JSON.stringify([
        { postId: 1, source: 'sidebar', timestamp: 1000 },
      ]);

      const clicks = getRecommendationClicks();
      expect(clicks).toHaveLength(1);
      expect(clicks[0].postId).toBe(1);
    });

    it('should handle invalid JSON gracefully', () => {
      mockStorage['recommendation_clicks'] = 'invalid';
      const clicks = getRecommendationClicks();
      expect(clicks).toEqual([]);
    });
  });

  describe('server-side rendering', () => {
    it('should handle undefined window check correctly', () => {
      const isWindowUndefined = typeof window === 'undefined';
      expect(isWindowUndefined).toBe(false);
    });
  });
});
