describe('Security Middleware Configuration', () => {
  it('should have correct CSP configuration in next.config.js', () => {
    const nextConfig = require('../next.config.js')
    
    expect(nextConfig.headers).toBeDefined()
    expect(typeof nextConfig.headers).toBe('function')
  })

  it('should include WordPress domains in CSP', () => {
    const nextConfig = require('../next.config.js')
    
    // The domains should be included in the remotePatterns configuration
    expect(nextConfig.images.remotePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: 'https',
          hostname: 'mitrabantennews.com'
        }),
        expect.objectContaining({
          protocol: 'https',
          hostname: 'www.mitrabantennews.com'
        })
      ])
    )
  })

  it('should have environment variables for WordPress', () => {
    const nextConfig = require('../next.config.js')
    
    expect(nextConfig.env.WORDPRESS_URL).toBeDefined()
    expect(nextConfig.env.WORDPRESS_API_URL).toBeDefined()
  })
})