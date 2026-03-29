import {
  addToReadingHistory,
  getReadingHistory,
  getTopCategories,
  getTopTags,
  hasReadPost,
  trackRecommendationClick,
  getRecommendationClicks,
} from '@/lib/utils/readingHistory';

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

describe('readingHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockReturnValue(undefined);
  });

  describe('addToReadingHistory', () => {
    it('should add new item to history', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      addToReadingHistory(1, 'test-post', 'Test Post', [1, 2], [3, 4]);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.items).toHaveLength(1);
      expect(savedData.items[0].postId).toBe(1);
      expect(savedData.categoryPreferences).toEqual({ '1': 1, '2': 1 });
      expect(savedData.tagPreferences).toEqual({ '3': 1, '4': 1 });
    });

    it('should move existing item to front', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [{ postId: 1, slug: 'old', title: 'Old', categoryIds: [], tagIds: [], timestamp: 1000 }],
        categoryPreferences: { '1': 2 },
        tagPreferences: { '3': 1 },
      }));

      addToReadingHistory(1, 'new-slug', 'New Title', [1, 2], [3, 4]);

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.items[0].postId).toBe(1);
      expect(savedData.items[0].slug).toBe('new-slug');
      expect(savedData.categoryPreferences).toEqual({ '1': 3, '2': 1 });
    });

    it('should limit history items to max', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({
        postId: i + 1,
        slug: `post-${i + 1}`,
        title: `Post ${i + 1}`,
        categoryIds: [],
        tagIds: [],
        timestamp: Date.now() - i,
      }));

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items,
        categoryPreferences: {},
        tagPreferences: {},
      }));

      addToReadingHistory(26, 'new-post', 'New Post', [], []);

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.items.length).toBeLessThanOrEqual(20);
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => {
        addToReadingHistory(1, 'test', 'Test', [], []);
      }).not.toThrow();
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

    it('should parse stored data correctly', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [{ postId: 1, slug: 'test', title: 'Test', categoryIds: [1], tagIds: [2], timestamp: 1000 }],
        categoryPreferences: { '1': 2 },
        tagPreferences: { '2': 1 },
      }));

      const history = getReadingHistory();

      expect(history.items).toHaveLength(1);
      expect(history.categoryPreferences.get(1)).toBe(2);
      expect(history.tagPreferences.get(2)).toBe(1);
    });

    it('should handle JSON parse errors', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const history = getReadingHistory();

      expect(history.items).toEqual([]);
    });
  });

  describe('getTopCategories', () => {
    it('should return top categories sorted by preference', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: { '1': 5, '2': 10, '3': 3 },
        tagPreferences: {},
      }));

      const top = getTopCategories(2);

      expect(top).toEqual([2, 1]);
    });

    it('should return empty array when no categories', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      const top = getTopCategories();

      expect(top).toEqual([]);
    });
  });

  describe('getTopTags', () => {
    it('should return top tags sorted by preference', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: { '1': 5, '2': 10, '3': 3, '4': 8, '5': 2 },
      }));

      const top = getTopTags(3);

      expect(top).toEqual([2, 4, 1]);
    });

    it('should return empty array when no tags', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      const top = getTopTags();

      expect(top).toEqual([]);
    });
  });

  describe('hasReadPost', () => {
    it('should return true if post was read', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [{ postId: 1, slug: 'test', title: 'Test', categoryIds: [], tagIds: [], timestamp: 1000 }],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      expect(hasReadPost(1)).toBe(true);
    });

    it('should return false if post was not read', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [{ postId: 1, slug: 'test', title: 'Test', categoryIds: [], tagIds: [], timestamp: 1000 }],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      expect(hasReadPost(999)).toBe(false);
    });
  });

  describe('trackRecommendationClick', () => {
    it('should add click to recommendation clicks', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
        { postId: 1, source: 'home', timestamp: 1000 },
      ]));

      trackRecommendationClick(2, 'sidebar');

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(2);
      expect(savedData[1].postId).toBe(2);
      expect(savedData[1].source).toBe('sidebar');
    });

    it('should initialize empty array when no clicks', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      trackRecommendationClick(1, 'home');

      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData).toHaveLength(1);
      expect(savedData[0].postId).toBe(1);
    });
  });

  describe('getRecommendationClicks', () => {
    it('should return stored clicks', () => {
      const clicks = [
        { postId: 1, source: 'home', timestamp: 1000 },
        { postId: 2, source: 'sidebar', timestamp: 2000 },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(clicks));

      const result = getRecommendationClicks();

      expect(result).toEqual(clicks);
    });

    it('should return empty array when no clicks stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = getRecommendationClicks();

      expect(result).toEqual([]);
    });
  });

  describe('SSR safety', () => {
    it('should return default values when window is undefined', () => {
      const originalWindow = global.window;
      delete (global as unknown as { window?: undefined }).window;

      const history = getReadingHistory();
      expect(history.items).toEqual([]);
      expect(history.categoryPreferences.size).toBe(0);

      global.window = originalWindow;
    });
  });
});
