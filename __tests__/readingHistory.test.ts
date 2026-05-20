import {
  addToReadingHistory,
  getReadingHistory,
  getTopCategories,
  getTopTags,
  hasReadPost,
  trackRecommendationClick,
  getRecommendationClicks,
} from '@/lib/utils/readingHistory'

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

let storageData: Record<string, string | null> = {}

const createPersistentStorage = () => ({
  getItem: (key: string) => storageData[key] ?? null,
  setItem: (key: string, value: string) => {
    storageData[key] = value
  },
  removeItem: (key: string) => {
    delete storageData[key]
  },
  clear: () => {
    storageData = {}
  },
})

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('readingHistory', () => {
  let persistentStorage: Record<string, string | null>

  beforeEach(() => {
    jest.clearAllMocks()
    persistentStorage = {}
    mockLocalStorage.getItem.mockImplementation((key: string) => persistentStorage[key] ?? null)
    mockLocalStorage.setItem.mockImplementation((key: string, value: string) => {
      persistentStorage[key] = value
    })
  })

  describe('addToReadingHistory', () => {
    test('adds new item to reading history', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      addToReadingHistory(1, 'test-post', 'Test Post', [1, 2], [3, 4])

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'reading_history',
        expect.any(String)
      )
      const callArg = mockLocalStorage.setItem.mock.calls[0][1]
      const parsed = JSON.parse(callArg)
      expect(parsed.items).toHaveLength(1)
      expect(parsed.items[0]).toEqual({
        postId: 1,
        slug: 'test-post',
        title: 'Test Post',
        categoryIds: [1, 2],
        tagIds: [3, 4],
        timestamp: expect.any(Number),
      })
    })

    test('moves existing post to top when added again', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [
            { postId: 1, slug: 'old-post', title: 'Old', categoryIds: [], tagIds: [], timestamp: 1000 },
            { postId: 2, slug: 'second-post', title: 'Second', categoryIds: [], tagIds: [], timestamp: 2000 },
          ],
          categoryPreferences: {},
          tagPreferences: {},
        })
      )

      addToReadingHistory(1, 'updated-post', 'Updated Title', [1], [2])

      const callArg = mockLocalStorage.setItem.mock.calls[0][1]
      const parsed = JSON.parse(callArg)
      expect(parsed.items[0].postId).toBe(1)
      expect(parsed.items[0].slug).toBe('updated-post')
    })

    test('enforces maximum history limit of 20 items', () => {
      const existingItems = Array.from({ length: 20 }, (_, i) => ({
        postId: i + 1,
        slug: `post-${i + 1}`,
        title: `Post ${i + 1}`,
        categoryIds: [],
        tagIds: [],
        timestamp: Date.now() + i,
      }))

      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: existingItems,
          categoryPreferences: {},
          tagPreferences: {},
        })
      )

      addToReadingHistory(999, 'new-post', 'New Post', [1], [1])

      const callArg = mockLocalStorage.setItem.mock.calls[0][1]
      const parsed = JSON.parse(callArg)
      expect(parsed.items.length).toBe(20)
      expect(parsed.items[0].postId).toBe(999)
      expect(parsed.items[19].postId).toBe(19)
    })

    test('updates category preferences count', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { 1: 2, 2: 1 },
          tagPreferences: {},
        })
      )

      addToReadingHistory(1, 'test', 'Test', [1, 2], [])

      const callArg = mockLocalStorage.setItem.mock.calls[0][1]
      const parsed = JSON.parse(callArg)
      expect(parsed.categoryPreferences[1]).toBe(3)
      expect(parsed.categoryPreferences[2]).toBe(2)
    })

    test('updates tag preferences count', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: { 3: 1, 4: 2 },
        })
      )

      addToReadingHistory(1, 'test', 'Test', [], [3, 4])

      const callArg = mockLocalStorage.setItem.mock.calls[0][1]
      const parsed = JSON.parse(callArg)
      expect(parsed.tagPreferences[3]).toBe(2)
      expect(parsed.tagPreferences[4]).toBe(3)
    })

    test('creates new category/tag preference when not exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      addToReadingHistory(1, 'test', 'Test', [99], [88])

      const callArg = mockLocalStorage.setItem.mock.calls[0][1]
      const parsed = JSON.parse(callArg)
      expect(parsed.categoryPreferences[99]).toBe(1)
      expect(parsed.tagPreferences[88]).toBe(1)
    })

    test('handles empty category and tag arrays', () => {
      addToReadingHistory(1, 'test', 'Test', [], [])

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'reading_history',
        expect.any(String)
      )
      const callArg = mockLocalStorage.setItem.mock.calls[0][1]
      const parsed = JSON.parse(callArg)
      expect(parsed.categoryPreferences).toEqual({})
      expect(parsed.tagPreferences).toEqual({})
    })

    test('does nothing during SSR (no window)', () => {
      const originalLocalStorage = global.localStorage
      delete (global as unknown as { localStorage?: typeof mockLocalStorage }).localStorage

      expect(() => {
        addToReadingHistory(1, 'test', 'Test', [1], [1])
      }).not.toThrow()

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
      global.localStorage = originalLocalStorage
    })

    test('handles localStorage.setItem throwing', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded')
      })

      expect(() => {
        addToReadingHistory(1, 'test', 'Test', [1], [1])
      }).not.toThrow()
    })
  })

  describe('getReadingHistory', () => {
    test('returns empty history when no stored data', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = getReadingHistory()

      expect(result.items).toEqual([])
      expect(result.categoryPreferences).toBeInstanceOf(Map)
      expect(result.tagPreferences).toBeInstanceOf(Map)
    })

    test('returns stored history items', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [
            { postId: 1, slug: 'test', title: 'Test', categoryIds: [1], tagIds: [], timestamp: 1000 },
          ],
          categoryPreferences: { 1: 3 },
          tagPreferences: { 2: 2 },
        })
      )

      const result = getReadingHistory()

      expect(result.items).toHaveLength(1)
      expect(result.items[0].postId).toBe(1)
      expect(result.categoryPreferences.get(1)).toBe(3)
      expect(result.tagPreferences.get(2)).toBe(2)
    })

    test('converts category preferences keys to numbers', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { '1': 5, '2': 3 },
          tagPreferences: {},
        })
      )

      const result = getReadingHistory()

      expect(result.categoryPreferences.get(1)).toBe(5)
      expect(result.categoryPreferences.get(2)).toBe(3)
    })

    test('converts tag preferences keys to numbers', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: { '10': 7, '20': 4 },
        })
      )

      const result = getReadingHistory()

      expect(result.tagPreferences.get(10)).toBe(7)
      expect(result.tagPreferences.get(20)).toBe(4)
    })

    test('returns defaults when JSON is invalid', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json')

      const result = getReadingHistory()

      expect(result.items).toEqual([])
      expect(result.categoryPreferences).toBeInstanceOf(Map)
    })

    test('returns defaults when localStorage throws', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage unavailable')
      })

      const result = getReadingHistory()

      expect(result.items).toEqual([])
    })

    test('handles missing items array in stored data', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          categoryPreferences: { 1: 1 },
          tagPreferences: {},
        })
      )

      const result = getReadingHistory()

      expect(result.items).toBeUndefined()
    })

    test('does nothing during SSR (no window)', () => {
      const originalLocalStorage = global.localStorage
      delete (global as unknown as { localStorage?: typeof mockLocalStorage }).localStorage

      const result = getReadingHistory()

      expect(result.items).toEqual([])
      expect(result.categoryPreferences).toBeInstanceOf(Map)
      global.localStorage = originalLocalStorage
    })
  })

  describe('getTopCategories', () => {
    test('returns empty array when no preferences', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: {},
        })
      )

      const result = getTopCategories()

      expect(result).toEqual([])
    })

    test('returns top categories sorted by count', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { 1: 10, 2: 5, 3: 8, 4: 2 },
          tagPreferences: {},
        })
      )

      const result = getTopCategories()

      expect(result).toEqual([1, 3, 2])
    })

    test('respects limit parameter', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { 1: 10, 2: 8, 3: 6, 4: 4, 5: 2 },
          tagPreferences: {},
        })
      )

      const result = getTopCategories(2)

      expect(result).toEqual([1, 2])
      expect(result).toHaveLength(2)
    })

    test('handles default limit of 3', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: { 1: 10, 2: 8, 3: 6, 4: 4 },
          tagPreferences: {},
        })
      )

      const result = getTopCategories()

      expect(result).toHaveLength(3)
    })
  })

  describe('getTopTags', () => {
    test('returns empty array when no preferences', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: {},
        })
      )

      const result = getTopTags()

      expect(result).toEqual([])
    })

    test('returns top tags sorted by count', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: { 1: 10, 2: 5, 3: 8, 4: 2 },
        })
      )

      const result = getTopTags()

      expect(result).toEqual([1, 3, 2, 4])
    })

    test('respects limit parameter', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: { 1: 10, 2: 8, 3: 6, 4: 4, 5: 2 },
        })
      )

      const result = getTopTags(2)

      expect(result).toEqual([1, 2])
      expect(result).toHaveLength(2)
    })

    test('handles default limit of 5', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [],
          categoryPreferences: {},
          tagPreferences: { 1: 10, 2: 8, 3: 6, 4: 4, 5: 2, 6: 1 },
        })
      )

      const result = getTopTags()

      expect(result).toHaveLength(5)
    })
  })

  describe('hasReadPost', () => {
    test('returns false when post not in history', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [{ postId: 1, slug: 'test', title: 'Test', categoryIds: [], tagIds: [], timestamp: 1000 }],
          categoryPreferences: {},
          tagPreferences: {},
        })
      )

      const result = hasReadPost(999)

      expect(result).toBe(false)
    })

    test('returns true when post exists in history', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [{ postId: 1, slug: 'test', title: 'Test', categoryIds: [], tagIds: [], timestamp: 1000 }],
          categoryPreferences: {},
          tagPreferences: {},
        })
      )

      const result = hasReadPost(1)

      expect(result).toBe(true)
    })

    test('returns false when history is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = hasReadPost(1)

      expect(result).toBe(false)
    })
  })

  describe('trackRecommendationClick', () => {
    test('adds click to recommendation clicks', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      trackRecommendationClick(123, 'sidebar')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'recommendation_clicks',
        expect.any(String)
      )
      const callArg = mockLocalStorage.setItem.mock.calls[0][1]
      const parsed = JSON.parse(callArg)
      expect(parsed).toHaveLength(1)
      expect(parsed[0]).toEqual({
        postId: 123,
        source: 'sidebar',
        timestamp: expect.any(Number),
      })
    })

    test('appends to existing clicks', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify([
          { postId: 1, source: 'related', timestamp: 1000 },
        ])
      )

      trackRecommendationClick(2, 'featured')

      const callArg = mockLocalStorage.setItem.mock.calls[0][1]
      const parsed = JSON.parse(callArg)
      expect(parsed).toHaveLength(2)
      expect(parsed[1].postId).toBe(2)
    })

    test('does nothing during SSR', () => {
      const originalLocalStorage = global.localStorage
      delete (global as unknown as { localStorage?: typeof mockLocalStorage }).localStorage

      expect(() => {
        trackRecommendationClick(1, 'test')
      }).not.toThrow()

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
      global.localStorage = originalLocalStorage
    })
  })

  describe('getRecommendationClicks', () => {
    test('returns empty array when no clicks stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = getRecommendationClicks()

      expect(result).toEqual([])
    })

    test('returns stored clicks', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify([
          { postId: 1, source: 'sidebar', timestamp: 1000 },
          { postId: 2, source: 'related', timestamp: 2000 },
        ])
      )

      const result = getRecommendationClicks()

      expect(result).toHaveLength(2)
      expect(result[0].postId).toBe(1)
      expect(result[1].postId).toBe(2)
    })

    test('returns defaults when JSON is invalid', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid')

      const result = getRecommendationClicks()

      expect(result).toEqual([])
    })

    test('returns defaults when localStorage throws', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage unavailable')
      })

      const result = getRecommendationClicks()

      expect(result).toEqual([])
    })

    test('does nothing during SSR', () => {
      const originalLocalStorage = global.localStorage
      delete (global as unknown as { localStorage?: typeof mockLocalStorage }).localStorage

      const result = getRecommendationClicks()

      expect(result).toEqual([])
      global.localStorage = originalLocalStorage
    })
  })

  describe('integration scenarios', () => {
    test('full workflow: add items, check history, verify preferences', () => {
      addToReadingHistory(1, 'post-1', 'Post 1', [1], [1])
      addToReadingHistory(2, 'post-2', 'Post 2', [1, 2], [1])
      addToReadingHistory(3, 'post-3', 'Post 3', [2], [2])

      expect(hasReadPost(1)).toBe(true)
      expect(hasReadPost(2)).toBe(true)
      expect(hasReadPost(999)).toBe(false)

      const categories = getTopCategories(2)
      expect(categories).toEqual(expect.arrayContaining([1, 2]))

      const tags = getTopTags(2)
      expect(tags).toEqual([1, 2])
    })

    test('duplicate handling preserves latest data', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          items: [{ postId: 1, slug: 'old', title: 'Old Title', categoryIds: [], tagIds: [], timestamp: 1000 }],
          categoryPreferences: {},
          tagPreferences: {},
        })
      )

      addToReadingHistory(1, 'new', 'New Title', [1], [1])

      const callArg = mockLocalStorage.setItem.mock.calls[0][1]
      const parsed = JSON.parse(callArg)
      expect(parsed.items).toHaveLength(1)
      expect(parsed.items[0].slug).toBe('new')
      expect(parsed.items[0].title).toBe('New Title')
    })

    test('max items enforcement with multiple additions', () => {
      for (let i = 1; i <= 25; i++) {
        addToReadingHistory(i, `post-${i}`, `Post ${i}`, [1], [1])
      }

      const result = getReadingHistory()
      expect(result.items.length).toBe(20)
      expect(result.items[0].postId).toBe(25)
      expect(result.items[19].postId).toBe(6)
    })
  })
})