import { validateEnvironment, logEnvironmentValidation } from '@/lib/config/envValidation'

describe('envValidation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('validateEnvironment', () => {
    it('should return valid when all required env vars are set', () => {
      process.env.NEXT_PUBLIC_WORDPRESS_API_URL = 'https://example.com/wp-json'
      process.env.NEXT_PUBLIC_WORDPRESS_URL = 'https://example.com'
      process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'

      const result = validateEnvironment()

      expect(result.valid).toBe(true)
      expect(result.missing).toHaveLength(0)
    })

    it('should return warnings when optional env vars are not set', () => {
      process.env.NEXT_PUBLIC_WORDPRESS_API_URL = 'https://example.com/wp-json'
      process.env.NEXT_PUBLIC_WORDPRESS_URL = 'https://example.com'
      delete process.env.NEXT_PUBLIC_SITE_URL

      const result = validateEnvironment()

      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should return missing when required env vars are not set', () => {
      delete process.env.NEXT_PUBLIC_WORDPRESS_API_URL
      delete process.env.NEXT_PUBLIC_WORDPRESS_URL
      delete process.env.NEXT_PUBLIC_SITE_URL
      delete process.env.NEXT_PUBLIC_SITE_URL_WWW
      delete process.env.NEXT_PUBLIC_FEATURE_PERSONALIZED_RECOMMENDATIONS
      delete process.env.NEXT_PUBLIC_FEATURE_RECOMMENDATION_ANALYTICS
      delete process.env.SKIP_RETRIES

      const result = validateEnvironment()

      expect(result.valid).toBe(false)
      expect(result.missing).toContain('NEXT_PUBLIC_WORDPRESS_URL')
      expect(result.missing).toContain('NEXT_PUBLIC_WORDPRESS_API_URL')
    })

    it('should accept http URLs', () => {
      process.env.NEXT_PUBLIC_WORDPRESS_API_URL = 'http://example.com/wp-json'
      process.env.NEXT_PUBLIC_WORDPRESS_URL = 'https://example.com'

      const result = validateEnvironment()

      expect(result.valid).toBe(true)
    })

    it('should accept https URLs', () => {
      process.env.NEXT_PUBLIC_WORDPRESS_API_URL = 'https://example.com/wp-json'
      process.env.NEXT_PUBLIC_WORDPRESS_URL = 'https://example.com'

      const result = validateEnvironment()

      expect(result.valid).toBe(true)
    })
  })

  describe('logEnvironmentValidation', () => {
    it('should not throw when called', () => {
      expect(() => {
        logEnvironmentValidation()
      }).not.toThrow()
    })
  })
})
