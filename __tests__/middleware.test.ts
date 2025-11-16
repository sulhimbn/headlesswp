describe('Next.js Configuration', () => {
  it('should include WordPress domains in image configuration', () => {
    const nextConfig = require('../next.config.js')
    
    // The domains should be included in the image configuration
    expect(nextConfig.images.domains).toContain('mitrabantennews.com')
    expect(nextConfig.images.domains).toContain('www.mitrabantennews.com')
  })

  it('should have environment variables for WordPress', () => {
    const nextConfig = require('../next.config.js')
    
    expect(nextConfig.env.WORDPRESS_URL).toBeDefined()
    expect(nextConfig.env.WORDPRESS_API_URL).toBeDefined()
  })

  it('should not have CSP headers in next.config.js (moved to middleware)', () => {
    const nextConfig = require('../next.config.js')
    
    // CSP headers should be handled by middleware, not next.config.js
    expect(nextConfig.headers).toBeUndefined()
  })
})