import {
  getWordPressImageUrl,
  generateResponsiveSrcSet,
  generateBlurDataURL,
  fetchWordPressMedia,
  getMediaSizes,
  optimizeMedia,
  trackImageLoad,
  getImageLoadMetrics,
  clearMetricsCache,
} from '@/lib/utils/mediaOptimizer'

describe('mediaOptimizer', () => {
  describe('getWordPressImageUrl', () => {
    it('returns empty string for empty input', () => {
      expect(getWordPressImageUrl('')).toBe('')
    })

    it('returns base URL when no dimensions specified', () => {
      const url = 'https://example.com/image.jpg'
      expect(getWordPressImageUrl(url)).toBe(url)
    })

    it('adds width parameter', () => {
      const url = getWordPressImageUrl('https://example.com/image.jpg', 800)
      expect(url).toContain('w=800')
    })

    it('adds height parameter', () => {
      const url = getWordPressImageUrl('https://example.com/image.jpg', undefined, 600)
      expect(url).toContain('h=600')
    })

    it('adds both width and height parameters', () => {
      const url = getWordPressImageUrl('https://example.com/image.jpg', 800, 600)
      expect(url).toContain('w=800')
      expect(url).toContain('h=600')
    })
  })

  describe('generateResponsiveSrcSet', () => {
    it('returns empty string for empty input', () => {
      expect(generateResponsiveSrcSet('')).toBe('')
    })

    it('generates srcset with default widths', () => {
      const srcset = generateResponsiveSrcSet('https://example.com/image.jpg')
      expect(srcset).toContain('320w')
      expect(srcset).toContain('640w')
      expect(srcset).toContain('960w')
      expect(srcset).toContain('1280w')
      expect(srcset).toContain('1920w')
    })

    it('generates srcset with custom widths', () => {
      const srcset = generateResponsiveSrcSet('https://example.com/image.jpg', [400, 800])
      expect(srcset).toContain('400w')
      expect(srcset).toContain('800w')
      expect(srcset).not.toContain('320w')
    })
  })

  describe('generateBlurDataURL', () => {
    it('returns default placeholder for new image', () => {
      const placeholder = generateBlurDataURL('https://example.com/new-image.jpg')
      expect(placeholder).toBeTruthy()
      expect(placeholder).toContain('data:image')
    })

    it('returns cached value for previously seen image', () => {
      const url = 'https://example.com/cached-image.jpg'
      const first = generateBlurDataURL(url)
      const second = generateBlurDataURL(url)
      expect(first).toBe(second)
    })
  })

  describe('getMediaSizes', () => {
    it('returns correct sizes for thumbnail', () => {
      const sizes = getMediaSizes('thumbnail')
      expect(sizes).toContain('100vw')
    })

    it('returns correct sizes for card', () => {
      const sizes = getMediaSizes('card')
      expect(sizes).toContain('50vw')
    })

    it('returns correct sizes for hero', () => {
      const sizes = getMediaSizes('hero')
      expect(sizes).toBe('100vw')
    })

    it('returns correct sizes for content', () => {
      const sizes = getMediaSizes('content')
      expect(sizes).toContain('75vw')
    })

    it('falls back to card sizes for unknown context', () => {
      const sizes = getMediaSizes('unknown' as 'thumbnail')
      expect(sizes).toContain('50vw')
    })
  })

  describe('fetchWordPressMedia', () => {
    it('returns null for invalid media ID', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
      })
      const result = await fetchWordPressMedia(999)
      expect(result).toBeNull()
    })

    it('returns media data for valid ID', async () => {
      const mockMedia = {
        id: 1,
        source_url: 'https://example.com/image.jpg',
        title: { rendered: 'Test Image' },
        alt_text: 'Test alt',
        media_type: 'image',
        mime_type: 'image/jpeg',
      }
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMedia),
      })
      const result = await fetchWordPressMedia(1)
      expect(result).toEqual(mockMedia)
    })
  })

  describe('optimizeMedia', () => {
    it('returns null for null media', async () => {
      const result = await optimizeMedia(null)
      expect(result).toBeNull()
    })

    it('returns optimized media with default options', async () => {
      const media = {
        id: 1,
        source_url: 'https://example.com/image.jpg',
        title: { rendered: 'Test' },
        alt_text: 'Alt text',
        media_type: 'image',
        mime_type: 'image/jpeg',
      }
      const result = await optimizeMedia(media)
      expect(result?.url).toBe(media.source_url)
      expect(result?.alt).toBe('Alt text')
    })

    it('includes blur placeholder for priority images', async () => {
      const media = {
        id: 1,
        source_url: 'https://example.com/image.jpg',
        title: { rendered: 'Test' },
        alt_text: 'Alt',
        media_type: 'image',
        mime_type: 'image/jpeg',
      }
      const result = await optimizeMedia(media, { priority: true })
      expect(result?.blurDataURL).toBeTruthy()
    })
  })

  describe('trackImageLoad', () => {
    beforeEach(() => {
      clearMetricsCache()
    })

    it('tracks image load metrics', () => {
      trackImageLoad('https://example.com/image.jpg', {
        loadTime: 100,
        size: 5000,
      })
      const metrics = getImageLoadMetrics('https://example.com/image.jpg')
      expect(metrics?.loadTime).toBe(100)
      expect(metrics?.size).toBe(5000)
    })

    it('extracts format from URL', () => {
      trackImageLoad('https://example.com/image.jpg', {
        loadTime: 50,
        size: 1000,
      })
      const metrics = getImageLoadMetrics('https://example.com/image.jpg')
      expect(metrics?.format).toBe('jpg')
    })
  })
})
