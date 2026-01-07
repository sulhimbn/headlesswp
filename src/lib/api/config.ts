export const WORDPRESS_API_BASE_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || 'http://localhost:8080/wp-json'
export const WORDPRESS_SITE_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'http://localhost:8080'
export const API_TIMEOUT = 10000
export const MAX_RETRIES = 3
export const SKIP_RETRIES = process.env.SKIP_RETRIES === 'true' || process.env.NODE_ENV === 'test'