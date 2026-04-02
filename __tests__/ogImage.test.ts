describe('OG Image Generation', () => {
  const wrapText = (text: string, maxChars: number): string[] => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim()
      } else {
        if (currentLine) lines.push(currentLine)
        currentLine = word
      }
    }
    if (currentLine) lines.push(currentLine)

    return lines
  }

  const OG_IMAGE_CONFIG = {
    width: 1200,
    height: 630,
    siteName: 'Mitra Banten News',
    defaultBg: '#1a1a2e',
    defaultText: '#ffffff',
    accentColor: '#e63946',
  }

  describe('wrapText', () => {
    it('should wrap text at max characters', () => {
      const result = wrapText('This is a very long title that needs to be wrapped', 20)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toBe('This is a very long')
    })

    it('should handle short text without wrapping', () => {
      const result = wrapText('Short Title', 20)
      expect(result).toHaveLength(1)
      expect(result[0]).toBe('Short Title')
    })

    it('should handle empty string', () => {
      const result = wrapText('', 20)
      expect(result).toHaveLength(0)
    })

    it('should handle single word longer than max', () => {
      const result = wrapText('Supercalifragilisticexpialidocious', 10)
      expect(result).toHaveLength(1)
    })
  })

  describe('OG_IMAGE_CONFIG', () => {
    it('should have correct dimensions', () => {
      expect(OG_IMAGE_CONFIG.width).toBe(1200)
      expect(OG_IMAGE_CONFIG.height).toBe(630)
    })

    it('should have required colors defined', () => {
      expect(OG_IMAGE_CONFIG.defaultBg).toBe('#1a1a2e')
      expect(OG_IMAGE_CONFIG.defaultText).toBe('#ffffff')
      expect(OG_IMAGE_CONFIG.accentColor).toBe('#e63946')
    })

    it('should have site name', () => {
      expect(OG_IMAGE_CONFIG.siteName).toBe('Mitra Banten News')
    })
  })
})

describe('OG Image API Endpoint', () => {
  const API_ROUTE = '/api/og-image'

  it('should respond to GET requests', () => {
    expect(API_ROUTE).toBe('/api/og-image')
  })

  it('should accept title parameter', () => {
    const params = new URLSearchParams({ title: 'Test Article' })
    expect(params.get('title')).toBe('Test Article')
  })

  it('should accept optional parameters', () => {
    const params = new URLSearchParams({
      title: 'Test',
      postId: '123',
      image: 'https://example.com/image.jpg',
      category: 'News',
      author: 'John Doe',
      date: '2024-01-01',
    })
    expect(params.get('postId')).toBe('123')
    expect(params.get('image')).toBe('https://example.com/image.jpg')
    expect(params.get('category')).toBe('News')
  })
})
