import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { enhancedPostService } from '@/lib/services/enhancedPostService'

export const runtime = 'edge'

export const alt = 'OG Image'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return new NextResponse('Missing slug parameter', { status: 400 })
  }

  const post = await enhancedPostService.getPostBySlug(slug)

  if (!post) {
    return new NextResponse('Post not found', { status: 404 })
  }

  const title = post.title.rendered.replace(/<[^>]*>?/gm, '').trim()
  const excerpt = post.excerpt.rendered.replace(/<[^>]*>?/gm, '').trim().substring(0, 120)
  const hasMedia = post.featured_media > 0 && post.mediaUrl

  try {
    const fontData = await fetch('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2').then(res => res.arrayBuffer())
    const fontBoldData = await fetch('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuBWYAZ9hiJ-Ek-_EeA.woff2').then(res => res.arrayBuffer())

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#1e40af',
            position: 'relative',
          }}
        >
          {hasMedia && (
            <img
              src={post.mediaUrl!}
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
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
              backgroundColor: hasMedia ? 'rgba(0,0,0,0.5)' : 'transparent',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '60px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              height: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <span
                style={{
                  background: '#f97316',
                  color: 'white',
                  padding: '8px 16px',
                  fontSize: '24px',
                  fontFamily: 'Inter',
                  fontWeight: 700,
                  borderRadius: '8px',
                }}
              >
                MITRA BANTEN NEWS
              </span>
            </div>
            <p
              style={{
                color: 'white',
                fontSize: '48px',
                fontFamily: 'Inter',
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: '16px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </p>
            {excerpt && (
              <p
                style={{
                  color: '#e5e7eb',
                  fontSize: '28px',
                  fontFamily: 'Inter',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {excerpt}
              </p>
            )}
          </div>
        </div>
      ),
      {
        ...size,
        fonts: [
          {
            name: 'Inter',
            data: fontData,
            style: 'normal',
          },
          {
            name: 'Inter',
            data: fontBoldData,
            style: 'normal',
            weight: 700,
          },
        ],
      }
    )
  } catch {
    return new NextResponse('Failed to generate image', { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return Image(req)
}