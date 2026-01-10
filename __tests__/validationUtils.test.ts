import {
  validateEnum,
  validatePattern,
  validateLength,
  validateMin,
  validatePositiveInteger,
  validateNonEmptyString,
  validateNonEmptyArray,
  validateIso8601Date,
  validateUrl,
  validateNonNegativeInteger,
} from '@/lib/validation/validationUtils';

describe('validationUtils - validateEnum', () => {
  it('should accept valid enum value', () => {
    const result = validateEnum('publish', ['publish', 'draft', 'private'] as const, 'status');
    expect(result).toBeNull();
  });

  it('should reject invalid enum value', () => {
    const result = validateEnum('invalid', ['publish', 'draft', 'private'] as const, 'status');
    expect(result).not.toBeNull();
    expect(result?.field).toBe('status');
    expect(result?.rule).toBe('enum');
    expect(result?.message).toContain('must be one of');
  });

  it('should handle case-sensitive enum values', () => {
    const result = validateEnum('Publish', ['publish', 'draft', 'private'] as const, 'status');
    expect(result).not.toBeNull();
  });

  it('should handle empty string as invalid enum value', () => {
    const result = validateEnum('', ['publish', 'draft', 'private'] as const, 'status');
    expect(result).not.toBeNull();
  });

  it('should handle single value enum', () => {
    const result = validateEnum('only', ['only'] as const, 'type');
    expect(result).toBeNull();
  });
});

describe('validationUtils - validatePattern', () => {
  it('should accept value matching pattern', () => {
    const result = validatePattern('test-slug-123', /^[a-z0-9-]+$/, 'slug');
    expect(result).toBeNull();
  });

  it('should reject value not matching pattern', () => {
    const result = validatePattern('test slug', /^[a-z0-9-]+$/, 'slug');
    expect(result).not.toBeNull();
    expect(result?.field).toBe('slug');
    expect(result?.rule).toBe('pattern');
    expect(result?.message).toContain('must match pattern');
  });

  it('should reject value with uppercase letters when only lowercase allowed', () => {
    const result = validatePattern('Test-Slug', /^[a-z0-9-]+$/, 'slug');
    expect(result).not.toBeNull();
  });

  it('should reject value with special characters not in pattern', () => {
    const result = validatePattern('test@slug', /^[a-z0-9-]+$/, 'slug');
    expect(result).not.toBeNull();
  });

  it('should handle empty string', () => {
    const result = validatePattern('', /^[a-z0-9-]+$/, 'slug');
    expect(result).not.toBeNull();
  });

  it('should handle email pattern', () => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmail = validatePattern('user@example.com', emailPattern, 'email');
    expect(validEmail).toBeNull();

    const invalidEmail = validatePattern('invalid-email', emailPattern, 'email');
    expect(invalidEmail).not.toBeNull();
  });
});

describe('validationUtils - validateLength', () => {
  it('should accept value within length range', () => {
    const result = validateLength('test', 1, 10, 'title');
    expect(result).toBeNull();
  });

  it('should reject value shorter than min length', () => {
    const result = validateLength('ab', 3, 10, 'title');
    expect(result).not.toBeNull();
    expect(result?.field).toBe('title');
    expect(result?.rule).toBe('length');
    expect(result?.message).toContain('between 3 and 10 characters');
  });

  it('should reject value longer than max length', () => {
    const result = validateLength('abcdefghijk', 3, 10, 'title');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('between 3 and 10 characters');
  });

  it('should accept value exactly at min length', () => {
    const result = validateLength('abc', 3, 10, 'title');
    expect(result).toBeNull();
  });

  it('should accept value exactly at max length', () => {
    const result = validateLength('abcdefghij', 1, 10, 'title');
    expect(result).toBeNull();
  });

  it('should reject empty string when min is greater than 0', () => {
    const result = validateLength('', 1, 10, 'title');
    expect(result).not.toBeNull();
  });

  it('should handle large max length values', () => {
    const result = validateLength('test', 1, 1000, 'description');
    expect(result).toBeNull();
  });
});

