import DOMPurify from 'dompurify'

describe('XSS Protection Tests', () => {
  describe('DOMPurify sanitization', () => {
    test('should remove script tags from HTML content', () => {
      const maliciousHTML = '<p>Valid content</p><script>alert("XSS")</script>'
      const sanitized = DOMPurify.sanitize(maliciousHTML)
      
      expect(sanitized).toBe('<p>Valid content</p>')
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert("XSS")')
    })

    test('should remove onclick handlers', () => {
      const maliciousHTML = '<p onclick="alert(\'XSS\')">Click me</p>'
      const sanitized = DOMPurify.sanitize(maliciousHTML)
      
      expect(sanitized).toBe('<p>Click me</p>')
      expect(sanitized).not.toContain('onclick')
      expect(sanitized).not.toContain('alert')
    })

    test('should preserve safe HTML elements', () => {
      const safeHTML = '<p><strong>Bold text</strong> and <em>italic text</em></p>'
      const sanitized = DOMPurify.sanitize(safeHTML)
      
      expect(sanitized).toBe(safeHTML)
    })

    test('should handle WordPress excerpt content safely', () => {
      const wordpressExcerpt = '<p>This is a <strong>sample</strong> excerpt.</p>'
      const sanitized = DOMPurify.sanitize(wordpressExcerpt)
      
      expect(sanitized).toBe(wordpressExcerpt)
    })

    test('should remove dangerous iframe tags', () => {
      const maliciousHTML = '<p>Content</p><iframe src="javascript:alert(\'XSS\')"></iframe>'
      const sanitized = DOMPurify.sanitize(maliciousHTML)
      
      expect(sanitized).toBe('<p>Content</p>')
      expect(sanitized).not.toContain('<iframe')
    })

    test('should handle empty or null content gracefully', () => {
      expect(DOMPurify.sanitize('')).toBe('')
      expect(DOMPurify.sanitize(null as any)).toBe('')
      expect(DOMPurify.sanitize(undefined as any)).toBe('')
    })
  })
})