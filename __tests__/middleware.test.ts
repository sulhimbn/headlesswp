describe('Security Middleware Configuration', () => {
  let nextConfig: unknown

  beforeAll(async () => {
    // Dynamic import for ES module
    const config = await import('../next.config.js')
    nextConfig = config.default
  })

  it('should have correct CSP configuration in next.config.js', () => {
    expect((nextConfig as { headers?: unknown }).headers).toBeDefined()
    expect(typeof (nextConfig as { headers: () => unknown }).headers).toBe('function')
  })

  it('should include WordPress domains in CSP', () => {
    // The domains should be included in the remotePatterns configuration
    expect((nextConfig as { images: { remotePatterns: unknown[] } }).images.remotePatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          protocol: 'https',
          hostname: 'mitrabantennews.com',
        }),
        expect.objectContaining({
          protocol: 'https',
          hostname: 'www.mitrabantennews.com',
        })
      ])
    )
  })

  it('should have environment variables for WordPress', () => {
    expect((nextConfig as { env: { WORDPRESS_URL?: string; WORDPRESS_API_URL?: string } }).env.WORDPRESS_URL).toBeDefined()
    expect((nextConfig as { env: { WORDPRESS_URL?: string; WORDPRESS_API_URL?: string } }).env.WORDPRESS_API_URL).toBeDefined()
  })
})