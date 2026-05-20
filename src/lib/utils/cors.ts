import { NextResponse } from 'next/server'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
const ALLOWED_METHODS = ['GET', 'OPTIONS']
const MAX_AGE = '86400'

export function addCorsHeaders(response: NextResponse, origin?: string): void {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
  response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS.join(', '))
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Max-Age', MAX_AGE)
}

export function handleCors(request: Request): NextResponse {
  const origin = request.headers.get('origin')
  const response = NextResponse.json({ error: 'CORS preflight' }, { status: 204 })
  addCorsHeaders(response, origin || undefined)
  return response
}

export function addCorsToResponse(response: NextResponse, request: Request): NextResponse {
  const origin = request.headers.get('origin')
  addCorsHeaders(response, origin || undefined)
  return response
}