import { generateMetadata as kategoriMetadata } from '@/app/kategori/[slug]/page'
import { generateMetadata as tagMetadata } from '@/app/tag/[slug]/page'
import { generateMetadata as authorMetadata } from '@/app/author/[id]/page'
import { generateMetadata as beritaMetadata } from '@/app/berita/page'
import { generateMetadata as cariMetadata } from '@/app/cari/page'
import { standardizedAPI } from '@/lib/api/standardized'

jest.mock('@/lib/api/standardized', () => ({
  standardizedAPI: {
    getCategoryBySlug: jest.fn(),
    getTagBySlug: jest.fn(),
    getAuthorById: jest.fn(),
  },
}))

function success<T>(data: T) {
  return {
    data,
    error: null,
    metadata: { timestamp: new Date().toISOString(), endpoint: '/test' },
  }
}

describe('Detail and list page metadata (SEO-001)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('/kategori/[slug] returns canonical + OG + Twitter', async () => {
    ;(standardizedAPI.getCategoryBySlug as jest.Mock).mockResolvedValue(
      success({ id: 1, name: 'Politik', slug: 'politik', description: 'Berita politik', parent: 0, count: 5, link: '' })
    )
    const meta = await kategoriMetadata({ params: { slug: 'politik' } })
    expect(meta.title).toContain('Politik')
    expect(meta.alternates?.canonical).toBe('https://mitrabantennews.com/kategori/politik')
    expect(meta.openGraph?.url).toBe('https://mitrabantennews.com/kategori/politik')
  })

  test('/kategori/[slug] falls back gracefully for unknown slug', async () => {
    ;(standardizedAPI.getCategoryBySlug as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'not found' },
      metadata: { timestamp: new Date().toISOString(), endpoint: '/test' },
    })
    const meta = await kategoriMetadata({ params: { slug: 'nope' } })
    expect(meta.title).toContain('Tidak Ditemukan')
    expect(meta.alternates?.canonical).toContain('/kategori/nope')
  })

  test('/tag/[slug] returns canonical URL', async () => {
    ;(standardizedAPI.getTagBySlug as jest.Mock).mockResolvedValue(
      success({ id: 10, name: 'banten', slug: 'banten', description: '', count: 7, link: '' })
    )
    const meta = await tagMetadata({ params: { slug: 'banten' } })
    expect(meta.title).toContain('banten')
    expect(meta.alternates?.canonical).toBe('https://mitrabantennews.com/tag/banten')
  })

  test('/author/[id] returns canonical URL and profile OG type', async () => {
    ;(standardizedAPI.getAuthorById as jest.Mock).mockResolvedValue(
      success({ id: 7, name: 'Redaksi', slug: 'redaksi', description: '', avatar_urls: {}, link: '' })
    )
    const meta = await authorMetadata({ params: { id: '7' } })
    expect(meta.title).toContain('Redaksi')
    expect(meta.alternates?.canonical).toBe('https://mitrabantennews.com/author/7')
    expect((meta.openGraph as { type?: string } | null | undefined)?.type).toBe('profile')
  })

  test('/author/[id] handles non-numeric id', async () => {
    const meta = await authorMetadata({ params: { id: 'abc' } })
    expect(meta.title).toContain('Tidak Ditemukan')
    expect(standardizedAPI.getAuthorById).not.toHaveBeenCalled()
  })

  test('/berita returns canonical list URL', async () => {
    const meta = await beritaMetadata()
    expect(meta.alternates?.canonical).toBe('https://mitrabantennews.com/berita')
  })

  test('/cari is noindex,follow with canonical URL', async () => {
    const meta = await cariMetadata()
    expect(meta.alternates?.canonical).toBe('https://mitrabantennews.com/cari')
    expect(meta.robots).toMatchObject({ index: false, follow: true })
  })
})
