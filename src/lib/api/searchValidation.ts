export interface ValidationResult {
  isValid: boolean
  error?: {
    code: string
    message: string
  }
  sanitizedValue?: string
}

const SEARCH_MIN_LENGTH = 1
const SEARCH_MAX_LENGTH = 200

const FORBIDDEN_CHARS = ['<', '>', '{', '}', '|', '\\', '^', '`', '[', ']', '"', "'", ';', '&', '$', '#', '*', '!']

export function validateSearchQuery(query: string | null): ValidationResult {
  if (!query || query.trim() === '') {
    return {
      isValid: false,
      error: {
        code: 'EMPTY_SEARCH_QUERY',
        message: 'Search query is required',
      },
    }
  }

  const trimmedQuery = query.trim()

  if (trimmedQuery.length < SEARCH_MIN_LENGTH) {
    return {
      isValid: false,
      error: {
        code: 'SEARCH_QUERY_TOO_SHORT',
        message: `Search query must be at least ${SEARCH_MIN_LENGTH} character`,
      },
    }
  }

  if (trimmedQuery.length > SEARCH_MAX_LENGTH) {
    return {
      isValid: false,
      error: {
        code: 'SEARCH_QUERY_TOO_LONG',
        message: `Search query must not exceed ${SEARCH_MAX_LENGTH} characters`,
      },
    }
  }

  const hasForbiddenChar = FORBIDDEN_CHARS.some(char => trimmedQuery.includes(char))
  if (hasForbiddenChar) {
    return {
      isValid: false,
      error: {
        code: 'INVALID_SEARCH_CHARS',
        message: 'Search query contains forbidden characters',
      },
    }
  }

  const sanitizedQuery = trimmedQuery
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    isValid: true,
    sanitizedValue: sanitizedQuery,
  }
}

export function sanitizeSearchInput(query: string): string {
  return query.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim()
}