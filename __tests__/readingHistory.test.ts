import {
  addToReadingHistory,
  getReadingHistory,
  getTopCategories,
  getTopTags,
  hasReadPost,
  trackRecommendationClick,
  getRecommendationClicks,
} from '@/lib/utils/readingHistory'

const LOCAL_STORAGE_KEY = 'reading_history'
const RECOMMENDATION_CLICKS_KEY = 'recommendation_clicks'

describe('readingHistory', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-15T10:00:00'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('addToReadingHistory', () => {
    test('adds item to reading history', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1, 2], [10, 20])

      const history = getReadingHistory()
      expect(history.items).toHaveLength(1)
      expect(history.items[0].postId).toBe(1)
      expect(history.items[0].slug).toBe('post-1')
      expect(history.items[0].title).toBe('Post 1')
      expect(history.items[0].categoryIds).toEqual([1, 2])
      expect(history.items[0].tagIds).toEqual([10, 20])
    })

    test('updates category preferences when adding post', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1, 2], [10])

      const history = getReadingHistory()
      expect(history.categoryPreferences.get(1)).toBe(1)
      expect(history.categoryPreferences.get(2)).toBe(1)
    })

    test('updates tag preferences when adding post', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10, 20])

      const history = getReadingHistory()
      expect(history.tagPreferences.get(10)).toBe(1)
      expect(history.tagPreferences.get(20)).toBe(1)
    })

    test('moves existing post to front when re-adding', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10])
      addToReadingHistory(2, 'post-2', 'Post 2', [2], [20])
      addToReadingHistory(1, 'post-1', 'Post 1 Updated', [1], [10])

      const history = getReadingHistory()
      expect(history.items).toHaveLength(2)
      expect(history.items[0].postId).toBe(1)
      expect(history.items[0].title).toBe('Post 1 Updated')
      expect(history.items[1].postId).toBe(2)
    })

    test('truncates history when exceeding MAX_HISTORY_ITEMS', () => {
      const maxItems = 20

      for (let i = 1; i <= 25; i++) {
        addToReadingHistory(i, `post-${i}`, `Post ${i}`, [1], [10])
      }

      const history = getReadingHistory()
      expect(history.items).toHaveLength(maxItems)
      expect(history.items[0].postId).toBe(25)
      expect(history.items[maxItems - 1].postId).toBe(6)
    })

    test('increments category preference count for repeated categories', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10])
      addToReadingHistory(2, 'post-2', 'Post 2', [1], [20])

      const history = getReadingHistory()
      expect(history.categoryPreferences.get(1)).toBe(2)
    })

    test('increments tag preference count for repeated tags', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [10])
      addToReadingHistory(2, 'post-2', 'Post 2', [2], [10])

      const history = getReadingHistory()
      expect(history.tagPreferences.get(10)).toBe(2)
    })
  })

  describe('getReadingHistory', () => {
    test('returns empty history when no data exists', () => {
      const history = getReadingHistory()
      expect(history.items).toEqual([])
      expect(history.categoryPreferences.size).toBe(0)
    })

    test('returns stored history data', () => {
      const storedData = {
        items: [
          {
            postId: 1,
            slug: 'post-1',
            title: 'Post 1',
            categoryIds: [1],
            tagIds: [10],
            timestamp: Date.now(),
          },
        ],
        categoryPreferences: { 1: 2 },
        tagPreferences: { 10: 1 },
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      const history = getReadingHistory()
      expect(history.items).toHaveLength(1)
      expect(history.categoryPreferences.get(1)).toBe(2)
      expect(history.tagPreferences.get(10)).toBe(1)
    })

    test('handles corrupted localStorage data gracefully', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'invalid-json')

      const history = getReadingHistory()
      expect(history.items).toEqual([])
      expect(history.categoryPreferences.size).toBe(0)
    })

  })

  describe('getTopCategories', () => {
    test('returns top categories sorted by count', () => {
      const storedData = {
        items: [],
        categoryPreferences: { 1: 5, 2: 3, 3: 10 },
        tagPreferences: {},
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      const topCategories = getTopCategories()
      expect(topCategories).toEqual([3, 1, 2])
    })

    test('respects limit parameter', () => {
      const storedData = {
        items: [],
        categoryPreferences: { 1: 5, 2: 3, 3: 10, 4: 8 },
        tagPreferences: {},
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      const topCategories = getTopCategories(2)
      expect(topCategories).toEqual([3, 4])
    })

    test('returns empty array when no categories', () => {
      const storedData = {
        items: [],
        categoryPreferences: {},
        tagPreferences: {},
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      const topCategories = getTopCategories()
      expect(topCategories).toEqual([])
    })

    test('returns default limit of 3 when no limit specified', () => {
      const storedData = {
        items: [],
        categoryPreferences: { 1: 5, 2: 3, 3: 10, 4: 8, 5: 2 },
        tagPreferences: {},
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      const topCategories = getTopCategories()
      expect(topCategories).toHaveLength(3)
      expect(topCategories).toEqual([3, 4, 1])
    })
  })

  describe('getTopTags', () => {
    test('returns top tags sorted by count', () => {
      const storedData = {
        items: [],
        categoryPreferences: {},
        tagPreferences: { 10: 5, 20: 3, 30: 10 },
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      const topTags = getTopTags()
      expect(topTags).toEqual([30, 10, 20])
    })

    test('respects limit parameter', () => {
      const storedData = {
        items: [],
        categoryPreferences: {},
        tagPreferences: { 10: 5, 20: 3, 30: 10, 40: 8 },
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      const topTags = getTopTags(2)
      expect(topTags).toEqual([30, 40])
    })

    test('returns empty array when no tags', () => {
      const storedData = {
        items: [],
        categoryPreferences: {},
        tagPreferences: {},
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      const topTags = getTopTags()
      expect(topTags).toEqual([])
    })

    test('returns default limit of 5 when no limit specified', () => {
      const storedData = {
        items: [],
        categoryPreferences: {},
        tagPreferences: { 10: 5, 20: 3, 30: 10, 40: 8, 50: 2, 60: 1 },
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      const topTags = getTopTags()
      expect(topTags).toHaveLength(5)
      expect(topTags).toEqual([30, 40, 10, 20, 50])
    })
  })

  describe('hasReadPost', () => {
    test('returns true for read post', () => {
      const storedData = {
        items: [
          {
            postId: 1,
            slug: 'post-1',
            title: 'Post 1',
            categoryIds: [1],
            tagIds: [10],
            timestamp: Date.now(),
          },
        ],
        categoryPreferences: {},
        tagPreferences: {},
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      expect(hasReadPost(1)).toBe(true)
    })

    test('returns false for unread post', () => {
      const storedData = {
        items: [
          {
            postId: 1,
            slug: 'post-1',
            title: 'Post 1',
            categoryIds: [1],
            tagIds: [10],
            timestamp: Date.now(),
          },
        ],
        categoryPreferences: {},
        tagPreferences: {},
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      expect(hasReadPost(999)).toBe(false)
    })

    test('returns false when no history', () => {
      const storedData = {
        items: [],
        categoryPreferences: {},
        tagPreferences: {},
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storedData))

      expect(hasReadPost(1)).toBe(false)
    })
  })

  describe('trackRecommendationClick', () => {
    test('adds click to storage', () => {
      trackRecommendationClick(123, 'category-page')

      const clicks = getRecommendationClicks()
      expect(clicks).toHaveLength(1)
      expect(clicks[0].postId).toBe(123)
      expect(clicks[0].source).toBe('category-page')
      expect(clicks[0].timestamp).toBe(Date.now())
    })

    test('accumulates multiple clicks', () => {
      trackRecommendationClick(123, 'category-page')
      trackRecommendationClick(456, 'homepage')
      trackRecommendationClick(789, 'sidebar')

      const clicks = getRecommendationClicks()
      expect(clicks).toHaveLength(3)
      expect(clicks[0].postId).toBe(123)
      expect(clicks[1].postId).toBe(456)
      expect(clicks[2].postId).toBe(789)
    })

    test('stores click with different sources', () => {
      trackRecommendationClick(100, 'related-posts')
      trackRecommendationClick(101, 'search-results')
      trackRecommendationClick(102, 'recommended')

      const clicks = getRecommendationClicks()
      expect(clicks[0].source).toBe('related-posts')
      expect(clicks[1].source).toBe('search-results')
      expect(clicks[2].source).toBe('recommended')
    })
  })

  describe('getRecommendationClicks', () => {
    test('returns empty array when no clicks stored', () => {
      const clicks = getRecommendationClicks()
      expect(clicks).toEqual([])
    })

    test('returns stored clicks', () => {
      const storedClicks = [
        { postId: 123, source: 'category-page', timestamp: Date.now() },
        { postId: 456, source: 'homepage', timestamp: Date.now() },
      ]
      localStorage.setItem(RECOMMENDATION_CLICKS_KEY, JSON.stringify(storedClicks))

      const clicks = getRecommendationClicks()
      expect(clicks).toHaveLength(2)
      expect(clicks[0].postId).toBe(123)
      expect(clicks[1].postId).toBe(456)
    })

    test('handles corrupted clicks data gracefully', () => {
      localStorage.setItem(RECOMMENDATION_CLICKS_KEY, 'not-valid-json')

      const clicks = getRecommendationClicks()
      expect(clicks).toEqual([])
    })

    test('handles corrupted clicks data with invalid JSON', () => {
      localStorage.setItem(RECOMMENDATION_CLICKS_KEY, '{invalid json}')

      const clicks = getRecommendationClicks()
      expect(clicks).toEqual([])
    })
  })

  describe('localStorage error handling', () => {
    test('getStorageItem returns default on JSON.parse error', () => {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'corrupted{')

      const history = getReadingHistory()
      expect(history.items).toEqual([])
    })
  })
})
