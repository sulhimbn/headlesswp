export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  value: unknown;
}

export function validateEnum<T extends readonly string[]>(
  value: string,
  allowedValues: T,
  fieldName: string
): ValidationError | null {
  if (!allowedValues.includes(value as T[number])) {
    return {
      field: fieldName,
      rule: 'enum',
      message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      value,
    };
  }
  return null;
}

export function validatePattern(
  value: string,
  pattern: RegExp,
  fieldName: string
): ValidationError | null {
  if (!pattern.test(value)) {
    return {
      field: fieldName,
      rule: 'pattern',
      message: `${fieldName} must match pattern: ${pattern.source}`,
      value,
    };
  }
  return null;
}

export function validateLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): ValidationError | null {
  if (value.length < minLength || value.length > maxLength) {
    return {
      field: fieldName,
      rule: 'length',
      message: `${fieldName} must be between ${minLength} and ${maxLength} characters`,
      value,
    };
  }
  return null;
}

export function validateMin(value: number, min: number, fieldName: string): ValidationError | null {
  if (value < min) {
    return {
      field: fieldName,
      rule: 'min',
      message: `${fieldName} must be at least ${min}`,
      value,
    };
  }
  return null;
}

export function validatePositiveInteger(value: number, fieldName: string): ValidationError | null {
  if (!Number.isInteger(value) || value <= 0) {
    return {
      field: fieldName,
      rule: 'positiveInteger',
      message: `${fieldName} must be a positive integer`,
      value,
    };
  }
  return null;
}

export function validateNonEmptyString(value: string, fieldName: string): ValidationError | null {
  if (value === '' || value.trim() === '') {
    return {
      field: fieldName,
      rule: 'nonEmpty',
      message: `${fieldName} must not be empty`,
      value,
    };
  }
  return null;
}

export function validateNonEmptyArray<T>(value: T[], fieldName: string): ValidationError | null {
  if (value.length === 0) {
    return {
      field: fieldName,
      rule: 'nonEmpty',
      message: `${fieldName} must not be empty`,
      value,
    };
  }
  return null;
}

export function validateIso8601Date(value: string, fieldName: string): ValidationError | null {
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  if (!isoPattern.test(value)) {
    return {
      field: fieldName,
      rule: 'format',
      message: `${fieldName} must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss)`,
      value,
    };
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return {
      field: fieldName,
      rule: 'format',
      message: `${fieldName} must be a valid date`,
      value,
    };
  }

  return null;
}

export function validateUrl(value: string, fieldName: string): ValidationError | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return {
        field: fieldName,
        rule: 'format',
        message: `${fieldName} must use http or https protocol`,
        value,
      };
    }
    return null;
  } catch {
    return {
      field: fieldName,
      rule: 'format',
      message: `${fieldName} must be a valid URL`,
      value,
    };
  }
}

export function validateNonNegativeInteger(value: number, fieldName: string): ValidationError | null {
  if (!Number.isInteger(value) || value < 0) {
    return {
      field: fieldName,
      rule: 'nonNegative',
      message: `${fieldName} must be a non-negative integer`,
      value,
    };
  }
  return null;
}
