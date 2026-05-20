import { SITE_URL } from '@/lib/api/config'

export const HREFLANG_CONFIG = {
  languages: [
    { code: 'id-ID', locale: 'id_ID', label: 'Indonesian' },
    { code: 'en-US', locale: 'en_US', label: 'English' },
  ],
  xdefault: 'x-default',
} as const

export type HreflangLanguage = typeof HREFLANG_CONFIG.languages[number]['code']

export interface HreflangEntry {
  url: string
  lang: HreflangLanguage | typeof HREFLANG_CONFIG.xdefault
}

export function generateHreflangUrls(baseUrl: string, path: string = ''): HreflangEntry[] {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const baseUrlClean = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl

  const urls: HreflangEntry[] = []

  for (const lang of HREFLANG_CONFIG.languages) {
    urls.push({
      url: `${baseUrlClean}${cleanPath}`,
      lang: lang.code,
    })
  }

  urls.push({
    url: `${baseUrlClean}${cleanPath}`,
    lang: HREFLANG_CONFIG.xdefault,
  })

  return urls
}

export function generateHomepageHreflang(): HreflangEntry[] {
  return generateHreflangUrls(SITE_URL, '/')
}

export function generatePageHreflang(slug: string, basePath: string = ''): HreflangEntry[] {
  const path = basePath ? `${basePath}/${slug}` : slug
  return generateHreflangUrls(SITE_URL, path)
}
