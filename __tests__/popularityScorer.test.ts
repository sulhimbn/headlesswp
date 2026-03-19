import { PopularityScorer } from '@/lib/services/popularityScorer'

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

jest.mock('@/lib/services/readingPatternTracker', () => ({
  readingPatternTracker: {
    getCoOccurringPosts: jest.fn().mockReturnValue([]),
    trackRead: jest.fn(),
  },
}))

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('PopularityScorer', () => {
  let scorer: PopularityScorer

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    scorer = new PopularityScorer()
  })

  describe('recordView', () => {
    test('records view for post without throwing', () => {
      expect(() => scorer.recordView(1, [1, 2])).not.toThrow()
    })

    test('records multiple views for different posts', () => {
      scorer.recordView(1, [1])
      scorer.recordView(2, [2])
      scorer.recordView(3, [1, 2])

      expect(() => scorer.recordView(4, [1])).not.toThrow()
    })
  })

  describe('calculateScore', () => {
    test('returns valid score object', () => {
      const score = scorer.calculateScore(1, [1, 2])
      
      expect(score).toHaveProperty('postId', 1)
      expect(score).toHaveProperty('score')
      expect(score).toHaveProperty('categoryScore')
      expect(score).toHaveProperty('coOccurrenceScore')
      expect(score).toHaveProperty('popularityScore')
      expect(score).toHaveProperty('timestamp')
    })

    test('score is between 0 and 1', () => {
      const score = scorer.calculateScore(1, [1])
      
      expect(score.score).toBeGreaterThanOrEqual(0)
      expect(score.score).toBeLessThanOrEqual(1)
    })

    test('caches score within same minute', () => {
      const score1 = scorer.calculateScore(1, [1])
      const score2 = scorer.calculateScore(1, [1])
      
      expect(score1.timestamp).toBe(score2.timestamp)
    })
  })

  describe('predictNextPosts', () => {
    test('returns array of post IDs', () => {
      const predictions = scorer.predictNextPosts(1, [1, 2], 5)
      
      expect(Array.isArray(predictions)).toBe(true)
    })

    test('respects limit parameter', () => {
      scorer.recordView(1, [1])
      scorer.recordView(2, [1])
      scorer.recordView(3, [1])
      scorer.recordView(4, [1])
      scorer.recordView(5, [1])
      scorer.recordView(6, [1])

      const predictions = scorer.predictNextPosts(1, [1], 3)
      
      expect(predictions.length).toBeLessThanOrEqual(3)
    })

    test('does not include current post in predictions', () => {
      scorer.recordView(1, [1])
      
      const predictions = scorer.predictNextPosts(1, [1], 5)
      
      expect(predictions).not.toContain(1)
    })
  })

  describe('getScore', () => {
    test('returns undefined for unrecorded post', () => {
      const score = scorer.getScore(999)
      expect(score).toBeUndefined()
    })

    test('returns score after calculateScore is called', () => {
      const score = scorer.calculateScore(1, [1])
      const retrievedScore = scorer.getScore(1)
      
      expect(retrievedScore).toBeDefined()
      expect(retrievedScore?.postId).toBe(1)
    })
  })

  describe('clearScores', () => {
    test('clears all cached scores', () => {
      scorer.recordView(1, [1])
      scorer.calculateScore(1, [1])
      
      scorer.clearScores()
      
      expect(scorer.getScore(1)).toBeUndefined()
    })
  })
})
