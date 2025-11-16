describe('CSP Middleware Configuration', () => {
  it('should have middleware file with CSP configuration', () => {
    const fs = require('fs')
    const path = require('path')
    const middlewarePath = path.join(__dirname, '../src/middleware.ts')
    
    expect(fs.existsSync(middlewarePath)).toBe(true)
    
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
    
    // Check for CSP implementation
    expect(middlewareContent).toContain('Content-Security-Policy')
    expect(middlewareContent).toContain('generateNonce')
    expect(middlewareContent).toContain("default-src 'self'")
    expect(middlewareContent).toContain('script-src')
    expect(middlewareContent).toContain('style-src')
    expect(middlewareContent).toContain("object-src 'none'")
    expect(middlewareContent).toContain("frame-ancestors 'none'")
  })

  it('should not contain unsafe CSP directives', () => {
    const fs = require('fs')
    const path = require('path')
    const middlewarePath = path.join(__dirname, '../src/middleware.ts')
    
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
    
    // Should not contain unsafe directives
    expect(middlewareContent).not.toContain("'unsafe-inline'")
    expect(middlewareContent).not.toContain("'unsafe-eval'")
  })

  it('should implement nonce-based CSP', () => {
    const fs = require('fs')
    const path = require('path')
    const middlewarePath = path.join(__dirname, '../src/middleware.ts')
    
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
    
    // Should implement nonce-based approach
    expect(middlewareContent).toContain('nonce-${nonce}')
    expect(middlewareContent).toContain('x-nonce')
    expect(middlewareContent).toContain('generateNonce')
  })

  it('should include additional security headers', () => {
    const fs = require('fs')
    const path = require('path')
    const middlewarePath = path.join(__dirname, '../src/middleware.ts')
    
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
    
    // Should include security headers
    expect(middlewareContent).toContain('Strict-Transport-Security')
    expect(middlewareContent).toContain('X-Frame-Options')
    expect(middlewareContent).toContain('X-Content-Type-Options')
    expect(middlewareContent).toContain('X-XSS-Protection')
    expect(middlewareContent).toContain('Referrer-Policy')
    expect(middlewareContent).toContain('Permissions-Policy')
  })

  it('should include CSP reporting configuration', () => {
    const fs = require('fs')
    const path = require('path')
    const middlewarePath = path.join(__dirname, '../src/middleware.ts')
    
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
    
    // Should include reporting
    expect(middlewareContent).toContain('report-uri')
    expect(middlewareContent).toContain('report-to')
    expect(middlewareContent).toContain('csp-endpoint')
  })

  it('should allow WordPress domains in CSP', () => {
    const fs = require('fs')
    const path = require('path')
    const middlewarePath = path.join(__dirname, '../src/middleware.ts')
    
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')
    
    // Should allow WordPress domains
    expect(middlewareContent).toContain('https://mitrabantennews.com')
    expect(middlewareContent).toContain('https://www.mitrabantennews.com')
  })
})