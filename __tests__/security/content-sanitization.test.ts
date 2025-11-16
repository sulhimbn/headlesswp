import DOMPurify from 'dompurify'

describe('Content Sanitization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('XSS Prevention', () => {
    it('removes script tags from HTML content', () => {
      const maliciousHTML = '<p>Valid content</p><script>alert("XSS")</script>'
      const sanitized = DOMPurify.sanitize(maliciousHTML)
      
      expect(sanitized).toBe('<p>Valid content</p>')
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert("XSS")')
    })

    it('removes onclick event handlers', () => {
      const maliciousHTML = '<div onclick="alert(\'XSS\')">Click me</div>'
      const sanitized = DOMPurify.sanitize(maliciousHTML)
      
      expect(sanitized).toBe('<div>Click me</div>')
      expect(sanitized).not.toContain('onclick')
    })

    it('removes javascript: URLs', () => {
      const maliciousHTML = '<a href="javascript:alert(\'XSS\')">Link</a>'
      const sanitized = DOMPurify.sanitize(maliciousHTML)
      
      expect(sanitized).toBe('<a>Link</a>')
      expect(sanitized).not.toContain('javascript:')
    })

    it('removes data URLs with script content', () => {
      const maliciousHTML = '<iframe src="data:text/html,<script>alert(\'XSS\')</script>"></iframe>'
      const sanitized = DOMPurify.sanitize(maliciousHTML)
      
      expect(sanitized).toBe('')
    })

    it('removes dangerous HTML5 attributes', () => {
      const maliciousHTML = '<div onmouseover="alert(\'XSS\')" onerror="alert(\'XSS\')">Content</div>'
      const sanitized = DOMPurify.sanitize(maliciousHTML)
      
      expect(sanitized).toBe('<div>Content</div>')
      expect(sanitized).not.toContain('onmouseover')
      expect(sanitized).not.toContain('onerror')
    })
  })

  describe('Safe HTML Preservation', () => {
    it('preserves basic HTML formatting', () => {
      const safeHTML = '<p>This is <strong>bold</strong> and <em>italic</em> text.</p>'
      const sanitized = DOMPurify.sanitize(safeHTML)
      
      expect(sanitized).toBe(safeHTML)
    })

    it('preserves heading elements', () => {
      const safeHTML = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>'
      const sanitized = DOMPurify.sanitize(safeHTML)
      
      expect(sanitized).toBe(safeHTML)
    })

    it('preserves list elements', () => {
      const safeHTML = '<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>First</li><li>Second</li></ol>'
      const sanitized = DOMPurify.sanitize(safeHTML)
      
      expect(sanitized).toBe(safeHTML)
    })

    it('preserves links with safe protocols', () => {
      const safeHTML = '<a href="https://example.com">Safe link</a><a href="mailto:test@example.com">Email</a>'
      const sanitized = DOMPurify.sanitize(safeHTML)
      
      expect(sanitized).toBe(safeHTML)
    })

    it('preserves images with safe attributes', () => {
      const safeHTML = '<img src="https://example.com/image.jpg" alt="Description" width="300" height="200">'
      const sanitized = DOMPurify.sanitize(safeHTML)
      
      expect(sanitized).toBe(safeHTML)
    })

    it('preserves blockquote elements', () => {
      const safeHTML = '<blockquote>This is a quote</blockquote>'
      const sanitized = DOMPurify.sanitize(safeHTML)
      
      expect(sanitized).toBe(safeHTML)
    })

    it('preserves code and pre elements', () => {
      const safeHTML = '<pre><code>console.log("Hello");</code></pre>'
      const sanitized = DOMPurify.sanitize(safeHTML)
      
      expect(sanitized).toBe(safeHTML)
    })
  })

  describe('WordPress Content Scenarios', () => {
    it('sanitizes WordPress post excerpts', () => {
      const wordpressExcerpt = '<p>This is an excerpt <strong>with formatting</strong>.</p>'
      const sanitized = DOMPurify.sanitize(wordpressExcerpt)
      
      expect(sanitized).toBe(wordpressExcerpt)
    })

    it('sanitizes WordPress post content with embedded media', () => {
      const wordpressContent = `
        <h2>Article Title</h2>
        <p>Article content with <a href="https://example.com">links</a>.</p>
        <img src="https://example.com/image.jpg" alt="Article image">
        <blockquote>Quote from article</blockquote>
      `
      const sanitized = DOMPurify.sanitize(wordpressContent)
      
      expect(sanitized).toContain('<h2>Article Title</h2>')
      expect(sanitized).toContain('<a href="https://example.com">links</a>')
      expect(sanitized).toContain('<img src="https://example.com/image.jpg" alt="Article image">')
      expect(sanitized).toContain('<blockquote>Quote from article</blockquote>')
    })

    it('handles WordPress Gutenberg blocks', () => {
      const gutenbergContent = `
        <div class="wp-block-paragraph">
          <p>Paragraph block content</p>
        </div>
        <div class="wp-block-heading">
          <h2>Heading block</h2>
        </div>
      `
      const sanitized = DOMPurify.sanitize(gutenbergContent)
      
      expect(sanitized).toContain('<p>Paragraph block content</p>')
      expect(sanitized).toContain('<h2>Heading block</h2>')
    })

    it('removes malicious scripts from WordPress content', () => {
      const maliciousWordPressContent = `
        <p>Valid content</p>
        <script>
          // Malicious script injected through WordPress editor
          document.location.href = 'https://malicious-site.com';
        </script>
        <p>More valid content</p>
      `
      const sanitized = DOMPurify.sanitize(maliciousWordPressContent)
      
      expect(sanitized).toContain('<p>Valid content</p>')
      expect(sanitized).toContain('<p>More valid content</p>')
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('document.location.href')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty strings', () => {
      const sanitized = DOMPurify.sanitize('')
      expect(sanitized).toBe('')
    })

    it('handles null input', () => {
      const sanitized = DOMPurify.sanitize(null as any)
      expect(sanitized).toBe('')
    })

    it('handles undefined input', () => {
      const sanitized = DOMPurify.sanitize(undefined as any)
      expect(sanitized).toBe('')
    })

    it('handles plain text without HTML', () => {
      const plainText = 'Just plain text without any HTML tags'
      const sanitized = DOMPurify.sanitize(plainText)
      
      expect(sanitized).toBe(plainText)
    })

    it('handles malformed HTML', () => {
      const malformedHTML = '<p>Unclosed paragraph<div>Nested div</p>'
      const sanitized = DOMPurify.sanitize(malformedHTML)
      
      expect(sanitized).toContain('Unclosed paragraph')
      expect(sanitized).toContain('Nested div')
    })

    it('handles HTML comments', () => {
      const htmlWithComments = '<p>Content</p><!-- This is a comment --><p>More content</p>'
      const sanitized = DOMPurify.sanitize(htmlWithComments)
      
      expect(sanitized).toContain('<p>Content</p>')
      expect(sanitized).toContain('<p>More content</p>')
      expect(sanitized).not.toContain('<!--')
    })
  })

  describe('Performance Considerations', () => {
    it('processes large HTML content efficiently', () => {
      const largeHTML = '<p>' + 'This is a large paragraph. '.repeat(1000) + '</p>'
      
      const start = performance.now()
      const sanitized = DOMPurify.sanitize(largeHTML)
      const end = performance.now()
      
      expect(sanitized).toContain('This is a large paragraph.')
      expect(end - start).toBeLessThan(100) // Should process in under 100ms
    })

    it('handles repeated sanitization calls', () => {
      const html = '<p>Test content</p>'
      
      for (let i = 0; i < 100; i++) {
        const sanitized = DOMPurify.sanitize(html)
        expect(sanitized).toBe(html)
      }
    })
  })

  describe('Configuration Testing', () => {
    it('uses default DOMPurify configuration', () => {
      const testHTML = '<p>Test</p>'
      const sanitized = DOMPurify.sanitize(testHTML)
      
      expect(sanitized).toBe(testHTML)
    })

    it('maintains consistent behavior across multiple calls', () => {
      const testHTML = '<p><strong>Bold text</strong></p>'
      
      const result1 = DOMPurify.sanitize(testHTML)
      const result2 = DOMPurify.sanitize(testHTML)
      
      expect(result1).toBe(result2)
    })
  })
})