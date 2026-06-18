import {
  addToReadingHistory,
  getReadingHistory,
  getTopCategories,
  getTopTags,
  hasReadPost,
  trackRecommendationClick,
  getRecommendationClicks,
  ReadingHistoryItem,
} from '@/lib/utils/readingHistory';

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('readingHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockReturnValue(undefined);
  });

  describe('addToReadingHistory', () => {
    it('should add new item to history', () => {
      addToReadingHistory(1, 'test-post', 'Test Post', [1, 2], [10, 20]);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'reading_history',
        expect.any(String)
      );
    });

    it('should update existing item to front', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: [{ postId: 1, slug: 'old-post', title: 'Old', categoryIds: [], tagIds: [], timestamp: 1000 }],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      addToReadingHistory(1, 'new-post', 'New Post', [1], [10]);

      const call = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(call[1]);
      expect(stored.items[0].postId).toBe(1);
      expect(stored.items[0].slug).toBe('new-post');
    });

    it('should limit history items to max', () => {
      const manyItems = Array.from({ length: 30 }, (_, i) => ({
        postId: i,
        slug: `post-${i}`,
        title: `Post ${i}`,
        categoryIds: [1],
        tagIds: [1],
        timestamp: Date.now() - i * 1000,
      }));

      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: manyItems,
        categoryPreferences: { 1: 30 },
        tagPreferences: { 1: 30 },
      }));

      addToReadingHistory(999, 'new', 'New', [1], [1]);

      const call = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(call[1]);
      expect(stored.items.length).toBeLessThanOrEqual(30);
    });

    it('should update category preferences', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: [],
        categoryPreferences: { 1: 5 },
        tagPreferences: {},
      }));

      addToReadingHistory(1, 'test', 'Test', [1], []);

      const call = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(call[1]);
      expect(stored.categoryPreferences[1]).toBe(6);
    });

    it('should update tag preferences', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: { 10: 3 },
      }));

      addToReadingHistory(1, 'test', 'Test', [], [10]);

      const call = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(call[1]);
      expect(stored.tagPreferences[10]).toBe(4);
    });
  });

  describe('getReadingHistory', () => {
    it('should return empty history when no data', () => {
      const history = getReadingHistory();

      expect(history.items).toEqual([]);
      expect(history.categoryPreferences.size).toBe(0);
      expect(history.tagPreferences.size).toBe(0);
    });

    it('should return stored history', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: [{ postId: 1, slug: 'test', title: 'Test', categoryIds: [1], tagIds: [10], timestamp: 123456 }],
        categoryPreferences: { 1: 2 },
        tagPreferences: { 10: 1 },
      }));

      const history = getReadingHistory();

      expect(history.items).toHaveLength(1);
      expect(history.items[0].postId).toBe(1);
      expect(history.categoryPreferences.get(1)).toBe(2);
      expect(history.tagPreferences.get(10)).toBe(1);
    });

    it('should handle invalid JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValueOnce('invalid json');

      const history = getReadingHistory();

      expect(history.items).toEqual([]);
    });
  });

  describe('getTopCategories', () => {
    it('should return top categories by preference count', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: [],
        categoryPreferences: { 1: 10, 2: 5, 3: 20 },
        tagPreferences: {},
      }));

      const top = getTopCategories(2);

      expect(top).toEqual([3, 1]);
    });

    it('should return empty array when no preferences', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      const top = getTopCategories();

      expect(top).toEqual([]);
    });

    it('should handle limit parameter', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: [],
        categoryPreferences: { 1: 10, 2: 8, 3: 6, 4: 4, 5: 2 },
        tagPreferences: {},
      }));

      const top = getTopCategories(3);

      expect(top).toHaveLength(3);
      expect(top).toEqual([1, 2, 3]);
    });
  });

  describe('getTopTags', () => {
    it('should return top tags by preference count', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: { 10: 15, 20: 8, 30: 25 },
      }));

      const top = getTopTags(2);

      expect(top).toEqual([30, 10]);
    });

    it('should return empty array when no preferences', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      const top = getTopTags();

      expect(top).toEqual([]);
    });
  });

  describe('hasReadPost', () => {
    it('should return true when post was read', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: [{ postId: 123, slug: 'test', title: 'Test', categoryIds: [], tagIds: [], timestamp: 123456 }],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      expect(hasReadPost(123)).toBe(true);
    });

    it('should return false when post was not read', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        items: [{ postId: 123, slug: 'test', title: 'Test', categoryIds: [], tagIds: [], timestamp: 123456 }],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      expect(hasReadPost(999)).toBe(false);
    });
  });

  describe('trackRecommendationClick', () => {
    it('should add click to recommendation clicks', () => {
      trackRecommendationClick(123, 'sidebar');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'recommendation_clicks',
        expect.any(String)
      );
    });

    it('should preserve existing clicks', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify([
        { postId: 1, source: 'homepage', timestamp: 1000 },
      ]));

      trackRecommendationClick(2, 'article');

      const call = mockLocalStorage.setItem.mock.calls[0];
      const stored = JSON.parse(call[1]);
      expect(stored).toHaveLength(2);
    });
  });

  describe('getRecommendationClicks', () => {
    it('should return empty array when no clicks', () => {
      const clicks = getRecommendationClicks();

      expect(clicks).toEqual([]);
    });

    it('should return stored clicks', () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify([
        { postId: 123, source: 'sidebar', timestamp: 123456 },
      ]));

      const clicks = getRecommendationClicks();

      expect(clicks).toHaveLength(1);
      expect(clicks[0].postId).toBe(123);
    });
  });
});