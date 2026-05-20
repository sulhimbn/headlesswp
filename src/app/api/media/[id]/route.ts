import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { withCors, corsOptionsResponse } from '@/lib/api/cors'

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mediaId = parseInt(id, 10)

    if (isNaN(mediaId)) {
      return withCors(NextResponse.json({ error: 'Invalid media ID' }, { status: 400 }))
    }

    const result = await standardizedAPI.getMediaById(mediaId)

    if (!isApiResultSuccessful(result) || !result.data) {
      return withCors(NextResponse.json({ error: 'Media not found' }, { status: 404 }))
    }

    return withCors(NextResponse.json({
      source_url: result.data.source_url,
      alt_text: result.data.alt_text,
    }))
  } catch (error) {
    logger.error('Error in /api/media/[id]', error, { module: 'api/media' })
    return withCors(NextResponse.json({ error: 'Internal server error' }, { status: 500 }))
  }
}
