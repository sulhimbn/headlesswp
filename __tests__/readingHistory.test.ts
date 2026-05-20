import {
  addToReadingHistory,
  getReadingHistory,
  getTopCategories,
  getTopTags,
  hasReadPost,
  trackRecommendationClick,
  getRecommendationClicks,
  ReadingHistory
} from '@/lib/utils/readingHistory';

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('readingHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
  });

  describe('addToReadingHistory', () => {
    it('should add new item to empty history', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      addToReadingHistory(1, 'post-1', 'Post Title 1', [1, 2], [10, 20]);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'reading_history',
        expect.stringContaining('"items"')
      );
    });

    it('should move existing post to front', () => {
      const existingHistory = {
        items: [
          { postId: 1, slug: 'post-1', title: 'Old Title', categoryIds: [1], tagIds: [10], timestamp: 1000 }
        ],
        categoryPreferences: { '1': 1 },
        tagPreferences: { '10': 1 }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingHistory));

      addToReadingHistory(1, 'post-1', 'New Title', [1], [10]);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      
      expect(stored.items[0].title).toBe('New Title');
      expect(stored.items[0].timestamp).toBeGreaterThan(1000);
    });

    it('should limit history to MAX_HISTORY_ITEMS', () => {
      const manyItems = Array.from({ length: 25 }, (_, i) => ({
        postId: i + 1,
        slug: `post-${i + 1}`,
        title: `Post ${i + 1}`,
        categoryIds: [1],
        tagIds: [10],
        timestamp: Date.now() - i * 1000
      }));
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: manyItems,
        categoryPreferences: { '1': 25 },
        tagPreferences: { '10': 25 }
      }));

      addToReadingHistory(100, 'post-100', 'New Post', [1], [10]);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      
      expect(stored.items.length).toBeLessThanOrEqual(20);
    });

    it('should update category preferences', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      addToReadingHistory(1, 'post-1', 'Post 1', [1, 2], [10]);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      
      expect(stored.categoryPreferences['1']).toBe(1);
      expect(stored.categoryPreferences['2']).toBe(1);
    });

    it('should increment existing category preferences', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: { '1': 2, '2': 1 },
        tagPreferences: {}
      }));

      addToReadingHistory(2, 'post-2', 'Post 2', [1, 3], [10]);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      
      expect(stored.categoryPreferences['1']).toBe(3);
      expect(stored.categoryPreferences['2']).toBe(1);
      expect(stored.categoryPreferences['3']).toBe(1);
    });

    it('should update tag preferences', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10, 20]);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      
      expect(stored.tagPreferences['10']).toBe(1);
      expect(stored.tagPreferences['20']).toBe(1);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10]);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getReadingHistory', () => {
    it('should return empty history when no data', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const history = getReadingHistory();

      expect(history.items).toEqual([]);
      expect(history.categoryPreferences.size).toBe(0);
      expect(history.tagPreferences.size).toBe(0);
    });

    it('should parse stored history correctly', () => {
      const storedData = {
        items: [
          { postId: 1, slug: 'post-1', title: 'Post 1', categoryIds: [1], tagIds: [10], timestamp: 1000 }
        ],
        categoryPreferences: { '1': 2 },
        tagPreferences: { '10': 1 }
      };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData));

      const history = getReadingHistory();

      expect(history.items.length).toBe(1);
      expect(history.items[0].postId).toBe(1);
      expect(history.categoryPreferences.get(1)).toBe(2);
      expect(history.tagPreferences.get(10)).toBe(1);
    });

    it('should handle corrupted JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const history = getReadingHistory();

      expect(history.items).toEqual([]);
    });
  });

  describe('getTopCategories', () => {
    it('should return top categories by preference count', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: { '1': 10, '2': 5, '3': 8, '4': 2 },
        tagPreferences: {}
      }));

      const topCategories = getTopCategories(3);

      expect(topCategories).toEqual([1, 3, 2]);
    });

    it('should return empty array when no categories', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const topCategories = getTopCategories();

      expect(topCategories).toEqual([]);
    });

    it('should respect limit parameter', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: { '1': 10, '2': 8, '3': 6, '4': 4, '5': 2 },
        tagPreferences: {}
      }));

      const topCategories = getTopCategories(2);

      expect(topCategories.length).toBe(2);
    });
  });

  describe('getTopTags', () => {
    it('should return top tags by preference count', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: { '10': 15, '20': 10, '30': 8, '40': 5 }
      }));

      const topTags = getTopTags(3);

      expect(topTags).toEqual([10, 20, 30]);
    });

    it('should return empty array when no tags', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const topTags = getTopTags();

      expect(topTags).toEqual([]);
    });

    it('should respect limit parameter', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: { '10': 10, '20': 8, '30': 6, '40': 4 }
      }));

      const topTags = getTopTags(1);

      expect(topTags.length).toBe(1);
      expect(topTags[0]).toBe(10);
    });
  });

  describe('hasReadPost', () => {
    it('should return true if post was read', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [
          { postId: 1, slug: 'post-1', title: 'Post 1', categoryIds: [1], tagIds: [10], timestamp: 1000 },
          { postId: 2, slug: 'post-2', title: 'Post 2', categoryIds: [2], tagIds: [20], timestamp: 2000 }
        ],
        categoryPreferences: {},
        tagPreferences: {}
      }));

      expect(hasReadPost(1)).toBe(true);
      expect(hasReadPost(2)).toBe(true);
    });

    it('should return false if post was not read', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [
          { postId: 1, slug: 'post-1', title: 'Post 1', categoryIds: [1], tagIds: [10], timestamp: 1000 }
        ],
        categoryPreferences: {},
        tagPreferences: {}
      }));

      expect(hasReadPost(999)).toBe(false);
    });

    it('should return false when history is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(hasReadPost(1)).toBe(false);
    });
  });

  describe('trackRecommendationClick', () => {
    it('should add click to empty clicks array', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      trackRecommendationClick(123, 'homepage');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'recommendation_clicks',
        expect.stringContaining('"postId":123')
      );
    });

    it('should append to existing clicks', () => {
      const existingClicks = [
        { postId: 1, source: 'sidebar', timestamp: 1000 }
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingClicks));

      trackRecommendationClick(2, 'homepage');

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      
      expect(stored.length).toBe(2);
      expect(stored[1].postId).toBe(2);
      expect(stored[1].source).toBe('homepage');
    });

    it('should store timestamp with click', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      const beforeTime = Date.now();

      trackRecommendationClick(1, 'test');

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(setItemCall[1]);
      
      expect(stored[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
    });
  });

  describe('getRecommendationClicks', () => {
    it('should return empty array when no clicks', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const clicks = getRecommendationClicks();

      expect(clicks).toEqual([]);
    });

    it('should return stored clicks', () => {
      const storedClicks = [
        { postId: 1, source: 'homepage', timestamp: 1000 },
        { postId: 2, source: 'sidebar', timestamp: 2000 }
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedClicks));

      const clicks = getRecommendationClicks();

      expect(clicks.length).toBe(2);
      expect(clicks[0].postId).toBe(1);
      expect(clicks[1].postId).toBe(2);
    });

    it('should handle corrupted JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const clicks = getRecommendationClicks();

      expect(clicks).toEqual([]);
    });
  });
});
