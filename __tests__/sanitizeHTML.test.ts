import { sanitizeHTML } from '@/lib/utils/sanitizeHTML'

describe('sanitizeHTML - Excerpt Configuration', () => {
  describe('Happy Path', () => {
    it('should preserve allowed basic HTML tags with excerpt config', () => {
      const html = '<p>Hello <strong>world</strong></p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).toBe('<p>Hello <strong>world</strong></p>')
    })

    it('should preserve allowed formatting tags with excerpt config', () => {
      const html = '<p><em>Italic</em> and <u>underline</u> text</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).toBe('<p><em>Italic</em> and <u>underline</u> text</p>')
    })

    it('should preserve links with allowed attributes using excerpt config', () => {
      const html = '<p>Visit <a href="https://example.com" title="Example" class="link">here</a></p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).toBe('<p>Visit <a href="https://example.com" title="Example" class="link">here</a></p>')
    })

    it('should preserve line breaks with excerpt config', () => {
      const html = '<p>Line 1</p><br/><p>Line 2</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).toBe('<p>Line 1</p><br><p>Line 2</p>')
    })

    it('should preserve spans with classes using excerpt config', () => {
      const html = '<p><span class="highlight">Highlighted</span> text</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).toBe('<p><span class="highlight">Highlighted</span> text</p>')
    })

    it('should handle plain text without HTML using excerpt config', () => {
      const html = 'Just plain text'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).toBe('Just plain text')
    })

    it('should handle empty string with excerpt config', () => {
      const result = sanitizeHTML('', 'excerpt')

      expect(result).toBe('')
    })
  })

  describe('Sad Path - Forbidden Tags', () => {
    it('should remove script tags with excerpt config', () => {
      const html = '<p>Before</p><script>alert("XSS")</script><p>After</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert("XSS")')
      expect(result).toContain('<p>Before</p>')
      expect(result).toContain('<p>After</p>')
    })

    it('should remove style tags with excerpt config', () => {
      const html = '<p>Text</p><style>body { color: red; }</style><p>More text</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<style>')
      expect(result).not.toContain('body { color: red; }')
      expect(result).toContain('<p>Text</p>')
      expect(result).toContain('<p>More text</p>')
    })

    it('should remove iframe tags with excerpt config', () => {
      const html = '<p>Video</p><iframe src="malicious.com"></iframe><p>End</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<iframe>')
      expect(result).not.toContain('malicious.com')
      expect(result).toContain('<p>Video</p>')
      expect(result).toContain('<p>End</p>')
    })

    it('should remove object tags with excerpt config', () => {
      const html = '<p>Before</p><object data="malicious.swf"></object><p>After</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<object>')
      expect(result).not.toContain('malicious.swf')
    })

    it('should remove embed tags with excerpt config', () => {
      const html = '<p>Before</p><embed src="malicious.swf"><p>After</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<embed>')
      expect(result).not.toContain('malicious.swf')
    })

    it('should remove multiple script tags with excerpt config', () => {
      const html = '<script>alert(1)</script><p>Content</p><script>alert(2)</script>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert(1)')
      expect(result).not.toContain('alert(2)')
    })
  })

  describe('Sad Path - Forbidden Attributes', () => {
    it('should remove onclick attribute with excerpt config', () => {
      const html = '<p onclick="alert(\'XSS\')">Click me</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('onclick')
      expect(result).not.toContain('alert')
      expect(result).toContain('<p>Click me</p>')
    })

    it('should remove onload attribute with excerpt config', () => {
      const html = '<p onload="alert(\'XSS\')">Text</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('onload')
    })

    it('should remove onerror attribute with excerpt config', () => {
      const html = '<img src="invalid.jpg" onerror="alert(\'XSS\')" alt="Test">'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('onerror')
      expect(result).not.toContain('alert')
    })

    it('should remove onmouseover attribute with excerpt config', () => {
      const html = '<p onmouseover="alert(\'XSS\')">Hover me</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('onmouseover')
      expect(result).not.toContain('alert')
    })
  })

  describe('Edge Cases', () => {
    it('should handle Unicode characters with excerpt config', () => {
      const html = '<p>Héllo Wörld 你好</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).toBe('<p>Héllo Wörld 你好</p>')
    })

    it('should handle special HTML entities with excerpt config', () => {
      const html = '<p>HTML &lt;script&gt; &amp; &quot;test&quot;</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).toContain('&lt;')
      expect(result).toContain('&amp;')
      expect(result).toContain('"')
      expect(result).toContain('test')
    })

    it('should handle nested malicious tags with excerpt config', () => {
      const html = '<p>Text <script><iframe src="bad"></iframe></script> more text</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<script>')
      expect(result).not.toContain('<iframe>')
    })

    it('should handle self-closing tags with excerpt config', () => {
      const html = '<p>Line 1</p><br/><p>Line 2</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).toContain('<br>')
    })

    it('should handle mixed case tags with excerpt config', () => {
      const html = '<P>Test</P><SCRIPT>alert("XSS")</SCRIPT>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).toContain('<p>')
      expect(result).not.toContain('<script>')
    })
  })

  describe('Disallowed Tags for Excerpt', () => {
    it('should remove list tags (ol, ul, li) with excerpt config', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<ul>')
      expect(result).not.toContain('<li>')
    })

    it('should remove heading tags (h1-h6) with excerpt config', () => {
      const html = '<h1>Title</h1><p>Content</p>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<h1>')
      expect(result).toContain('<p>Content</p>')
    })

    it('should remove blockquote tag with excerpt config', () => {
      const html = '<blockquote>Quote</blockquote>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<blockquote>')
    })

    it('should remove code/pre tags with excerpt config', () => {
      const html = '<code>const x = 1;</code><pre>formatted</pre>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<code>')
      expect(result).not.toContain('<pre>')
    })

    it('should remove img tag with excerpt config', () => {
      const html = '<img src="test.jpg" alt="Test">'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<img>')
    })

    it('should remove div tag with excerpt config', () => {
      const html = '<div>Content</div>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<div>')
    })

    it('should remove table elements with excerpt config', () => {
      const html = '<table><tr><td>Data</td></tr></table>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('<table>')
      expect(result).not.toContain('<tr>')
      expect(result).not.toContain('<td>')
    })
  })

  describe('Disallowed Attributes for Excerpt', () => {
    it('should remove target attribute from links with excerpt config', () => {
      const html = '<a href="https://example.com" target="_blank">Link</a>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('target')
      expect(result).toContain('href=')
    })

    it('should remove rel attribute from links with excerpt config', () => {
      const html = '<a href="https://example.com" rel="noopener">Link</a>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('rel')
    })

    it('should remove id attribute with excerpt config', () => {
      const html = '<span id="test-id">Text</span>'
      const result = sanitizeHTML(html, 'excerpt')

      expect(result).not.toContain('id=')
      expect(result).toContain('<span>')
    })
  })
})

