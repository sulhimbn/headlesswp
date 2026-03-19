import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BOT_USER_AGENTS = [
  'googlebot',
  'bingbot',
  'yandex',
  'duckduckbot',
  'baiduspider',
  'facebookexternalhit',
  'twitterbot',
  'applebot',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'rogerbot',
  'screaming frog',
];

const STATIC_EXTENSIONS = [
  '.js',
  '.css',
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
];

function isBot(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase();
  return BOT_USER_AGENTS.some((bot) => lowerUA.includes(bot));
}

function isStaticAsset(pathname: string): boolean {
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

function getGeoHeaders(request: NextRequest): Record<string, string> {
  const geoHeaders: Record<string, string> = {};
  
  const country = request.headers.get('x-vercel-ip-country');
  const city = request.headers.get('x-vercel-ip-city');
  const region = request.headers.get('x-vercel-ip-region');
  
  if (country) geoHeaders['x-geo-country'] = country;
  if (city) geoHeaders['x-geo-city'] = city;
  if (region) geoHeaders['x-geo-region'] = region;
  
  return geoHeaders;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';

  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (isBot(userAgent)) {
    response.headers.set('X-Bot-Detected', 'true');
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  }

  const geoHeaders = getGeoHeaders(request);
  Object.entries(geoHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (isStaticAsset(pathname)) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  }

  if (pathname.startsWith('/api/')) {
    response.headers.set(
      'Cache-Control',
      'no-store, must-revalidate'
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};