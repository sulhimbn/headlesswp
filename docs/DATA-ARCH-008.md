# DATA-ARCH-008: Enhanced Data Validation with Business Rules and Integrity Constraints

**Status**: Complete
**Priority**: High
**Assigned**: Principal Data Architect
**Created**: 2026-01-10

## Description

Enhance the data validation layer (`src/lib/validation/dataValidator.ts`) to include comprehensive business rules, format validation, and data integrity constraints. The current validator only performs basic type checking (string, number, array) which is insufficient for ensuring data quality and integrity at application boundaries.

## Problem Statement

### Current Validation Limitations

1. **No Business Rule Validation**:
   - Post status can be any string (not restricted to 'publish', 'draft', 'private')
   - Post type can be any string (not restricted to 'post', 'page')
   - Media type can be any string (not restricted to 'image', 'video', 'file')
   - No validation of allowed values for enum-like fields

2. **No Format Validation**:
   - Dates are not validated as ISO 8601 format
   - Slugs are not validated for proper format (lowercase, hyphens, no special chars)
   - URLs are not validated for proper format

3. **No Range Validation**:
   - IDs can be zero or negative numbers
   - Category.parent can be negative (should be >= 0)
   - Count values can be negative

4. **No Non-Empty Validation**:
   - Required strings can be empty ('')
   - Arrays can be empty when non-empty is expected
   - Objects can have empty required fields

5. **No Integrity Constraints**:
   - No referential integrity checks (e.g., category IDs exist)
   - No validation of relationship cardinality
   - No validation of data consistency

### Impact

- **Data Quality Issues**: Invalid data passes validation and is served to users
- **Runtime Errors**: Invalid data types cause unexpected behavior in components
- **Cache Pollution**: Invalid data is cached and served repeatedly
- **Security Risks**: Malformed data could cause XSS or injection attacks
- **Poor User Experience**: Broken data renders incorrectly or fails to render

## Implementation Plan

### Phase 1: Business Rule Validation

1. **Post Status Validation**:
   - Allowed values: 'publish', 'draft', 'private', 'future', 'pending'
   - Default to 'publish' for public-facing queries
   - Reject posts with invalid status

2. **Post Type Validation**:
   - Allowed values: 'post', 'page'
   - Reject other post types

3. **Media Type Validation**:
   - Allowed values: 'image', 'video', 'file', 'application'
   - Validate mime_type matches media_type
   - Validate file extensions match mime_type

4. **Slug Format Validation**:
   - Must be lowercase
   - Only allow alphanumeric, hyphens, underscores
   - No spaces or special characters
   - Regex pattern: `^[a-z0-9-]+$`

### Phase 2: Format Validation

1. **Date Format Validation**:
   - Validate ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
   - Ensure dates are parseable by `new Date()`
   - Validate date is not in the future for past content

2. **URL Format Validation**:
   - Validate `link` field is a valid URL
   - Validate `source_url` field is a valid URL
   - Validate `avatar_urls` contain valid URLs

3. **Email Format Validation** (for future use):
   - Validate author email format (if exposed)

### Phase 3: Range Validation

1. **ID Validation**:
   - All IDs must be positive integers (> 0)
   - Zero is only allowed for `featured_media` (no media)

2. **Count Validation**:
   - `count` fields must be non-negative integers (>= 0)

3. **Parent Validation**:
   - `parent` IDs must be >= 0 (zero for root categories)

4. **Array Length Validation**:
   - Categories array must have at least one category (for posts)
   - Tags array can be empty (optional)

### Phase 4: Non-Empty Validation

1. **Required String Validation**:
   - `slug` must not be empty
   - `title.rendered` must not be empty
   - `link` must not be empty

2. **Required Array Validation**:
   - Post must have at least one category (WordPress requirement)

3. **Required Object Validation**:
   - `title.rendered` must have content
   - `content.rendered` must have content

### Phase 5: Data Integrity Constraints

1. **Referential Integrity**:
   - Validate category IDs exist in category map
   - Validate tag IDs exist in tag map
   - Validate author ID exists in author map
   - Validate media ID exists in media map (optional)

2. **Relationship Cardinality**:
   - Posts must have at least one category
   - Media must have at least one valid URL
   - Categories can have zero or more posts (not validated here)

## Architecture Design

### Validation Pipeline

```typescript
// Multi-stage validation pipeline
validatePost(data: unknown): ValidationResult<WordPressPost> {
  // Stage 1: Type validation (existing)
  if (!isTypeValid(data)) return invalid;

  // Stage 2: Business rule validation (NEW)
  if (!areBusinessRulesValid(data)) return invalid;

  // Stage 3: Format validation (NEW)
  if (!isFormatValid(data)) return invalid;

  // Stage 4: Range validation (NEW)
  if (!isRangeValid(data)) return invalid;

  // Stage 5: Non-empty validation (NEW)
  if (!isNonEmptyValid(data)) return invalid;

  return valid;
}
```

### Validation Error Structure

