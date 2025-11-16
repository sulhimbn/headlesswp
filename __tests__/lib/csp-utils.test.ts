import { renderHook } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useCspNonce, addNonceToScript, addNonceToStyle } from '@/lib/csp-utils'

// Mock document and window for client-side testing
const mockDocument = {
  querySelector: jest.fn(),
} as any

Object.defineProperty(window, 'document', {
  value: mockDocument,
  writable: true,
})

describe('CSP Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useCspNonce Hook', () => {
    it('should return empty string on server-side', () => {
      // Mock server-side environment
      const originalWindow = global.window
      delete (global as any).window

      const { result } = renderHook(() => useCspNonce())
      expect(result.current).toBe('')

      // Restore window
      global.window = originalWindow
    })

    it('should return nonce from meta tag on client-side', () => {
      // Mock meta tag with nonce
      mockDocument.querySelector.mockReturnValue({
        getAttribute: jest.fn().mockReturnValue('test-nonce-123')
      })

      const { result } = renderHook(() => useCspNonce())
      expect(result.current).toBe('test-nonce-123')

      expect(mockDocument.querySelector).toHaveBeenCalledWith('meta[name="csp-nonce"]')
    })

    it('should return empty string when meta tag not found', () => {
      // Mock no meta tag found
      mockDocument.querySelector.mockReturnValue(null)

      const { result } = renderHook(() => useCspNonce())
      expect(result.current).toBe('')

      expect(mockDocument.querySelector).toHaveBeenCalledWith('meta[name="csp-nonce"]')
    })

    it('should return empty string when meta tag has no content attribute', () => {
      // Mock meta tag without content
      const mockMeta = {
        getAttribute: jest.fn().mockReturnValue(null)
      }
      mockDocument.querySelector.mockReturnValue(mockMeta)

      const { result } = renderHook(() => useCspNonce())
      expect(result.current).toBe('')
    })

    it('should handle different nonce values', () => {
      const testCases = [
        'simple-nonce',
        'nonce-with-numbers-123',
        'very-long-nonce-with-many-characters-and-special-symbols-!@#$%',
        'unicode-nonce-🔒-secure',
        ''
      ]

      for (const nonce of testCases) {
        mockDocument.querySelector.mockReturnValue({
          getAttribute: jest.fn().mockReturnValue(nonce)
        })

        const { result } = renderHook(() => useCspNonce())
        expect(result.current).toBe(nonce)
      }
    })

    it('should be reactive to meta tag changes', () => {
      // Initial nonce
      mockDocument.querySelector.mockReturnValue({
        getAttribute: jest.fn().mockReturnValue('initial-nonce')
      })

      const { result, rerender } = renderHook(() => useCspNonce())
      expect(result.current).toBe('initial-nonce')

      // Change nonce
      mockDocument.querySelector.mockReturnValue({
        getAttribute: jest.fn().mockReturnValue('updated-nonce')
      })

      rerender()
      expect(result.current).toBe('updated-nonce')
    })
  })

  describe('addNonceToScript Function', () => {
    it('should add nonce to script tag', () => {
      const scriptContent = '<script>console.log("test")</script>'
      const nonce = 'test-nonce'
      const result = addNonceToScript(scriptContent, nonce)

      expect(result).toBe('<script nonce="test-nonce">console.log("test")</script>')
    })

    it('should add nonce to multiple script tags', () => {
      const scriptContent = '<script>console.log("first")</script><script>console.log("second")</script>'
      const nonce = 'test-nonce'
      const result = addNonceToScript(scriptContent, nonce)

      expect(result).toBe(
        '<script nonce="test-nonce">console.log("first")</script><script nonce="test-nonce">console.log("second")</script>'
      )
    })

    it('should not modify content when nonce is empty', () => {
      const scriptContent = '<script>console.log("test")</script>'
      const result = addNonceToScript(scriptContent, '')

      expect(result).toBe(scriptContent)
    })

    it('should not modify content when nonce is null', () => {
      const scriptContent = '<script>console.log("test")</script>'
      const result = addNonceToScript(scriptContent, null as any)

      expect(result).toBe(scriptContent)
    })

    it('should not modify content when nonce is undefined', () => {
      const scriptContent = '<script>console.log("test")</script>'
      const result = addNonceToScript(scriptContent, undefined as any)

      expect(result).toBe(scriptContent)
    })

    it('should handle script tags with attributes', () => {
      const scriptContent = '<script type="module" src="app.js"></script>'
      const nonce = 'test-nonce'
      const result = addNonceToScript(scriptContent, nonce)

      expect(result).toBe('<script nonce="test-nonce" type="module" src="app.js"></script>')
    })

    it('should handle script tags with multiple attributes', () => {
      const scriptContent = '<script type="text/javascript" async defer src="script.js"></script>'
      const nonce = 'test-nonce'
      const result = addNonceToScript(scriptContent, nonce)

      expect(result).toBe('<script nonce="test-nonce" type="text/javascript" async defer src="script.js"></script>')
    })

    it('should handle self-closing script tags', () => {
      const scriptContent = '<script src="script.js"/>'
      const nonce = 'test-nonce'
      const result = addNonceToScript(scriptContent, nonce)

      expect(result).toBe('<script nonce="test-nonce" src="script.js"/>')
    })

    it('should handle script tags with special characters in nonce', () => {
      const scriptContent = '<script>console.log("test")</script>'
      const nonce = 'nonce-with-"quotes"-and-\'apostrophes\''
      const result = addNonceToScript(scriptContent, nonce)

      expect(result).toBe('<script nonce="nonce-with-"quotes"-and-\'apostrophes\'">console.log("test")</script>')
    })

    it('should handle malformed script tags gracefully', () => {
      const scriptContent = '<script>console.log("unclosed script"'
      const nonce = 'test-nonce'
      const result = addNonceToScript(scriptContent, nonce)

      expect(result).toBe('<script nonce="test-nonce">console.log("unclosed script"')
    })

    it('should not affect non-script content', () => {
      const content = '<div>Some content</div><p>Paragraph</p>'
      const nonce = 'test-nonce'
      const result = addNonceToScript(content, nonce)

      expect(result).toBe(content)
    })

    it('should handle mixed content with scripts and other elements', () => {
      const content = '<div>Header</div><script>console.log("test")</script><p>Content</p>'
      const nonce = 'test-nonce'
      const result = addNonceToScript(content, nonce)

      expect(result).toBe('<div>Header</div><script nonce="test-nonce">console.log("test")</script><p>Content</p>')
    })
  })

  describe('addNonceToStyle Function', () => {
    it('should add nonce to style tag', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const nonce = 'test-nonce'
      const result = addNonceToStyle(styleContent, nonce)

      expect(result).toBe('<style nonce="test-nonce">body { color: red; }</style>')
    })

    it('should add nonce to multiple style tags', () => {
      const styleContent = '<style>body { color: red; }</style><style>h1 { font-size: 2em; }</style>'
      const nonce = 'test-nonce'
      const result = addNonceToStyle(styleContent, nonce)

      expect(result).toBe(
        '<style nonce="test-nonce">body { color: red; }</style><style nonce="test-nonce">h1 { font-size: 2em; }</style>'
      )
    })

    it('should not modify content when nonce is empty', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const result = addNonceToStyle(styleContent, '')

      expect(result).toBe(styleContent)
    })

    it('should not modify content when nonce is null', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const result = addNonceToStyle(styleContent, null as any)

      expect(result).toBe(styleContent)
    })

    it('should not modify content when nonce is undefined', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const result = addNonceToStyle(styleContent, undefined as any)

      expect(result).toBe(styleContent)
    })

    it('should handle style tags with attributes', () => {
      const styleContent = '<style media="screen">body { color: red; }</style>'
      const nonce = 'test-nonce'
      const result = addNonceToStyle(styleContent, nonce)

      expect(result).toBe('<style nonce="test-nonce" media="screen">body { color: red; }</style>')
    })

    it('should handle style tags with multiple attributes', () => {
      const styleContent = '<style type="text/css" media="screen and (max-width: 768px)">body { color: red; }</style>'
      const nonce = 'test-nonce'
      const result = addNonceToStyle(styleContent, nonce)

      expect(result).toBe('<style nonce="test-nonce" type="text/css" media="screen and (max-width: 768px)">body { color: red; }</style>')
    })

    it('should handle self-closing style tags', () => {
      const styleContent = '<style href="styles.css"/>'
      const nonce = 'test-nonce'
      const result = addNonceToStyle(styleContent, nonce)

      expect(result).toBe('<style nonce="test-nonce" href="styles.css"/>')
    })

    it('should handle style tags with special characters in nonce', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const nonce = 'nonce-with-"quotes"-and-\'apostrophes\''
      const result = addNonceToStyle(styleContent, nonce)

      expect(result).toBe('<style nonce="nonce-with-"quotes"-and-\'apostrophes\'">body { color: red; }</style>')
    })

    it('should handle malformed style tags gracefully', () => {
      const styleContent = '<style>body { color: red;'
      const nonce = 'test-nonce'
      const result = addNonceToStyle(styleContent, nonce)

      expect(result).toBe('<style nonce="test-nonce">body { color: red;')
    })

    it('should not affect non-style content', () => {
      const content = '<div>Some content</div><p>Paragraph</p>'
      const nonce = 'test-nonce'
      const result = addNonceToStyle(content, nonce)

      expect(result).toBe(content)
    })

    it('should handle mixed content with styles and other elements', () => {
      const content = '<div>Header</div><style>body { color: red; }</style><p>Content</p>'
      const nonce = 'test-nonce'
      const result = addNonceToStyle(content, nonce)

      expect(result).toBe('<div>Header</div><style nonce="test-nonce">body { color: red; }</style><p>Content</p>')
    })

    it('should handle complex CSS content', () => {
      const styleContent = `<style>
        body { 
          color: red; 
          background: url('data:image/svg+xml,<svg>...</svg>');
        }
        @media (max-width: 768px) {
          body { color: blue; }
        }
      </style>`
      const nonce = 'test-nonce'
      const result = addNonceToStyle(styleContent, nonce)

      expect(result).toContain('<style nonce="test-nonce">')
      expect(result).toContain('color: red;')
      expect(result).toContain('@media (max-width: 768px)')
    })
  })

  describe('Integration Tests', () => {
    it('should work together: useCspNonce and addNonceToScript', () => {
      mockDocument.querySelector.mockReturnValue({
        getAttribute: jest.fn().mockReturnValue('integration-test-nonce')
      })

      const { result } = renderHook(() => useCspNonce())
      const nonce = result.current

      const scriptContent = '<script>console.log("integration test")</script>'
      const resultWithNonce = addNonceToScript(scriptContent, nonce)

      expect(resultWithNonce).toBe('<script nonce="integration-test-nonce">console.log("integration test")</script>')
    })

    it('should work together: useCspNonce and addNonceToStyle', () => {
      mockDocument.querySelector.mockReturnValue({
        getAttribute: jest.fn().mockReturnValue('integration-test-nonce')
      })

      const { result } = renderHook(() => useCspNonce())
      const nonce = result.current

      const styleContent = '<style>body { color: blue; }</style>'
      const resultWithNonce = addNonceToStyle(styleContent, nonce)

      expect(resultWithNonce).toBe('<style nonce="integration-test-nonce">body { color: blue; }</style>')
    })

    it('should handle real-world scenario with mixed content', () => {
      mockDocument.querySelector.mockReturnValue({
        getAttribute: jest.fn().mockReturnValue('real-world-nonce')
      })

      const { result } = renderHook(() => useCspNonce())
      const nonce = result.current

      const mixedContent = `
        <div>
          <h1>Page Title</h1>
          <script>console.log("analytics")</script>
          <style>body { margin: 0; }</style>
          <script src="app.js"></script>
          <style media="screen">p { line-height: 1.5; }</style>
        </div>
      `

      const scriptsWithNonce = addNonceToScript(mixedContent, nonce)
      const stylesWithNonce = addNonceToStyle(scriptsWithNonce, nonce)

      expect(stylesWithNonce).toContain('<script nonce="real-world-nonce">')
      expect(stylesWithNonce).toContain('<style nonce="real-world-nonce">')
      expect(stylesWithNonce).toContain('console.log("analytics")')
      expect(stylesWithNonce).toContain('body { margin: 0; }')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(addNonceToScript('', 'test-nonce')).toBe('')
      expect(addNonceToStyle('', 'test-nonce')).toBe('')
    })

    it('should handle very long content', () => {
      const longScript = '<script>' + 'console.log("test");'.repeat(1000) + '</script>'
      const result = addNonceToScript(longScript, 'test-nonce')
      
      expect(result).toContain('<script nonce="test-nonce">')
      expect(result.length).toBeGreaterThan(longScript.length)
    })

    it('should handle nonce with HTML entities', () => {
      const scriptContent = '<script>console.log("test")</script>'
      const nonce = '&lt;script&gt;malicious&lt;/script&gt;'
      const result = addNonceToScript(scriptContent, nonce)

      expect(result).toContain(`nonce="${nonce}"`)
    })

    it('should handle script-like content in attributes', () => {
      const content = '<div data-script="<script>not a real script</script>">Content</div>'
      const nonce = 'test-nonce'
      const result = addNonceToScript(content, nonce)

      // Should not modify the attribute content
      expect(result).toBe(content)
    })
  })
})