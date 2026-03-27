import { generateOGImage, alt, size, contentType } from '@/lib/utils/ogImage'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
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
    const categoryResult = await standardizedAPI.getCategoryBySlug(slug)

    if (!isApiResultSuccessful(categoryResult)) {
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
            Category Not Found
          </div>
        )
      , {
        width: size.width,
        height: size.height,
      })
    }

    const category = categoryResult.data
    const categoryName = category.name

    return generateOGImage({
      title: '',
      description: '',
      type: 'category',
      categoryName,
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
