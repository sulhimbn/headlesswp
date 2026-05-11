import { NextResponse } from 'next/server'
import { SITE_URL } from '@/lib/api/config'

export const dynamic = 'force-dynamic'

/**
 * Security.txt endpoint following the specification at https://securitytxt.org/
 * 
 * This endpoint provides security researchers with a standardized way to
 * report vulnerabilities according to the SEOBN (Security Engineers Open Bug
 * Bounty Network) guidelines.
 */
export async function GET() {
  const contactEmail = 'security@mitrabantennews.com'
  
  // Calculate expiration date (1 year from now)
  const expiresDate = new Date()
  expiresDate.setFullYear(expiresDate.getFullYear() + 1)
  
  const securityTxtContent = `# Security Contact Information
# https://securitytxt.org/

Contact: mailto:${contactEmail}
Expires: ${expiresDate.toUTCString()}
Preferred-Languages: en
Canonical: ${SITE_URL}/security.txt
Policy: ${SITE_URL}/docs/guides/SECURITY.md
`

  return new NextResponse(securityTxtContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
