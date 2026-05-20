import type { ValidationError } from './validationUtils';

export interface SearchQueryValidationResult {
  isValid: boolean;
  sanitizedQuery: string;
  errors: ValidationError[];
}

const MAX_QUERY_LENGTH = 500;
const MIN_QUERY_LENGTH = 1;

export function validateSearchQuery(query: string): SearchQueryValidationResult {
  const errors: ValidationError[] = [];
  
  if (typeof query !== 'string') {
    errors.push({
      field: 'query',
      rule: 'type',
      message: 'Query must be a string',
      value: query
    });
    return { isValid: false, sanitizedQuery: '', errors };
  }

  const sanitizedQuery = sanitizeSearchQuery(query);
  
  if (sanitizedQuery.length < MIN_QUERY_LENGTH) {
    errors.push({
      field: 'query',
      rule: 'minLength',
      message: `Query must be at least ${MIN_QUERY_LENGTH} character(s)`,
      value: query
    });
  }

  if (query.length > MAX_QUERY_LENGTH) {
    errors.push({
      field: 'query',
      rule: 'maxLength',
      message: `Query must not exceed ${MAX_QUERY_LENGTH} characters`,
      value: query
    });
  }

  return {
    isValid: errors.length === 0,
    sanitizedQuery,
    errors
  };
}

function sanitizeSearchQuery(query: string): string {
  let sanitized = query.trim();
  
  if (sanitized.length === 0) {
    return sanitized;
  }
  
  /* eslint-disable no-control-regex */
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/gu, '');
  /* eslint-enable no-control-regex */
  
  return sanitized;
}

export function isSearchQueryValid(query: string): boolean {
  return validateSearchQuery(query).isValid;
}

export function getSanitizedSearchQuery(query: string): string {
  return validateSearchQuery(query).sanitizedQuery;
}