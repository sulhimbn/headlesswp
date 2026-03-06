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
      expect(result.errors || []).toHaveLength(0)
    })

    it('should return warnings when optional env vars are not set', () => {
      delete process.env.NEXT_PUBLIC_WORDPRESS_API_URL
      delete process.env.NEXT_PUBLIC_WORDPRESS_URL
      delete process.env.NEXT_PUBLIC_SITE_URL

      const result = validateEnvironment()

      expect(result.valid).toBe(false)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should return error when env var has invalid format', () => {
      process.env.NEXT_PUBLIC_WORDPRESS_API_URL = 'not-a-url'
      process.env.NEXT_PUBLIC_WORDPRESS_URL = 'https://example.com'

      const result = validateEnvironment()

      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual(
        expect.stringContaining('invalid format')
      )
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
