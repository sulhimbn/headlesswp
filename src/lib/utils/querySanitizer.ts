import { API_QUERY_LIMITS } from '@/lib/api/config'

export interface SanitizedSearchParams {
  query: string
  page: number
  perPage: number
}

export function sanitizeSearchQuery(
  query: string | null | undefined,
  page: string | null | undefined,
  perPage: string | null | undefined
): SanitizedSearchParams {
  const sanitizedQuery = sanitizeString(query || '')
  const parsedPage = parseInt(page || '1', 10)
  const parsedPerPage = parseInt(perPage || '10', 10)

  return {
    query: sanitizedQuery.slice(0, API_QUERY_LIMITS.MAX_QUERY_LENGTH),
    page: clampValue(parsedPage, 1, API_QUERY_LIMITS.MAX_PAGE),
    perPage: clampValue(parsedPerPage, 1, API_QUERY_LIMITS.MAX_PER_PAGE),
  }
}

function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;')
    .replace(/"/g, '&quot;')
    .replace(/;/g, '')
}

function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function sanitizeNumericParam(
  value: string | null | undefined,
  defaultValue: number,
  max: number,
  min = 1
): number {
  const parsed = parseInt(value || String(defaultValue), 10)
  return clampValue(parsed, min, max)
}