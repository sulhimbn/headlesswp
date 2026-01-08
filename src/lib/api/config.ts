export const WORDPRESS_API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8080/wp-json'
export const WORDPRESS_SITE_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost:8080'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mitrabantennews.com'
export const SITE_URL_WWW = process.env.NEXT_PUBLIC_SITE_URL_WWW || 'https://www.mitrabantennews.com'

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

export const API_TIMEOUT = TIME_CONSTANTS.MINUTE_IN_MS * 10
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
} as const

export const DEFAULT_PER_PAGE = 10

export const REVALIDATE_TIMES = {
  HOMEPAGE: 5 * 60, // 300 seconds (5 minutes)
  POST_LIST: 5 * 60, // 300 seconds (5 minutes)
  POST_DETAIL: 60 * 60, // 3600 seconds (1 hour)
} as const