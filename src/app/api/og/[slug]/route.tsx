import { ImageResponse } from 'next/og'
import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { SITE_URL } from '@/lib/api/config'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const alt = 'Mitra Banten News'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

interface Props {
  params: Promise<{ slug: string }>
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').trim()
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export default async function Image({ params }: Props) {
  const { slug } = await params
  
  let title = 'Mitra Banten News'
  let excerpt = 'Berita terkini dari Banten'
  let mediaUrl: string | null = null

  try {
    const post = await enhancedPostService.getPostBySlug(slug)
    
    if (post) {
      title = stripHtml(post.title.rendered)
      excerpt = truncate(stripHtml(post.excerpt.rendered), 120)
      mediaUrl = post.mediaUrl
    }
  } catch (error) {
    console.error('Failed to fetch post for OG image:', error)
  }

  const siteName = 'Mitra Banten News'
  const siteUrl = SITE_URL.replace('https://', '')

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1e3a5f',
          position: 'relative',
        }}
      >
        {mediaUrl && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${mediaUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
        {mediaUrl && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
            }}
          />
        )}
        
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '10px',
            background: 'linear-gradient(to right, #f59e0b, #d97706)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              backgroundColor: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 'bold',
              color: '#1e3a5f',
            }}
          >
            M
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: 'white',
              letterSpacing: '0.5px',
            }}
          >
            {siteName}
          </span>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '50px 60px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.4), transparent)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
          
          {excerpt && (
            <div
              style={{
                fontSize: 24,
                color: '#e5e7eb',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {excerpt}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: '#9ca3af',
              }}
            >
              {siteUrl}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}