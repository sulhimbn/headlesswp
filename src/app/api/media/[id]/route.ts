import { NextRequest, NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

async function mediaHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mediaId = parseInt(id, 10)

    if (isNaN(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID', details: 'ID must be a valid number' }, { status: 400 })
    }

    const result = await standardizedAPI.getMediaById(mediaId)

    if (!isApiResultSuccessful(result) || !result.data) {
      return NextResponse.json({ error: 'Failed to fetch media', details: result.error }, { status: 500 })
    }

    return NextResponse.json({
      source_url: result.data.source_url,
      alt_text: result.data.alt_text,
    })
  } catch (error) {
    logger.error('Error in /api/media/[id]', error, { module: 'api/media' })
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal server error', details: message }, { status: 500 })
  }
}

export const GET = withApiRateLimit(mediaHandler as (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>, 'media')