describe('sanitizeHTML - Full Configuration', () => {
  describe('Happy Path', () => {
    it('should preserve all allowed formatting tags with full config', () => {
      const html = '<p>Text with <strong>bold</strong>, <em>italic</em>, and <u>underline</u></p>'
      const result = sanitizeHTML(html, 'full')

      expect(result).toBe('<p>Text with <strong>bold</strong>, <em>italic</em>, and <u>underline</u></p>')
    })

    it('should preserve lists with full config', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'
      const result = sanitizeHTML(html, 'full')

      expect(result).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>')
    })

    it('should preserve ordered lists with full config', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>'
      const result = sanitizeHTML(html, 'full')

      expect(result).toBe('<ol><li>First</li><li>Second</li></ol>')
    })

    it('should preserve headings (h1-h6) with full config', () => {
      const html = '<h1>Title 1</h1><h2>Title 2</h2><h3>Title 3</h3>'
      const result = sanitizeHTML(html, 'full')

      expect(result).toBe('<h1>Title 1</h1><h2>Title 2</h2><h3>Title 3</h3>')
    })

    it('should preserve images with allowed attributes using full config', () => {
      const html = '<img src="test.jpg" alt="Test image" width="100" height="100" class="responsive" id="img1">'
      const result = sanitizeHTML(html, 'full')

      expect(result).toContain('src="test.jpg"')
      expect(result).toContain('alt="Test image"')
      expect(result).toContain('width="100"')
      expect(result).toContain('height="100"')
      expect(result).toContain('class="responsive"')
      expect(result).toContain('id="img1"')
    })

    it('should preserve blockquote with full config', () => {
      const html = '<blockquote>This is a quote</blockquote>'
      const result = sanitizeHTML(html, 'full')

      expect(result).toBe('<blockquote>This is a quote</blockquote>')
    })

    it('should preserve code and pre tags with full config', () => {
      const html = '<p>Code example:</p><pre><code>const x = 1;</code></pre>'
      const result = sanitizeHTML(html, 'full')

      expect(result).toContain('<code>const x = 1;</code>')
      expect(result).toContain('<pre>')
    })

    it('should preserve div and span tags with full config', () => {
      const html = '<div><span class="highlight">Text</span></div>'
      const result = sanitizeHTML(html, 'full')

      expect(result).toBe('<div><span class="highlight">Text</span></div>')
    })

    it('should preserve table elements with full config', () => {
      const html = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>'
      const result = sanitizeHTML(html, 'full')

      expect(result).toContain('<table>')
      expect(result).toContain('<thead>')
      expect(result).toContain('<tbody>')
      expect(result).toContain('<tr>')
      expect(result).toContain('<th>')
      expect(result).toContain('<td>')
    })

    it('should preserve links with full attributes using full config', () => {
      const html = '<a href="https://example.com" title="Example" target="_blank" rel="noopener" class="link" id="link1">Link</a>'
      const result = sanitizeHTML(html, 'full')

      expect(result).toContain('href="https://example.com"')
      expect(result).toContain('title="Example"')
      expect(result).toContain('target="_blank"')
      expect(result).toContain('rel="noopener"')
      expect(result).toContain('class="link"')
      expect(result).toContain('id="link1"')
    })
  })

  describe('Sad Path - Forbidden Tags', () => {
    it('should remove script tags with full config', () => {
      const html = '<p>Before</p><script>alert("XSS")</script><p>After</p>'
      const result = sanitizeHTML(html, 'full')

      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert("XSS")')
      expect(result).toContain('<p>Before</p>')
      expect(result).toContain('<p>After</p>')
    })

    it('should remove style tags with full config', () => {
      const html = '<p>Text</p><style>body { color: red; }</style><p>More text</p>'
      const result = sanitizeHTML(html, 'full')

      expect(result).not.toContain('<style>')
      expect(result).not.toContain('body { color: red; }')
      expect(result).toContain('<p>Text</p>')
      expect(result).toContain('<p>More text</p>')
    })

    it('should remove iframe tags with full config', () => {
      const html = '<p>Video</p><iframe src="malicious.com"></iframe><p>End</p>'
      const result = sanitizeHTML(html, 'full')

      expect(result).not.toContain('<iframe>')
      expect(result).not.toContain('malicious.com')
      expect(result).toContain('<p>Video</p>')
      expect(result).toContain('<p>End</p>')
    })

    it('should remove object tags with full config', () => {
      const html = '<p>Before</p><object data="malicious.swf"></object><p>After</p>'
      const result = sanitizeHTML(html, 'full')

      expect(result).not.toContain('<object>')
      expect(result).not.toContain('malicious.swf')
    })

    it('should remove embed tags with full config', () => {
      const html = '<p>Before</p><embed src="malicious.swf"><p>After</p>'
      const result = sanitizeHTML(html, 'full')

      expect(result).not.toContain('<embed>')
      expect(result).not.toContain('malicious.swf')
    })
  })

  describe('Sad Path - Forbidden Attributes', () => {
    it('should remove onclick attribute with full config', () => {
      const html = '<p onclick="alert(\'XSS\')">Click me</p>'
      const result = sanitizeHTML(html, 'full')

      expect(result).not.toContain('onclick')
      expect(result).not.toContain('alert')
      expect(result).toContain('<p>Click me</p>')
    })

    it('should remove onload attribute with full config', () => {
      const html = '<p onload="alert(\'XSS\')">Text</p>'
      const result = sanitizeHTML(html, 'full')

      expect(result).not.toContain('onload')
    })

    it('should remove onerror attribute with full config', () => {
      const html = '<img src="invalid.jpg" onerror="alert(\'XSS\')" alt="Test">'
      const result = sanitizeHTML(html, 'full')

      expect(result).not.toContain('onerror')
      expect(result).not.toContain('alert')
      expect(result).toContain('src="invalid.jpg"')
    })

    it('should remove onmouseover attribute with full config', () => {
      const html = '<p onmouseover="alert(\'XSS\')">Hover me</p>'
      const result = sanitizeHTML(html, 'full')

      expect(result).not.toContain('onmouseover')
      expect(result).not.toContain('alert')
    })
  })

  describe('Edge Cases', () => {
    it('should handle complex nested HTML with full config', () => {
      const html = '<div><h1>Title</h1><p>Text with <strong>bold</strong> and <em>italic</em></p><ul><li>Item 1</li><li>Item 2</li></ul></div>'
      const result = sanitizeHTML(html, 'full')

      expect(result).toContain('<div>')
      expect(result).toContain('<h1>Title</h1>')
      expect(result).toContain('<strong>bold</strong>')
      expect(result).toContain('<em>italic</em>')
      expect(result).toContain('<ul>')
      expect(result).toContain('<li>Item 1</li>')
      expect(result).toContain('<li>Item 2</li>')
    })

    it('should handle malformed HTML with full config', () => {
      const html = '<p>Unclosed paragraph<div><span>Nested<span></div>'
      const result = sanitizeHTML(html, 'full')

      expect(result).toContain('<p>')
      expect(result).toContain('<div>')
      expect(result).toContain('<span>')
    })

    it('should handle multiple XSS attack vectors with full config', () => {
      const html = `
        <p>Text</p>
        <script>alert('XSS1')</script>
        <style>.xss { background: red; }</style>
        <iframe src="evil.com"></iframe>
        <object data="evil.swf"></object>
        <embed src="evil2.swf"></embed>
        <p onclick="alert('XSS2')">Click</p>
        <img src="x" onerror="alert('XSS3')">
        <p onmouseover="alert('XSS4')">Hover</p>
        <p onload="alert('XSS5')">Load</p>
      `
      const result = sanitizeHTML(html, 'full')

      expect(result).not.toContain('<script>')
      expect(result).not.toContain('<style>')
      expect(result).not.toContain('<iframe>')
      expect(result).not.toContain('<object>')
      expect(result).not.toContain('<embed>')
      expect(result).not.toContain('onclick')
      expect(result).not.toContain('onerror')
      expect(result).not.toContain('onmouseover')
      expect(result).not.toContain('onload')
      expect(result).not.toContain('alert')
      expect(result).toContain('<p>Text</p>')
    })
  })
})

