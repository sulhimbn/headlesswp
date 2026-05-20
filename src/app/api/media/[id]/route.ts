import { NextRequest, NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

function sanitizeMediaId(id: string): number | null {
  const parsed = parseInt(id, 10)
  if (isNaN(parsed) || parsed < 1 || parsed > 2147483647) return null
  return parsed
}

async function mediaHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const mediaId = sanitizeMediaId(id)

    if (mediaId === null) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 })
    }

    const result = await standardizedAPI.getMediaById(mediaId)

    if (!isApiResultSuccessful(result) || !result.data) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    return NextResponse.json({
      source_url: result.data.source_url,
      alt_text: result.data.alt_text,
    })
  } catch (error) {
    logger.error('Error in /api/media/[id]', error, { module: 'api/media' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GET = withApiRateLimit(mediaHandler as any, 'metrics')
