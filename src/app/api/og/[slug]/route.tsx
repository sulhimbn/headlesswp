import { ImageResponse } from 'next/og'
import { getPostBySlug } from '@/lib/api/standardized'
import { SITE_URL } from '@/lib/api/config'

export const runtime = 'edge'

export const alt = 'Artikel Mitra Banten News'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

interface OGImageOptions {
  title: string
  category?: string
  date?: string
  excerpt?: string
}

function generateOGImage({ title, category, date, excerpt }: OGImageOptions): ImageResponse {
  const titleFontSize = title.length > 60 ? '48px' : '64px'
  const excerptFontSize = excerpt && excerpt.length > 100 ? '24px' : '28px'

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
          backgroundColor: '#dc2626',
          backgroundImage: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
          fontFamily: 'Inter, sans-serif',
          padding: '60px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '16px 32px',
            marginBottom: '40px',
            position: 'absolute',
            top: '60px',
          }}
        >
          <span
            style={{
              color: '#dc2626',
              fontSize: '24px',
              fontWeight: '700',
              letterSpacing: '0.5px',
            }}
          >
            Mitra Banten News
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            maxWidth: '900px',
            textAlign: 'center',
          }}
        >
          {category && (
            <span
              style={{
                color: '#fecaca',
                fontSize: '24px',
                fontWeight: '600',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {category}
            </span>
          )}

          <h1
            style={{
              color: 'white',
              fontSize: titleFontSize,
              fontWeight: '800',
              lineHeight: 1.2,
              marginBottom: '24px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </h1>

          {excerpt && (
            <p
              style={{
                color: '#fecaca',
                fontSize: excerptFontSize,
                fontWeight: '400',
                lineHeight: 1.5,
                marginBottom: '32px',
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

        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0 60px',
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              color: '#fecaca',
              fontSize: '20px',
              fontWeight: '500',
            }}
          >
            {date || SITE_URL}
          </span>

          <span
            style={{
              color: 'white',
              fontSize: '20px',
              fontWeight: '700',
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
}

export default async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const postResult = await getPostBySlug(slug)

    if (!postResult.data || postResult.error) {
      return generateOGImage({
        title: 'Mitra Banten News',
        category: 'Portal Berita',
        excerpt: 'Portal berita terkini dan terpercaya dari Banten dan sekitarnya',
      })
    }

    const post = postResult.data
    const title = typeof post.title === 'object' && 'rendered' in post.title 
      ? post.title.rendered 
      : String(post.title)

    const excerpt = typeof post.excerpt === 'object' && 'rendered' in post.excerpt
      ? post.excerpt.rendered.replace(/<[^>]*>/g, '').trim()
      : ''

    const embedded = post as unknown as { _embedded?: { 'wp:term'?: Array<Array<{ name: string }>> } }
    const categoryNames = embedded._embedded?.['wp:term']?.[0]?.map((term) => term.name).join(', ')
    const date = post.date ? new Date(post.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : undefined

    return generateOGImage({
      title,
      category: categoryNames,
      date,
      excerpt: excerpt.slice(0, 150),
    })
  } catch {
    return generateOGImage({
      title: 'Mitra Banten News',
      category: 'Portal Berita',
      excerpt: 'Portal berita terkini dan terpercaya dari Banten dan sekitarnya',
    })
  }
}