import { generateOGImage, alt, size, contentType } from '@/lib/utils/ogImage'
import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const altText = alt
export const contentTypeImage = contentType
export const imageSize = size

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const post = await enhancedPostService.getPostBySlug(slug)

    if (!post) {
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
              fontSize: 32,
              color: '#ffffff',
            }}
          >
            Post Not Found
          </div>
        )
      , {
        width: size.width,
        height: size.height,
      })
    }

    const title = post.title.rendered
    const description = post.excerpt.rendered.replace(/<[^>]*>?/gm, '').trim().substring(0, 160)
    const image = post.mediaUrl || undefined

    return generateOGImage({
      title,
      description,
      image,
      type: 'post',
    })
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
            fontSize: 32,
            color: '#ffffff',
          }}
        >
          Error generating image
        </div>
      )
    , {
      width: size.width,
      height: size.height,
    })
  }
}
