import { render, screen, waitFor } from '@testing-library/react'
import PersonalizedRecommendations from '@/components/post/PersonalizedRecommendations'
import React from 'react'

jest.mock('@/lib/utils/sanitizeHTML', () => ({
  sanitizeHTML: jest.fn((html: string) => html),
}))

jest.mock('@/lib/utils/readingHistory', () => ({
  getTopCategories: jest.fn(() => [1, 2]),
  trackRecommendationClick: jest.fn(),
}))

jest.mock('@/lib/api/config', () => ({
  FEATURE_FLAGS: {
    PERSONALIZED_RECOMMENDATIONS: true,
    RECOMMENDATION_ANALYTICS: false,
  },
  RECOMMENDATION_CONFIG: {
    MAX_RECOMMENDATIONS: 3,
  },
}))

jest.mock('@/lib/constants/uiText', () => ({
  UI_TEXT: {
    homePage: {
      personalizedRecommendations: 'Rekomendasi Untuk Anda',
    },
  },
}))

jest.mock('next/link', () => {
  return function MockLink({ children, href, onClick, 'aria-label': ariaLabel }: any) {
    return (
      <a href={href} onClick={onClick} aria-label={ariaLabel}>
        {children}
      </a>
    )
  }
})

jest.mock('next/image', () => {
  return function MockImage({ src, alt }: any) {
    return <img src={src} alt={alt} />
  }
})

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('PersonalizedRecommendations Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockFetch.mockReset()
  })

  describe('Loading state', () => {
    test('renders loading skeleton', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      render(<PersonalizedRecommendations currentPostId={1} currentCategoryIds={[1]} />)

      expect(screen.getByText('Rekomendasi Untuk Anda')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Rekomendasi Untuk Anda' })).toBeInTheDocument()
    })
  })

  describe('No recommendations', () => {
    test('returns null when no recommendations found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const { container } = render(<PersonalizedRecommendations currentPostId={1} currentCategoryIds={[1]} />)

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })

    test('returns null when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      })

      const { container } = render(<PersonalizedRecommendations currentPostId={1} currentCategoryIds={[1]} />)

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })

    test('returns null when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { container } = render(<PersonalizedRecommendations currentPostId={1} currentCategoryIds={[1]} />)

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })
  })

  describe('With recommendations', () => {
    const mockPosts = [
      {
        id: 2,
        title: { rendered: 'Related Post 1' },
        excerpt: { rendered: '<p>Excerpt 1</p>' },
        slug: 'related-post-1',
        featured_media: 0,
        date: '2026-01-10T10:00:00',
      },
      {
        id: 3,
        title: { rendered: 'Related Post 2' },
        excerpt: { rendered: '<p>Excerpt 2</p>' },
        slug: 'related-post-2',
        featured_media: 0,
        date: '2026-01-11T10:00:00',
      },
    ]

    test('renders recommendations when available', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPosts,
      })

      render(<PersonalizedRecommendations currentPostId={1} currentCategoryIds={[1]} />)

      await waitFor(() => {
        expect(screen.getByText('Related Post 1')).toBeInTheDocument()
        expect(screen.getByText('Related Post 2')).toBeInTheDocument()
      })

      expect(screen.getByRole('heading', { name: 'Rekomendasi Untuk Anda' })).toBeInTheDocument()
    })

    test('excludes current post from recommendations', async () => {
      const postsWithCurrentPost = [
        ...mockPosts,
        { id: 1, title: { rendered: 'Current Post' }, excerpt: { rendered: '' }, slug: 'current', featured_media: 0, date: '' },
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => postsWithCurrentPost,
      })

      render(<PersonalizedRecommendations currentPostId={1} currentCategoryIds={[1]} />)

      await waitFor(() => {
        expect(screen.queryByText('Current Post')).not.toBeInTheDocument()
      })
    })

    test('filters out already read posts from localStorage', async () => {
      localStorage.setItem('reading_history', JSON.stringify({ items: [{ postId: 2 }] }))

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPosts,
      })

      render(<PersonalizedRecommendations currentPostId={1} currentCategoryIds={[1]} />)

      await waitFor(() => {
        expect(screen.queryByText('Related Post 1')).not.toBeInTheDocument()
        expect(screen.getByText('Related Post 2')).toBeInTheDocument()
      })
    })

    test('handles media fetch gracefully', async () => {
      const postsWithMedia = [
        {
          id: 2,
          title: { rendered: 'Post Title' },
          excerpt: { rendered: '<p>Excerpt</p>' },
          slug: 'post-title',
          featured_media: 999,
          date: '2026-01-10T10:00:00',
        },
      ]

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => postsWithMedia,
        })
        .mockResolvedValueOnce({
          ok: false,
        })

      render(<PersonalizedRecommendations currentPostId={1} currentCategoryIds={[1]} />)

      await waitFor(() => {
        expect(screen.getByText('Post Title')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('has proper heading association', async () => {
      const mockPosts = [
        {
          id: 2,
          title: { rendered: 'Test Post' },
          excerpt: { rendered: '<p>Excerpt</p>' },
          slug: 'test-post',
          featured_media: 0,
          date: '2026-01-10T10:00:00',
        },
      ]

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockPosts,
      })

      render(<PersonalizedRecommendations currentPostId={1} currentCategoryIds={[1]} />)

      const heading = await screen.findByRole('heading', { name: 'Rekomendasi Untuk Anda' })
      expect(heading.id).toBe('personalized-heading')
    })
  })
})
