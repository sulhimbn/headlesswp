import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { CACHE_TIMES } from '@/lib/api/config'

const CACHE_CONTROL = `public, max-age=${CACHE_TIMES.MEDIUM}, s-maxage=${CACHE_TIMES.LONG}, stale-while-revalidate=${CACHE_TIMES.MEDIUM_LONG}`

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mediaId = parseInt(id, 10)

    if (isNaN(mediaId) || mediaId < 1) {
      return NextResponse.json(
        { error: 'Invalid media ID format' },
        { status: 400 }
      )
    }

    const result = await standardizedAPI.getMediaById(mediaId)

    if (!isApiResultSuccessful(result)) {
      if (result.error?.statusCode === 404) {
        return NextResponse.json(
          { error: 'Media not found' },
          { status: 404 }
        )
      }
      const status = result.error?.statusCode || 503
      return NextResponse.json(
        { error: 'Failed to fetch media', details: result.error?.message },
        { status }
      )
    }

    const response = NextResponse.json({
      source_url: result.data.source_url,
      alt_text: result.data.alt_text,
    })
    response.headers.set('Cache-Control', CACHE_CONTROL)
    return response
  } catch (error) {
    logger.error('Error in /api/media/[id]', error, { module: 'api/media' })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
