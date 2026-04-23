import { NextRequest, NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'
import { WordPressMedia } from '@/types/wordpress'
import { logger } from '@/lib/utils/logger'

function isValidId(id: string): boolean {
  const num = parseInt(id, 10)
  return !isNaN(num) && num > 0
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json({ urls: [] })
    }

    const ids = idsParam.split(',').filter(isValidId).map(id => parseInt(id, 10))

    if (ids.length === 0) {
      return NextResponse.json({ urls: [] })
    }

    const urls: Record<number, string | null> = {}

    const results = await Promise.all(
      ids.map(async (id) => {
        const result = await standardizedAPI.getMediaById(id)
        return { id, url: result.data?.source_url || null }
      })
    )

    for (const { id, url } of results) {
      urls[id] = url
    }

    return NextResponse.json({ urls })
  } catch (error) {
    logger.error('Error in /api/media/batch', error, { module: 'api/media/batch' })
    return NextResponse.json({ urls: {} })
  }
}