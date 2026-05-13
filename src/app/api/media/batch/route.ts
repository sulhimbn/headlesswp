import { NextResponse } from 'next/server'
import { wordpressAPI } from '@/lib/wordpress'
import { logger } from '@/lib/utils/logger'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')

    if (!idsParam) {
      return NextResponse.json({}, { status: 200 })
    }

    const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id) && id > 0)

    if (ids.length === 0) {
      return NextResponse.json({}, { status: 200 })
    }

    const mediaUrls = await wordpressAPI.getMediaUrlsBatch(ids)

    const result: Record<number, string | null> = {}
    ids.forEach(id => {
      result[id] = mediaUrls.get(id) || null
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    logger.error('Error in /api/media/batch', error, { module: 'api/media/batch' })
    return NextResponse.json({}, { status: 200 })
  }
}