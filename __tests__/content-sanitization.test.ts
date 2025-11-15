import DOMPurify from 'dompurify';

describe('Content Sanitization', () => {
  describe('DOMPurify sanitization', () => {
    it('should sanitize malicious script tags', () => {
      const maliciousContent = '<p>Valid content</p><script>alert("XSS")</script>';
      const sanitized = DOMPurify.sanitize(maliciousContent);
      
      expect(sanitized).toBe('<p>Valid content</p>');
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should sanitize onclick handlers', () => {
      const maliciousContent = '<p onclick="alert(\'XSS\')">Click me</p>';
      const sanitized = DOMPurify.sanitize(maliciousContent);
      
      expect(sanitized).toBe('<p>Click me</p>');
      expect(sanitized).not.toContain('onclick');
    });

    it('should allow safe HTML tags', () => {
      const safeContent = '<p>This is <strong>safe</strong> content with <em>emphasis</em>.</p>';
      const sanitized = DOMPurify.sanitize(safeContent);
      
      expect(sanitized).toBe(safeContent);
    });

    it('should sanitize javascript: URLs', () => {
      const maliciousContent = '<a href="javascript:alert(\'XSS\')">Click me</a>';
      const sanitized = DOMPurify.sanitize(maliciousContent);
      
      expect(sanitized).toBe('<a>Click me</a>');
      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle WordPress excerpt content safely', () => {
      const wordpressExcerpt = '<p>This is a WordPress excerpt with <strong>formatting</strong>.</p>';
      const sanitized = DOMPurify.sanitize(wordpressExcerpt);
      
      expect(sanitized).toBe(wordpressExcerpt);
    });

    it('should handle WordPress post content safely', () => {
      const wordpressContent = `
        <h2>Article Title</h2>
        <p>This is an article with <a href="/valid-link">valid links</a> and <em>formatting</em>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `;
      const sanitized = DOMPurify.sanitize(wordpressContent);
      
      expect(sanitized).toContain('<h2>Article Title</h2>');
      expect(sanitized).toContain('<a href="/valid-link">valid links</a>');
      expect(sanitized).toContain('<em>formatting</em>');
      expect(sanitized).toContain('<ul>');
      expect(sanitized).toContain('<li>Item 1</li>');
    });
  });
});