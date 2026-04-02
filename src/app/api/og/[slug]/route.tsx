import { ImageResponse } from 'next/og'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { SITE_URL } from '@/lib/api/config'

export const alt = 'OG Image'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  try {
    const result = await standardizedAPI.getPostBySlug(slug)
    
    if (!isApiResultSuccessful(result) || !result.data) {
      return generateDefaultOGImage('Article Not Found')
    }

    const post = result.data
    const title = post.title?.rendered || 'Untitled'
    const excerpt = post.excerpt?.rendered?.replace(/<[^>]*>?/gm, '').trim().substring(0, 150) || ''
    const siteName = 'Mitra Banten News'

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
            backgroundColor: '#1a1a2e',
            backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            fontSize: 48,
            color: 'white',
            padding: 60,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 60,
              fontSize: 24,
              color: '#e94560',
              fontWeight: 600,
            }}
          >
            {siteName}
          </div>
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: 1000,
            }}
          >
            <h1
              style={{
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1.2,
                color: 'white',
                marginBottom: 24,
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              {title}
            </h1>
            
            {excerpt && (
              <p
                style={{
                  fontSize: 28,
                  color: '#a0a0b0',
                  lineHeight: 1.4,
                  maxWidth: 900,
                }}
              >
                {excerpt}
              </p>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 60,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontSize: 20,
                color: '#666680',
              }}
            >
              {SITE_URL}
            </span>
          </div>
        </div>
      ),
      {
        ...size,
      }
    )
  } catch {
    return generateDefaultOGImage('Error Loading Article')
  }
}

function generateDefaultOGImage(title: string) {
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
          backgroundColor: '#1a1a2e',
          backgroundImage: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          fontSize: 48,
          color: 'white',
          padding: 60,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 60,
            fontSize: 24,
            color: '#e94560',
            fontWeight: 600,
          }}
        >
          Mitra Banten News
        </div>
        
        <h1
          style={{
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.2,
            color: 'white',
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          {title}
        </h1>
      </div>
    ),
    {
      ...size,
    }
  )
}

export async function GET() {
  return generateDefaultOGImage('Mitra Banten News')
}
