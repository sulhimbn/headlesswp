import type { WordPressPost, WordPressCategory, WordPressTag, WordPressAuthor } from '@/types/wordpress';
import type { ValidationError } from './validationUtils';

export interface RelationshipValidatorOptions {
  categories?: Map<number, WordPressCategory>;
  tags?: Map<number, WordPressTag>;
  authors?: Map<number, WordPressAuthor>;
  strict?: boolean;
}

class RelationshipValidator {
  private hasMap(value: unknown): value is Map<number, unknown> {
    return value instanceof Map;
  }

  private validateReferenceIds(
    ids: number[],
    availableIds: Set<number>,
    entityType: string,
    errors: ValidationError[]
  ): void {
    if (!Array.isArray(ids)) {
      errors.push({ field: entityType, rule: 'type', message: `${entityType} must be an array`, value: ids });
      return;
    }

    const invalidIds = ids.filter(id => !availableIds.has(id));
    if (invalidIds.length > 0) {
      errors.push({
        field: entityType,
        rule: 'reference',
        message: `${entityType} contains invalid IDs: ${invalidIds.join(', ')}`,
        value: invalidIds
      });
    }
  }

  private validateReferenceId(
    id: number,
    availableIds: Set<number>,
    entityType: string,
    errors: ValidationError[]
  ): void {
    if (typeof id !== 'number' || id <= 0) {
      errors.push({ field: entityType, rule: 'reference', message: `${entityType} must be a positive number`, value: id });
      return;
    }

    if (!availableIds.has(id)) {
      errors.push({
        field: entityType,
        rule: 'reference',
        message: `${entityType} references non-existent ID: ${id}`,
        value: id
      });
    }
  }

  validatePostRelationships(
    post: WordPressPost,
    options: RelationshipValidatorOptions
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    const { categories, tags, authors } = options;

    if (categories && this.hasMap(categories)) {
      const categoryIds = new Set(categories.keys());
      if (post.categories && post.categories.length > 0) {
        this.validateReferenceIds(post.categories, categoryIds, 'Post.categories', errors);
      }
    }

    if (tags && this.hasMap(tags)) {
      const tagIds = new Set(tags.keys());
      if (post.tags && post.tags.length > 0) {
        this.validateReferenceIds(post.tags, tagIds, 'Post.tags', errors);
      }
    }

    if (authors && this.hasMap(authors)) {
      const authorIds = new Set(authors.keys());
      if (post.author && post.author > 0) {
        this.validateReferenceId(post.author, authorIds, 'Post.author', errors);
      }
    }

    return errors;
  }

  validatePostsRelationships(
    posts: WordPressPost[],
    options: RelationshipValidatorOptions
  ): ValidationError[] {
    const allErrors: ValidationError[] = [];

    for (let i = 0; i < posts.length; i++) {
      const errors = this.validatePostRelationships(posts[i], options);
      if (errors.length > 0) {
        allErrors.push(
          ...errors.map(error => ({
            ...error,
            field: `Post[${i}].${error.field}`,
            message: `Post at index ${i}: ${error.message}`
          }))
        );
      }
    }

    return allErrors;
  }
}

export const relationshipValidator = new RelationshipValidator();

export default relationshipValidator;