describe('sanitizeHTML - Default Configuration', () => {
  it('should use full config as default when no config specified', () => {
    const html = '<h1>Title</h1><p>Text with <strong>bold</strong></p><ul><li>Item</li></ul>'
    const result = sanitizeHTML(html)

    expect(result).toContain('<h1>')
    expect(result).toContain('<strong>')
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>')
  })

  it('should remove forbidden tags with default config', () => {
    const html = '<p>Text</p><script>alert("XSS")</script><p>More</p>'
    const result = sanitizeHTML(html)

    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
  })
})

describe('sanitizeHTML - Security', () => {
  it('should prevent XSS via script injection with excerpt config', () => {
    const html = '<p><script>alert(document.cookie)</script>Text</p>'
    const result = sanitizeHTML(html, 'excerpt')

    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
    expect(result).not.toContain('document.cookie')
  })

  it('should prevent XSS via javascript: protocol with full config', () => {
    const html = '<a href="javascript:alert(\'XSS\')">Click</a>'
    const result = sanitizeHTML(html, 'full')

    expect(result).not.toContain('javascript:')
  })

  it('should prevent XSS via data: protocol with full config', () => {
    const html = '<a href="data:text/html,<script>alert(\'XSS\')</script>">Click</a>'
    const result = sanitizeHTML(html, 'full')

    expect(result).not.toContain('data:')
  })

  it('should prevent XSS via img onerror with excerpt config', () => {
    const html = '<img src="x" onerror="alert(\'XSS\')">'
    const result = sanitizeHTML(html, 'excerpt')

    expect(result).not.toContain('<img>')
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('alert')
  })

  it('should prevent XSS via SVG script with full config', () => {
    const html = '<svg><script>alert(\'XSS\')</script></svg>'
    const result = sanitizeHTML(html, 'full')

    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert')
  })
})
