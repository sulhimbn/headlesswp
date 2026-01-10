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

interface ValidationResult<T> {
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

  validatePost(data: unknown): ValidationResult<WordPressPost> {
    const errors: ValidationError[] = [];

    if (!this.isObject(data)) {
      return { valid: false, errors: [{ field: 'Post', rule: 'type', message: 'Post must be an object', value: data }] };
    }

    if (!this.isNumber(data.id)) {
      errors.push({ field: 'Post.id', rule: 'type', message: 'Post.id must be a number', value: data.id });
    } else {
      const idError = validatePositiveInteger(data.id, 'Post.id');
      if (idError) errors.push(idError);
    }

    if (!this.isObject(data.title) || !this.isString(data.title.rendered)) {
      errors.push({ field: 'Post.title.rendered', rule: 'type', message: 'Post.title.rendered must be a string', value: data.title });
    } else {
      const titleError = validateNonEmptyString(data.title.rendered, 'Post.title.rendered');
      if (titleError) errors.push(titleError);
    }

    if (!this.isObject(data.content) || !this.isString(data.content.rendered)) {
      errors.push({ field: 'Post.content.rendered', rule: 'type', message: 'Post.content.rendered must be a string', value: data.content });
    }

    if (!this.isObject(data.excerpt) || !this.isString(data.excerpt.rendered)) {
      errors.push({ field: 'Post.excerpt.rendered', rule: 'type', message: 'Post.excerpt.rendered must be a string', value: data.excerpt });
    }

    if (!this.isString(data.slug)) {
      errors.push({ field: 'Post.slug', rule: 'type', message: 'Post.slug must be a string', value: data.slug });
    } else {
      const slugError = validateNonEmptyString(data.slug, 'Post.slug');
      if (slugError) errors.push(slugError);

      const patternError = validatePattern(data.slug, POST_VALIDATION_RULES.slug.pattern, 'Post.slug');
      if (patternError) errors.push(patternError);

      const lengthError = validateLength(data.slug, POST_VALIDATION_RULES.slug.minLength, POST_VALIDATION_RULES.slug.maxLength, 'Post.slug');
      if (lengthError) errors.push(lengthError);
    }

    if (!this.isString(data.date)) {
      errors.push({ field: 'Post.date', rule: 'type', message: 'Post.date must be a string', value: data.date });
    } else {
      const dateError = validateIso8601Date(data.date, 'Post.date');
      if (dateError) errors.push(dateError);
    }

    if (!this.isString(data.modified)) {
      errors.push({ field: 'Post.modified', rule: 'type', message: 'Post.modified must be a string', value: data.modified });
    } else {
      const modifiedError = validateIso8601Date(data.modified, 'Post.modified');
      if (modifiedError) errors.push(modifiedError);
    }

    if (!this.isNumber(data.author)) {
      errors.push({ field: 'Post.author', rule: 'type', message: 'Post.author must be a number', value: data.author });
    } else {
      const authorError = validatePositiveInteger(data.author, 'Post.author');
      if (authorError) errors.push(authorError);
    }

    if (!this.isNumber(data.featured_media)) {
      errors.push({ field: 'Post.featured_media', rule: 'type', message: 'Post.featured_media must be a number', value: data.featured_media });
    } else if (data.featured_media < 0) {
      errors.push({ field: 'Post.featured_media', rule: 'min', message: 'Post.featured_media must be non-negative', value: data.featured_media });
    }

    if (!this.isArray(data.categories)) {
      errors.push({ field: 'Post.categories', rule: 'type', message: 'Post.categories must be an array', value: data.categories });
    } else {
      if (!data.categories.every((id: unknown) => this.isNumber(id))) {
        errors.push({ field: 'Post.categories', rule: 'type', message: 'Post.categories must contain only numbers', value: data.categories });
      }
      if (data.categories.length === 0) {
        errors.push({ field: 'Post.categories', rule: 'nonEmpty', message: 'Post.categories must contain at least one category', value: data.categories });
      }
    }

    if (!this.isArray(data.tags)) {
      errors.push({ field: 'Post.tags', rule: 'type', message: 'Post.tags must be an array', value: data.tags });
    } else {
      if (!data.tags.every((id: unknown) => this.isNumber(id))) {
        errors.push({ field: 'Post.tags', rule: 'type', message: 'Post.tags must contain only numbers', value: data.tags });
      }
    }

    if (!this.isString(data.status)) {
      errors.push({ field: 'Post.status', rule: 'type', message: 'Post.status must be a string', value: data.status });
    } else {
      const statusError = validateEnum(data.status, POST_VALIDATION_RULES.status.allowedValues, 'Post.status');
      if (statusError) errors.push(statusError);
    }

    if (!this.isString(data.type)) {
      errors.push({ field: 'Post.type', rule: 'type', message: 'Post.type must be a string', value: data.type });
    } else {
      const typeError = validateEnum(data.type, POST_VALIDATION_RULES.type.allowedValues, 'Post.type');
      if (typeError) errors.push(typeError);
    }

    if (!this.isString(data.link)) {
      errors.push({ field: 'Post.link', rule: 'type', message: 'Post.link must be a string', value: data.link });
    } else {
      const linkError = validateUrl(data.link, 'Post.link');
      if (linkError) errors.push(linkError);
    }

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

    if (!this.isNumber(data.id)) {
      errors.push({ field: 'Category.id', rule: 'type', message: 'Category.id must be a number', value: data.id });
    } else {
      const idError = validatePositiveInteger(data.id, 'Category.id');
      if (idError) errors.push(idError);
    }

    if (!this.isString(data.name)) {
      errors.push({ field: 'Category.name', rule: 'type', message: 'Category.name must be a string', value: data.name });
    } else {
      const nameError = validateNonEmptyString(data.name, 'Category.name');
      if (nameError) errors.push(nameError);
    }

    if (!this.isString(data.slug)) {
      errors.push({ field: 'Category.slug', rule: 'type', message: 'Category.slug must be a string', value: data.slug });
    } else {
      const slugError = validateNonEmptyString(data.slug, 'Category.slug');
      if (slugError) errors.push(slugError);

      const patternError = validatePattern(data.slug, CATEGORY_VALIDATION_RULES.slug.pattern, 'Category.slug');
      if (patternError) errors.push(patternError);

      const lengthError = validateLength(data.slug, CATEGORY_VALIDATION_RULES.slug.minLength, CATEGORY_VALIDATION_RULES.slug.maxLength, 'Category.slug');
      if (lengthError) errors.push(lengthError);
    }

    if (!this.isString(data.description)) {
      errors.push({ field: 'Category.description', rule: 'type', message: 'Category.description must be a string', value: data.description });
    }

    if (!this.isNumber(data.parent)) {
      errors.push({ field: 'Category.parent', rule: 'type', message: 'Category.parent must be a number', value: data.parent });
    } else {
      const parentError = validateMin(data.parent, CATEGORY_VALIDATION_RULES.parent.min, 'Category.parent');
      if (parentError) errors.push(parentError);
    }

    if (!this.isNumber(data.count)) {
      errors.push({ field: 'Category.count', rule: 'type', message: 'Category.count must be a number', value: data.count });
    } else {
      const countError = validateNonNegativeInteger(data.count, 'Category.count');
      if (countError) errors.push(countError);
    }

    if (!this.isString(data.link)) {
      errors.push({ field: 'Category.link', rule: 'type', message: 'Category.link must be a string', value: data.link });
    } else {
      const linkError = validateUrl(data.link, 'Category.link');
      if (linkError) errors.push(linkError);
    }

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

    if (!this.isNumber(data.id)) {
      errors.push({ field: 'Tag.id', rule: 'type', message: 'Tag.id must be a number', value: data.id });
    } else {
      const idError = validatePositiveInteger(data.id, 'Tag.id');
      if (idError) errors.push(idError);
    }

    if (!this.isString(data.name)) {
      errors.push({ field: 'Tag.name', rule: 'type', message: 'Tag.name must be a string', value: data.name });
    } else {
      const nameError = validateNonEmptyString(data.name, 'Tag.name');
      if (nameError) errors.push(nameError);
    }

    if (!this.isString(data.slug)) {
      errors.push({ field: 'Tag.slug', rule: 'type', message: 'Tag.slug must be a string', value: data.slug });
    } else {
      const slugError = validateNonEmptyString(data.slug, 'Tag.slug');
      if (slugError) errors.push(slugError);

      const patternError = validatePattern(data.slug, TAG_VALIDATION_RULES.slug.pattern, 'Tag.slug');
      if (patternError) errors.push(patternError);

      const lengthError = validateLength(data.slug, TAG_VALIDATION_RULES.slug.minLength, TAG_VALIDATION_RULES.slug.maxLength, 'Tag.slug');
      if (lengthError) errors.push(lengthError);
    }

    if (!this.isString(data.description)) {
      errors.push({ field: 'Tag.description', rule: 'type', message: 'Tag.description must be a string', value: data.description });
    }

    if (!this.isNumber(data.count)) {
      errors.push({ field: 'Tag.count', rule: 'type', message: 'Tag.count must be a number', value: data.count });
    } else {
      const countError = validateNonNegativeInteger(data.count, 'Tag.count');
      if (countError) errors.push(countError);
    }

    if (!this.isString(data.link)) {
      errors.push({ field: 'Tag.link', rule: 'type', message: 'Tag.link must be a string', value: data.link });
    } else {
      const linkError = validateUrl(data.link, 'Tag.link');
      if (linkError) errors.push(linkError);
    }

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

    if (!this.isNumber(data.id)) {
      errors.push({ field: 'Media.id', rule: 'type', message: 'Media.id must be a number', value: data.id });
    } else {
      const idError = validatePositiveInteger(data.id, 'Media.id');
      if (idError) errors.push(idError);
    }

    if (!this.isString(data.source_url)) {
      errors.push({ field: 'Media.source_url', rule: 'type', message: 'Media.source_url must be a string', value: data.source_url });
    } else {
      const urlError = validateUrl(data.source_url, 'Media.source_url');
      if (urlError) errors.push(urlError);
    }

    if (!this.isObject(data.title) || !this.isString(data.title.rendered)) {
      errors.push({ field: 'Media.title.rendered', rule: 'type', message: 'Media.title.rendered must be a string', value: data.title });
    }

    if (!this.isString(data.alt_text)) {
      errors.push({ field: 'Media.alt_text', rule: 'type', message: 'Media.alt_text must be a string', value: data.alt_text });
    }

    if (!this.isString(data.media_type)) {
      errors.push({ field: 'Media.media_type', rule: 'type', message: 'Media.media_type must be a string', value: data.media_type });
    } else {
      const mediaTypeError = validateEnum(data.media_type, MEDIA_VALIDATION_RULES.media_type.allowedValues, 'Media.media_type');
      if (mediaTypeError) errors.push(mediaTypeError);
    }

    if (!this.isString(data.mime_type)) {
      errors.push({ field: 'Media.mime_type', rule: 'type', message: 'Media.mime_type must be a string', value: data.mime_type });
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

    if (!this.isNumber(data.id)) {
      errors.push({ field: 'Author.id', rule: 'type', message: 'Author.id must be a number', value: data.id });
    } else {
      const idError = validatePositiveInteger(data.id, 'Author.id');
      if (idError) errors.push(idError);
    }

    if (!this.isString(data.name)) {
      errors.push({ field: 'Author.name', rule: 'type', message: 'Author.name must be a string', value: data.name });
    } else {
      const nameError = validateNonEmptyString(data.name, 'Author.name');
      if (nameError) errors.push(nameError);
    }

    if (!this.isString(data.slug)) {
      errors.push({ field: 'Author.slug', rule: 'type', message: 'Author.slug must be a string', value: data.slug });
    } else {
      const slugError = validateNonEmptyString(data.slug, 'Author.slug');
      if (slugError) errors.push(slugError);

      const patternError = validatePattern(data.slug, AUTHOR_VALIDATION_RULES.slug.pattern, 'Author.slug');
      if (patternError) errors.push(patternError);

      const lengthError = validateLength(data.slug, AUTHOR_VALIDATION_RULES.slug.minLength, AUTHOR_VALIDATION_RULES.slug.maxLength, 'Author.slug');
      if (lengthError) errors.push(lengthError);
    }

    if (!this.isString(data.description)) {
      errors.push({ field: 'Author.description', rule: 'type', message: 'Author.description must be a string', value: data.description });
    }

    if (!this.isObject(data.avatar_urls)) {
      errors.push({ field: 'Author.avatar_urls', rule: 'type', message: 'Author.avatar_urls must be an object', value: data.avatar_urls });
    }

    if (!this.isString(data.link)) {
      errors.push({ field: 'Author.link', rule: 'type', message: 'Author.link must be a string', value: data.link });
    } else {
      const linkError = validateUrl(data.link, 'Author.link');
      if (linkError) errors.push(linkError);
    }

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

export type { ValidationError, ValidationResult };
