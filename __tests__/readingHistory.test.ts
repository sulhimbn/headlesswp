import { 
  addToReadingHistory, 
  getReadingHistory, 
  getTopCategories, 
  getTopTags, 
  hasReadPost,
  trackRecommendationClick,
  getRecommendationClicks
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
    it('should add new post to reading history', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      addToReadingHistory(1, 'test-post', 'Test Post', [1], [2]);

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(stored.items).toHaveLength(1);
      expect(stored.items[0].postId).toBe(1);
      expect(stored.items[0].slug).toBe('test-post');
      expect(stored.items[0].title).toBe('Test Post');
    });

    it('should update existing post position in history', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [
          { postId: 1, slug: 'old-post', title: 'Old Post', categoryIds: [], tagIds: [], timestamp: Date.now() - 1000 }
        ],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      addToReadingHistory(1, 'updated-post', 'Updated Post', [1], [2]);

      const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(stored.items[0].postId).toBe(1);
      expect(stored.items[0].slug).toBe('updated-post');
    });

    it('should limit history items to MAX_HISTORY_ITEMS', () => {
      const items = Array.from({ length: 25 }, (_, i) => ({
        postId: i + 1,
        slug: `post-${i + 1}`,
        title: `Post ${i + 1}`,
        categoryIds: [],
        tagIds: [],
        timestamp: Date.now() - i * 1000,
      }));

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items,
        categoryPreferences: {},
        tagPreferences: {},
      }));

      addToReadingHistory(99, 'new-post', 'New Post', [1], [2]);

      const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(stored.items.length).toBeLessThanOrEqual(20);
    });

    it('should track category preferences', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: { 1: 3 },
        tagPreferences: {},
      }));

      addToReadingHistory(1, 'test-post', 'Test Post', [1, 2], []);

      const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(stored.categoryPreferences['1']).toBe(4);
      expect(stored.categoryPreferences['2']).toBe(1);
    });

    it('should track tag preferences', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: { 1: 2 },
      }));

      addToReadingHistory(1, 'test-post', 'Test Post', [], [1, 3]);

      const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(stored.tagPreferences['1']).toBe(3);
      expect(stored.tagPreferences['3']).toBe(1);
    });
  });

  describe('getReadingHistory', () => {
    it('should return empty history when no stored data', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const history = getReadingHistory();

      expect(history.items).toEqual([]);
      expect(history.categoryPreferences.size).toBe(0);
      expect(history.tagPreferences.size).toBe(0);
    });

    it('should parse stored history correctly', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [
          { postId: 1, slug: 'test', title: 'Test', categoryIds: [1], tagIds: [2], timestamp: 1234567890 }
        ],
        categoryPreferences: { 1: 5 },
        tagPreferences: { 2: 3 },
      }));

      const history = getReadingHistory();

      expect(history.items).toHaveLength(1);
      expect(history.items[0].postId).toBe(1);
      expect(history.categoryPreferences.get(1)).toBe(5);
      expect(history.tagPreferences.get(2)).toBe(3);
    });

    it('should handle corrupted JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const history = getReadingHistory();

      expect(history.items).toEqual([]);
    });
  });

  describe('getTopCategories', () => {
    it('should return top categories sorted by preference count', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: { 1: 10, 2: 5, 3: 20 },
        tagPreferences: {},
      }));

      const categories = getTopCategories(2);

      expect(categories).toEqual([3, 1]);
    });

    it('should return empty array when no categories', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const categories = getTopCategories();

      expect(categories).toEqual([]);
    });

    it('should respect limit parameter', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: { 1: 10, 2: 8, 3: 6, 4: 4, 5: 2 },
        tagPreferences: {},
      }));

      const categories = getTopCategories(3);

      expect(categories).toHaveLength(3);
    });
  });

  describe('getTopTags', () => {
    it('should return top tags sorted by preference count', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: { 1: 10, 2: 5, 3: 20, 4: 15, 5: 8 },
      }));

      const tags = getTopTags(3);

      expect(tags).toEqual([3, 4, 1]);
    });

    it('should return empty array when no tags', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const tags = getTopTags();

      expect(tags).toEqual([]);
    });

    it('should use default limit of 5', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [],
        categoryPreferences: {},
        tagPreferences: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 },
      }));

      const tags = getTopTags();

      expect(tags).toHaveLength(5);
    });
  });

  describe('hasReadPost', () => {
    it('should return true for read post', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [{ postId: 1 }, { postId: 2 }],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      expect(hasReadPost(1)).toBe(true);
    });

    it('should return false for unread post', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
        items: [{ postId: 1 }],
        categoryPreferences: {},
        tagPreferences: {},
      }));

      expect(hasReadPost(2)).toBe(false);
    });

    it('should return false when no history', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(hasReadPost(1)).toBe(false);
    });
  });

  describe('trackRecommendationClick', () => {
    it('should track recommendation click', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));

      trackRecommendationClick(123, 'sidebar');

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(stored).toHaveLength(1);
      expect(stored[0].postId).toBe(123);
      expect(stored[0].source).toBe('sidebar');
    });

    it('should append to existing clicks', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
        { postId: 1, source: 'homepage', timestamp: 1000 }
      ]));

      trackRecommendationClick(2, 'article');

      const stored = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(stored).toHaveLength(2);
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
        { postId: 2, source: 'sidebar', timestamp: 2000 },
      ];
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedClicks));

      const clicks = getRecommendationClicks();

      expect(clicks).toEqual(storedClicks);
    });

    it('should handle corrupted clicks data', () => {
      mockLocalStorage.getItem.mockReturnValue('not json');

      const clicks = getRecommendationClicks();

      expect(clicks).toEqual([]);
    });
  });
});
