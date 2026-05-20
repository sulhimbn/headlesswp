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

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('readingHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('addToReadingHistory', () => {
    it('should add a new post to reading history', () => {
      addToReadingHistory(1, 'test-post-1', 'Test Post 1', [1], [10]);

      const history = getReadingHistory();
      expect(history.items).toHaveLength(1);
      expect(history.items[0].postId).toBe(1);
      expect(history.items[0].slug).toBe('test-post-1');
      expect(history.items[0].title).toBe('Test Post 1');
    });

    it('should update existing post position in history', () => {
      addToReadingHistory(1, 'test-post-1', 'Test Post 1', [1], [10]);
      addToReadingHistory(2, 'test-post-2', 'Test Post 2', [2], [20]);
      addToReadingHistory(1, 'test-post-1', 'Test Post 1', [1], [10]); // Add again

      const history = getReadingHistory();
      expect(history.items).toHaveLength(2);
      expect(history.items[0].postId).toBe(1); // Should be first now
    });

    it('should track category preferences', () => {
      addToReadingHistory(1, 'test-post-1', 'Test Post 1', [1, 2], [10]);
      addToReadingHistory(2, 'test-post-2', 'Test Post 2', [1], [20]);

      const history = getReadingHistory();
      expect(history.categoryPreferences.get(1)).toBe(2); // Category 1 was read twice
      expect(history.categoryPreferences.get(2)).toBe(1);
    });

    it('should track tag preferences', () => {
      addToReadingHistory(1, 'test-post-1', 'Test Post 1', [1], [10, 20]);
      addToReadingHistory(2, 'test-post-2', 'Test Post 2', [2], [10]);

      const history = getReadingHistory();
      expect(history.tagPreferences.get(10)).toBe(2); // Tag 10 was in both posts
      expect(history.tagPreferences.get(20)).toBe(1);
    });

    it('should limit history items to MAX_HISTORY_ITEMS', () => {
      // Add more items than MAX_HISTORY_ITEMS
      for (let i = 0; i <= RECOMMENDATION_CONFIG.MAX_HISTORY_ITEMS + 5; i++) {
        addToReadingHistory(i, `post-${i}`, `Post ${i}`, [1], [10]);
      }

      const history = getReadingHistory();
      expect(history.items).toHaveLength(RECOMMENDATION_CONFIG.MAX_HISTORY_ITEMS);
    });
  });

  describe('getTopCategories', () => {
    it('should return top categories by preference count', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10]);
      addToReadingHistory(2, 'post-2', 'Post 2', [1], [20]);
      addToReadingHistory(3, 'post-3', 'Post 3', [2], [30]);
      addToReadingHistory(4, 'post-4', 'Post 4', [2], [40]);
      addToReadingHistory(5, 'post-5', 'Post 5', [2], [50]);
      addToReadingHistory(6, 'post-6', 'Post 6', [3], [60]);

      const topCategories = getTopCategories(3);
      expect(topCategories).toEqual([2, 1, 3]); // Category 2 has 3 reads, 1 has 2, 3 has 1
    });

    it('should return empty array when no history', () => {
      const topCategories = getTopCategories();
      expect(topCategories).toEqual([]);
    });

    it('should respect limit parameter', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10]);
      addToReadingHistory(2, 'post-2', 'Post 2', [2], [20]);
      addToReadingHistory(3, 'post-3', 'Post 3', [3], [30]);

      const topCategories = getTopCategories(1);
      expect(topCategories).toHaveLength(1);
    });
  });

  describe('getTopTags', () => {
    it('should return top tags by preference count', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10, 20]);
      addToReadingHistory(2, 'post-2', 'Post 2', [2], [10]);
      addToReadingHistory(3, 'post-3', 'Post 3', [3], [10, 20, 30]);

      const topTags = getTopTags(3);
      expect(topTags).toContain(10); // Read 3 times
      expect(topTags).toContain(20); // Read 2 times
      expect(topTags).toContain(30); // Read 1 time
    });

    it('should return empty array when no history', () => {
      const topTags = getTopTags();
      expect(topTags).toEqual([]);
    });
  });

  describe('hasReadPost', () => {
    it('should return true for read post', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10]);

      expect(hasReadPost(1)).toBe(true);
    });

    it('should return false for unread post', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10]);

      expect(hasReadPost(999)).toBe(false);
    });

    it('should return false when history is empty', () => {
      expect(hasReadPost(1)).toBe(false);
    });
  });

  describe('trackRecommendationClick', () => {
    it('should track recommendation clicks', () => {
      trackRecommendationClick(123, 'homepage');

      const clicks = getRecommendationClicks();
      expect(clicks).toHaveLength(1);
      expect(clicks[0].postId).toBe(123);
      expect(clicks[0].source).toBe('homepage');
      expect(clicks[0].timestamp).toBeDefined();
    });

    it('should track multiple clicks', () => {
      trackRecommendationClick(1, 'sidebar');
      trackRecommendationClick(2, 'homepage');

      const clicks = getRecommendationClicks();
      expect(clicks).toHaveLength(2);
    });

    it('should return empty array when no clicks tracked', () => {
      const clicks = getRecommendationClicks();
      expect(clicks).toEqual([]);
    });
  });

  describe('getRecommendationClicks', () => {
    it('should return all tracked clicks', () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockImplementation(() => now);
      
      trackRecommendationClick(1, 'test');
      
      const clicks = getRecommendationClicks();
      expect(clicks[0].timestamp).toBe(now);
    });
  });
});
