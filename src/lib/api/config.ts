export const WORDPRESS_API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8080/wp-json'
export const WORDPRESS_SITE_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost:8080'
export const API_TIMEOUT = 10000
export const MAX_RETRIES = 3
export const SKIP_RETRIES = process.env.SKIP_RETRIES === 'true' || process.env.NODE_ENV === 'test'

export const CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5
export const CIRCUIT_BREAKER_RECOVERY_TIMEOUT = 60000
export const CIRCUIT_BREAKER_SUCCESS_THRESHOLD = 2

export const RETRY_INITIAL_DELAY = 1000
export const RETRY_MAX_DELAY = 30000
export const RETRY_BACKOFF_MULTIPLIER = 2