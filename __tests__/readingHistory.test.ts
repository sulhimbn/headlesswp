import {
  addToReadingHistory,
  getReadingHistory,
  getTopCategories,
  getTopTags,
  hasReadPost,
  trackRecommendationClick,
  getRecommendationClicks,
} from '@/lib/utils/readingHistory';
import { RECOMMENDATION_CONFIG } from '@/lib/api/config';

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

jest.mock('@/lib/api/config', () => ({
  RECOMMENDATION_CONFIG: {
    MAX_HISTORY_ITEMS: 3,
    MAX_RECOMMENDATIONS: 3,
  },
}));

describe('readingHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockReturnValue(undefined);
  });

  describe('addToReadingHistory', () => {
    it('should add new item to reading history', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: {},
        })
      );

      addToReadingHistory(1, 'post-1', 'Post 1', [1, 2], [10, 20]);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      expect(stored.items).toContainEqual(
        expect.objectContaining({
          postId: 1,
          slug: 'post-1',
          title: 'Post 1',
        })
      );
    });

    it('should move existing item to front', () => {
      const existingHistory = {
        items: [
          {
            postId: 1,
            slug: 'post-1',
            title: 'Post 1',
            categoryIds: [1],
            tagIds: [10],
            timestamp: Date.now() - 1000,
          },
        ],
        categoryPreferences: { 1: 1 },
        tagPreferences: { 10: 1 },
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingHistory));

      addToReadingHistory(1, 'post-1', 'Post 1 Updated', [1], [10]);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      expect(stored.items[0].title).toBe('Post 1 Updated');
      expect(stored.items.length).toBe(1);
    });

    it('should limit history items to MAX_HISTORY_ITEMS', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [
            { postId: 1, slug: 'p1', title: 'P1', categoryIds: [1], tagIds: [10], timestamp: 1000 },
            { postId: 2, slug: 'p2', title: 'P2', categoryIds: [2], tagIds: [20], timestamp: 2000 },
          ],
          categoryPreferences: { 1: 1, 2: 1 },
          tagPreferences: { 10: 1, 20: 1 },
        })
      );

      addToReadingHistory(3, 'p3', 'P3', [3], [30]);
      addToReadingHistory(4, 'p4', 'P4', [4], [40]);
      addToReadingHistory(5, 'p5', 'P5', [5], [50]);

      const setItemCall = mockLocalStorage.setItem.mock.calls[2];
      const stored = JSON.parse(setItemCall[1]);
      expect(stored.items.length).toBe(3);
    });

    it('should update category preferences', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { 1: 2 },
          tagPreferences: {},
        })
      );

      addToReadingHistory(1, 'post-1', 'Post 1', [1, 2], []);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      expect(stored.categoryPreferences['1']).toBe(3);
      expect(stored.categoryPreferences['2']).toBe(1);
    });

    it('should update tag preferences', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: { 10: 2 },
        })
      );

      addToReadingHistory(1, 'post-1', 'Post 1', [], [10, 20]);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      expect(stored.tagPreferences['10']).toBe(3);
      expect(stored.tagPreferences['20']).toBe(1);
    });

    it('should handle localStorage error gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        addToReadingHistory(1, 'post-1', 'Post 1', [], []);
      }).not.toThrow();
    });
  });

  describe('getReadingHistory', () => {
    it('should return empty history when no stored data', () => {
      const history = getReadingHistory();

      expect(history.items).toEqual([]);
      expect(history.categoryPreferences).toBeInstanceOf(Map);
      expect(history.tagPreferences).toBeInstanceOf(Map);
    });

    it('should parse stored history correctly', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [{ postId: 1, slug: 'p1', title: 'P1', categoryIds: [1], tagIds: [10], timestamp: 1000 }],
          categoryPreferences: { 1: 2 },
          tagPreferences: { 10: 1 },
        })
      );

      const history = getReadingHistory();

      expect(history.items).toHaveLength(1);
      expect(history.categoryPreferences.get(1)).toBe(2);
      expect(history.tagPreferences.get(10)).toBe(1);
    });

    it('should handle parse error gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Parse error');
      });

      const history = getReadingHistory();

      expect(history.items).toEqual([]);
    });
  });

  describe('getTopCategories', () => {
    it('should return top categories by preference count', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { 1: 5, 2: 3, 3: 8, 4: 1 },
          tagPreferences: {},
        })
      );

      const topCategories = getTopCategories(3);

      expect(topCategories).toEqual([3, 1, 2]);
    });

    it('should use default limit of 3', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { 1: 5, 2: 3, 3: 8, 4: 1, 5: 2, 6: 7 },
          tagPreferences: {},
        })
      );

      const topCategories = getTopCategories();

      expect(topCategories).toHaveLength(3);
    });

    it('should return empty array when no categories', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: {},
        })
      );

      const topCategories = getTopCategories();

      expect(topCategories).toEqual([]);
    });
  });

  describe('getTopTags', () => {
    it('should return top tags by preference count', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: { 10: 5, 20: 3, 30: 8, 40: 1 },
        })
      );

      const topTags = getTopTags(3);

      expect(topTags).toEqual([30, 10, 20]);
    });

    it('should use default limit of 5', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: { 10: 5, 20: 3, 30: 8, 40: 1, 50: 2, 60: 7, 70: 4, 80: 9 },
        })
      );

      const topTags = getTopTags();

      expect(topTags).toHaveLength(5);
    });

    it('should return empty array when no tags', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: {},
        })
      );

      const topTags = getTopTags();

      expect(topTags).toEqual([]);
    });
  });

  describe('hasReadPost', () => {
    it('should return true if post has been read', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [
            { postId: 1, slug: 'p1', title: 'P1', categoryIds: [], tagIds: [], timestamp: 1000 },
            { postId: 2, slug: 'p2', title: 'P2', categoryIds: [], tagIds: [], timestamp: 2000 },
          ],
          categoryPreferences: {},
          tagPreferences: {},
        })
      );

      expect(hasReadPost(1)).toBe(true);
      expect(hasReadPost(2)).toBe(true);
    });

    it('should return false if post has not been read', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [{ postId: 1, slug: 'p1', title: 'P1', categoryIds: [], tagIds: [], timestamp: 1000 }],
          categoryPreferences: {},
          tagPreferences: {},
        })
      );

      expect(hasReadPost(999)).toBe(false);
    });
  });

  describe('trackRecommendationClick', () => {
    it('should add click to recommendation clicks', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));

      trackRecommendationClick(123, 'related_posts');

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      expect(stored).toContainEqual(
        expect.objectContaining({
          postId: 123,
          source: 'related_posts',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should preserve existing clicks', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify([
          { postId: 1, source: 'homepage', timestamp: 1000 },
        ])
      );

      trackRecommendationClick(2, 'sidebar');

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      expect(stored).toHaveLength(2);
    });
  });

  describe('getRecommendationClicks', () => {
    it('should return empty array when no clicks stored', () => {
      const clicks = getRecommendationClicks();

      expect(clicks).toEqual([]);
    });

    it('should return stored clicks', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify([
          { postId: 1, source: 'homepage', timestamp: 1000 },
          { postId: 2, source: 'related', timestamp: 2000 },
        ])
      );

      const clicks = getRecommendationClicks();

      expect(clicks).toHaveLength(2);
      expect(clicks[0].postId).toBe(1);
      expect(clicks[1].postId).toBe(2);
    });
  });
});
