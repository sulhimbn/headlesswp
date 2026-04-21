import { NextRequest, NextResponse } from 'next/server';

const BOT_UA_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /yandex/i,
  /duckduckbot/i,
  /baiduspider/i,
  /facebookexternalhit/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegrambot/i,
  /slackbot/i,
  /applebot/i,
  /GPTBot/i,
  /ClaudeBot/i,
  /anthropic-ai/i,
  /CCBot/i,
  /cohere-ai/i,
];

const CRITICAL_ROUTES = ['/berita', '/kategori', '/tag', '/author', '/cari'];

const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60000;

interface RateLimitState {
  requestTimes: number[];
}

const rateLimitStore = new Map<string, RateLimitState>();

function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_UA_PATTERNS.some(pattern => pattern.test(userAgent));
}

function getClientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

function checkRateLimit(clientKey: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  let state = rateLimitStore.get(clientKey);

  if (!state) {
    state = { requestTimes: [] };
    rateLimitStore.set(clientKey, state);
  }

  state.requestTimes = state.requestTimes.filter(
    t => now - t < RATE_LIMIT_WINDOW_MS
  );

  const remaining = RATE_LIMIT_MAX - state.requestTimes.length;

  if (remaining <= 0) {
    const oldestRequest = state.requestTimes[0];
    const resetTime = oldestRequest + RATE_LIMIT_WINDOW_MS;
    return { allowed: false, remaining: 0, resetTime };
  }

  state.requestTimes.push(now);

  const resetTime = now + RATE_LIMIT_WINDOW_MS;
  return { allowed: true, remaining: remaining - 1, resetTime };
}

function setSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function setBotOptimizationHeaders(
  response: NextResponse,
  isBot: boolean
): void {
  if (isBot) {
    response.headers.set('X-Robots-Tag', 'index, follow');
    response.headers.set('X-SEO-Crawler', 'bot');
  } else {
    response.headers.set('X-Robots-Tag', 'index, follow');
    response.headers.set('X-SEO-Crawler', 'human');
  }
}

function setRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  resetTime: number
): void {
  response.headers.set(
    'X-RateLimit-Policy',
    `${RATE_LIMIT_MAX};w=${Math.floor(RATE_LIMIT_WINDOW_MS / 1000)}`
  );
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set(
    'X-RateLimit-Reset',
    Math.ceil(resetTime / 1000).toString()
  );
}

function setPrefetchHints(response: NextResponse): void {
  const criticalRoutesStr = CRITICAL_ROUTES.join(',');
  response.headers.set('Link', `<${criticalRoutesStr}>; rel="prefetch"`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const clientKey = getClientKey(request);
  const rateLimitResult = checkRateLimit(clientKey);

  const isBot = isBotUserAgent(request.headers.get('user-agent'));
  const response = NextResponse.next();

  setSecurityHeaders(response);
  setBotOptimizationHeaders(response, isBot);
  setRateLimitHeaders(
    response,
    rateLimitResult.remaining,
    rateLimitResult.resetTime
  );
  setPrefetchHints(response);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(
            (rateLimitResult.resetTime - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/berita', request.url), 307);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
};
