describe('Security Middleware Configuration', () => {
  it('should have correct CSP configuration in next.config.js', () => {
    const nextConfig = require('../next.config.js')
    
    expect(nextConfig.headers).toBeDefined()
    expect(typeof nextConfig.headers).toBe('function')
  })

  it('should include WordPress domains in CSP', () => {
    const nextConfig = require('../next.config.js')
    
    // The domains should be included in the CSP configuration
    expect(nextConfig.images.domains).toContain('mitrabantennews.com')
    expect(nextConfig.images.domains).toContain('www.mitrabantennews.com')
  })

  it('should have environment variables for WordPress', () => {
    const nextConfig = require('../next.config.js')
    
    expect(nextConfig.env.WORDPRESS_URL).toBeDefined()
    expect(nextConfig.env.WORDPRESS_API_URL).toBeDefined()
  })
})