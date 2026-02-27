import { NextResponse } from 'next/server'
import { getEnvironmentStatus } from '@/lib/config/envValidation'

export const dynamic = 'force-dynamic'

async function environmentHandler() {
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

export const GET = environmentHandler
