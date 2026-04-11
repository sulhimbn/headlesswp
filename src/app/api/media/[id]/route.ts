import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

const MAX_MEDIA_ID = 1000000

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mediaId = parseInt(id, 10)

    if (isNaN(mediaId) || mediaId < 1 || mediaId > MAX_MEDIA_ID) {
      return NextResponse.json(
        { error: 'Invalid media ID', source_url: null },
        { status: 400 }
      )
    }

    const result = await standardizedAPI.getMediaById(mediaId)

    if (!isApiResultSuccessful(result)) {
      const errorMsg = result.error?.message || 'Failed to fetch media'
      logger.warn('Failed to fetch media', undefined, { module: 'api/media', error: result.error })
      return NextResponse.json(
        { error: errorMsg, source_url: null },
        { status: 503 }
      )
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Media not found', source_url: null },
        { status: 404 }
      )
    }

    return NextResponse.json({
      source_url: result.data.source_url,
      alt_text: result.data.alt_text,
    })
  } catch (error) {
    logger.error('Error in /api/media/[id]', error, { module: 'api/media' })
    return NextResponse.json(
      { error: 'Internal server error', source_url: null },
      { status: 500 }
    )
  }
}
