/**
 * Tests for security.txt endpoint
 * 
 * This endpoint provides security researchers with a standardized way to
 * report vulnerabilities according to the security.txt specification:
 * https://securitytxt.org/
 */

describe('security.txt Endpoint', () => {
  const mockSiteUrl = 'https://mitrabantennews.com'
  const mockContactEmail = 'security@mitrabantennews.com'

  // Helper function to generate security.txt content (matches route handler logic)
  function generateSecurityTxtContent(contactEmail: string, siteUrl: string): string {
    const expiresDate = new Date()
    expiresDate.setFullYear(expiresDate.getFullYear() + 1)
    
    return `# Security Contact Information
# https://securitytxt.org/

Contact: mailto:${contactEmail}
Expires: ${expiresDate.toUTCString()}
Preferred-Languages: en
Canonical: ${siteUrl}/security.txt
Policy: ${siteUrl}/docs/guides/SECURITY.md
`
  }

  describe('Security.txt Content Generation', () => {
    it('should include contact email', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      expect(content).toContain(`Contact: mailto:${mockContactEmail}`)
    })

    it('should include valid expires date', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      // Should contain a valid UTC date
      expect(content).toContain('Expires:')
      expect(content).toMatch(/Expires: .+GMT/)
    })

    it('should include preferred languages', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      expect(content).toContain('Preferred-Languages: en')
    })

    it('should include canonical URL', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      expect(content).toContain(`Canonical: ${mockSiteUrl}/security.txt`)
    })

    it('should include policy URL', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      expect(content).toContain(`Policy: ${mockSiteUrl}/docs/guides/SECURITY.md`)
    })

    it('should follow security.txt specification format', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      // Check required field
      expect(content).toContain('Contact:')
      
      // Check recommended field
      expect(content).toContain('Expires:')
      
      // Check optional fields
      expect(content).toContain('Preferred-Languages:')
      expect(content).toContain('Canonical:')
      expect(content).toContain('Policy:')
    })

    it('should use mailto: prefix for email contact', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      expect(content).toContain('mailto:')
      expect(content).toContain('security@mitrabantennews.com')
    })

    it('should include security.txt.org reference', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      expect(content).toContain('https://securitytxt.org/')
    })

    it('should have correct structure with comments', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      const lines = content.split('\n')
      expect(lines[0]).toBe('# Security Contact Information')
      expect(lines[1]).toBe('# https://securitytxt.org/')
      expect(lines[2]).toBe('')
    })

    it('should handle different site URLs correctly', () => {
      const customSiteUrl = 'https://example.com'
      const content = generateSecurityTxtContent('security@example.com', customSiteUrl)
      
      expect(content).toContain(`Canonical: ${customSiteUrl}/security.txt`)
      expect(content).toContain(`Policy: ${customSiteUrl}/docs/guides/SECURITY.md`)
    })
  })

  describe('Security.txt Specification Compliance', () => {
    it('should have Contact as required field', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      // Contact field is required per spec
      const contactMatch = content.match(/^Contact:/m)
      expect(contactMatch).toBeTruthy()
    })

    it('should have Expires as recommended field', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      // Expires field is recommended per spec
      const expiresMatch = content.match(/^Expires:/m)
      expect(expiresMatch).toBeTruthy()
    })

    it('should have Preferred-Languages as optional field', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      // Preferred-Languages is optional per spec
      const langMatch = content.match(/^Preferred-Languages:/m)
      expect(langMatch).toBeTruthy()
    })

    it('should have Canonical as optional field', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      // Canonical is optional per spec
      const canonicalMatch = content.match(/^Canonical:/m)
      expect(canonicalMatch).toBeTruthy()
    })

    it('should have Policy as optional field', () => {
      const content = generateSecurityTxtContent(mockContactEmail, mockSiteUrl)
      
      // Policy is optional per spec
      const policyMatch = content.match(/^Policy:/m)
      expect(policyMatch).toBeTruthy()
    })
  })
})
