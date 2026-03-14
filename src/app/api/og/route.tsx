import { ImageResponse } from 'next/og'
import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { SITE_URL } from '@/lib/api/config'

export const runtime = 'edge'

export const alt = 'Mitra Banten News'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  let title = 'Mitra Banten News'
  let excerpt = 'Berita terkini dari Banten'
  let mediaUrl: string | null = null

  try {
    const post = await enhancedPostService.getPostBySlug(slug)
    
    if (post) {
      title = post.title.rendered.replace(/<[^>]*>/g, '').trim()
      excerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '').trim().substring(0, 120)
      mediaUrl = post.mediaUrl
    }
  } catch (error) {
    console.error('Failed to fetch post for OG image:', error)
  }

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1e3a5f',
        backgroundImage: mediaUrl ? `url(${mediaUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
      }}
    >
      {mediaUrl && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}
        />
      )}
      
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '8px',
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
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1e3a5f',
          }}
        >
          M
        </div>
        <span
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: 'white',
            letterSpacing: '0.5px',
          }}
        >
          Mitra Banten News
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '40px 60px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 48,
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
        
        <div
          style={{
            fontSize: 22,
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
              fontSize: 18,
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>{formattedDate}</span>
            <span>•</span>
            <span>{SITE_URL}</span>
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  )
}
