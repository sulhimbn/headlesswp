function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`${name} is required`)
    }
    console.warn(`${name} is not set, using placeholder`)
    return `https://placeholder-${name.toLowerCase().replace('next_public_', '')}.com`
  }
  return value
}

export function validateConfig(): void {
  getRequiredEnvVar('NEXT_PUBLIC_WORDPRESS_API_URL')
  getRequiredEnvVar('NEXT_PUBLIC_WORDPRESS_URL')
  getRequiredEnvVar('NEXT_PUBLIC_SITE_URL')
}

if (process.env.NODE_ENV !== 'test') {
  validateConfig()
}

export const WORDPRESS_API_BASE_URL = getRequiredEnvVar('NEXT_PUBLIC_WORDPRESS_API_URL')
export const WORDPRESS_SITE_URL = getRequiredEnvVar('NEXT_PUBLIC_WORDPRESS_URL')
export const SITE_URL = getRequiredEnvVar('NEXT_PUBLIC_SITE_URL')
export const SITE_URL_WWW = process.env.NEXT_PUBLIC_SITE_URL_WWW || ''

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
  SITEMAP: 15 * TIME_CONSTANTS.MINUTE_IN_MS,
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
  RELATED_POSTS: 3,
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

export const FEATURE_FLAGS = {
  PERSONALIZED_RECOMMENDATIONS: process.env.NEXT_PUBLIC_FEATURE_PERSONALIZED_RECOMMENDATIONS === 'true',
  RECOMMENDATION_ANALYTICS: process.env.NEXT_PUBLIC_FEATURE_RECOMMENDATION_ANALYTICS === 'true',
} as const

export const RECOMMENDATION_CONFIG = {
  MAX_HISTORY_ITEMS: 20,
  MAX_RECOMMENDATIONS: 3,
} as const

export const API_QUERY_LIMITS = {
  MAX_PER_PAGE: 100,
  MAX_PAGE: 1000,
  MAX_QUERY_LENGTH: 200,
  AUTOCOMPLETE: 8,
} as const