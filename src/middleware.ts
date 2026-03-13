import { NextRequest } from 'next/server'
import type { NextFetchEvent } from 'next/server'
import { proxy } from './proxy'

const BOT_USER_AGENTS = [
  /bot/i, /spider/i, /crawl/i, /slurp/i, /googlebot/i, /bingbot/i, /yandex/i,
  /duckduckbot/i, /facebookexternalhit/i, /twitterbot/i, /rogerbot/i, /linkedinbot/i,
  /embedly/i, /quora link preview/i, /showyoubot/i, /outbrain/i, /pinterest/i,
  /applebot/i, /semrush/i, /ahrefs/i, /mj12bot/i, /dotbot/i, /screaming frog/i
]

const CACHE_CONTROL_BOT = 'public, s-maxage=60, stale-while-revalidate=300'
const CACHE_CONTROL_USER = 'public, s-maxage=300, stale-while-revalidate=600'
const CACHE_CONTROL_API = 'public, s-maxage=30, stale-while-revalidate=60'

export function middleware(request: NextRequest, _event: NextFetchEvent) {
  const response = proxy(request)

  const userAgent = request.headers.get('user-agent') || ''
  const isBot = BOT_USER_AGENTS.some(bot => bot.test(userAgent))

  const url = new URL(request.url)
  const isApiRoute = url.pathname.startsWith('/api/')

  if (isApiRoute) {
    response.headers.set('Cache-Control', CACHE_CONTROL_API)
  } else if (isBot) {
    response.headers.set('Cache-Control', CACHE_CONTROL_BOT)
    response.headers.set('X-Cache-Strategy', 'bot')
  } else {
    response.headers.set('Cache-Control', CACHE_CONTROL_USER)
    response.headers.set('X-Cache-Strategy', 'user')
  }

  const country = request.headers.get('x-geo-country') || request.headers.get('cf-ipcountry') || 'unknown'
  const region = request.headers.get('x-geo-region') || 'unknown'
  const city = request.headers.get('x-geo-city') || 'unknown'

  if (country !== 'unknown') {
    response.headers.set('X-Geo-Country', country)
    response.headers.set('X-Geo-Region', region)
    response.headers.set('X-Geo-City', city)
  }

  const abTestCookie = request.cookies.get('ab-test-variant')
  let abVariant = abTestCookie?.value

  if (!abVariant) {
    abVariant = Math.random() < 0.5 ? 'control' : 'variant'
    response.cookies.set('ab-test-variant', abVariant, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    })
  }

  response.headers.set('X-AB-Test-Variant', abVariant)

  const authToken = request.cookies.get('auth-token')
  if (authToken) {
    const tokenAge = Date.now() - (parseInt(request.cookies.get('token-issued-at')?.value || '0', 10))
    const refreshThreshold = 60 * 60 * 1000

    if (tokenAge > refreshThreshold) {
      response.headers.set('X-Auth-Token-Refresh', 'true')
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
}
