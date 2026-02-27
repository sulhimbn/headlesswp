import { renderHook, act } from '@testing-library/react'
import { useReadingTracker } from '@/components/hooks/useReadingTracker'

jest.mock('@/lib/utils/readingHistory', () => ({
  addToReadingHistory: jest.fn(),
}))

import { addToReadingHistory } from '@/lib/utils/readingHistory'

describe('useReadingTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic functionality', () => {
    test('tracks post when enabled', () => {
      const { rerender } = renderHook(() =>
        useReadingTracker({
          postId: 1,
          slug: 'test-post',
          title: 'Test Post',
          categoryIds: [1, 2],
          tagIds: [3, 4],
          enabled: true,
        })
      )

      expect(addToReadingHistory).toHaveBeenCalledWith(
        1,
        'test-post',
        'Test Post',
        [1, 2],
        [3, 4]
      )
    })

    test('tracks post with default enabled=true', () => {
      renderHook(() =>
        useReadingTracker({
          postId: 1,
          slug: 'test-post',
          title: 'Test Post',
          categoryIds: [1],
          tagIds: [],
        })
      )

      expect(addToReadingHistory).toHaveBeenCalled()
    })
  })

  describe('Disabled state', () => {
    test('does not track when enabled=false', () => {
      renderHook(() =>
        useReadingTracker({
          postId: 1,
          slug: 'test-post',
          title: 'Test Post',
          categoryIds: [],
          tagIds: [],
          enabled: false,
        })
      )

      expect(addToReadingHistory).not.toHaveBeenCalled()
    })

    test('does not track when enabled becomes false', () => {
      const { rerender } = renderHook(
        ({ enabled }) =>
          useReadingTracker({
            postId: 1,
            slug: 'test-post',
            title: 'Test Post',
            categoryIds: [],
            tagIds: [],
            enabled,
          }),
        { initialProps: { enabled: true } }
      )

      jest.clearAllMocks()

      rerender({ enabled: false })

      expect(addToReadingHistory).not.toHaveBeenCalled()
    })
  })

  describe('SSR safety', () => {
    test('handles undefined window (SSR)', () => {
      const originalWindow = global.window

      delete (global as unknown as { window?: undefined }).window

      expect(() => {
        renderHook(() =>
          useReadingTracker({
            postId: 1,
            slug: 'test-post',
            title: 'Test Post',
            categoryIds: [],
            tagIds: [],
            enabled: true,
          })
        )
      }).not.toThrow()

      global.window = originalWindow
    })
  })

  describe('Dependency array changes', () => {
    test('tracks when postId changes', () => {
      const { rerender } = renderHook(
        ({ postId }) =>
          useReadingTracker({
            postId,
            slug: 'test-post',
            title: 'Test Post',
            categoryIds: [],
            tagIds: [],
          }),
        { initialProps: { postId: 1 } }
      )

      jest.clearAllMocks()

      rerender({ postId: 2 })

      expect(addToReadingHistory).toHaveBeenCalledWith(
        2,
        'test-post',
        'Test Post',
        [],
        []
      )
    })

    test('tracks when slug changes', () => {
      const { rerender } = renderHook(
        ({ slug }) =>
          useReadingTracker({
            postId: 1,
            slug,
            title: 'Test Post',
            categoryIds: [],
            tagIds: [],
          }),
        { initialProps: { slug: 'old-slug' } }
      )

      jest.clearAllMocks()

      rerender({ slug: 'new-slug' })

      expect(addToReadingHistory).toHaveBeenCalledWith(
        1,
        'new-slug',
        'Test Post',
        [],
        []
      )
    })

    test('tracks when title changes', () => {
      const { rerender } = renderHook(
        ({ title }) =>
          useReadingTracker({
            postId: 1,
            slug: 'test-post',
            title,
            categoryIds: [],
            tagIds: [],
          }),
        { initialProps: { title: 'Old Title' } }
      )

      jest.clearAllMocks()

      rerender({ title: 'New Title' })

      expect(addToReadingHistory).toHaveBeenCalledWith(
        1,
        'test-post',
        'New Title',
        [],
        []
      )
    })

    test('tracks when categoryIds changes', () => {
      const { rerender } = renderHook(
        ({ categoryIds }) =>
          useReadingTracker({
            postId: 1,
            slug: 'test-post',
            title: 'Test Post',
            categoryIds,
            tagIds: [],
          }),
        { initialProps: { categoryIds: [1] } }
      )

      jest.clearAllMocks()

      rerender({ categoryIds: [1, 2] })

      expect(addToReadingHistory).toHaveBeenCalledWith(
        1,
        'test-post',
        'Test Post',
        [1, 2],
        []
      )
    })

    test('tracks when tagIds changes', () => {
      const { rerender } = renderHook(
        ({ tagIds }) =>
          useReadingTracker({
            postId: 1,
            slug: 'test-post',
            title: 'Test Post',
            categoryIds: [],
            tagIds,
          }),
        { initialProps: { tagIds: [1] } }
      )

      jest.clearAllMocks()

      rerender({ tagIds: [1, 2] })

      expect(addToReadingHistory).toHaveBeenCalledWith(
        1,
        'test-post',
        'Test Post',
        [],
        [1, 2]
      )
    })

    test('does not track when dependencies stay the same', () => {
      const { rerender } = renderHook(
        ({ postId }) =>
          useReadingTracker({
            postId,
            slug: 'test-post',
            title: 'Test Post',
            categoryIds: [],
            tagIds: [],
          }),
        { initialProps: { postId: 1 } }
      )

      jest.clearAllMocks()

      rerender({ postId: 1 })

      expect(addToReadingHistory).not.toHaveBeenCalled()
    })
  })
})
