import DOMPurify from 'dompurify';

describe('XSS Protection Tests', () => {
  describe('DOMPurify Sanitization', () => {
    it('should remove script tags from HTML content', () => {
      const maliciousHTML = '<p>Valid content</p><script>alert("XSS")</script>';
      const sanitized = DOMPurify.sanitize(maliciousHTML);
      
      expect(sanitized).toBe('<p>Valid content</p>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert("XSS")');
    });

    it('should remove onclick event handlers', () => {
      const maliciousHTML = '<p onclick="alert(\'XSS\')">Click me</p>';
      const sanitized = DOMPurify.sanitize(maliciousHTML);
      
      expect(sanitized).toBe('<p>Click me</p>');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove javascript: URLs', () => {
      const maliciousHTML = '<a href="javascript:alert(\'XSS\')">Malicious link</a>';
      const sanitized = DOMPurify.sanitize(maliciousHTML);
      
      expect(sanitized).toBe('<a>Malicious link</a>');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should preserve safe HTML elements', () => {
      const safeHTML = '<p><strong>Bold text</strong> and <em>italic text</em></p>';
      const sanitized = DOMPurify.sanitize(safeHTML);
      
      expect(sanitized).toBe(safeHTML);
    });

    it('should preserve safe HTML attributes', () => {
      const safeHTML = '<a href="https://example.com">Safe link</a>';
      const sanitized = DOMPurify.sanitize(safeHTML);
      
      expect(sanitized).toBe(safeHTML);
    });

    it('should handle WordPress excerpt content safely', () => {
      const wordpressExcerpt = '<p>This is a <strong>WordPress</strong> excerpt with <em>formatting</em>.</p>';
      const sanitized = DOMPurify.sanitize(wordpressExcerpt);
      
      expect(sanitized).toBe(wordpressExcerpt);
    });

    it('should sanitize complex XSS attempts', () => {
      const complexXSS = `
        <div>
          <p>Normal content</p>
          <img src="x" onerror="alert('XSS')">
          <iframe src="javascript:alert('XSS')"></iframe>
          <link rel="stylesheet" href="javascript:alert('XSS')">
        </div>
      `;
      const sanitized = DOMPurify.sanitize(complexXSS);
      
      expect(sanitized).toContain('<p>Normal content</p>');
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('<iframe>');
      expect(sanitized).not.toContain('<link>');
    });

    it('should handle empty and null inputs gracefully', () => {
      expect(DOMPurify.sanitize('')).toBe('');
      expect(DOMPurify.sanitize('<p></p>')).toBe('<p></p>');
      expect(DOMPurify.sanitize(null as any)).toBe('');
      expect(DOMPurify.sanitize(undefined as any)).toBe('');
    });
  });
});