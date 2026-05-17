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

export default async function Image({ params }: { params: { slug: string } }) {
  const post = await enhancedPostService.getPostBySlug(params.slug)
  
  const title = post?.title?.rendered ? post.title.rendered.replace(/<[^>]*>?/gm, '').trim() : 'Mitra Banten News'
  const excerpt = post?.excerpt?.rendered 
    ? post.excerpt.rendered.replace(/<[^>]*>?/gm, '').trim().substring(0, 120) 
    : 'Portal berita terkini dari Banten'
  const siteName = 'Mitra Banten News'
  
  const fontData = await fetch(new URL('https://fonts.gstatic.com/s/poppins/v21/xD7mPjKoc8iG94tnpeD.woff2')).then((res) => res.arrayBuffer())
  
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
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
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
              backgroundColor: 'hsl(0 84% 40%)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>M</span>
          </div>
          <span style={{ color: '#f8fafc', fontSize: 24, fontWeight: 600 }}>{siteName}</span>
        </div>
        
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 900,
            padding: '0 40px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              color: 'hsl(0 84% 60%)',
              fontSize: 20,
              fontWeight: 500,
              marginBottom: 16,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            BERITA TERKINI
          </p>
          <h1
            style={{
              color: '#ffffff',
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 24,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              color: '#94a3b8',
              fontSize: 24,
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {excerpt}
          </p>
        </div>
        
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                backgroundColor: 'hsl(0 84% 40%)',
                borderRadius: 4,
              }}
            />
            <span style={{ color: '#64748b', fontSize: 18 }}>{SITE_URL}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Poppins',
          data: fontData,
          style: 'normal',
          weight: 400,
        },
        {
          name: 'Poppins',
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  )
}