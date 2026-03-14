import { ImageResponse } from 'next/og'
import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { notFound } from 'next/navigation'

export const runtime = 'edge'

const OG_IMAGE_WIDTH = 1200
const OG_IMAGE_HEIGHT = 630

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const post = await enhancedPostService.getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const title = post.title.rendered.replace(/<[^>]*>?/gm, '').trim()
  const excerpt = post.excerpt.rendered.replace(/<[^>]*>?/gm, '').trim().substring(0, 120)
  const siteName = 'Mitra Banten News'
  const authorName = post.authorDetails?.name || 'Mitra Banten News'

  const fonts = {
    inter: fetch(new URL('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2')).then((res) => res.arrayBuffer()),
  }

  const fontData = await fonts.inter

  try {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e3a5f',
            backgroundImage: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
            fontFamily: 'Inter',
            padding: '60px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '1000px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: '#93c5fd',
                fontSize: 24,
                fontWeight: 600,
                marginBottom: 24,
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              {siteName}
            </div>
            <div
              style={{
                color: 'white',
                fontSize: 64,
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: 24,
              }}
            >
              {title.length > 80 ? title.substring(0, 80) + '...' : title}
            </div>
            {excerpt && (
              <div
                style={{
                  color: '#cbd5e1',
                  fontSize: 28,
                  fontWeight: 400,
                  lineHeight: 1.4,
                }}
              >
                {excerpt.length > 100 ? excerpt.substring(0, 100) + '...' : excerpt}
              </div>
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                color: '#94a3b8',
                fontSize: 20,
              }}
            >
              {authorName}
            </div>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#2563eb',
              }}
            />
            <div
              style={{
                color: '#94a3b8',
                fontSize: 20,
              }}
            >
              mitrabantennews.com
            </div>
          </div>
        </div>
      ),
      {
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        fonts: [
          {
            name: 'Inter',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    )
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e3a5f',
            color: 'white',
            fontSize: 48,
            fontFamily: 'Inter',
          }}
        >
          {siteName}
        </div>
      ),
      {
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
      }
    )
  }
}
