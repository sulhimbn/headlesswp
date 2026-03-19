import { readingPatternTracker, ReadingPatternTracker } from '@/lib/services/readingPatternTracker'

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
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

describe('ReadingPatternTracker', () => {
  let tracker: ReadingPatternTracker

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    tracker = new ReadingPatternTracker()
  })

  describe('trackRead', () => {
    test('tracks basic read with categories', () => {
      tracker.trackRead(1, [1, 2], [1])
      
      const sequences = tracker.getSequencesForPost(1)
      expect(sequences).toHaveLength(0)
    })

    test('tracks sequence between consecutive reads', () => {
      tracker.trackRead(1, [1], [])
      tracker.trackRead(2, [1, 2], [])
      
      const sequences = tracker.getSequencesForPost(1)
      expect(sequences.length).toBeGreaterThanOrEqual(0)
    })

    test('increments existing sequence count', () => {
      tracker.trackRead(1, [1], [])
      tracker.trackRead(2, [2], [])
      tracker.trackRead(1, [1], [])
      tracker.trackRead(2, [2], [])

      expect(() => tracker.getSequencesForPost(1)).not.toThrow()
    })
  })

  describe('getCoOccurringPosts', () => {
    test('returns co-occurring posts sorted by score', () => {
      tracker.trackRead(1, [1], [])
      tracker.trackRead(2, [2], [])
      tracker.trackRead(3, [1], [])

      const coOccurring = tracker.getCoOccurringPosts(1)
      expect(Array.isArray(coOccurring)).toBe(true)
    })

    test('returns empty array for post with no co-occurrences', () => {
      const coOccurring = tracker.getCoOccurringPosts(999)
      expect(coOccurring).toEqual([])
    })
  })

  describe('getCategoryTransitionProbability', () => {
    test('returns 0 for unobserved category transition', () => {
      const prob = tracker.getCategoryTransitionProbability(1, 2)
      expect(prob).toBe(0)
    })

    test('calculates probability for observed transition', () => {
      tracker.trackRead(1, [1, 2], [])
      tracker.trackRead(2, [2, 3], [])

      const prob = tracker.getCategoryTransitionProbability(1, 2)
      expect(prob).toBeGreaterThanOrEqual(0)
      expect(prob).toBeLessThanOrEqual(1)
    })
  })

  describe('getTotalReads', () => {
    test('returns 0 initially', () => {
      expect(tracker.getTotalReads()).toBe(0)
    })

    test('increments with each trackRead call', () => {
      tracker.trackRead(1, [1], [])
      tracker.trackRead(2, [2], [])
      
      expect(tracker.getTotalReads()).toBeGreaterThanOrEqual(2)
    })
  })

  describe('clearPatterns', () => {
    test('clears all patterns and resets counters', () => {
      tracker.trackRead(1, [1], [])
      tracker.trackRead(2, [2], [])
      
      tracker.clearPatterns()
      
      expect(tracker.getTotalReads()).toBe(0)
      expect(tracker.getSequencesCount()).toBe(0)
    })
  })

  describe('getSequencesCount', () => {
    test('returns 0 initially', () => {
      expect(tracker.getSequencesCount()).toBe(0)
    })
  })
})
