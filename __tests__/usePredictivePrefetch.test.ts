import { renderHook, act } from '@testing-library/react'
import { usePredictivePrefetch, clearPrefetchMetrics } from '@/hooks/usePredictivePrefetch'

jest.mock('@/lib/services/readingPatternTracker', () => ({
  readingPatternTracker: {
    trackRead: jest.fn(),
    getCoOccurringPosts: jest.fn().mockReturnValue([]),
  },
}))

jest.mock('@/lib/services/popularityScorer', () => ({
  popularityScorer: {
    recordView: jest.fn(),
    predictNextPosts: jest.fn().mockReturnValue([2, 3, 4]),
    getScore: jest.fn(),
  },
}))

jest.mock('@/lib/api/config', () => ({
  FEATURE_FLAGS: {
    PERSONALIZED_RECOMMENDATIONS: true,
    RECOMMENDATION_ANALYTICS: true,
    PREDICTIVE_PREFETCH: true,
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

describe('usePredictivePrefetch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('Basic functionality', () => {
    test('returns prefetch function', () => {
      const { result } = renderHook(() =>
        usePredictivePrefetch({
          postId: 1,
          categoryIds: [1, 2],
        })
      )

      expect(typeof result.current.prefetch).toBe('function')
    })

    test('returns recordUsage function', () => {
      const { result } = renderHook(() =>
        usePredictivePrefetch({
          postId: 1,
          categoryIds: [1, 2],
        })
      )

      expect(typeof result.current.recordUsage).toBe('function')
    })

    test('returns getMetrics function', () => {
      const { result } = renderHook(() =>
        usePredictivePrefetch({
          postId: 1,
          categoryIds: [1, 2],
        })
      )

      expect(typeof result.current.getMetrics).toBe('function')
    })

    test('returns predictedPostIds array', () => {
      const { result } = renderHook(() =>
        usePredictivePrefetch({
          postId: 1,
          categoryIds: [1, 2],
        })
      )

      expect(Array.isArray(result.current.predictedPostIds)).toBe(true)
    })
  })

  describe('Disabled state', () => {
    test('does not throw when disabled', () => {
      const { result } = renderHook(() =>
        usePredictivePrefetch({
          postId: 1,
          categoryIds: [1, 2],
          enabled: false,
        })
      )

      expect(() => result.current.prefetch()).not.toThrow()
    })
  })

  describe('getMetrics', () => {
    test('returns valid metrics object', () => {
      const { result } = renderHook(() =>
        usePredictivePrefetch({
          postId: 1,
          categoryIds: [1, 2],
        })
      )

      const metrics = result.current.getMetrics()
      
      expect(metrics).toHaveProperty('prefetchedCount')
      expect(metrics).toHaveProperty('usedCount')
      expect(metrics).toHaveProperty('accuracy')
      expect(typeof metrics.prefetchedCount).toBe('number')
      expect(typeof metrics.usedCount).toBe('number')
      expect(typeof metrics.accuracy).toBe('number')
    })

    test('accuracy is between 0 and 1', () => {
      const { result } = renderHook(() =>
        usePredictivePrefetch({
          postId: 1,
          categoryIds: [1, 2],
        })
      )

      const metrics = result.current.getMetrics()
      
      expect(metrics.accuracy).toBeGreaterThanOrEqual(0)
      expect(metrics.accuracy).toBeLessThanOrEqual(1)
    })
  })

  describe('clearPrefetchMetrics', () => {
    test('clears metrics without throwing', () => {
      expect(() => clearPrefetchMetrics()).not.toThrow()
    })
  })

  describe('onPrefetch callback', () => {
    test('calls onPrefetch with URLs', () => {
      const onPrefetch = jest.fn()

      const { result } = renderHook(() =>
        usePredictivePrefetch({
          postId: 1,
          categoryIds: [1, 2],
          onPrefetch,
        })
      )

      act(() => {
        result.current.prefetch()
      })

      expect(onPrefetch).toHaveBeenCalled()
    })
  })

  describe('prefetchLimit option', () => {
    test('respects prefetchLimit', () => {
      const { result } = renderHook(() =>
        usePredictivePrefetch({
          postId: 1,
          categoryIds: [1, 2],
          prefetchLimit: 2,
        })
      )

      expect(() => result.current.prefetch()).not.toThrow()
    })
  })
})
