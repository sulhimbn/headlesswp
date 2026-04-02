import { ImageResponse } from '@vercel/og'
import { NextRequest, NextResponse } from 'next/server'
import { cacheManager } from '@/lib/cache'

export const OG_IMAGE_CONFIG = {
  width: 1200,
  height: 630,
  siteName: 'Mitra Banten News',
  defaultBg: '#1a1a2e',
  defaultText: '#ffffff',
  accentColor: '#e63946',
} as const

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxChars) {
      currentLine = (currentLine + ' ' + word).trim()
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)

  return lines
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'Article'
  const image = searchParams.get('image') || undefined
  const category = searchParams.get('category') || undefined
  const author = searchParams.get('author') || undefined
  const date = searchParams.get('date') || undefined
  const postId = searchParams.get('postId') || undefined

  const cacheKey = postId ? `og-image:${postId}` : `og-image:${title.substring(0, 50)}`
  const cached = cacheManager.get<ArrayBuffer>(cacheKey)
  
  if (cached) {
    return new NextResponse(cached, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  }

  const titleLines = wrapText(title, 40)
  const displayTitle = titleLines.slice(0, 2).join('\n')

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: OG_IMAGE_CONFIG.defaultBg,
          padding: '60px',
          position: 'relative',
        }}
      >
        {image && (
          <img
            src={image}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.3,
            }}
          />
        )}
        
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to bottom, rgba(26,26,46,0.8) 0%, rgba(26,26,46,0.95) 100%)',
          }}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            zIndex: 1,
            textAlign: 'center',
          }}
        >
          {category && (
            <div
              style={{
                backgroundColor: OG_IMAGE_CONFIG.accentColor,
                color: OG_IMAGE_CONFIG.defaultText,
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: 24,
                fontWeight: 600,
                marginBottom: 32,
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {category}
            </div>
          )}

          <div
            style={{
              color: OG_IMAGE_CONFIG.defaultText,
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.2,
              textAlign: 'center',
              maxWidth: '1000px',
            }}
          >
            {displayTitle}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {author && (
              <span style={{ color: '#a0a0b0', fontSize: 24 }}>
                {author}
              </span>
            )}
            {date && (
              <span style={{ color: '#606070', fontSize: 20 }}>
                {date}
              </span>
            )}
          </div>

          <span
            style={{
              color: OG_IMAGE_CONFIG.accentColor,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {OG_IMAGE_CONFIG.siteName}
          </span>
        </div>
      </div>
    ),
    {
      width: OG_IMAGE_CONFIG.width,
      height: OG_IMAGE_CONFIG.height,
    }
  )

  const arrayBuffer = await imageResponse.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  cacheManager.set(cacheKey, buffer, 86400 * 1000)

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
