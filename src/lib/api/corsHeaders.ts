import { NextResponse } from 'next/server'

export function addCorsHeaders(response: NextResponse): void {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export function createCorsResponse(
  data: unknown,
  status = 200
): NextResponse {
  const response = NextResponse.json(data, { status })
  addCorsHeaders(response)
  return response
}

export async function handleCorsOptionsRequest(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}