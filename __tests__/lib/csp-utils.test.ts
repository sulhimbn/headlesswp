import { useCspNonce, addNonceToScript, addNonceToStyle } from '@/lib/csp-utils'

describe('CSP Utilities', () => {
  let mockDocument: any

  beforeEach(() => {
    // Clear any existing mocks
    jest.clearAllMocks()
    
    // Create fresh document mock for each test
    mockDocument = {
      querySelector: jest.fn(),
    }
    
    // Mock document.querySelector
    Object.defineProperty(window, 'document', {
      value: mockDocument,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // Clean up document mock after each test
    delete (window as any).document
  })

  describe('useCspNonce', () => {
    it('returns empty string on server-side', () => {
      // Mock server-side environment
      const originalWindow = global.window
      delete (global as any).window

      const result = useCspNonce()
      expect(result).toBe('')

      // Restore window
      global.window = originalWindow
    })

    it('returns nonce from meta tag when available', () => {
      mockDocument.querySelector.mockReturnValue({
        getAttribute: jest.fn().mockReturnValue('test-nonce-123')
      })

      const result = useCspNonce()
      expect(result).toBe('test-nonce-123')
      expect(mockDocument.querySelector).toHaveBeenCalledWith('meta[name="csp-nonce"]')
    })

    it('returns empty string when meta tag not found', () => {
      mockDocument.querySelector.mockReturnValue(null)

      const result = useCspNonce()
      expect(result).toBe('')
      expect(mockDocument.querySelector).toHaveBeenCalledWith('meta[name="csp-nonce"]')
    })

    it('returns empty string when meta tag has no content attribute', () => {
      mockDocument.querySelector.mockReturnValue({
        getAttribute: jest.fn().mockReturnValue(null)
      })

      const result = useCspNonce()
      expect(result).toBe('')
    })

    it('handles meta tag with empty content', () => {
      mockDocument.querySelector.mockReturnValue({
        getAttribute: jest.fn().mockReturnValue('')
      })

      const result = useCspNonce()
      expect(result).toBe('')
    })
  })

  describe('addNonceToScript', () => {
    it('adds nonce to script tag when nonce is provided', () => {
      const scriptContent = '<script>console.log("test")</script>'
      const nonce = 'test-nonce-123'

      const result = addNonceToScript(scriptContent, nonce)
      expect(result).toBe('<script nonce="test-nonce-123">console.log("test")</script>')
    })

    it('adds nonce to multiple script tags', () => {
      const scriptContent = '<script>console.log("test1")</script><script>console.log("test2")</script>'
      const nonce = 'test-nonce-123'

      const result = addNonceToScript(scriptContent, nonce)
      expect(result).toBe(
        '<script nonce="test-nonce-123">console.log("test1")</script><script nonce="test-nonce-123">console.log("test2")</script>'
      )
    })

    it('returns original content when nonce is empty', () => {
      const scriptContent = '<script>console.log("test")</script>'
      const nonce = ''

      const result = addNonceToScript(scriptContent, nonce)
      expect(result).toBe(scriptContent)
    })

    it('returns original content when nonce is null', () => {
      const scriptContent = '<script>console.log("test")</script>'
      const nonce = null as any

      const result = addNonceToScript(scriptContent, nonce)
      expect(result).toBe(scriptContent)
    })

    it('handles script tags with attributes', () => {
      const scriptContent = '<script src="test.js" async>console.log("test")</script>'
      const nonce = 'test-nonce-123'

      const result = addNonceToScript(scriptContent, nonce)
      expect(result).toBe('<script nonce="test-nonce-123" src="test.js" async>console.log("test")</script>')
    })

    it('handles empty script content', () => {
      const scriptContent = ''
      const nonce = 'test-nonce-123'

      const result = addNonceToScript(scriptContent, nonce)
      expect(result).toBe('')
    })

    it('handles script content without script tags', () => {
      const scriptContent = 'console.log("test")'
      const nonce = 'test-nonce-123'

      const result = addNonceToScript(scriptContent, nonce)
      expect(result).toBe('console.log("test")')
    })
  })

  describe('addNonceToStyle', () => {
    it('adds nonce to style tag when nonce is provided', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const nonce = 'test-nonce-123'

      const result = addNonceToStyle(styleContent, nonce)
      expect(result).toBe('<style nonce="test-nonce-123">body { color: red; }</style>')
    })

    it('adds nonce to multiple style tags', () => {
      const styleContent = '<style>body { color: red; }</style><style>h1 { font-size: 24px; }</style>'
      const nonce = 'test-nonce-123'

      const result = addNonceToStyle(styleContent, nonce)
      expect(result).toBe(
        '<style nonce="test-nonce-123">body { color: red; }</style><style nonce="test-nonce-123">h1 { font-size: 24px; }</style>'
      )
    })

    it('returns original content when nonce is empty', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const nonce = ''

      const result = addNonceToStyle(styleContent, nonce)
      expect(result).toBe(styleContent)
    })

    it('returns original content when nonce is null', () => {
      const styleContent = '<style>body { color: red; }</style>'
      const nonce = null as any

      const result = addNonceToStyle(styleContent, nonce)
      expect(result).toBe(styleContent)
    })

    it('handles style tags with attributes', () => {
      const styleContent = '<style media="screen">body { color: red; }</style>'
      const nonce = 'test-nonce-123'

      const result = addNonceToStyle(styleContent, nonce)
      expect(result).toBe('<style nonce="test-nonce-123" media="screen">body { color: red; }</style>')
    })

    it('handles empty style content', () => {
      const styleContent = ''
      const nonce = 'test-nonce-123'

      const result = addNonceToStyle(styleContent, nonce)
      expect(result).toBe('')
    })

    it('handles style content without style tags', () => {
      const styleContent = 'body { color: red; }'
      const nonce = 'test-nonce-123'

      const result = addNonceToStyle(styleContent, nonce)
      expect(result).toBe('body { color: red; }')
    })
  })

  describe('integration tests', () => {
    it('handles complex HTML with both script and style tags', () => {
      const content = `
        <style>body { margin: 0; }</style>
        <script>console.log("init");</script>
        <style>h1 { color: blue; }</style>
        <script src="app.js"></script>
      `
      const nonce = 'test-nonce-123'

      const scriptResult = addNonceToScript(content, nonce)
      const styleResult = addNonceToStyle(content, nonce)

      expect(scriptResult).toContain('<script nonce="test-nonce-123">console.log("init");</script>')
      expect(scriptResult).toContain('<script nonce="test-nonce-123" src="app.js"></script>')
      
      expect(styleResult).toContain('<style nonce="test-nonce-123">body { margin: 0; }</style>')
      expect(styleResult).toContain('<style nonce="test-nonce-123">h1 { color: blue; }</style>')
    })
  })
})