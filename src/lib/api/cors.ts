import { NextResponse } from 'next/server';

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export function addCorsHeaders(response: NextResponse): NextResponse {
  const headers = corsHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function corsResponse(response: NextResponse): NextResponse {
  return addCorsHeaders(response);
}

export function corsError(status: number, body: object): NextResponse {
  const response = NextResponse.json(body, { status });
  return corsResponse(response);
}
