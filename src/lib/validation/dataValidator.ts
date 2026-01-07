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
    const errors: string[] = [];

    if (!this.isArray(data)) {
      return { valid: false, errors: ['Posts must be an array'] };
    }

    const validPosts: WordPressPost[] = [];

    for (let i = 0; i < data.length; i++) {
      const result = this.validatePost(data[i]);
      if (!result.valid) {
        errors.push(`Post at index ${i}: ${result.errors.join(', ')}`);
      } else {
        validPosts.push(result.data!);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: validPosts, errors: [] };
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
    const errors: string[] = [];

    if (!this.isArray(data)) {
      return { valid: false, errors: ['Categories must be an array'] };
    }

    const validCategories: WordPressCategory[] = [];

    for (let i = 0; i < data.length; i++) {
      const result = this.validateCategory(data[i]);
      if (!result.valid) {
        errors.push(`Category at index ${i}: ${result.errors.join(', ')}`);
      } else {
        validCategories.push(result.data!);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: validCategories, errors: [] };
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
    const errors: string[] = [];

    if (!this.isArray(data)) {
      return { valid: false, errors: ['Tags must be an array'] };
    }

    const validTags: WordPressTag[] = [];

    for (let i = 0; i < data.length; i++) {
      const result = this.validateTag(data[i]);
      if (!result.valid) {
        errors.push(`Tag at index ${i}: ${result.errors.join(', ')}`);
      } else {
        validTags.push(result.data!);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, data: validTags, errors: [] };
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
