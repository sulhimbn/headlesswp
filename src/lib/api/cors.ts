import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : []

export function corsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin')
  
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)
    
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      response.headers.set('Access-Control-Max-Age', '86400')
    }
  }
  
  return response
}

export function handleCorsPreflight(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    return corsHeaders(request, response)
  }
  return null
}

export function withCors(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const preflightResponse = handleCorsPreflight(request)
    if (preflightResponse) {
      return preflightResponse
    }
    
    const response = await handler(request)
    return corsHeaders(request, response)
  }
}