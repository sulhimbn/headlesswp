import { calculateReadingTime, getReadingTimeText } from '@/lib/utils/readingTime'

describe('readingTime', () => {
  describe('calculateReadingTime', () => {
    test('returns 0 for empty string', () => {
      expect(calculateReadingTime('')).toBe(0)
    })

    test('returns 0 for null/undefined', () => {
      expect(calculateReadingTime(null as unknown as string)).toBe(0)
      expect(calculateReadingTime(undefined as unknown as string)).toBe(0)
    })

    test('calculates reading time for plain text', () => {
      const text = 'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words. ' +
        'This is a test content with exactly two hundred words.'
      
      expect(calculateReadingTime(text)).toBe(1)
    })

    test('calculates reading time for HTML content', () => {
      const html = '<p>This is a <strong>test</strong> content.</p>' +
        '<p>Another paragraph here.</p>'
      
      const result = calculateReadingTime(html)
      expect(result).toBeGreaterThan(0)
    })

    test('strips HTML tags before calculating', () => {
      const html = '<div><p>Just five words here.</p></div>'
      const plainText = 'Just five words here.'
      
      expect(calculateReadingTime(html)).toBe(calculateReadingTime(plainText))
    })

    test('rounds up to nearest minute', () => {
      const text = 'One two three four five six seven eight nine ten.'
      expect(calculateReadingTime(text)).toBe(1)
    })
  })

  describe('getReadingTimeText', () => {
    test('returns formatted text with min read', () => {
      expect(getReadingTimeText(1)).toBe('1 min read')
      expect(getReadingTimeText(5)).toBe('5 min read')
      expect(getReadingTimeText(10)).toBe('10 min read')
    })

    test('handles zero', () => {
      expect(getReadingTimeText(0)).toBe('0 min read')
    })
  })
})
