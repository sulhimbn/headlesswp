import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BOT_UA_PATTERNS = [
  /bot/i,
  /spider/i,
  /crawler/i,
  /slurp/i,
  /search/i,
  /archive/i,
  /fetch/i,
];

const CACHE_HEADERS = {
  default: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  },
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
  api: {
    'Cache-Control': 'no-store, must-revalidate',
  },
};

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function getPathType(pathname: string): 'api' | 'static' | 'default' {
  if (pathname.startsWith('/api/')) return 'api';
  if (
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|css|js)$/)
  ) {
    return 'static';
  }
  return 'default';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isBot = isBotUserAgent(request.headers.get('user-agent'));
  if (isBot) {
    console.warn(`[Middleware] Bot detected: ${request.headers.get('user-agent')}`);
  }

  const response = NextResponse.next();

  const pathType = getPathType(pathname);
  const headers = CACHE_HEADERS[pathType];

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (request.method === 'GET') {
    const etag = `W/"${Buffer.from(request.url).toString('base64').slice(0, 16)}"`;
    response.headers.set('ETag', etag);
    response.headers.set('Vary', 'Accept-Encoding');
  }

  if (isBot) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  const country = request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry');
  if (country) {
    response.headers.set('X-Geo-Country', country);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
