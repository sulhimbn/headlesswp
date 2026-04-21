import { NextResponse } from 'next/server'
import { getEnvironmentStatus } from '@/lib/config/envValidation'
import { withCors, corsOptionsResponse } from '@/lib/api/cors'

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return corsOptionsResponse()
}

async function environmentHandler() {
  const status = getEnvironmentStatus()

  if (status.valid) {
    return withCors(NextResponse.json(status, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    }))
  }

  return withCors(NextResponse.json(status, {
    status: 500,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'application/json'
    }
  }))
}

export const GET = environmentHandler
