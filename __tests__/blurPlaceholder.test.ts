import { getPlaceholderBlur, isPlaceholderUrl } from '@/lib/utils/blurPlaceholder'

describe('blurPlaceholder', () => {
  describe('getPlaceholderBlur', () => {
    it('should return a base64 encoded blur placeholder', () => {
      const blur = getPlaceholderBlur()
      expect(blur).toBeTruthy()
      expect(blur.startsWith('data:image/jpeg;base64,')).toBe(true)
    })

    it('should always return the same value', () => {
      const blur1 = getPlaceholderBlur()
      const blur2 = getPlaceholderBlur()
      expect(blur1).toBe(blur2)
    })
  })

  describe('isPlaceholderUrl', () => {
    it('should return true for null', () => {
      expect(isPlaceholderUrl(null)).toBe(true)
    })

    it('should return true for undefined', () => {
      expect(isPlaceholderUrl(undefined)).toBe(true)
    })

    it('should return true for placeholder-image.jpg', () => {
      expect(isPlaceholderUrl('/placeholder-image.jpg')).toBe(true)
    })

    it('should return true for URLs containing placeholder', () => {
      expect(isPlaceholderUrl('https://example.com/placeholder.png')).toBe(true)
    })

    it('should return false for actual image URLs', () => {
      expect(isPlaceholderUrl('https://example.com/image.jpg')).toBe(false)
      expect(isPlaceholderUrl('https://cdn.example.com/media/photo.png')).toBe(false)
    })

    it('should return false for WordPress media URLs', () => {
      expect(isPlaceholderUrl('https://your-domain.com/wp-content/uploads/2024/01/photo.jpg')).toBe(false)
    })
  })
})
