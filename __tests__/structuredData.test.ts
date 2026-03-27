import {
  generateBreadcrumbList,
  generateArticleSchema,
  generateWebsiteSchema,
  generateOrganizationSchema,
  generateCollectionPageSchema,
  generateSearchResultsPageSchema,
  generateBreadcrumbSchemaForPage,
  DEFAULT_ORGANIZATION,
} from '@/lib/seo/structuredData'
import { SITE_URL } from '@/lib/api/config'

describe('structuredData', () => {
  describe('generateBreadcrumbList', () => {
    it('should generate valid BreadcrumbList schema', () => {
      const items = [
        { name: 'Home', url: 'https://example.com' },
        { name: 'Category', url: 'https://example.com/category' },
      ]
      const result = generateBreadcrumbList(items)

      expect(result).toHaveProperty('@context', 'https://schema.org')
      expect(result).toHaveProperty('@type', 'BreadcrumbList')
      expect(result.itemListElement).toHaveLength(2)
      expect(result.itemListElement[0]).toHaveProperty('position', 1)
      expect(result.itemListElement[0]).toHaveProperty('name', 'Home')
    })
  })

  describe('generateArticleSchema', () => {
    it('should generate valid NewsArticle schema', () => {
      const result = generateArticleSchema({
        headline: 'Test Article',
        description: 'Test description',
        url: `${SITE_URL}/berita/test-article`,
        image: `${SITE_URL}/image.jpg`,
        datePublished: '2024-01-01T00:00:00Z',
        dateModified: '2024-01-02T00:00:00Z',
        author: { name: 'John Doe' },
      })

      expect(result).toHaveProperty('@context', 'https://schema.org')
      expect(result).toHaveProperty('@type', 'NewsArticle')
      expect(result).toHaveProperty('headline', 'Test Article')
      expect(result).toHaveProperty('description', 'Test description')
      expect(result.author).toHaveLength(1)
      expect(result.author[0]).toHaveProperty('name', 'John Doe')
      expect(result.publisher).toHaveProperty('name', 'Mitra Banten News')
    })
  })

  describe('generateWebsiteSchema', () => {
    it('should generate valid WebSite schema with searchAction', () => {
      const result = generateWebsiteSchema(DEFAULT_ORGANIZATION)

      expect(result).toHaveProperty('@context', 'https://schema.org')
      expect(result).toHaveProperty('@type', 'WebSite')
      expect(result).toHaveProperty('name', 'Mitra Banten News')
      expect(result).toHaveProperty('url', SITE_URL)
      expect(result.potentialAction).toHaveProperty('@type', 'SearchAction')
      expect(result.potentialAction).toHaveProperty('target')
      expect(result.potentialAction['query-input']).toBe('required name=search_term_string')
    })
  })

  describe('generateOrganizationSchema', () => {
    it('should generate valid Organization schema', () => {
      const result = generateOrganizationSchema(DEFAULT_ORGANIZATION)

      expect(result).toHaveProperty('@context', 'https://schema.org')
      expect(result).toHaveProperty('@type', 'Organization')
      expect(result).toHaveProperty('name', 'Mitra Banten News')
      expect(result).toHaveProperty('url', SITE_URL)
      expect(result).toHaveProperty('logo', `${SITE_URL}/logo.png`)
      expect(result).toHaveProperty('contactPoint')
    })

    it('should include sameAs when provided', () => {
      const org = {
        ...DEFAULT_ORGANIZATION,
        sameAs: ['https://facebook.com/example', 'https://twitter.com/example'],
      }
      const result = generateOrganizationSchema(org)

      expect(result.sameAs).toHaveLength(2)
      expect(result.sameAs).toContain('https://facebook.com/example')
    })
  })

  describe('generateCollectionPageSchema', () => {
    it('should generate valid CollectionPage schema', () => {
      const result = generateCollectionPageSchema({
        name: 'Category News',
        description: 'News from category',
        url: `${SITE_URL}/kategori/politics`,
        numberOfItems: 10,
      })

      expect(result).toHaveProperty('@context', 'https://schema.org')
      expect(result).toHaveProperty('@type', 'CollectionPage')
      expect(result).toHaveProperty('name', 'Category News')
      expect(result).toHaveProperty('description', 'News from category')
      expect(result).toHaveProperty('url', `${SITE_URL}/kategori/politics`)
      expect(result).toHaveProperty('numberOfItems', 10)
      expect(result.isPartOf).toHaveProperty('url', SITE_URL)
    })
  })

  describe('generateSearchResultsPageSchema', () => {
    it('should generate valid SearchResultsPage schema', () => {
      const result = generateSearchResultsPageSchema({
        query: 'election',
        resultCount: 25,
        url: `${SITE_URL}/cari?q=election`,
      })

      expect(result).toHaveProperty('@context', 'https://schema.org')
      expect(result).toHaveProperty('@type', 'SearchResultsPage')
      expect(result).toHaveProperty('name', 'Hasil pencarian: election')
      expect(result).toHaveProperty('description')
      expect(result).toHaveProperty('numberOfItems', 25)
      expect(result.mainEntity).toHaveProperty('@type', 'ItemList')
    })
  })

  describe('generateBreadcrumbSchemaForPage', () => {
    it('should generate valid BreadcrumbList with full URLs', () => {
      const items = [
        { label: 'Beranda', href: '/' },
        { label: 'Berita', href: '/berita' },
        { label: 'Test Article', href: '/berita/test-article' },
      ]
      const result = generateBreadcrumbSchemaForPage(items)

      expect(result).toHaveProperty('@context', 'https://schema.org')
      expect(result).toHaveProperty('@type', 'BreadcrumbList')
      expect(result.itemListElement).toHaveLength(3)
      expect(result.itemListElement[0]).toHaveProperty('position', 1)
      expect(result.itemListElement[0]).toHaveProperty('name', 'Beranda')
      expect(result.itemListElement[0]).toHaveProperty('item', SITE_URL + '/')
    })

    it('should handle external URLs without prefixing', () => {
      const items = [
        { label: 'Home', href: 'https://external.com' },
      ]
      const result = generateBreadcrumbSchemaForPage(items)

      expect(result.itemListElement[0].item).toBe('https://external.com')
    })
  })

  describe('DEFAULT_ORGANIZATION', () => {
    it('should have required properties', () => {
      expect(DEFAULT_ORGANIZATION).toHaveProperty('name')
      expect(DEFAULT_ORGANIZATION).toHaveProperty('url')
      expect(DEFAULT_ORGANIZATION).toHaveProperty('logo')
    })
  })
})
