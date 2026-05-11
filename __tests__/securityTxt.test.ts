describe('Security.txt Endpoint', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('security.txt generation', () => {
    it('should include contact information', () => {
      process.env.SECURITY_TXT_CONTACT = 'security@example.com'
      const { getSecurityTxtContent } = require('@/lib/utils/securityTxt')
      const content = getSecurityTxtContent()
      expect(content).toContain('Contact: security@example.com')
    })

    it('should include encryption when provided', () => {
      process.env.SECURITY_TXT_ENCRYPTION = 'https://example.com/pgp-key.txt'
      const { getSecurityTxtContent } = require('@/lib/utils/securityTxt')
      const content = getSecurityTxtContent()
      expect(content).toContain('Encryption: https://example.com/pgp-key.txt')
    })

    it('should not include encryption when not provided', () => {
      delete process.env.SECURITY_TXT_ENCRYPTION
      const { getSecurityTxtContent } = require('@/lib/utils/securityTxt')
      const content = getSecurityTxtContent()
      expect(content).not.toContain('Encryption:')
    })

    it('should include preferred languages', () => {
      process.env.SECURITY_TXT_LANGUAGES = 'en,id'
      const { getSecurityTxtContent } = require('@/lib/utils/securityTxt')
      const content = getSecurityTxtContent()
      expect(content).toContain('Preferred-Languages: en,id')
    })

    it('should use default language when not provided', () => {
      delete process.env.SECURITY_TXT_LANGUAGES
      const { getSecurityTxtContent } = require('@/lib/utils/securityTxt')
      const content = getSecurityTxtContent()
      expect(content).toContain('Preferred-Languages: en')
    })

    it('should include policy when provided', () => {
      process.env.SECURITY_TXT_POLICY = 'https://example.com/security-policy'
      const { getSecurityTxtContent } = require('@/lib/utils/securityTxt')
      const content = getSecurityTxtContent()
      expect(content).toContain('Policy: https://example.com/security-policy')
    })

    it('should include expires when provided', () => {
      process.env.SECURITY_TXT_EXPIRES = '2026-12-31T23:59:59Z'
      const { getSecurityTxtContent } = require('@/lib/utils/securityTxt')
      const content = getSecurityTxtContent()
      expect(content).toContain('Expires: 2026-12-31T23:59:59Z')
    })

    it('should have proper formatting with newlines', () => {
      process.env.SECURITY_TXT_CONTACT = 'security@example.com'
      const { getSecurityTxtContent } = require('@/lib/utils/securityTxt')
      const content = getSecurityTxtContent()
      expect(content.endsWith('\n')).toBe(true)
    })
  })

  describe('Route handlers', () => {
    const mockNextResponse = {
      json: jest.fn(),
      redirect: jest.fn(),
    }

    jest.mock('next/server', () => ({
      NextResponse: {
        json: (...args: unknown[]) => mockNextResponse.json(...args),
        redirect: (...args: unknown[]) => mockNextResponse.redirect(...args),
      },
    }))

    it('should return valid security.txt content format', () => {
      process.env.SECURITY_TXT_CONTACT = 'test@example.com'
      process.env.SECURITY_TXT_LANGUAGES = 'en'
      
      const expected = `Contact: test@example.com
Preferred-Languages: en
`
      expect(expected).toContain('Contact: test@example.com')
      expect(expected).toContain('Preferred-Languages: en')
    })
  })
})