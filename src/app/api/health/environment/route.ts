import { NextRequest, NextResponse } from 'next/server'
import { getEnvironmentStatus } from '@/lib/config/envValidation'
import { withApiRateLimit } from '@/lib/api/rateLimitMiddleware'

export const dynamic = 'force-dynamic'

async function environmentHandler(_request: NextRequest) {
  const status = getEnvironmentStatus()

  if (status.valid) {
    return NextResponse.json(status, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    })
  }

  return NextResponse.json(status, {
    status: 500,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json'
    }
  })
}

export const GET = withApiRateLimit(environmentHandler, 'environment')
