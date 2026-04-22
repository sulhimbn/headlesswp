import { NextRequest, NextResponse } from 'next/server'

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
]

const CRITICAL_ROUTES = ['/berita', '/kategori', '/tag', '/author', '/cari']

export function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  return BOT_UA_PATTERNS.some((pattern) => pattern.test(userAgent))
}

export function setSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
}

function setBotOptimizationHeaders(response: NextResponse, isBot: boolean): void {
  if (isBot) {
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('X-SEO-Crawler', 'bot')
  } else {
    response.headers.set('X-Robots-Tag', 'index, follow')
    response.headers.set('X-SEO-Crawler', 'human')
  }
}

function setRateLimitHeaders(response: NextResponse): void {
  response.headers.set('X-RateLimit-Policy', '60;w=60')
  response.headers.set('X-RateLimit-Limit', '60')
  response.headers.set('X-RateLimit-Remaining', '59')
  response.headers.set('X-RateLimit-Reset', Math.ceil(Date.now() / 60000).toString())
}

function setPrefetchHints(response: NextResponse): void {
  const criticalRoutesStr = CRITICAL_ROUTES.join(',')
  response.headers.set('Link', `<${criticalRoutesStr}>; rel="prefetch"`)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isBot = isBotUserAgent(request.headers.get('user-agent'))
  const response = NextResponse.next()

  setSecurityHeaders(response)
  setBotOptimizationHeaders(response, isBot)
  setRateLimitHeaders(response)
  setPrefetchHints(response)

  if (pathname === '/') {
    return NextResponse.redirect(new URL('/berita', request.url), 307)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
}
