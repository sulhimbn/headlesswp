import type { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';
import {
  POST_VALIDATION_RULES,
  CATEGORY_VALIDATION_RULES,
  TAG_VALIDATION_RULES,
  MEDIA_VALIDATION_RULES,
  AUTHOR_VALIDATION_RULES,
} from './validationRules';
import type { ValidationError } from './validationUtils';
import {
  validateEnum,
  validatePattern,
  validateLength,
  validateMin,
  validatePositiveInteger,
  validateNonEmptyString,
  validateIso8601Date,
  validateUrl,
  validateNonNegativeInteger,
} from './validationUtils';

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors: ValidationError[];
}

class DataValidator {
  private isString(value: unknown): value is string {
    return typeof value === 'string';
  }

  private isNumber(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
  }

  private isArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !this.isArray(value);
  }

  private assertValidType<T>(value: Record<string, unknown>): T {
    return value as T;
  }

  private pluralize(word: string): string {
    const irregularPlurals: Record<string, string> = {
      'Category': 'Categories',
    };

    if (irregularPlurals[word]) {
      return irregularPlurals[word];
    }

    return `${word}s`;
  }

  private validateArray<T>(
    data: unknown,
    itemName: string,
    validateFn: (item: unknown) => ValidationResult<T>
  ): ValidationResult<T[]> {
    const errors: ValidationError[] = [];

    if (!this.isArray(data)) {
      return { valid: false, errors: [{ field: itemName, rule: 'type', message: `${this.pluralize(itemName)} must be an array`, value: data }] };
    }

    const validItems: T[] = [];

    for (let i = 0; i < data.length; i++) {
      const result = validateFn(data[i]);
      if (!result.valid) {
        errors.push(...result.errors);
        errors.push({ field: itemName, rule: 'type', message: `${itemName} at index ${i}: ${result.errors.map(e => e.message).join(', ')}`, value: data[i] });
      } else {
        validItems.push(result.data!);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: validItems, errors: [] };
  }

  private validateIdField(value: unknown, fieldName: string, errors: ValidationError[]): void {
    if (!this.isNumber(value)) {
      errors.push({ field: fieldName, rule: 'type', message: `${fieldName} must be a number`, value });
    } else {
      const error = validatePositiveInteger(value, fieldName);
      if (error) errors.push(error);
    }
  }

  private validateNamedObjectField(
    value: unknown,
    fieldName: string,
    errors: ValidationError[],
    nestedField: string,
    requireNonEmpty: boolean
  ): void {
    const obj = value as Record<string, unknown>;
    if (!this.isObject(value) || !this.isString(obj[nestedField])) {
      errors.push({ field: `${fieldName}.${nestedField}`, rule: 'type', message: `${fieldName}.${nestedField} must be a string`, value });
    } else if (requireNonEmpty) {
      const error = validateNonEmptyString(obj[nestedField], `${fieldName}.${nestedField}`);
      if (error) errors.push(error);
    }
  }

  private validateSlugField(
    value: unknown,
    fieldName: string,
    errors: ValidationError[],
    rules: { pattern: RegExp; minLength: number; maxLength: number }
  ): void {
    if (!this.isString(value)) {
      errors.push({ field: fieldName, rule: 'type', message: `${fieldName} must be a string`, value });
    } else {
      const emptyError = validateNonEmptyString(value, fieldName);
      if (emptyError) errors.push(emptyError);

      const patternError = validatePattern(value, rules.pattern, fieldName);
      if (patternError) errors.push(patternError);

      const lengthError = validateLength(value, rules.minLength, rules.maxLength, fieldName);
      if (lengthError) errors.push(lengthError);
    }
  }

  private validateDateField(value: unknown, fieldName: string, errors: ValidationError[]): void {
    if (!this.isString(value)) {
      errors.push({ field: fieldName, rule: 'type', message: `${fieldName} must be a string`, value });
    } else {
      const error = validateIso8601Date(value, fieldName);
      if (error) errors.push(error);
    }
  }

  private validateUrlField(value: unknown, fieldName: string, errors: ValidationError[]): void {
    if (!this.isString(value)) {
      errors.push({ field: fieldName, rule: 'type', message: `${fieldName} must be a string`, value });
    } else {
      const error = validateUrl(value, fieldName);
      if (error) errors.push(error);
    }
  }

  private validateEnumField(
    value: unknown,
    fieldName: string,
    allowedValues: readonly string[],
    errors: ValidationError[]
  ): void {
    if (!this.isString(value)) {
      errors.push({ field: fieldName, rule: 'type', message: `${fieldName} must be a string`, value });
    } else {
      const error = validateEnum(value, allowedValues, fieldName);
      if (error) errors.push(error);
    }
  }

  validatePost(data: unknown): ValidationResult<WordPressPost> {
    const errors: ValidationError[] = [];

    if (!this.isObject(data)) {
      return { valid: false, errors: [{ field: 'Post', rule: 'type', message: 'Post must be an object', value: data }] };
    }

    const record = data as Record<string, unknown>;
    this.validateIdField(record.id, 'Post.id', errors);
    this.validateNamedObjectField(record.title, 'Post.title', errors, 'rendered', true);
    this.validateNamedObjectField(record.content, 'Post.content', errors, 'rendered', false);
    this.validateNamedObjectField(record.excerpt, 'Post.excerpt', errors, 'rendered', false);
    this.validateSlugField(record.slug, 'Post.slug', errors, POST_VALIDATION_RULES.slug);
    this.validateDateField(record.date, 'Post.date', errors);
    this.validateDateField(record.modified, 'Post.modified', errors);
    this.validateIdField(record.author, 'Post.author', errors);

    if (!this.isNumber(record.featured_media)) {
      errors.push({ field: 'Post.featured_media', rule: 'type', message: 'Post.featured_media must be a number', value: record.featured_media });
    } else if (record.featured_media < 0) {
      errors.push({ field: 'Post.featured_media', rule: 'min', message: 'Post.featured_media must be non-negative', value: record.featured_media });
    }

    if (!this.isArray(record.categories)) {
      errors.push({ field: 'Post.categories', rule: 'type', message: 'Post.categories must be an array', value: record.categories });
    } else {
      if (!record.categories.every((id: unknown) => this.isNumber(id))) {
        errors.push({ field: 'Post.categories', rule: 'type', message: 'Post.categories must contain only numbers', value: record.categories });
      }
      if (record.categories.length === 0) {
        errors.push({ field: 'Post.categories', rule: 'nonEmpty', message: 'Post.categories must contain at least one category', value: record.categories });
      }
    }

    if (!this.isArray(record.tags)) {
      errors.push({ field: 'Post.tags', rule: 'type', message: 'Post.tags must be an array', value: record.tags });
    } else {
      if (!record.tags.every((id: unknown) => this.isNumber(id))) {
        errors.push({ field: 'Post.tags', rule: 'type', message: 'Post.tags must contain only numbers', value: record.tags });
      }
    }

    this.validateEnumField(record.status, 'Post.status', POST_VALIDATION_RULES.status.allowedValues, errors);
    this.validateEnumField(record.type, 'Post.type', POST_VALIDATION_RULES.type.allowedValues, errors);
    this.validateUrlField(record.link, 'Post.link', errors);

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: this.assertValidType<WordPressPost>(data), errors: [] };
  }

  validatePosts(data: unknown): ValidationResult<WordPressPost[]> {
    return this.validateArray(data, 'Post', (item) => this.validatePost(item));
  }

  validateCategory(data: unknown): ValidationResult<WordPressCategory> {
    const errors: ValidationError[] = [];

    if (!this.isObject(data)) {
      return { valid: false, errors: [{ field: 'Category', rule: 'type', message: 'Category must be an object', value: data }] };
    }

    const record = data as Record<string, unknown>;
    this.validateIdField(record.id, 'Category.id', errors);

    if (!this.isString(record.name)) {
      errors.push({ field: 'Category.name', rule: 'type', message: 'Category.name must be a string', value: record.name });
    } else {
      const nameError = validateNonEmptyString(record.name, 'Category.name');
      if (nameError) errors.push(nameError);
    }

    this.validateSlugField(record.slug, 'Category.slug', errors, CATEGORY_VALIDATION_RULES.slug);

    if (!this.isString(record.description)) {
      errors.push({ field: 'Category.description', rule: 'type', message: 'Category.description must be a string', value: record.description });
    }

    if (!this.isNumber(record.parent)) {
      errors.push({ field: 'Category.parent', rule: 'type', message: 'Category.parent must be a number', value: record.parent });
    } else {
      const parentError = validateMin(record.parent, CATEGORY_VALIDATION_RULES.parent.min, 'Category.parent');
      if (parentError) errors.push(parentError);
    }

    if (!this.isNumber(record.count)) {
      errors.push({ field: 'Category.count', rule: 'type', message: 'Category.count must be a number', value: record.count });
    } else {
      const countError = validateNonNegativeInteger(record.count, 'Category.count');
      if (countError) errors.push(countError);
    }

    this.validateUrlField(record.link, 'Category.link', errors);

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: this.assertValidType<WordPressCategory>(data), errors: [] };
  }

  validateCategories(data: unknown): ValidationResult<WordPressCategory[]> {
    return this.validateArray(data, 'Category', (item) => this.validateCategory(item));
  }

  validateTag(data: unknown): ValidationResult<WordPressTag> {
    const errors: ValidationError[] = [];

    if (!this.isObject(data)) {
      return { valid: false, errors: [{ field: 'Tag', rule: 'type', message: 'Tag must be an object', value: data }] };
    }

    const record = data as Record<string, unknown>;
    this.validateIdField(record.id, 'Tag.id', errors);

    if (!this.isString(record.name)) {
      errors.push({ field: 'Tag.name', rule: 'type', message: 'Tag.name must be a string', value: record.name });
    } else {
      const nameError = validateNonEmptyString(record.name, 'Tag.name');
      if (nameError) errors.push(nameError);
    }

    this.validateSlugField(record.slug, 'Tag.slug', errors, TAG_VALIDATION_RULES.slug);

    if (!this.isString(record.description)) {
      errors.push({ field: 'Tag.description', rule: 'type', message: 'Tag.description must be a string', value: record.description });
    }

    if (!this.isNumber(record.count)) {
      errors.push({ field: 'Tag.count', rule: 'type', message: 'Tag.count must be a number', value: record.count });
    } else {
      const countError = validateNonNegativeInteger(record.count, 'Tag.count');
      if (countError) errors.push(countError);
    }

    this.validateUrlField(record.link, 'Tag.link', errors);

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: this.assertValidType<WordPressTag>(data), errors: [] };
  }

  validateTags(data: unknown): ValidationResult<WordPressTag[]> {
    return this.validateArray(data, 'Tag', (item) => this.validateTag(item));
  }

  validateMedia(data: unknown): ValidationResult<WordPressMedia> {
    const errors: ValidationError[] = [];

    if (!this.isObject(data)) {
      return { valid: false, errors: [{ field: 'Media', rule: 'type', message: 'Media must be an object', value: data }] };
    }

    const record = data as Record<string, unknown>;
    this.validateIdField(record.id, 'Media.id', errors);
    this.validateUrlField(record.source_url, 'Media.source_url', errors);
    this.validateNamedObjectField(record.title, 'Media.title', errors, 'rendered', false);

    if (!this.isString(record.alt_text)) {
      errors.push({ field: 'Media.alt_text', rule: 'type', message: 'Media.alt_text must be a string', value: record.alt_text });
    }

    this.validateEnumField(record.media_type, 'Media.media_type', MEDIA_VALIDATION_RULES.media_type.allowedValues, errors);

    if (!this.isString(record.mime_type)) {
      errors.push({ field: 'Media.mime_type', rule: 'type', message: 'Media.mime_type must be a string', value: record.mime_type });
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: this.assertValidType<WordPressMedia>(data), errors: [] };
  }

  validateAuthor(data: unknown): ValidationResult<WordPressAuthor> {
    const errors: ValidationError[] = [];

    if (!this.isObject(data)) {
      return { valid: false, errors: [{ field: 'Author', rule: 'type', message: 'Author must be an object', value: data }] };
    }

    const record = data as Record<string, unknown>;
    this.validateIdField(record.id, 'Author.id', errors);

    if (!this.isString(record.name)) {
      errors.push({ field: 'Author.name', rule: 'type', message: 'Author.name must be a string', value: record.name });
    } else {
      const nameError = validateNonEmptyString(record.name, 'Author.name');
      if (nameError) errors.push(nameError);
    }

    this.validateSlugField(record.slug, 'Author.slug', errors, AUTHOR_VALIDATION_RULES.slug);

    if (!this.isString(record.description)) {
      errors.push({ field: 'Author.description', rule: 'type', message: 'Author.description must be a string', value: record.description });
    }

    if (!this.isObject(record.avatar_urls)) {
      errors.push({ field: 'Author.avatar_urls', rule: 'type', message: 'Author.avatar_urls must be an object', value: record.avatar_urls });
    }

    this.validateUrlField(record.link, 'Author.link', errors);

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: this.assertValidType<WordPressAuthor>(data), errors: [] };
  }
}

export const dataValidator = new DataValidator();

export default dataValidator;

export function isValidationResultValid<T>(result: ValidationResult<T>): result is { valid: true; data: T; errors: [] } {
  return result.valid;
}

export function unwrapValidationResult<T>(result: ValidationResult<T>): T {
  if (!result.valid) {
    const errorMessages = result.errors.map(e => `[${e.field}] ${e.message}`).join(', ');
    throw new Error(`Validation failed: ${errorMessages}`);
  }
  return result.data!;
}

export function unwrapValidationResultSafe<T>(result: ValidationResult<T>, fallback: T): T {
  if (!result.valid) {
    return fallback;
  }
  return result.data!;
}

export type { ValidationError };
