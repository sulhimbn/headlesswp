import { NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const ids = body.ids

    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids must be an array' }, { status: 400 })
    }

    const validIds = ids.filter((id: unknown): id is number => typeof id === 'number' && id > 0).slice(0, 20)

    if (validIds.length === 0) {
      return NextResponse.json({ media: [] })
    }

    const results: Record<number, string | null> = {}

    await Promise.all(
      validIds.map(async (id) => {
        const result = await standardizedAPI.getMediaById(id)
        results[id] = result.data?.source_url ?? null
      })
    )

    return NextResponse.json({ media: results })
  } catch (error) {
    logger.error('Error in /api/media batch', error, { module: 'api/media' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}