import sitemap from '@/app/sitemap'
import { standardizedAPI } from '@/lib/api/standardized'
import { cacheManager } from '@/lib/cache'

jest.mock('@/lib/api/standardized', () => ({
  standardizedAPI: {
    getAllPosts: jest.fn(),
    getAllCategories: jest.fn(),
    getAllTags: jest.fn(),
  },
}))

jest.mock('@/lib/cache', () => {
  const actual = jest.requireActual('@/lib/cache')
  return {
    ...actual,
    cacheManager: {
      get: jest.fn(),
      set: jest.fn(),
    },
  }
})

function successList<T>(data: T[]) {
  return {
    data,
    error: null,
    metadata: { timestamp: new Date().toISOString(), endpoint: '/test' },
    pagination: { page: 1, perPage: data.length, total: data.length, totalPages: 1 },
  }
}

describe('sitemap (SEO-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(cacheManager.get as jest.Mock).mockReturnValue(undefined)
  })

  test('includes homepage, posts, categories, tags, and derived authors', async () => {
    ;(standardizedAPI.getAllPosts as jest.Mock).mockResolvedValue(
      successList([
        { id: 1, slug: 'post-1', date: '2026-01-01', modified: '2026-01-02', author: 7 },
        { id: 2, slug: 'post-2', date: '2026-01-03', modified: '2026-01-03', author: 7 },
        { id: 3, slug: 'post-3', date: '2026-01-04', modified: '2026-01-04', author: 9 },
      ])
    )
    ;(standardizedAPI.getAllCategories as jest.Mock).mockResolvedValue(
      successList([{ id: 1, slug: 'politik' }])
    )
    ;(standardizedAPI.getAllTags as jest.Mock).mockResolvedValue(
      successList([{ id: 10, slug: 'banten' }])
    )

    const entries = await sitemap()
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://mitrabantennews.com')
    expect(urls).toContain('https://mitrabantennews.com/berita')
    expect(urls).toContain('https://mitrabantennews.com/kategori')
    expect(urls).toContain('https://mitrabantennews.com/tag')
    expect(urls).toContain('https://mitrabantennews.com/berita/post-1')
    expect(urls).toContain('https://mitrabantennews.com/kategori/politik')
    expect(urls).toContain('https://mitrabantennews.com/tag/banten')
    // Authors derived from unique post author IDs (no /users list endpoint).
    expect(urls).toContain('https://mitrabantennews.com/author/7')
    expect(urls).toContain('https://mitrabantennews.com/author/9')
    expect(urls.filter((u) => u.includes('/author/'))).toHaveLength(2)
  })

  test('returns cached sitemap without hitting the API', async () => {
    const cached = [{ url: 'https://mitrabantennews.com', lastModified: new Date() }]
    ;(cacheManager.get as jest.Mock).mockReturnValue(cached)

    const entries = await sitemap()

    expect(entries).toEqual(cached)
    expect(standardizedAPI.getAllPosts).not.toHaveBeenCalled()
  })

  test('falls back to static pages on API failure', async () => {
    ;(standardizedAPI.getAllPosts as jest.Mock).mockRejectedValue(new Error('down'))
    ;(standardizedAPI.getAllCategories as jest.Mock).mockRejectedValue(new Error('down'))
    ;(standardizedAPI.getAllTags as jest.Mock).mockRejectedValue(new Error('down'))

    const entries = await sitemap()
    const urls = entries.map((e) => e.url)

    expect(urls).toContain('https://mitrabantennews.com')
    expect(urls).toContain('https://mitrabantennews.com/berita')
  })
})