describe('validationUtils - validateMin', () => {
  it('should accept value greater than min', () => {
    const result = validateMin(10, 5, 'count');
    expect(result).toBeNull();
  });

  it('should accept value equal to min', () => {
    const result = validateMin(5, 5, 'count');
    expect(result).toBeNull();
  });

  it('should reject value less than min', () => {
    const result = validateMin(3, 5, 'count');
    expect(result).not.toBeNull();
    expect(result?.field).toBe('count');
    expect(result?.rule).toBe('min');
    expect(result?.message).toContain('must be at least 5');
  });

  it('should handle negative min values', () => {
    const result = validateMin(-5, -10, 'temperature');
    expect(result).toBeNull();

    const result2 = validateMin(-15, -10, 'temperature');
    expect(result2).not.toBeNull();
  });

  it('should handle zero as min', () => {
    const result = validateMin(0, 0, 'count');
    expect(result).toBeNull();

    const result2 = validateMin(-1, 0, 'count');
    expect(result2).not.toBeNull();
  });

  it('should handle decimal numbers', () => {
    const result = validateMin(5.5, 5.0, 'rating');
    expect(result).toBeNull();

    const result2 = validateMin(4.9, 5.0, 'rating');
    expect(result2).not.toBeNull();
  });
});

describe('validationUtils - validatePositiveInteger', () => {
  it('should accept positive integer', () => {
    const result = validatePositiveInteger(1, 'id');
    expect(result).toBeNull();
  });

  it('should reject zero', () => {
    const result = validatePositiveInteger(0, 'id');
    expect(result).not.toBeNull();
    expect(result?.field).toBe('id');
    expect(result?.rule).toBe('positiveInteger');
    expect(result?.message).toContain('must be a positive integer');
  });

  it('should reject negative integer', () => {
    const result = validatePositiveInteger(-1, 'id');
    expect(result).not.toBeNull();
  });

  it('should reject decimal number', () => {
    const result = validatePositiveInteger(1.5, 'id');
    expect(result).not.toBeNull();
  });

  it('should reject NaN', () => {
    const result = validatePositiveInteger(NaN, 'id');
    expect(result).not.toBeNull();
  });

  it('should reject Infinity', () => {
    const result = validatePositiveInteger(Infinity, 'id');
    expect(result).not.toBeNull();
  });

  it('should handle large positive integers', () => {
    const result = validatePositiveInteger(999999, 'id');
    expect(result).toBeNull();
  });
});

describe('validationUtils - validateNonEmptyString', () => {
  it('should accept non-empty string', () => {
    const result = validateNonEmptyString('test', 'title');
    expect(result).toBeNull();
  });

  it('should reject empty string', () => {
    const result = validateNonEmptyString('', 'title');
    expect(result).not.toBeNull();
    expect(result?.field).toBe('title');
    expect(result?.rule).toBe('nonEmpty');
    expect(result?.message).toContain('must not be empty');
  });

  it('should reject whitespace-only string', () => {
    const result = validateNonEmptyString('   ', 'title');
    expect(result).not.toBeNull();
  });

  it('should accept string with whitespace but containing characters', () => {
    const result = validateNonEmptyString('  test  ', 'title');
    expect(result).toBeNull();
  });

  it('should handle string with tabs', () => {
    const result = validateNonEmptyString('\t\t', 'title');
    expect(result).not.toBeNull();
  });

  it('should handle string with newlines', () => {
    const result = validateNonEmptyString('\n\n', 'title');
    expect(result).not.toBeNull();
  });
});

describe('validationUtils - validateNonEmptyArray', () => {
  it('should accept non-empty array', () => {
    const result = validateNonEmptyArray([1, 2, 3], 'items');
    expect(result).toBeNull();
  });

  it('should reject empty array', () => {
    const result = validateNonEmptyArray([], 'items');
    expect(result).not.toBeNull();
    expect(result?.field).toBe('items');
    expect(result?.rule).toBe('nonEmpty');
    expect(result?.message).toContain('must not be empty');
  });

  it('should handle array with single element', () => {
    const result = validateNonEmptyArray([1], 'items');
    expect(result).toBeNull();
  });

  it('should handle array with null/undefined elements', () => {
    const result = validateNonEmptyArray([null, undefined], 'items');
    expect(result).toBeNull();
  });

  it('should handle large arrays', () => {
    const largeArray = Array(1000).fill(0);
    const result = validateNonEmptyArray(largeArray, 'items');
    expect(result).toBeNull();
  });
});

