import { sanitizeHtml, sanitizeText, isValidUrl } from '@/lib/content-sanitizer'

describe('Content Sanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const maliciousHtml = '<p>Safe content</p><script>alert("xss")</script>'
      const result = sanitizeHtml(maliciousHtml)
      expect(result).toBe('<p>Safe content</p>')
      expect(result).not.toContain('<script>')
    })

    it('should remove onclick handlers', () => {
      const maliciousHtml = '<p onclick="alert(\'xss\')">Click me</p>'
      const result = sanitizeHtml(maliciousHtml)
      expect(result).toBe('<p>Click me</p>')
      expect(result).not.toContain('onclick')
    })

    it('should preserve safe HTML tags', () => {
      const safeHtml = '<h1>Title</h1><p>Content with <strong>bold</strong> text</p>'
      const result = sanitizeHtml(safeHtml)
      expect(result).toBe(safeHtml)
    })

    it('should preserve safe attributes', () => {
      const safeHtml = '<a href="https://example.com" title="Link">Link</a>'
      const result = sanitizeHtml(safeHtml)
      expect(result).toBe(safeHtml)
    })

    it('should remove dangerous attributes', () => {
      const maliciousHtml = '<img src="image.jpg" onload="alert(\'xss\')" />'
      const result = sanitizeHtml(maliciousHtml)
      expect(result).toBe('<img src="image.jpg">')
      expect(result).not.toContain('onload')
    })

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml(null as any)).toBe('')
      expect(sanitizeHtml(undefined as any)).toBe('')
    })

    it('should handle WordPress content', () => {
      const wordpressContent = `
        <h2>Article Title</h2>
        <p>This is an article with <a href="https://mitrabantennews.com">links</a> and <strong>formatting</strong>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <blockquote>Quote content</blockquote>
      `
      const result = sanitizeHtml(wordpressContent)
      expect(result).toContain('<h2>Article Title</h2>')
      expect(result).toContain('<a href="https://mitrabantennews.com">links</a>')
      expect(result).toContain('<strong>formatting</strong>')
    })
  })

  describe('sanitizeText', () => {
    it('should extract plain text from HTML', () => {
      const html = '<h1>Title</h1><p>Content with <strong>bold</strong> text</p>'
      const result = sanitizeText(html)
      expect(result).toBe('TitleContent with bold text')
    })

    it('should handle empty input', () => {
      expect(sanitizeText('')).toBe('')
      expect(sanitizeText(null as any)).toBe('')
      expect(sanitizeText(undefined as any)).toBe('')
    })
  })

  describe('isValidUrl', () => {
    it('should allow valid HTTP URLs', () => {
      expect(isValidUrl('https://mitrabantennews.com')).toBe(true)
      expect(isValidUrl('https://www.mitrabantennews.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
    })

    it('should allow mailto and tel protocols', () => {
      expect(isValidUrl('mailto:test@example.com')).toBe(true)
      expect(isValidUrl('tel:+1234567890')).toBe(true)
    })

    it('should reject dangerous protocols', () => {
      expect(isValidUrl('javascript:alert("xss")')).toBe(false)
      expect(isValidUrl('data:text/html,<script>alert("xss")</script>')).toBe(false)
    })

    it('should reject external domains', () => {
      expect(isValidUrl('https://evil.com')).toBe(false)
      expect(isValidUrl('https://malicious-site.net')).toBe(false)
    })

    it('should handle invalid URLs', () => {
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('javascript:alert("xss")')).toBe(false)
      expect(isValidUrl('data:text/html,<script>alert("xss")</script>')).toBe(false)
      expect(isValidUrl(null as any)).toBe(false)
      expect(isValidUrl(undefined as any)).toBe(false)
    })
  })
})