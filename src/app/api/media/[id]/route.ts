import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful, createErrorResponse } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mediaId = parseInt(id, 10)

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: { type: 'CLIENT_ERROR', message: 'Invalid media ID', retryable: false } },
        { status: 400 }
      )
    }

    const result = await standardizedAPI.getMediaById(mediaId)

    if (!isApiResultSuccessful(result) || !result.data) {
      logger.warn('Failed to fetch media from API', result.error, { module: 'api/media' })
      return createErrorResponse(result.error, result.metadata?.endpoint)
    }

    return NextResponse.json({
      source_url: result.data.source_url,
      alt_text: result.data.alt_text,
    })
  } catch (error) {
    logger.error('Error in /api/media/[id]', error, { module: 'api/media' })
    return createErrorResponse(error)
  }
}
