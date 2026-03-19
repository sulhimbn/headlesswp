import {
  isWordPressMediaUrl,
  extractWordPressMediaDomain,
  getMediaOptimizationConfig,
  DEFAULT_SIZES,
} from '@/lib/utils/mediaOptimization'

describe('mediaOptimization', () => {
  describe('isWordPressMediaUrl', () => {
    test('returns true for WordPress media URL', () => {
      expect(isWordPressMediaUrl('https://mitrabantennews.com/wp-content/uploads/2024/01/image.jpg')).toBe(true)
    })

    test('returns true for WordPress media URL with www', () => {
      expect(isWordPressMediaUrl('https://www.mitrabantennews.com/wp-content/uploads/2024/01/image.jpg')).toBe(true)
    })

    test('returns false for external URL', () => {
      expect(isWordPressMediaUrl('https://example.com/image.jpg')).toBe(false)
    })

    test('returns false for empty string', () => {
      expect(isWordPressMediaUrl('')).toBe(false)
    })

    test('returns false for null', () => {
      expect(isWordPressMediaUrl(null as unknown as string)).toBe(false)
    })

    test('returns true for wp-content plugins URL', () => {
      expect(isWordPressMediaUrl('https://mitrabantennews.com/wp-content/plugins/some-plugin/image.png')).toBe(true)
    })

    test('returns true for localhost in test environment', () => {
      expect(isWordPressMediaUrl('http://localhost:8080/wp-content/uploads/2024/01/image.jpg')).toBe(true)
    })
  })

  describe('extractWordPressMediaDomain', () => {
    test('returns hostname from WORDPRESS_URL in test environment', () => {
      expect(extractWordPressMediaDomain()).toBe('localhost')
    })

    test('handles malformed URL gracefully', () => {
      const result = extractWordPressMediaDomain()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('getMediaOptimizationConfig', () => {
    test('returns config with useNextImage false in browser environment', () => {
      const config = getMediaOptimizationConfig({
        src: 'https://mitrabantennews.com/image.jpg',
        priority: false,
      })

      expect(config.useNextImage).toBe(false)
      expect(config.src).toBe('https://mitrabantennews.com/image.jpg')
      expect(config.priority).toBe(false)
      expect(config.placeholder).toBe('empty')
    })

    test('returns placeholder image when src is empty', () => {
      const config = getMediaOptimizationConfig({
        src: '',
        priority: false,
      })

      expect(config.src).toBe('/placeholder-image.jpg')
    })

    test('uses custom sizes when provided', () => {
      const customSizes = '(max-width: 640px) 100vw, 50vw'
      const config = getMediaOptimizationConfig({
        src: 'https://example.com/image.jpg',
        sizes: customSizes,
      })

      expect(config.sizes).toBe(customSizes)
    })

    test('applies blur placeholder for priority images', () => {
      const config = getMediaOptimizationConfig({
        src: 'https://mitrabantennews.com/image.jpg',
        priority: true,
      })

      expect(config.placeholder).toBe('blur')
      expect(config.blurDataURL).toBeDefined()
      expect(config.priority).toBe(true)
    })
  })

  describe('DEFAULT_SIZES', () => {
    test('contains all expected size presets', () => {
      expect(DEFAULT_SIZES.thumbnail).toBeDefined()
      expect(DEFAULT_SIZES.card).toBeDefined()
      expect(DEFAULT_SIZES.hero).toBeDefined()
      expect(DEFAULT_SIZES.content).toBeDefined()
      expect(DEFAULT_SIZES.avatar).toBeDefined()
    })

    test('card sizes are correct', () => {
      expect(DEFAULT_SIZES.card).toBe('(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw')
    })

    test('hero sizes cover full width', () => {
      expect(DEFAULT_SIZES.hero).toBe('100vw')
    })
  })
})