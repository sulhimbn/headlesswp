import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { addCorsHeaders } from '@/lib/api/corsHeaders'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const mediaId = parseInt(id, 10)

    if (isNaN(mediaId)) {
      const response = NextResponse.json({ error: 'Invalid media ID' }, { status: 400 })
      addCorsHeaders(response)
      return response
    }

    const result = await standardizedAPI.getMediaById(mediaId)

    if (!isApiResultSuccessful(result) || !result.data) {
      const response = NextResponse.json({ error: 'Media not found' }, { status: 404 })
      addCorsHeaders(response)
      return response
    }

    const response = NextResponse.json({
      source_url: result.data.source_url,
      alt_text: result.data.alt_text,
    })
    addCorsHeaders(response)
    return response
  } catch (error) {
    logger.error('Error in /api/media/[id]', error, { module: 'api/media' })
    const response = NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    addCorsHeaders(response)
    return response
  }
}
