import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  logger.info('Deprecated /api/observability/performance endpoint accessed', { module: 'observability/performance' })
  return NextResponse.json(
    { error: 'This endpoint has been deprecated. Use /api/observability/metrics instead.' },
    { status: 301, headers: { Location: '/api/observability/metrics' } }
  )
}
