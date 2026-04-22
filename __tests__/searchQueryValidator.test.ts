import { validateSearchQuery, isSearchQueryValid, getSanitizedSearchQuery } from '@/lib/validation/searchQueryValidator';

describe('searchQueryValidator', () => {
  describe('validateSearchQuery', () => {
    test('validates a normal search query', () => {
      const result = validateSearchQuery('test search');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedQuery).toBe('test search');
      expect(result.errors).toHaveLength(0);
    });

    test('validates a query with special characters', () => {
      const result = validateSearchQuery('test & special@chars#');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedQuery).toBe('test & special@chars#');
    });

    test('validates a query with unicode characters and emojis', () => {
      const result = validateSearchQuery('Café 🎉 testing');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedQuery).toBe('Café 🎉 testing');
    });

    test('rejects empty query', () => {
      const result = validateSearchQuery('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('minLength');
    });

    test('rejects whitespace-only query', () => {
      const result = validateSearchQuery('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('minLength');
    });

    test('rejects query exceeding max length', () => {
      const longQuery = 'a'.repeat(501);
      const result = validateSearchQuery(longQuery);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('maxLength');
    });

    test('accepts query at max length boundary', () => {
      const maxQuery = 'a'.repeat(500);
      const result = validateSearchQuery(maxQuery);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedQuery).toHaveLength(500);
    });

    test('rejects non-string query', () => {
      const result = validateSearchQuery(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('type');
    });

    test('rejects undefined query', () => {
      const result = validateSearchQuery(undefined as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rule).toBe('type');
    });

    test('removes control characters', () => {
      const queryWithControlChars = 'test\u0000query\u0001';
      const result = validateSearchQuery(queryWithControlChars);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedQuery).toBe('testquery');
    });

    test('trims whitespace', () => {
      const result = validateSearchQuery('  test query  ');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedQuery).toBe('test query');
    });

    test('handles SQL injection attempt', () => {
      const sqlInjection = "test' OR '1'='1";
      const result = validateSearchQuery(sqlInjection);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedQuery).toBe("test' OR '1'='1");
    });

    test('handles potential XSS attempt', () => {
      const xssAttempt = '<script>alert("xss")</script>';
      const result = validateSearchQuery(xssAttempt);
      expect(result.isValid).toBe(true);
    });
  });

  describe('isSearchQueryValid', () => {
    test('returns true for valid query', () => {
      expect(isSearchQueryValid('test')).toBe(true);
    });

    test('returns false for invalid query', () => {
      expect(isSearchQueryValid('')).toBe(false);
      expect(isSearchQueryValid('a'.repeat(501))).toBe(false);
    });
  });

  describe('getSanitizedSearchQuery', () => {
    test('returns sanitized query for valid input', () => {
      expect(getSanitizedSearchQuery('  test query  ')).toBe('test query');
    });

    test('returns sanitized query (trimmed) for invalid input', () => {
      const result = getSanitizedSearchQuery('   ');
      expect(result).toBe('');
    });
  });
});