import { NextRequest, NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

async function mediaHandler(
  request: NextRequest,
  context?: unknown
) {
  const { params } = context as { params: Promise<{ id: string }> }
  const { id } = await params
  const mediaId = parseInt(id, 10)

  try {
    if (isNaN(mediaId)) {
      return NextResponse.json({ source_url: null }, { status: 200 })
    }

    const result = await standardizedAPI.getMediaById(mediaId)

    if (!isApiResultSuccessful(result) || !result.data) {
      return NextResponse.json({ source_url: null }, { status: 200 })
    }

    return NextResponse.json({
      source_url: result.data.source_url,
      alt_text: result.data.alt_text,
    })
  } catch (error) {
    logger.error('Error in /api/media/[id]', error, { module: 'api/media' })
    return NextResponse.json({ source_url: null }, { status: 200 })
  }
}

export const GET = withApiRateLimit(mediaHandler, 'media')