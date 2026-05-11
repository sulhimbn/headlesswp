import { NextResponse } from 'next/server'
import { getSecurityTxtContent } from '@/lib/utils/securityTxt'

export const dynamic = 'force-dynamic'

export async function GET() {
  const content = getSecurityTxtContent()

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}