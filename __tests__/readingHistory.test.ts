import { addToReadingHistory, getReadingHistory, getTopCategories, getTopTags, hasReadPost, trackRecommendationClick, getRecommendationClicks } from '@/lib/utils/readingHistory';
import { RECOMMENDATION_CONFIG } from '@/lib/api/config';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((i: number) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

jest.mock('@/lib/api/config', () => ({
  RECOMMENDATION_CONFIG: {
    MAX_HISTORY_ITEMS: 10,
  },
}));

describe('readingHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    (localStorageMock.getItem as jest.Mock).mockReturnValue(null);
  });

  describe('addToReadingHistory', () => {
    it('should add a new post to reading history', () => {
      addToReadingHistory(1, 'post-1', 'Post Title 1', [1, 2], [10, 20]);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'reading_history',
        expect.stringContaining('"postId":1')
      );
    });

    it('should update existing post position in history', () => {
      localStorageMock.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          items: [{ postId: 1, slug: 'post-1', title: 'Old Title', categoryIds: [1], tagIds: [10], timestamp: 1000 }],
          categoryPreferences: { 1: 1 },
          tagPreferences: { 10: 1 },
        })
      );

      addToReadingHistory(1, 'post-1', 'New Title', [1], [10]);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'reading_history',
        expect.stringContaining('"postId":1')
      );
    });

    it('should limit history to MAX_HISTORY_ITEMS', () => {
      for (let i = 1; i <= 15; i++) {
        addToReadingHistory(i, `post-${i}`, `Post ${i}`, [1], [10]);
      }

      const setItemCall = (localStorageMock.setItem as jest.Mock).mock.calls.find(
        (call) => call[0] === 'reading_history'
      );
      
      if (setItemCall) {
        const history = JSON.parse(setItemCall[1]);
        expect(history.items.length).toBeLessThanOrEqual(RECOMMENDATION_CONFIG.MAX_HISTORY_ITEMS);
      }
    });

    it('should update category preferences', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1, 2], [10]);

      const setItemCall = (localStorageMock.setItem as jest.Mock).mock.calls.find(
        (call) => call[0] === 'reading_history'
      );
      
      expect(setItemCall).toBeTruthy();
      const history = JSON.parse(setItemCall[1]);
      expect(history.categoryPreferences).toEqual({ '1': 1, '2': 1 });
    });

    it('should update tag preferences', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10, 20]);

      const setItemCall = (localStorageMock.setItem as jest.Mock).mock.calls.find(
        (call) => call[0] === 'reading_history'
      );
      
      expect(setItemCall).toBeTruthy();
      const history = JSON.parse(setItemCall[1]);
      expect(history.tagPreferences).toEqual({ '10': 1, '20': 1 });
    });

    it('should increment existing category preference', () => {
      localStorageMock.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { 1: 2 },
          tagPreferences: { 10: 1 },
        })
      );

      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10]);

      const setItemCall = (localStorageMock.setItem as jest.Mock).mock.calls.find(
        (call) => call[0] === 'reading_history'
      );
      
      const history = JSON.parse(setItemCall[1]);
      expect(history.categoryPreferences['1']).toBe(3);
    });
  });

  describe('getReadingHistory', () => {
    it('should return empty history when no data in storage', () => {
      const history = getReadingHistory();

      expect(history.items).toEqual([]);
      expect(history.categoryPreferences.size).toBe(0);
      expect(history.tagPreferences.size).toBe(0);
    });

    it('should return stored history', () => {
      localStorageMock.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          items: [{ postId: 1, slug: 'post-1', title: 'Post 1', categoryIds: [1], tagIds: [10], timestamp: 1000 }],
          categoryPreferences: { 1: 2 },
          tagPreferences: { 10: 1 },
        })
      );

      const history = getReadingHistory();

      expect(history.items.length).toBe(1);
      expect(history.items[0].postId).toBe(1);
      expect(history.categoryPreferences.get(1)).toBe(2);
      expect(history.tagPreferences.get(10)).toBe(1);
    });
  });

  describe('getTopCategories', () => {
    it('should return empty array when no history', () => {
      const categories = getTopCategories();
      expect(categories).toEqual([]);
    });

    it('should return top categories sorted by count', () => {
      localStorageMock.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { 1: 5, 2: 3, 3: 8 },
          tagPreferences: {},
        })
      );

      const categories = getTopCategories(2);

      expect(categories).toEqual([3, 1]);
    });

    it('should respect limit parameter', () => {
      localStorageMock.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { 1: 5, 2: 3, 3: 8, 4: 2 },
          tagPreferences: {},
        })
      );

      const categories = getTopCategories(2);

      expect(categories.length).toBe(2);
    });
  });

  describe('getTopTags', () => {
    it('should return empty array when no history', () => {
      const tags = getTopTags();
      expect(tags).toEqual([]);
    });

    it('should return top tags sorted by count', () => {
      localStorageMock.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: { 10: 5, 20: 3, 30: 8 },
        })
      );

      const tags = getTopTags(2);

      expect(tags).toEqual([30, 10]);
    });

    it('should respect limit parameter', () => {
      localStorageMock.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: { 10: 5, 20: 3, 30: 8, 40: 2 },
        })
      );

      const tags = getTopTags(2);

      expect(tags.length).toBe(2);
    });
  });

  describe('hasReadPost', () => {
    it('should return false when no history', () => {
      const result = hasReadPost(1);
      expect(result).toBe(false);
    });

    it('should return true when post has been read', () => {
      localStorageMock.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          items: [{ postId: 1, slug: 'post-1', title: 'Post 1', categoryIds: [1], tagIds: [10], timestamp: 1000 }],
          categoryPreferences: {},
          tagPreferences: {},
        })
      );

      const result = hasReadPost(1);
      expect(result).toBe(true);
    });

    it('should return false when post has not been read', () => {
      localStorageMock.getItem = jest.fn().mockReturnValue(
        JSON.stringify({
          items: [{ postId: 2, slug: 'post-2', title: 'Post 2', categoryIds: [1], tagIds: [10], timestamp: 1000 }],
          categoryPreferences: {},
          tagPreferences: {},
        })
      );

      const result = hasReadPost(1);
      expect(result).toBe(false);
    });
  });

  describe('trackRecommendationClick', () => {
    it('should add click to recommendation clicks', () => {
      trackRecommendationClick(123, 'homepage');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'recommendation_clicks',
        expect.stringContaining('"postId":123')
      );
    });

    it('should add multiple clicks', () => {
      let storedClicks: Array<{postId: number; source: string; timestamp: number}> = [];
      
      localStorageMock.getItem = jest.fn().mockImplementation((key: string) => {
        if (key === 'recommendation_clicks') {
          return JSON.stringify(storedClicks);
        }
        return null;
      });
      
      localStorageMock.setItem = jest.fn().mockImplementation((key: string, value: string) => {
        if (key === 'recommendation_clicks') {
          storedClicks = JSON.parse(value);
        }
      });

      trackRecommendationClick(1, 'sidebar');
      trackRecommendationClick(2, 'footer');

      expect(storedClicks.length).toBe(2);
      expect(storedClicks[0].postId).toBe(1);
      expect(storedClicks[1].postId).toBe(2);
    });
  });

  describe('getRecommendationClicks', () => {
    it('should return empty array when no clicks', () => {
      const clicks = getRecommendationClicks();
      expect(clicks).toEqual([]);
    });

    it('should return stored clicks', () => {
      localStorageMock.getItem = jest.fn().mockReturnValue(
        JSON.stringify([
          { postId: 1, source: 'homepage', timestamp: 1000 },
          { postId: 2, source: 'sidebar', timestamp: 2000 },
        ])
      );

      const clicks = getRecommendationClicks();

      expect(clicks.length).toBe(2);
      expect(clicks[0].postId).toBe(1);
    });
  });

  describe('server-side rendering', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      const history = getReadingHistory();
      expect(history.items).toEqual([]);
    });

    it('should handle setStorageItem errors gracefully', () => {
      localStorageMock.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        addToReadingHistory(1, 'post-1', 'Post 1', [1], [10]);
      }).not.toThrow();
    });
  });
});
