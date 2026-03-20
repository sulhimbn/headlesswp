import { ImageResponse } from 'next/og'
import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { SITE_URL } from '@/lib/api/config'

export const runtime = 'edge'

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').trim()
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const post = await enhancedPostService.getPostBySlug(slug)

  if (!post) {
    return new Response('Post not found', { status: 404 })
  }

  const title = stripHtml(post.title.rendered)
  const description = stripHtml(post.excerpt.rendered).substring(0, 120)
  const imageUrl = post.mediaUrl || `${SITE_URL}/og-image.jpg`
  const categoryName = post.categoriesDetails?.[0]?.name || 'Berita'

  const fontData = await fetch(
    new URL('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2')
  ).then(res => res.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1e3a8a',
          padding: '60px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#fbbf24',
              letterSpacing: '-0.02em',
            }}
          >
            Mitra Banten News
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              padding: '8px 16px',
              borderRadius: '8px',
            }}
          >
            {categoryName}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '40px',
              alignItems: 'flex-end',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              <div
                style={{
                  fontSize: title.length > 60 ? '42px' : '52px',
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: '22px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {description}
              </div>
            </div>

            {imageUrl && !imageUrl.includes('placeholder') && (
              <div
                style={{
                  width: '350px',
                  height: '250px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '4px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <img
                  src={imageUrl}
                  alt=""
                  width={350}
                  height={250}
                  style={{
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '2px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <div
            style={{
              fontSize: '18px',
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            mitrabantennews.com
          </div>
          <div
            style={{
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            {new Date().toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
          weight: 600,
        },
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
        {
          name: 'Inter',
          data: fontData,
          style: 'normal',
          weight: 800,
        },
      ],
    }
  )
}
