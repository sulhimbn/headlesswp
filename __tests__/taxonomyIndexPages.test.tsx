import { enhancedPostService } from '@/lib/services/enhancedPostService'
import KategoriIndexPage, { generateMetadata as kategoriMetadata } from '@/app/kategori/page'
import TagIndexPage, { generateMetadata as tagMetadata } from '@/app/tag/page'
import { render, screen } from '@testing-library/react'

jest.mock('@/lib/services/enhancedPostService')

describe('Taxonomy index pages (CAT-TAG-001/003, Indonesian routes)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('/kategori', () => {
    test('renders categories with counts and links', async () => {
      ;(enhancedPostService.getCategories as jest.Mock).mockResolvedValue([
        { id: 1, name: 'Politik', slug: 'politik', description: 'Berita politik', parent: 0, count: 5, link: '' },
      ])

      const Page = await KategoriIndexPage()
      render(Page)

      // sr-only h1 + visible SectionHeading h2 share the same text (project-wide pattern).
      expect(screen.getAllByRole('heading', { name: 'Semua Kategori' })).toHaveLength(2)
      const link = screen.getByRole('link', { name: /Politik/ })
      expect(link).toHaveAttribute('href', '/kategori/politik')
      expect(screen.getByText('5 artikel')).toBeInTheDocument()
    })

    test('renders empty state when no categories', async () => {
      ;(enhancedPostService.getCategories as jest.Mock).mockResolvedValue([])

      const Page = await KategoriIndexPage()
      render(Page)

      expect(screen.getByText('Tidak ada kategori')).toBeInTheDocument()
    })

    test('generateMetadata returns canonical URL', async () => {
      const meta = await kategoriMetadata()
      expect(meta.alternates?.canonical).toBe('https://mitrabantennews.com/kategori')
      expect(meta.title).toContain('Kategori')
    })
  })

  describe('/tag', () => {
    test('renders tags with counts and links', async () => {
      ;(enhancedPostService.getTags as jest.Mock).mockResolvedValue([
        { id: 10, name: 'banten', slug: 'banten', description: '', count: 7, link: '' },
      ])

      const Page = await TagIndexPage()
      render(Page)

      expect(screen.getAllByRole('heading', { name: 'Semua Tag' })).toHaveLength(2)
      const link = screen.getByRole('link', { name: /#banten/ })
      expect(link).toHaveAttribute('href', '/tag/banten')
    })

    test('renders empty state when no tags', async () => {
      ;(enhancedPostService.getTags as jest.Mock).mockResolvedValue([])

      const Page = await TagIndexPage()
      render(Page)

      expect(screen.getByText('Tidak ada tag')).toBeInTheDocument()
    })

    test('generateMetadata returns canonical URL', async () => {
      const meta = await tagMetadata()
      expect(meta.alternates?.canonical).toBe('https://mitrabantennews.com/tag')
      expect(meta.title).toContain('Tag')
    })
  })
})
