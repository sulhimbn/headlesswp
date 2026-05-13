import { validateSearchQuery, sanitizeSearchInput } from '@/lib/api/searchValidation'

describe('searchValidation', () => {
  describe('validateSearchQuery', () => {
    it('should reject null query', () => {
      const result = validateSearchQuery(null)
      expect(result.isValid).toBe(false)
      expect(result.error?.code).toBe('EMPTY_SEARCH_QUERY')
    })

    it('should reject empty query', () => {
      const result = validateSearchQuery('')
      expect(result.isValid).toBe(false)
      expect(result.error?.code).toBe('EMPTY_SEARCH_QUERY')
    })

    it('should reject whitespace-only query', () => {
      const result = validateSearchQuery('   ')
      expect(result.isValid).toBe(false)
      expect(result.error?.code).toBe('EMPTY_SEARCH_QUERY')
    })

    it('should reject query with forbidden characters', () => {
      const result = validateSearchQuery('test<script>')
      expect(result.isValid).toBe(false)
      expect(result.error?.code).toBe('INVALID_SEARCH_CHARS')
    })

    it('should reject query longer than max length', () => {
      const longQuery = 'a'.repeat(201)
      const result = validateSearchQuery(longQuery)
      expect(result.isValid).toBe(false)
      expect(result.error?.code).toBe('SEARCH_QUERY_TOO_LONG')
    })

    it('should accept valid query', () => {
      const result = validateSearchQuery('valid query')
      expect(result.isValid).toBe(true)
      expect(result.sanitizedValue).toBe('valid query')
    })

    it('should sanitize and trim query', () => {
      const result = validateSearchQuery('  valid query  ')
      expect(result.isValid).toBe(true)
      expect(result.sanitizedValue).toBe('valid query')
    })
  })

  describe('sanitizeSearchInput', () => {
    it('should remove angle brackets', () => {
      const result = sanitizeSearchInput('test<script>')
      expect(result).toBe('testscript')
    })

    it('should normalize whitespace', () => {
      const result = sanitizeSearchInput('test   query')
      expect(result).toBe('test query')
    })
  })
})