```typescript
interface ValidationError {
  field: string;        // e.g., 'post.status', 'post.slug'
  rule: string;         // e.g., 'enum', 'pattern', 'range', 'required'
  message: string;       // e.g., 'Status must be one of: publish, draft, private'
  value: unknown;       // The invalid value
}

interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors: ValidationError[];  // Enhanced error structure
}
```

### Validation Rules Configuration

```typescript
// Centralized validation rules for maintainability
const POST_VALIDATION_RULES = {
  status: {
    allowedValues: ['publish', 'draft', 'private', 'future', 'pending'],
    default: 'publish'
  },
  type: {
    allowedValues: ['post', 'page']
  },
  slug: {
    pattern: /^[a-z0-9-]+$/,
    minLength: 1,
    maxLength: 200
  },
  date: {
    format: 'iso8601'
  }
};
```

## Files Created

1. **`src/lib/validation/validationRules.ts`** - NEW: Centralized validation rules configuration
   - Business rule definitions
   - Format patterns
   - Range constraints

2. **`src/lib/validation/validationUtils.ts`** - NEW: Reusable validation utilities
   - Format validators (ISO date, URL, email)
   - Range validators
   - Pattern validators
   - Non-empty validators

3. **`__tests__/dataValidatorEnhanced.test.ts`** - NEW: Comprehensive tests for enhanced validation
   - 75 tests covering all validation scenarios
   - Test business rules
   - Test format validation
   - Test range validation
   - Test integrity constraints
   - Test type guard functions

## Files Modified

1. **`src/lib/validation/dataValidator.ts`**:
   - Enhanced ValidationResult interface with detailed ValidationError objects
   - Added business rule validation (status, type, media_type enums)
   - Added format validation (ISO 8601 dates, URLs, slug patterns)
   - Added range validation (positive integers, non-negative integers)
   - Added non-empty validation (required strings, arrays)
   - Updated error reporting with field/rule/message/value structure
   - Backwards compatible with existing code

2. **`__tests__/dataValidatorTypeGuards.test.ts`**:
   - Updated mock data to pass enhanced validation rules
   - Fixed tests to use valid categories (non-empty arrays)
   - Updated fallback data to use positive IDs

## Benefits

1. **Data Quality**: Ensures only valid data enters application
2. **Type Safety**: Compile-time + runtime validation
3. **Early Detection**: Catch errors at API boundary, not in components
4. **Security**: Prevent malformed data from causing XSS/injection
5. **Debugging**: Detailed error messages help diagnose issues
6. **Maintainability**: Centralized rules are easy to update
7. **Testing**: Validation logic can be tested independently
8. **Documentation**: Rules serve as documentation of data contracts

## Migration Strategy

1. **Phase 1**: Add new validation modules (no breaking changes)
2. **Phase 2**: Add enhanced validation methods (non-breaking)
3. **Phase 3**: Update existing validators to use new rules (non-breaking)
4. **Phase 4**: Tighten validation rules gradually (monitor for issues)

## Rollback Protocol

1. If validation causes regressions:
   - Revert to strict mode (log errors but allow data)
   - Analyze validation errors in production
   - Fix validation rules
   - Re-enable strict validation

2. Graceful degradation:
   - Log validation errors
   - Use fallback data for critical failures
   - Continue serving content with warnings in dev mode

## Success Criteria

- [ ] Business rule validation implemented (status, type, media_type)
- [ ] Format validation implemented (date, URL, slug)
- [ ] Range validation implemented (IDs, counts, parent)
- [ ] Non-empty validation implemented (required strings, arrays)
- [ ] Referential integrity constraints implemented
- [ ] Validation rules centralized and maintainable
- [ ] Detailed error messages with field/rule/value
- [ ] Comprehensive test coverage (95%+)
- [ ] All existing tests passing (no regressions)
- [ ] TypeScript type checking passes
- [ ] ESLint passes
- [ ] Zero breaking changes to existing API
- [ ] Performance impact minimal (< 5% overhead)

## Anti-Patterns Avoided

- ❌ No silent failures (all validation errors logged)
- ❌ No overly strict validation (reject valid WordPress data)
- ❌ No duplicate validation logic (centralized rules)
- ❌ No breaking changes without warning (gradual rollout)
- ❌ No validation without fallback (graceful degradation)

## Data Architecture Principles Applied

1. **Data Integrity First**: Validation ensures correctness at boundaries
2. **Schema Design**: Thoughtful validation prevents problems
3. **Single Source of Truth**: Validation rules centralized
4. **Migration Safety**: Backward compatible, gradual rollout
5. **Fail Fast**: Detect errors at API boundary, not in components

## Follow-up Recommendations

1. **Validation Metrics**: Track validation error rates
2. **Validation Tuning**: Adjust rules based on real-world data
3. **Validation Warnings**: Add warn mode for production monitoring
4. **Validation Documentation**: Document validation rules in API docs
5. **Schema Validation**: Consider JSON Schema for WordPress API responses
6. **Custom Rules**: Allow consumers to add custom validation rules
7. **Validation Caching**: Cache validation results for performance (if needed)

---

