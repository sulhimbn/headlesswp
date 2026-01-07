import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress';

interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors: string[];
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
    const errors: string[] = [];

    if (!this.isArray(data)) {
      return { valid: false, errors: [`${this.pluralize(itemName)} must be an array`] };
    }

    const validItems: T[] = [];

    for (let i = 0; i < data.length; i++) {
      const result = validateFn(data[i]);
      if (!result.valid) {
        errors.push(`${itemName} at index ${i}: ${result.errors.join(', ')}`);
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
    const errors: string[] = [];

    if (!this.isObject(data)) {
      return { valid: false, errors: ['Post must be an object'] };
    }

    if (!this.isNumber(data.id)) {
      errors.push('Post.id must be a number');
    }

    if (!this.isObject(data.title) || !this.isString(data.title.rendered)) {
      errors.push('Post.title.rendered must be a string');
    }

    if (!this.isObject(data.content) || !this.isString(data.content.rendered)) {
      errors.push('Post.content.rendered must be a string');
    }

    if (!this.isObject(data.excerpt) || !this.isString(data.excerpt.rendered)) {
      errors.push('Post.excerpt.rendered must be a string');
    }

    if (!this.isString(data.slug)) {
      errors.push('Post.slug must be a string');
    }

    if (!this.isString(data.date)) {
      errors.push('Post.date must be a string');
    }

    if (!this.isString(data.modified)) {
      errors.push('Post.modified must be a string');
    }

    if (!this.isNumber(data.author)) {
      errors.push('Post.author must be a number');
    }

    if (!this.isNumber(data.featured_media)) {
      errors.push('Post.featured_media must be a number');
    }

    if (!this.isArray(data.categories)) {
      errors.push('Post.categories must be an array');
    } else if (!data.categories.every((id: unknown) => this.isNumber(id))) {
      errors.push('Post.categories must contain only numbers');
    }

    if (!this.isArray(data.tags)) {
      errors.push('Post.tags must be an array');
    } else if (!data.tags.every((id: unknown) => this.isNumber(id))) {
      errors.push('Post.tags must contain only numbers');
    }

    if (!this.isString(data.status)) {
      errors.push('Post.status must be a string');
    }

    if (!this.isString(data.type)) {
      errors.push('Post.type must be a string');
    }

    if (!this.isString(data.link)) {
      errors.push('Post.link must be a string');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: data as unknown as WordPressPost, errors: [] };
  }

  validatePosts(data: unknown): ValidationResult<WordPressPost[]> {
    return this.validateArray(data, 'Post', (item) => this.validatePost(item));
  }

  validateCategory(data: unknown): ValidationResult<WordPressCategory> {
    const errors: string[] = [];

    if (!this.isObject(data)) {
      return { valid: false, errors: ['Category must be an object'] };
    }

    if (!this.isNumber(data.id)) {
      errors.push('Category.id must be a number');
    }

    if (!this.isString(data.name)) {
      errors.push('Category.name must be a string');
    }

    if (!this.isString(data.slug)) {
      errors.push('Category.slug must be a string');
    }

    if (!this.isString(data.description)) {
      errors.push('Category.description must be a string');
    }

    if (!this.isNumber(data.parent)) {
      errors.push('Category.parent must be a number');
    }

    if (!this.isNumber(data.count)) {
      errors.push('Category.count must be a number');
    }

    if (!this.isString(data.link)) {
      errors.push('Category.link must be a string');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: data as unknown as WordPressCategory, errors: [] };
  }

  validateCategories(data: unknown): ValidationResult<WordPressCategory[]> {
    return this.validateArray(data, 'Category', (item) => this.validateCategory(item));
  }

  validateTag(data: unknown): ValidationResult<WordPressTag> {
    const errors: string[] = [];

    if (!this.isObject(data)) {
      return { valid: false, errors: ['Tag must be an object'] };
    }

    if (!this.isNumber(data.id)) {
      errors.push('Tag.id must be a number');
    }

    if (!this.isString(data.name)) {
      errors.push('Tag.name must be a string');
    }

    if (!this.isString(data.slug)) {
      errors.push('Tag.slug must be a string');
    }

    if (!this.isString(data.description)) {
      errors.push('Tag.description must be a string');
    }

    if (!this.isNumber(data.count)) {
      errors.push('Tag.count must be a number');
    }

    if (!this.isString(data.link)) {
      errors.push('Tag.link must be a string');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: data as unknown as WordPressTag, errors: [] };
  }

  validateTags(data: unknown): ValidationResult<WordPressTag[]> {
    return this.validateArray(data, 'Tag', (item) => this.validateTag(item));
  }

  validateMedia(data: unknown): ValidationResult<WordPressMedia> {
    const errors: string[] = [];

    if (!this.isObject(data)) {
      return { valid: false, errors: ['Media must be an object'] };
    }

    if (!this.isNumber(data.id)) {
      errors.push('Media.id must be a number');
    }

    if (!this.isString(data.source_url)) {
      errors.push('Media.source_url must be a string');
    }

    if (!this.isObject(data.title) || !this.isString(data.title.rendered)) {
      errors.push('Media.title.rendered must be a string');
    }

    if (!this.isString(data.alt_text)) {
      errors.push('Media.alt_text must be a string');
    }

    if (!this.isString(data.media_type)) {
      errors.push('Media.media_type must be a string');
    }

    if (!this.isString(data.mime_type)) {
      errors.push('Media.mime_type must be a string');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: data as unknown as WordPressMedia, errors: [] };
  }

  validateAuthor(data: unknown): ValidationResult<WordPressAuthor> {
    const errors: string[] = [];

    if (!this.isObject(data)) {
      return { valid: false, errors: ['Author must be an object'] };
    }

    if (!this.isNumber(data.id)) {
      errors.push('Author.id must be a number');
    }

    if (!this.isString(data.name)) {
      errors.push('Author.name must be a string');
    }

    if (!this.isString(data.slug)) {
      errors.push('Author.slug must be a string');
    }

    if (!this.isString(data.description)) {
      errors.push('Author.description must be a string');
    }

    if (!this.isObject(data.avatar_urls)) {
      errors.push('Author.avatar_urls must be an object');
    }

    if (!this.isString(data.link)) {
      errors.push('Author.link must be a string');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: data as unknown as WordPressAuthor, errors: [] };
  }
}

export const dataValidator = new DataValidator();

export default dataValidator;

export function isValidationResultValid<T>(result: ValidationResult<T>): result is { valid: true; data: T; errors: [] } {
  return result.valid;
}

export function unwrapValidationResult<T>(result: ValidationResult<T>): T {
  if (!result.valid) {
    throw new Error(`Validation failed: ${result.errors.join(', ')}`);
  }
  return result.data!;
}

export function unwrapValidationResultSafe<T>(result: ValidationResult<T>, fallback: T): T {
  if (!result.valid) {
    return fallback;
  }
  return result.data!;
}
