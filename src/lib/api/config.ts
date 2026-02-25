function validateUrl(url: string | undefined, name: string, requireHttps: boolean): string {
  if (!url) {
    throw new Error(`Required environment variable NEXT_PUBLIC_${name} is not set`)
  }
  if (requireHttps && !url.startsWith('https://') && process.env.NODE_ENV === 'production') {
    throw new Error(`NEXT_PUBLIC_${name} must use HTTPS in production`)
  }
  return url
}

export const WORDPRESS_API_BASE_URL = validateUrl(process.env.NEXT_PUBLIC_WORDPRESS_API_URL, 'WORDPRESS_API_URL', false)
export const WORDPRESS_SITE_URL = validateUrl(process.env.NEXT_PUBLIC_WORDPRESS_URL, 'WORDPRESS_URL', false)
export const SITE_URL = validateUrl(process.env.NEXT_PUBLIC_SITE_URL, 'SITE_URL', true)
export const SITE_URL_WWW = validateUrl(process.env.NEXT_PUBLIC_SITE_URL_WWW, 'SITE_URL_WWW', true)

export const TIME_CONSTANTS = {
  SECOND_IN_MS: 1000,
  MINUTE_IN_MS: 60 * 1000,
  HOUR_IN_MS: 60 * 60 * 1000,
  DAY_IN_MS: 24 * 60 * 60 * 1000,
} as const

export const CACHE_TIMES = {
  SHORT: 2 * TIME_CONSTANTS.MINUTE_IN_MS,
  MEDIUM_SHORT: 5 * TIME_CONSTANTS.MINUTE_IN_MS,
  MEDIUM: 10 * TIME_CONSTANTS.MINUTE_IN_MS,
  MEDIUM_LONG: 30 * TIME_CONSTANTS.MINUTE_IN_MS,
  LONG: TIME_CONSTANTS.HOUR_IN_MS,
} as const

export const API_TIMEOUT = TIME_CONSTANTS.MINUTE_IN_MS / 2
export const MAX_RETRIES = 3
export const SKIP_RETRIES = process.env.SKIP_RETRIES === 'true' || process.env.NODE_ENV === 'test'

export const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5
export const CIRCUIT_BREAKER_RECOVERY_TIMEOUT = TIME_CONSTANTS.MINUTE_IN_MS
export const CIRCUIT_BREAKER_SUCCESS_THRESHOLD = 2

export const RETRY_INITIAL_DELAY = TIME_CONSTANTS.SECOND_IN_MS
export const RETRY_MAX_DELAY = 30 * TIME_CONSTANTS.SECOND_IN_MS
export const RETRY_BACKOFF_MULTIPLIER = 2

export const RATE_LIMIT_MAX_REQUESTS = 60
export const RATE_LIMIT_WINDOW_MS = TIME_CONSTANTS.MINUTE_IN_MS

export const PAGINATION_LIMITS = {
  LATEST_POSTS: 6,
  CATEGORY_POSTS: 3,
  ALL_POSTS: 50,
  SEARCH_POSTS: 12,
} as const

export const DEFAULT_PER_PAGE = 10

export const REVALIDATE_TIMES = {
  HOMEPAGE: 5 * 60, // 300 seconds (5 minutes)
  POST_LIST: 5 * 60, // 300 seconds (5 minutes)
  POST_DETAIL: 60 * 60, // 3600 seconds (1 hour)
} as const

export const PAGINATION = {
  MAX_VISIBLE_PAGES: 5,
} as const