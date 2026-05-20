import { NextResponse } from 'next/server'

export const GET = () => {
  return NextResponse.redirect(new URL('/api/observability/metrics', 'http://localhost'), 301)
}

export const POST = () => {
  return NextResponse.redirect(new URL('/api/observability/metrics', 'http://localhost'), 301)
}
