import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.redirect(new URL('/.well-known/security.txt', 'https://mitrabantennews.com'), 301)
}