describe('validationUtils - validateIso8601Date', () => {
  it('should accept valid ISO 8601 date', () => {
    const result = validateIso8601Date('2024-01-01T00:00:00', 'date');
    expect(result).toBeNull();
  });

  it('should accept ISO 8601 date with timezone', () => {
    const result = validateIso8601Date('2024-01-01T00:00:00Z', 'date');
    expect(result).toBeNull();
  });

  it('should accept ISO 8601 date with milliseconds', () => {
    const result = validateIso8601Date('2024-01-01T00:00:00.000', 'date');
    expect(result).toBeNull();
  });

  it('should reject invalid date format', () => {
    const result = validateIso8601Date('2024/01/01', 'date');
    expect(result).not.toBeNull();
    expect(result?.field).toBe('date');
    expect(result?.rule).toBe('format');
    expect(result?.message).toContain('ISO 8601 format');
  });

  it('should reject invalid date values', () => {
    const result = validateIso8601Date('2024-13-01T00:00:00', 'date');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('must be a valid date');
  });

  it('should reject empty string', () => {
    const result = validateIso8601Date('', 'date');
    expect(result).not.toBeNull();
  });

  it('should reject random string', () => {
    const result = validateIso8601Date('not a date', 'date');
    expect(result).not.toBeNull();
  });

  it('should reject date with only year and month', () => {
    const result = validateIso8601Date('2024-01', 'date');
    expect(result).not.toBeNull();
  });

  it('should accept leap year date', () => {
    const result = validateIso8601Date('2024-02-29T00:00:00', 'date');
    expect(result).toBeNull();
  });
});

describe('validationUtils - validateUrl', () => {
  it('should accept valid http URL', () => {
    const result = validateUrl('http://example.com', 'url');
    expect(result).toBeNull();
  });

  it('should accept valid https URL', () => {
    const result = validateUrl('https://example.com', 'url');
    expect(result).toBeNull();
  });

  it('should accept URL with path', () => {
    const result = validateUrl('https://example.com/path/to/resource', 'url');
    expect(result).toBeNull();
  });

  it('should accept URL with query parameters', () => {
    const result = validateUrl('https://example.com?param=value', 'url');
    expect(result).toBeNull();
  });

  it('should accept URL with fragment', () => {
    const result = validateUrl('https://example.com#section', 'url');
    expect(result).toBeNull();
  });

  it('should reject ftp protocol', () => {
    const result = validateUrl('ftp://example.com', 'url');
    expect(result).not.toBeNull();
    expect(result?.field).toBe('url');
    expect(result?.rule).toBe('format');
    expect(result?.message).toContain('must use http or https protocol');
  });

  it('should reject file protocol', () => {
    const result = validateUrl('file:///path/to/file', 'url');
    expect(result).not.toBeNull();
  });

  it('should reject invalid URL format', () => {
    const result = validateUrl('not-a-url', 'url');
    expect(result).not.toBeNull();
    expect(result?.message).toContain('must be a valid URL');
  });

  it('should reject URL without protocol', () => {
    const result = validateUrl('example.com', 'url');
    expect(result).not.toBeNull();
  });

  it('should reject empty string', () => {
    const result = validateUrl('', 'url');
    expect(result).not.toBeNull();
  });

  it('should handle localhost URLs', () => {
    const result = validateUrl('http://localhost:8080', 'url');
    expect(result).toBeNull();
  });

  it('should handle IP address URLs', () => {
    const result = validateUrl('http://192.168.1.1', 'url');
    expect(result).toBeNull();
  });
});

describe('validationUtils - validateNonNegativeInteger', () => {
  it('should accept positive integer', () => {
    const result = validateNonNegativeInteger(1, 'count');
    expect(result).toBeNull();
  });

  it('should accept zero', () => {
    const result = validateNonNegativeInteger(0, 'count');
    expect(result).toBeNull();
  });

  it('should reject negative integer', () => {
    const result = validateNonNegativeInteger(-1, 'count');
    expect(result).not.toBeNull();
    expect(result?.field).toBe('count');
    expect(result?.rule).toBe('nonNegative');
    expect(result?.message).toContain('must be a non-negative integer');
  });

  it('should reject decimal number', () => {
    const result = validateNonNegativeInteger(1.5, 'count');
    expect(result).not.toBeNull();
  });

  it('should reject NaN', () => {
    const result = validateNonNegativeInteger(NaN, 'count');
    expect(result).not.toBeNull();
  });

  it('should reject Infinity', () => {
    const result = validateNonNegativeInteger(Infinity, 'count');
    expect(result).not.toBeNull();
  });

  it('should handle large non-negative integers', () => {
    const result = validateNonNegativeInteger(999999, 'count');
    expect(result).toBeNull();
  });
});
