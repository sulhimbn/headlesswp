import { render } from '@testing-library/react'
import ReadingTracker from '@/components/post/ReadingTracker'
import React from 'react'

jest.mock('@/components/hooks/useReadingTracker', () => ({
  useReadingTracker: jest.fn(),
}))

import { useReadingTracker } from '@/components/hooks/useReadingTracker'

describe('ReadingTracker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useReadingTracker as jest.Mock).mockClear()
  })

  test('calls useReadingTracker with correct props', () => {
    render(
      <ReadingTracker
        postId={123}
        slug="test-slug"
        title="Test Title"
        categoryIds={[1, 2]}
        tagIds={[3, 4]}
      />
    )

    expect(useReadingTracker).toHaveBeenCalledWith({
      postId: 123,
      slug: 'test-slug',
      title: 'Test Title',
      categoryIds: [1, 2],
      tagIds: [3, 4],
      enabled: true,
    })
  })

  test('renders null', () => {
    const { container } = render(
      <ReadingTracker
        postId={1}
        slug="test"
        title="Test"
        categoryIds={[]}
        tagIds={[]}
      />
    )

    expect(container.firstChild).toBeNull()
  })

  test('works with empty categoryIds and tagIds', () => {
    render(
      <ReadingTracker
        postId={1}
        slug="test-slug"
        title="Test Title"
        categoryIds={[]}
        tagIds={[]}
      />
    )

    expect(useReadingTracker).toHaveBeenCalledWith({
      postId: 1,
      slug: 'test-slug',
      title: 'Test Title',
      categoryIds: [],
      tagIds: [],
      enabled: true,
    })
  })

  test('passes through different postId values', () => {
    const { rerender } = render(
      <ReadingTracker
        postId={1}
        slug="slug-1"
        title="Title 1"
        categoryIds={[1]}
        tagIds={[1]}
      />
    )

    expect(useReadingTracker).toHaveBeenLastCalledWith(
      expect.objectContaining({ postId: 1 })
    )

    rerender(
      <ReadingTracker
        postId={2}
        slug="slug-2"
        title="Title 2"
        categoryIds={[2]}
        tagIds={[2]}
      />
    )

    expect(useReadingTracker).toHaveBeenLastCalledWith(
      expect.objectContaining({ postId: 2 })
    )
  })
})
