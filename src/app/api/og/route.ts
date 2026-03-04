import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function generateSVGImage(
  title: string,
  description: string,
  siteName: string
): string {
  const sanitizedTitle = title.slice(0, 100)
  const sanitizedDescription = description.slice(0, 200)
  
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#e94560"/>
      <stop offset="100%" style="stop-color:#0f3460"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="560" width="1200" height="70" fill="url(#accent)" opacity="0.8"/>
  <text x="80" y="120" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#ffffff">
    ${sanitizedTitle.split('').map((char) => {
      if (char === '\n') return `<tspan x="80" dy="1.2em"/>`
      return char
    }).join('')}
  </text>
  <text x="80" y="220" font-family="Arial, sans-serif" font-size="28" fill="#a0a0a0">
    ${sanitizedDescription.split('').map((char) => {
      if (char === '\n') return `<tspan x="80" dy="1.2em"/>`
      return char
    }).join('')}
  </text>
  <text x="80" y="600" font-family="Arial, sans-serif" font-size="24" fill="#ffffff">${siteName}</text>
  <circle cx="1100" cy="100" r="60" fill="url(#accent)" opacity="0.6"/>
  <circle cx="1050" cy="150" r="40" fill="#e94560" opacity="0.4"/>
  <circle cx="1150" cy="80" r="30" fill="#e94560" opacity="0.3"/>
</svg>
  `.trim()
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Mitra Banten News'
    const description = searchParams.get('description') || 'Portal berita terkini dan terpercaya dari Banten'
    const siteName = searchParams.get('siteName') || 'Mitra Banten News'
    const format = searchParams.get('format') || 'svg'

    if (format === 'svg') {
      const svg = generateSVGImage(title, description, siteName)
      return new NextResponse(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      })
    }

    const svg = generateSVGImage(title, description, siteName)
    const base64 = Buffer.from(svg).toString('base64')
    
    return NextResponse.redirect(
      new URL(`data:image/svg+xml;base64,${base64}`),
      302
    )
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate OG image' },
      { status: 500 }
    )
  }
}
