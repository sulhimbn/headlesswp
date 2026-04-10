import { NextResponse } from 'next/server'

export const GET = (request: Request) => {
  return NextResponse.redirect(new URL('/api/observability/metrics', request.url), 301)
}
