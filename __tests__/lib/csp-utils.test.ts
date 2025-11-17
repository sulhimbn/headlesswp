import { useCspNonce, addNonceToScript, addNonceToStyle } from '@/lib/csp-utils'

// Mock DOM methods for testing
const mockGetAttribute = jest.fn()
const mockQuerySelector = jest.fn(() => ({
  getAttribute: mockGetAttribute
}))

// Mock document object
delete (window as any).document
window.document = {
  querySelector: mockQuerySelector
} as any

describe('CSP Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('useCspNonce', () => {
    it('should return empty string on server-side (window is undefined)', () => {
      // Mock server-side environment
      const originalWindow = global.window
      delete (global as any).window

      const result = useCspNonce()
      expect(result).toBe('')

      // Restore window
      global.window = originalWindow
    })

it('should return empty string when meta tag does not exist', () => {
    mockQuerySelector.mockReturnValue(null)
    
    const result = useCspNonce()
    
    expect(result).toBe('')
  })

    it('should return empty string when meta tag exists but has no content', () => {
      mockGetAttribute.mockReturnValue(null)
      
      const result = useCspNonce()
      
      expect(result).toBe('')
    })

    it('should return empty string when meta tag does not exist', () => {
      mockQuerySelector.mockReturnValue(null)
      
      const result = useCspNonce()
      
      expect(result).toBe('')
    })

    it('should handle meta tag with empty string content', () => {
      mockGetAttribute.mockReturnValue('')
      
      const result = useCspNonce()
      
      expect(result).toBe('')
    })

    it('should return empty string when meta tag has no content', () => {
      mockGetAttribute.mockReturnValue(null)
      
      const result = useCspNonce()
      
      expect(result).toBe('')
    })
  })

  describe('addNonceToScript', () => {
    it('should return original script content when nonce is empty', () => {
      const scriptContent = '<script>console.log("test");</script>'
      const nonce = ''
      
      const result = addNonceToScript(scriptContent, nonce)
      
      expect(result).toBe(scriptContent)
    })

    it('should return original script content when nonce is null', () => {
      const scriptContent = '<script>console.log("test");</script>'
      const nonce = null as any
      
      const result = addNonceToScript(scriptContent, nonce)
      
      expect(result).toBe(scriptContent)
    })

    it('should return original script content when nonce is undefined', () => {
      const scriptContent = '<script>console.log("test");</script>'
      const nonce = undefined
      
      const result = addNonceToScript(scriptContent, nonce)
      
      expect(result).toBe(scriptContent)
    })

    it('should add nonce to single script tag', () => {
      const scriptContent = '<script>console.log("test");</script>'
      const nonce = 'test-nonce-123'
      
      const result = addNonceToScript(scriptContent, nonce)
      
      expect(result).toBe('<script nonce="test-nonce-123">console.log("test");</script>')
    })

    it('should add nonce to multiple script tags', () => {
      const scriptContent = `
        <script>console.log("first");</script>
        <div>Some content</div>
        <script>console.log("second");</script>
      `
      const nonce = 'test-nonce-456'
      
      const result = addNonceToScript(scriptContent, nonce)
      
      expect(result).toContain('<script nonce="test-nonce-456">console.log("first");</script>')
      expect(result).toContain('<script nonce="test-nonce-456">console.log("second");</script>')
    })

    it('should handle script tag with attributes', () => {
      const scriptContent = '<script type="module" src="app.js"></script>'
      const nonce = 'module-nonce-789'
      
      const result = addNonceToScript(scriptContent, nonce)
      
      expect(result).toBe('<script nonce="module-nonce-789" type="module" src="app.js"></script>')
    })

    it('should handle self-closing script tags', () => {
      const scriptContent = '<script src="script.js" />'
      const nonce = 'self-closing-nonce'
      
      const result = addNonceToScript(scriptContent, nonce)
      
      expect(result).toBe('<script nonce="self-closing-nonce" src="script.js" />')
    })

    it('should handle script tags with whitespace', () => {
      const scriptContent = '<script   >   console.log("test");   </script>'
      const nonce = 'whitespace-nonce'
      
      const result = addNonceToScript(scriptContent, nonce)
      
      expect(result).toBe('<script nonce="whitespace-nonce"   >   console.log("test");   </script>')
    })

    it('should not modify non-script content', () => {
      const scriptContent = '<style>body { color: red; }</style><div>Content</div>'
      const nonce = 'test-nonce'
      
      const result = addNonceToScript(scriptContent, nonce)
      
      expect(result).toBe(scriptContent)
    })

    it('should handle empty script content', () => {
      const scriptContent = ''
      const nonce = 'test-nonce'
      
      const result = addNonceToScript(scriptContent, nonce)
      
      expect(result).toBe('')
    })

    it('should handle empty script content', () => {
      const scriptContent = ''
      const nonce = 'test-nonce'
      
      const result = addNonceToScript(scriptContent, nonce)
      
      expect(result).toBe('')
    })
  })

  describe('addNonceToStyle', () => {
    it('should return original style content when nonce is empty', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const nonce = ''
      
      const result = addNonceToStyle(styleContent, nonce)
      
      expect(result).toBe(styleContent)
    })

    it('should return original style content when nonce is null', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const nonce = null as any
      
      const result = addNonceToStyle(styleContent, nonce)
      
      expect(result).toBe(styleContent)
    })

    it('should return original style content when nonce is undefined', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const nonce = undefined
      
      const result = addNonceToStyle(styleContent, nonce)
      
      expect(result).toBe(styleContent)
    })

    it('should add nonce to single style tag', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const nonce = 'style-nonce-123'
      
      const result = addNonceToStyle(styleContent, nonce)
      
      expect(result).toBe('<style nonce="style-nonce-123">body { color: red; }</style>')
    })

    it('should add nonce to multiple style tags', () => {
      const styleContent = `
        <style>body { margin: 0; }</style>
        <div>Content</div>
        <style>.header { background: blue; }</style>
      `
      const nonce = 'style-nonce-456'
      
      const result = addNonceToStyle(styleContent, nonce)
      
      expect(result).toContain('<style nonce="style-nonce-456">body { margin: 0; }</style>')
      expect(result).toContain('<style nonce="style-nonce-456">.header { background: blue; }</style>')
    })

    it('should handle style tag with attributes', () => {
      const styleContent = '<style media="screen">body { color: red; }</style>'
      const nonce = 'media-nonce-789'
      
      const result = addNonceToStyle(styleContent, nonce)
      
      expect(result).toBe('<style nonce="media-nonce-789" media="screen">body { color: red; }</style>')
    })

    it('should handle style tags with whitespace', () => {
      const styleContent = '<style   >   body { color: red; }   </style>'
      const nonce = 'whitespace-nonce'
      
      const result = addNonceToStyle(styleContent, nonce)
      
      expect(result).toBe('<style nonce="whitespace-nonce"   >   body { color: red; }   </style>')
    })

    it('should not modify non-style content', () => {
      const styleContent = '<script>console.log("test");</script><div>Content</div>'
      const nonce = 'test-nonce'
      
      const result = addNonceToStyle(styleContent, nonce)
      
      expect(result).toBe(styleContent)
    })

    it('should handle empty style content', () => {
      const styleContent = ''
      const nonce = 'test-nonce'
      
      const result = addNonceToStyle(styleContent, nonce)
      
      expect(result).toBe('')
    })

    it('should handle empty style content', () => {
      const styleContent = ''
      const nonce = 'test-nonce'
      
      const result = addNonceToStyle(styleContent, nonce)
      
      expect(result).toBe('')
    })

    it('should handle complex CSS with nested rules', () => {
      const styleContent = '<style>@media (max-width: 768px) { .container { width: 100%; } }</style>'
      const nonce = 'complex-nonce'
      
      const result = addNonceToStyle(styleContent, nonce)
      
      expect(result).toBe('<style nonce="complex-nonce">@media (max-width: 768px) { .container { width: 100%; } }</style>')
    })
  })

  describe('Integration Tests', () => {
    it('should handle mixed content with both script and style', () => {
      const nonce = 'mixed-nonce-789'
      const mixedContent = `
        <style>body { margin: 0; }</style>
        <script>console.log("test");</script>
        <div>Content</div>
      `
      
      const styledResult = addNonceToStyle(mixedContent, nonce)
      const scriptedResult = addNonceToScript(styledResult, nonce)
      
      expect(scriptedResult).toContain('<style nonce="mixed-nonce-789">')
      expect(scriptedResult).toContain('<script nonce="mixed-nonce-789">')
    })
  })
})