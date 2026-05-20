import { NextRequest, NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { corsHeaders, handleCorsPreflight } from '@/lib/api/cors'

interface ErrorResponse {
  error: {
    type: string
    message: string
    timestamp: string
  }
}

function createErrorResponse(status: number, errorType: string, message: string): NextResponse<ErrorResponse> {
  const body: ErrorResponse = {
    error: {
      type: errorType,
      message,
      timestamp: new Date().toISOString(),
    },
  }
  return NextResponse.json(body, { status })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const preflight = handleCorsPreflight(request)
  if (preflight) {
    return preflight
  }

  try {
    const { id } = await params
    const mediaId = parseInt(id, 10)

    if (isNaN(mediaId)) {
      return corsHeaders(request, NextResponse.json({ source_url: null }, { status: 400 }))
    }

    const result = await standardizedAPI.getMediaById(mediaId)

    if (!isApiResultSuccessful(result) || !result.data) {
      const error = result.error
      logger.warn('Failed to fetch media from API', undefined, {
        module: 'api/media',
        errorType: error?.type,
        errorMessage: error?.message,
      })

      if (error?.type === 'TIMEOUT_ERROR') {
        return corsHeaders(request, createErrorResponse(504, 'GATEWAY_TIMEOUT', 'WordPress API request timed out'))
      }
      if (error?.type === 'RATE_LIMIT_ERROR') {
        return corsHeaders(request, createErrorResponse(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests to WordPress API'))
      }
      if (error?.type === 'SERVER_ERROR') {
        return corsHeaders(request, createErrorResponse(502, 'BAD_GATEWAY', 'WordPress API returned server error'))
      }
      if (error?.type === 'CIRCUIT_BREAKER_OPEN') {
        return corsHeaders(request, createErrorResponse(503, 'SERVICE_UNAVAILABLE', 'WordPress API temporarily unavailable'))
      }

      return corsHeaders(request, createErrorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch media from WordPress API'))
    }

    const response = NextResponse.json({
      source_url: result.data.source_url,
      alt_text: result.data.alt_text,
    })
    return corsHeaders(request, response)
  } catch (error) {
    logger.error('Error in /api/media/[id]', error, { module: 'api/media' })
    return corsHeaders(request, createErrorResponse(500, 'INTERNAL_ERROR', 'An unexpected error occurred'))
  }
}