'use client'

import { ImageResponse } from 'next/og'
import { SITE_URL } from '@/lib/api/config'

export const runtime = 'edge'

export const alt = 'Mitra Banten News'
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

interface OGImageProps {
  title: string
  description?: string
  image?: string
  type?: 'post' | 'category'
  categoryName?: string
}

export function generateOGImage({
  title,
  description,
  image,
  type = 'post',
  categoryName,
}: OGImageProps): ImageResponse {
  const isCategory = type === 'category'
  const titleText = isCategory ? `Kategori: ${categoryName}` : title
  const subtitleText = isCategory
    ? `Berita terkini dalam kategori ${categoryName}`
    : description || 'Baca berita terkini di Mitra Banten News'

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
          backgroundImage: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 50%, #1e3a5f 100%)',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {image && !isCategory && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.3,
            }}
          />
        )}

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
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 700,
              color: '#1e3a5f',
            }}
          >
            MBN
          </div>
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#ffffff',
              letterSpacing: 1,
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
            maxWidth: 900,
            padding: '0 60px',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: '#94a3b8',
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            {isCategory ? 'Kategori' : 'Artikel'}
          </span>

          <h1
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.1,
              marginBottom: 24,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {titleText}
          </h1>

          {!isCategory && (
            <p
              style={{
                fontSize: 24,
                color: '#cbd5e1',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {subtitleText}
            </p>
          )}

          {isCategory && (
            <p
              style={{
                fontSize: 24,
                color: '#cbd5e1',
                lineHeight: 1.4,
              }}
            >
              {subtitleText}
            </p>
          )}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 18,
              color: '#94a3b8',
            }}
          >
            {SITE_URL}
          </span>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 40,
            left: 40,
            display: 'flex',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          />
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.1)',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
