import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

const LOCALE_COUNTRY_MAP: Record<string, string> = {
  US: 'en-US',
  ID: 'id-ID',
  MY: 'ms-MY',
  SG: 'en-SG',
  TH: 'th-TH',
  PH: 'en-PH',
  VN: 'vi-VN',
}

const SEO_BOTS = [
  'googlebot',
  'googleother',
  'bingbot',
  'bingpreview',
  'yandex',
  'yandexbot',
  'duckduckbot',
  'samsungbot',
  'naverbot',
  'exabot',
  'facebot',
  'ia_archiver',
  'applebot',
  'twitterbot',
  'linkedinbot',
  'pinterest',
  'slackbot',
  'telegrambot',
  'discordbot',
  'whatsapp',
]

function isSeoBot(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase()
  return SEO_BOTS.some(bot => lowerUA.includes(bot))
}

function getCountryFromRequest(reqHeaders: Headers): string | null {
  return reqHeaders.get('x-vercel-ip-country') || reqHeaders.get('cf-ipcountry') || null
}

function getLocaleFromCountry(country: string): string | null {
  return LOCALE_COUNTRY_MAP[country] || null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestHeaders = request.headers

  const response = NextResponse.next()

  const userAgent = requestHeaders.get('user-agent') || ''
  const isBot = isSeoBot(userAgent)
  const country = getCountryFromRequest(requestHeaders)

  if (country) {
    const locale = getLocaleFromCountry(country)
    if (locale) {
      response.headers.set('x-user-locale', locale)
      response.headers.set('x-user-country', country)
    }
  }

  if (isBot) {
    response.headers.set('x-is-seo-bot', 'true')
  } else {
    response.headers.set('x-is-seo-bot', 'false')
  }

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  const isStaticAsset = pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif|json)$/i)
  
  if (isStaticAsset) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (pathname.startsWith('/_next/static')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  } else {
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
  }

  const abTestBucket = Math.random() < 0.5 ? 'A' : 'B'
  response.headers.set('x-ab-test-bucket', abTestBucket)

  if (pathname === '/' && country && country !== 'US') {
    const locale = getLocaleFromCountry(country)
    if (locale && locale !== 'en-US') {
      const localizedPath = `/${locale.split('-')[0]}${pathname}`
      return NextResponse.redirect(new URL(localizedPath, request.url))
    }
  }

  return response
}