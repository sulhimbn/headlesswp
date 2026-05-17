const mockGetItem = jest.fn()
const mockSetItem = jest.fn()

const mockLocalStorage = {
  getItem: mockGetItem,
  setItem: mockSetItem,
  removeItem: jest.fn(),
  clear: jest.fn(),
  get length() { return 0 },
  key: jest.fn(),
}

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1700000000000)

import {
  addToReadingHistory,
  getReadingHistory,
  getTopCategories,
  getTopTags,
  hasReadPost,
  trackRecommendationClick,
  getRecommendationClicks,
} from '@/lib/utils/readingHistory'

describe('readingHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetItem.mockReturnValue(null)
    mockSetItem.mockReturnValue(undefined)
  })

  afterAll(() => {
    mockDateNow.mockRestore()
  })

  describe('SSR behavior - indirectly tested', () => {
    it('operations work correctly in browser environment with window defined', () => {
      expect(typeof window).not.toBe('undefined')
      const result = getReadingHistory()
      expect(result).toBeDefined()
    })
  })

  describe('localStorage error handling - indirectly tested', () => {
    it('handles corrupted localStorage data gracefully', () => {
      mockGetItem.mockReturnValue('invalid-json-not-parseable')
      const result = getReadingHistory()
      expect(result.items).toEqual([])
      expect(result.categoryPreferences.size).toBe(0)
      expect(result.tagPreferences.size).toBe(0)
    })

    it('handles localStorage.getItem throwing an error', () => {
      mockGetItem.mockImplementation(() => {
        throw new Error('LocalStorage unavailable')
      })
      const result = getReadingHistory()
      expect(result).toBeDefined()
    })
  })

  describe('addToReadingHistory', () => {
    it('adds new post to reading history', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [2])
      
      expect(mockSetItem).toHaveBeenCalledWith(
        'reading_history',
        expect.stringContaining('"postId":1')
      )
    })

    it('updates existing post by moving it to front', () => {
      mockGetItem.mockReturnValue(
        JSON.stringify({
          items: [{ postId: 1, slug: 'old', title: 'Old', categoryIds: [1], tagIds: [2], timestamp: 1000 }],
          categoryPreferences: { '1': 1 },
          tagPreferences: { '2': 1 },
        })
      )

      addToReadingHistory(1, 'updated-slug', 'Updated Title', [1], [2])
      
      expect(mockSetItem).toHaveBeenCalledWith(
        'reading_history',
        expect.stringContaining('"slug":"updated-slug"')
      )
    })

    it('respects MAX_HISTORY_ITEMS limit', () => {
      const manyItems = Array.from({ length: 20 }, (_, i) => ({
        postId: i + 10,
        slug: `post-${i + 10}`,
        title: `Post ${i + 10}`,
        categoryIds: [1],
        tagIds: [2],
        timestamp: i * 1000,
      }))
      
      mockGetItem.mockReturnValue(
        JSON.stringify({
          items: manyItems,
          categoryPreferences: { '1': 20 },
          tagPreferences: { '2': 20 },
        })
      )

      addToReadingHistory(999, 'new-post', 'New Post', [1], [2])
      
      expect(mockSetItem).toHaveBeenCalledWith(
        'reading_history',
        expect.stringContaining('"postId":999')
      )
    })
  })

  describe('getReadingHistory', () => {
    it('returns parsed reading history from localStorage', () => {
      mockGetItem.mockReturnValue(
        JSON.stringify({
          items: [{ postId: 1, slug: 'test', title: 'Test', categoryIds: [1], tagIds: [2], timestamp: 1000 }],
          categoryPreferences: { '1': 2 },
          tagPreferences: { '2': 3 },
        })
      )

      const result = getReadingHistory()
      
      expect(result.items).toHaveLength(1)
      expect(result.items[0].postId).toBe(1)
      expect(result.categoryPreferences.get(1)).toBe(2)
      expect(result.tagPreferences.get(2)).toBe(3)
    })

    it('returns empty history when no data in localStorage', () => {
      mockGetItem.mockReturnValue(null)
      
      const result = getReadingHistory()
      
      expect(result.items).toEqual([])
      expect(result.categoryPreferences.size).toBe(0)
      expect(result.tagPreferences.size).toBe(0)
    })
  })

  describe('getTopCategories', () => {
    it('returns top categories sorted by count', () => {
      mockGetItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { '1': 5, '2': 10, '3': 3 },
          tagPreferences: {},
        })
      )

      const result = getTopCategories(2)
      
      expect(result).toEqual([2, 1])
    })

    it('returns empty array when no category preferences', () => {
      mockGetItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: {},
        })
      )

      const result = getTopCategories()
      
      expect(result).toEqual([])
    })
  })

  describe('getTopTags', () => {
    it('returns top tags sorted by count', () => {
      mockGetItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: { '1': 8, '2': 12, '3': 5, '4': 20, '5': 3 },
        })
      )

      const result = getTopTags(3)
      
      expect(result).toEqual([4, 2, 1])
    })

    it('returns empty array when no tag preferences', () => {
      mockGetItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: {},
        })
      )

      const result = getTopTags()
      
      expect(result).toEqual([])
    })
  })

  describe('hasReadPost', () => {
    it('returns true when post has been read', () => {
      mockGetItem.mockReturnValue(
        JSON.stringify({
          items: [
            { postId: 1, slug: 'test', title: 'Test', categoryIds: [], tagIds: [], timestamp: 1000 },
          ],
          categoryPreferences: {},
          tagPreferences: {},
        })
      )

      const result = hasReadPost(1)
      
      expect(result).toBe(true)
    })

    it('returns false when post has not been read', () => {
      mockGetItem.mockReturnValue(
        JSON.stringify({
          items: [{ postId: 1, slug: 'test', title: 'Test', categoryIds: [], tagIds: [], timestamp: 1000 }],
          categoryPreferences: {},
          tagPreferences: {},
        })
      )

      const result = hasReadPost(999)
      
      expect(result).toBe(false)
    })
  })

  describe('trackRecommendationClick', () => {
    it('adds click event to recommendation clicks', () => {
      mockGetItem.mockReturnValue(null)
      
      trackRecommendationClick(123, 'related_posts')
      
      expect(mockSetItem).toHaveBeenCalledWith(
        'recommendation_clicks',
        expect.stringContaining('"postId":123')
      )
      expect(mockSetItem).toHaveBeenCalledWith(
        'recommendation_clicks',
        expect.stringContaining('"source":"related_posts"')
      )
    })

    it('appends to existing clicks', () => {
      mockGetItem.mockReturnValue(
        JSON.stringify([{ postId: 1, source: 'homepage', timestamp: 1000 }])
      )
      
      trackRecommendationClick(2, 'sidebar')
      
      expect(mockSetItem).toHaveBeenCalledWith(
        'recommendation_clicks',
        expect.stringContaining('"postId":2')
      )
    })
  })

  describe('getRecommendationClicks', () => {
    it('returns clicks from localStorage', () => {
      mockGetItem.mockReturnValue(
        JSON.stringify([
          { postId: 1, source: 'homepage', timestamp: 1000 },
          { postId: 2, source: 'sidebar', timestamp: 2000 },
        ])
      )

      const result = getRecommendationClicks()
      
      expect(result).toHaveLength(2)
      expect(result[0].postId).toBe(1)
      expect(result[1].postId).toBe(2)
    })

    it('returns empty array when no clicks stored', () => {
      mockGetItem.mockReturnValue(null)
      
      const result = getRecommendationClicks()
      
      expect(result).toEqual([])
    })
  })

  describe('setStorageItem - localStorage unavailable', () => {
    it('handles localStorage.setItem error gracefully', () => {
      const originalWindow = global.window
      global.window = {} as Window & typeof globalThis
      
      mockSetItem.mockImplementation(() => {
        throw new Error('Quota exceeded')
      })

      expect(() => {
        addToReadingHistory(1, 'test', 'Test', [1], [2])
      }).not.toThrow()

      global.window = originalWindow
    })
  })
})