# Architecture Blueprint

**Version**: 1.0.1
**Last Updated**: 2026-02-02 (Principal Software Architect - PERF-MON-001: Core Performance Metrics Collection Complete)

## System Architecture

```
┌─────────────┐     REST API      ┌──────────────┐
│   Next.js   │ ◄──────────────► │  WordPress   │
│  Frontend   │   (wp-json)      │   Backend    │
└─────────────┘                  └──────────────┘
     │                                 │
     │                                 │
┌─────────────┐                  ┌──────────────┐
│   Docker    │                  │   MySQL      │
│  Container  │                  │  Database    │
└─────────────┘                  └──────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: CSS Modules (to be confirmed)
- **HTTP Client**: Axios 1.7
- **Security**: DOMPurify 3.3

### Backend
- **CMS**: WordPress
- **API Strategy**: REST API (wp-json/wp/v2/)
- **Database**: MySQL
- **Containerization**: Docker + Docker Compose

### Development
- **Testing**: Jest 30 + React Testing Library 16
- **Linting**: ESLint 8 with Next.js config
- **Version Control**: Git

## Design System

### Design Tokens

Design tokens are CSS variables defined in `src/app/globals.css` that provide a single source of truth for visual design. All components should use design tokens instead of hardcoded Tailwind values.

**Why Design Tokens?**
- **Consistency**: Ensures visual consistency across all components
- **Maintainability**: Change colors, spacing, typography in one place
- **Theming**: Enables easy theme switching for dark mode or custom themes
- **Scalability**: Centralized design system that grows with the application

### Available Tokens

**Colors** (HSL values for CSS):
```css
--color-primary: 0 84% 40%;              /* Red-600 equivalent */
--color-primary-dark: 0 86% 38%;           /* Red-700 equivalent */
--color-primary-light: 0 96% 95%;           /* Red-50 equivalent */
--color-secondary: 220 10% 96%;             /* Gray-100 equivalent */
--color-secondary-dark: 220 12% 90%;         /* Gray-200 equivalent */
--color-text-primary: 220 13% 13%;         /* Gray-900 equivalent */
--color-text-secondary: 220 9% 46%;         /* Gray-600 equivalent */
--color-text-muted: 220 9% 60%;            /* Gray-500 equivalent */
--color-background: 220 13% 98%;           /* Gray-50 equivalent */
--color-surface: 0 0% 100%;                /* White */
--color-border: 220 13% 91%;              /* Gray-300 equivalent */
--color-background-dark: 220 13% 10%;     /* Gray-900 equivalent (dark theme) */
--color-surface-dark: 220 13% 15%;         /* Gray-800 equivalent (dark theme) */
--color-text-muted-dark: 220 9% 65%;       /* Gray-400 equivalent (dark theme) */
--color-text-faint-dark: 220 9% 45%;       /* Gray-500 equivalent (dark theme) */
```

**Spacing**:
```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;       /* 16px */
--spacing-lg: 1.5rem;     /* 24px */
--spacing-xl: 2rem;       /* 32px */
--spacing-2xl: 3rem;      /* 48px */
--spacing-3xl: 4rem;      /* 64px */
```

**Typography**:
```css
--text-xs: 0.75rem;       /* 12px */
--text-sm: 0.875rem;      /* 14px */
--text-base: 1rem;         /* 16px */
--text-lg: 1.125rem;      /* 18px */
--text-xl: 1.25rem;       /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;     /* 30px */
```

**Border Radius**:
```css
--radius-sm: 0.25rem;     /* 4px */
--radius-md: 0.375rem;     /* 6px */
--radius-lg: 0.5rem;       /* 8px */
--radius-xl: 0.75rem;      /* 12px */
```

**Shadows**:
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

**Transitions**:
```css
--transition-fast: 150ms;
--transition-normal: 300ms;
--transition-slow: 500ms;
```

### Usage Guidelines

**Using Design Tokens in Components**:
```tsx
import { forwardRef } from 'react'

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ children, ...props }, ref) => (
  <button
    ref={ref}
    className={`
      bg-[hsl(var(--color-primary))]
      text-white
      rounded-[var(--radius-md)]
      px-4
      py-2
      transition-all
      duration-[var(--transition-normal)]
      hover:bg-[hsl(var(--color-primary-dark))]
      focus:ring-2
      focus:ring-[hsl(var(--color-primary))]
    `}
    {...props}
  >
    {children}
  </button>
))
```

**Token Mapping for Common Patterns**:
- `bg-white` → `bg-[hsl(var(--color-surface))]`
- `bg-gray-50` → `bg-[hsl(var(--color-background))]`
- `bg-red-600` → `bg-[hsl(var(--color-primary))]`
- `bg-red-700` → `bg-[hsl(var(--color-primary-dark))]`
- `text-gray-900` → `text-[hsl(var(--color-text-primary))]`
- `text-gray-600` → `text-[hsl(var(--color-text-secondary))]`
- `text-gray-500` → `text-[hsl(var(--color-text-muted))]`
- `text-red-600` → `text-[hsl(var(--color-primary))]`
- `rounded-md` → `rounded-[var(--radius-md)]`
- `rounded-lg` → `rounded-[var(--radius-lg)]`
- `shadow-md` → `shadow-[var(--shadow-md)]`
- `shadow-lg` → `shadow-[var(--shadow-lg)]`
- `transition-colors` → `transition-all duration-[var(--transition-normal)]` (or `--transition-fast` for micro-interactions)
- `text-gray-800` → `text-[hsl(var(--color-text-primary))]`
- `text-gray-700` → `text-[hsl(var(--color-text-secondary))]`
- `hover:bg-gray-300` → `hover:bg-[hsl(var(--color-secondary))]`
- `bg-gray-900` → `bg-[hsl(var(--color-background-dark))]`
- `text-gray-400` → `text-[hsl(var(--color-text-muted-dark))]`
- `border-gray-800` → `border-[hsl(var(--color-surface-dark))]`

**Button Variant Mappings** (extracted to `src/lib/constants/buttonStyles.ts`):
- **Primary variant**: `bg-[hsl(var(--color-primary))] text-white hover:bg-[hsl(var(--color-primary-dark))]`
- **Secondary variant**: `bg-[hsl(var(--color-secondary-dark))] text-[hsl(var(--color-text-primary))] hover:bg-[hsl(var(--color-secondary))]`
- **Outline variant**: `border-[hsl(var(--color-primary))] text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-light))]`
- **Ghost variant**: `text-[hsl(var(--color-text-secondary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))]`

### Accessibility Features

**Skip-to-Content Link**:
- Implemented in `src/app/layout.tsx`
- Allows keyboard users to skip navigation
- Hidden by default, visible on focus
- Located at top of page

**Focus Indicators**:
- Global focus styles defined in `src/app/globals.css`
- `*:focus-visible` uses `ring-2 ring-[hsl(var(--color-primary))]`
- All interactive elements have visible focus states

**Semantic HTML**:
- Use appropriate HTML elements: `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`
- ARIA attributes for screen readers
- Keyboard navigation support (Tab, Escape, arrow keys)

**Loading States**:
- Skeleton components use `aria-busy="true"` to indicate loading state to screen readers
- Section headings support optional `id` prop for anchor linking
- Design tokens used consistently across all skeleton components

### Responsive Design

**Breakpoints**:
- Mobile: < 640px (`sm:` prefix)
- Tablet: 640px - 1024px (`md:` prefix)
- Desktop: >= 1024px (`lg:` prefix)

**Component Patterns**:
- Mobile-first approach
- Progressive enhancement
- Touch-friendly tap targets (minimum 44x44px)

## Design Principles

1. **REST API Only**: Use WordPress REST API exclusively (no GraphQL)
2. **Security First**: Sanitize all user inputs, implement CSP
3. **Performance**: Optimize bundle size, implement caching
4. **Type Safety**: Strong TypeScript coverage
5. **Test Coverage**: Comprehensive unit and integration tests

## API Standards

### Base URL
```
Development: http://localhost:8080/wp-json/wp/v2/
```

### Standard Endpoints
| Endpoint | Purpose | Usage | Optimization |
|----------|---------|-------|-------------|
| `/posts` | News articles | List/detail pages | Batch requests |
| `/categories` | Categories | Navigation/filtering | Cached 30min |
| `/tags` | Tags | Content organization | Cached 30min |
| `/media` | Images/media | Media assets | Batch fetching |
| `/users` | Authors | Author profiles | Cached 30min |

### Batch Operations
- **Media Batch**: `getMediaBatch(ids)` - Fetch multiple media items
- **Media URL Batch**: `getMediaUrlsBatch(ids)` - Resolve URLs in batch
- Reduces API calls from N to 1 for N media items

### Response Format
```typescript
interface Post {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  excerpt: { rendered: string }
  date: string
  modified: string
  author: number
  categories: number[]
  tags: number[]
  featured_media: number
  // ... additional fields
}
```

### API Standardization

**Principles**:
- **Backward Compatibility**: Never break existing API consumers
- **Consistent Naming**: `getById<T>()`, `getBySlug<T>()`, `getAll<T>()`, `search<T>()`
- **Consistent Error Handling**: All methods return `ApiResult<T>` or `ApiListResult<T>` with consistent error handling
- **Consistent Response Format**: Data, error, metadata, pagination
- **Type Safety**: TypeScript interfaces and type guards
- **Error Types**: `NETWORK_ERROR`, `TIMEOUT_ERROR`, `RATE_LIMIT_ERROR`, `SERVER_ERROR`, `CLIENT_ERROR`, `CIRCUIT_BREAKER_OPEN`, `UNKNOWN_ERROR`
- **Retry Flags**: Each error type has a retryable flag
- **Metadata**: Timestamp, endpoint, cacheHit, retryCount
- **Pagination**: Page, perPage, total, totalPages

**Standardized Response Wrapper** (`src/lib/api/response.ts`):
```typescript
interface ApiResult<T> {
  data: T
  error: ApiError | null
  metadata: ApiMetadata
  pagination?: ApiPaginationMetadata
}

interface ApiListResult<T> extends ApiResult<T[]> {
  pagination: ApiPaginationMetadata
}
```

**Standardized Methods** (`src/lib/api/standardized.ts`):
- **Posts**: `getPostById()`, `getPostBySlug()`, `getAllPosts()`, `searchPosts()`
- **Categories**: `getCategoryById()`, `getCategoryBySlug()`, `getAllCategories()`
- **Tags**: `getTagById()`, `getTagBySlug()`, `getAllTags()`
- **Media**: `getMediaById()`
- **Authors**: `getAuthorById()`

**Implementation Status**:
  - ✅ **Phase 1 Complete**: Documentation and `ApiResult<T>` interface defined
  - ✅ **Phase 2 Complete**: Standardized methods implemented in `src/lib/api/standardized.ts`
     - 31 methods (getById, getBySlug, getAll, search)
     - All methods return `ApiResult<T>` or `ApiListResult<T>` with consistent error handling
  - ✅ **Phase 2 Complete**: Error result helper extracted for collection methods (REFACTOR-008)
     - Created `createErrorListResult()` helper to eliminate 52 lines of duplicate error result structure
     - Applied to `getAllPosts`, `searchPosts`, `getAllCategories`, `getAllTags`
  - ✅ **Phase 3 Complete**: Try-catch pattern extraction (REFACTOR-010)
     - Created `fetchAndHandleNotFound()` helper to eliminate 40 lines of duplicate error handling
     - Applied to `getPostBySlug`, `getCategoryById`, `getCategoryBySlug`, `getTagById`, `getTagBySlug`
  - ✅ **Phase 4 Complete**: Migrated service layer to use standardized API methods (INT-STD-004)
     - Migrated `enhancedPostService` methods: getLatestPosts, getCategoryPosts, getAllPosts, getPaginatedPosts, getPostBySlug, getPostById
     - All service methods now use `standardizedAPI` for consistent error handling and metadata tracking
     - Resilience patterns (circuit breaker, retry strategy, rate limiting) now applied at service layer
     - Preserved existing validation, enrichment, and caching behavior
  - ⏳ **Phase 5**: Deprecate old methods in major version (future)

**See Also**: [API Standardization Guidelines](./API_STANDARDIZATION.md)

### DRY Principle and Code Quality

 **Last Updated**: 2026-01-10 (Principal Data Architect)

**DRY (Don't Repeat Yourself)** is a fundamental software design principle that eliminates code duplication and improves maintainability.

**Extracted Helpers** (`src/lib/api/response.ts`):
1. **`fetchAndHandleNotFound<T>()`** - Generic error handling for not-found scenarios
   - Eliminates duplicate try-catch patterns
   - Consistent error messages and response format
   - Type-safe with generic types
   - Applied to 5 methods (getPostBySlug, getCategoryById, getCategoryBySlug, getTagById, getTagBySlug)

**Service Layer Helpers** (`src/lib/services/enhancedPostService.ts`):
1. **`fetchAndValidatePosts()`** - Unified fetch, error handling, and validation helper for post collections
    - Merged duplicate error handling and validation patterns from 6 service methods
    - Accepts `FetchAndValidatePostsOptions` interface for configuration
    - Supports optional fallback key for fallback posts
    - Supports configurable return empty on error flag
    - Applied to 4 service methods (getLatestPosts, getCategoryPosts, getAllPosts, searchPosts)
2. **`fetchAndValidateSinglePost()`** - Unified fetch, error handling, and validation helper for single post
    - Merged duplicate error handling and validation patterns from 2 service methods
    - Accepts `FetchAndValidateSinglePostOptions` interface for configuration
    - Supports identifier for logging (string or number)
    - Applied to 2 service methods (getPostBySlug, getPostById)

2. **`getEntityMap<T>()`** - Generic entity map helper
   - Merged duplicate `getCategoriesMap` and `getTagsMap` functions
   - Accepts `EntityMapOptions<T>` interface for configuration
   - Works with any entity type that has an `id: number` property
   - Applied to 2 service methods (getCategoriesMap, getTagsMap)

**API Layer Helpers** (`src/lib/api/standardized.ts`):
1. **`getAllEntities<T>()`** - Generic all entities helper
    - Merged duplicate `getAllCategories` and `getAllTags` functions
    - Accepts entities array and endpoint string
    - Handles pagination metadata creation (page: 1, perPage: entities.length, total: entities.length, totalPages: 1)
    - Applied to 2 API methods (getAllCategories, getAllTags)

**Data Validation Helpers** (`src/lib/validation/dataValidator.ts`):
1. **`validateIdField()`** - Validates ID fields (positive integer)
     - Used by all entity validation methods
     - Eliminates duplicate ID validation logic
2. **`validateNamedObjectField()`** - Validates nested object fields with rendered property
     - Used by Post, Media validation for title fields
     - Eliminates duplicate nested object validation
3. **`validateSlugField()`** - Validates slug fields (pattern + length)
     - Used by Post, Category, Tag, Author validation
     - Accepts validation rules for pattern and length
4. **`validateDateField()`** - Validates ISO 8601 date fields
     - Used by Post validation for date and modified fields
     - Centralizes date validation logic
5. **`validateUrlField()`** - Validates URL fields
     - Used by Category, Tag, Media, Author validation
     - Centralizes URL validation logic
6. **`validateEnumField()`** - Validates enum fields
     - Used by Post (status, type) and Media (media_type) validation
     - Centralizes enum validation logic
7. **`validateNumericField()`** - Validates numeric fields with custom validator
     - Used for Category (parent, count) numeric validation
     - Accepts custom validator for flexible numeric validation

**Relationship Validation Helpers** (`src/lib/validation/relationshipValidator.ts`):
1. **`validatePostRelationships()`** - Validates post entity references
     - Validates category, tag, and author references against available maps
     - Detects invalid reference IDs with clear error messages
     - Supports optional validation (can skip specific relationship types)
     - Used by `enrichPostWithDetails()` for automatic validation
2. **`validatePostsRelationships()`** - Validates post array relationships
     - Validates relationships for multiple posts simultaneously
     - Includes array index in error messages for easy debugging
     - Non-blocking validation (logs warnings but continues)

**Error Handling Helpers** (`src/lib/api/errors.ts`):
1. **`handleStatusCodeError()`** - Status code error handling helper
    - Merged duplicate status code handling from AxiosError and generic Error blocks
    - Handles rate limit (429), server errors (5xx), and client errors (4xx)
    - Supports retry-after header for rate limit errors
    - Applied to 2 code paths in `createApiError` function
    - Single source of truth for status code error logic

**Code Quality Improvements**:
- **Before**: 252 lines with 40 duplicate lines across 5 API methods; 46 duplicate lines across 2 service functions; 36 duplicate lines across 2 API getAllX functions; 38 duplicate lines in `createApiError`
- **After**: 213 lines (API layer) + 229 lines (service layer) + 207 lines (standardized API) + 187 lines (errors) + 104 lines (relationship validation) with reusable helpers
- **Lines Eliminated**: 40 lines (API layer response.ts) + 23 lines (service layer) + 14 lines (standardized API) + 20 lines (fetchAndValidate merge) + 38 lines (errors) = 135 lines total (28% reduction)
- **DRY Principle Applied**: Error handling and pagination logic defined once
- **Single Responsibility**: Each helper has one clear purpose
- **Consistency**: All methods use identical patterns
- **Maintainability**: Changes to error handling or pagination only require updating one function

**DATA-ARCH-009: Data Relationship Validation**:
- Created `RelationshipValidator` class with 104 lines
- Added `validatePostRelationships()` and `validatePostsRelationships()` methods
- Added 21 comprehensive tests for all relationship scenarios
- Integrated into `enrichPostWithDetails()` for automatic validation
- Test coverage improved: 215 → 236 data-related tests (+10% increase)
- Lines eliminated: N/A (new validation capability, no duplication removed)

**REFACTOR-011: fetchAndValidate Merge**:
- Merged `fetchAndValidate` and `fetchAndValidateSingle` into single generic function
- Added configurable `logLevel` parameter with safer default (`'error'`)
- Applied to 4 service methods (getLatestPosts, getCategoryPosts, getAllPosts, getPostById)
- Lines eliminated: ~20

**REFACTOR-012: Entity Map Generic Function**:
- Created generic `getEntityMap<T>()` helper for category/tag map operations
- Merged duplicate `getCategoriesMap` and `getTagsMap` functions
- Configurable via `EntityMapOptions<T>` interface
- Lines eliminated: ~23

**REFACTOR-014: getAllX Generic Helper**:
- Created generic `getAllEntities<T>()` helper for all-entities operations
- Merged duplicate `getAllCategories` and `getAllTags` functions
- Handles pagination metadata automatically
- Lines eliminated: ~14

**REFACTOR-018: CacheManager Metrics Extraction**:
- Created `CacheMetricsCalculator` class (src/lib/cache/cacheMetricsCalculator.ts, 139 lines)
- Extracted metrics methods: calculateStatistics, calculateAverageTtl, calculateEfficiencyLevel, calculatePerformanceMetrics, calculateMemoryUsage, formatMetricsForDisplay
- Updated CacheManager to delegate metrics calls to CacheMetricsCalculator
- Exported CacheEntry and CacheTelemetry interfaces from cache.ts for external use
- Lines eliminated: ~43 (CacheManager reduced from 925 to 882 lines)
- Clear separation of concerns: CacheMetricsCalculator handles metrics, CacheManager handles storage

**REFACTOR-028: CacheManager Cleanup Extraction**:
- Created `CacheCleanup` class (src/lib/cache/cacheCleanup.ts, 90 lines)
- Extracted cleanup methods: cleanup(), cleanupOrphanDependencies(), cleanupAll()
- Added `cleanupAll()` method for optimized single-pass combined cleanup (O(n) vs O(2n))
- Updated CacheManager to delegate cleanup operations to CacheCleanup
- Exported CacheCleanup class and CleanupResult type for external use
- Lines eliminated: 32 (CacheManager reduced from 916 to 884 lines)
- Added 325 comprehensive tests for cleanup operations (18 tests)
- Clear separation of concerns: CacheCleanup handles maintenance, CacheManager handles storage
- Performance improvement: Combined cleanup in single iteration

**REFACTOR-024: Extract Duplicate Validation Logic**:
- Created 7 helper methods in DataValidator class for common validation patterns
- Refactored 5 validation methods (validatePost, validateCategory, validateTag, validateMedia, validateAuthor)
- Lines eliminated: ~165 (49% reduction in validation methods)
- Total file: 472 → 421 lines (51 lines eliminated, 11% reduction)
- All 45 dataValidator tests passing (no behavioral changes)

**REFACTOR-017: Fix Revalidate Exports to Use Constants**:
- Replaced inline revalidate values with REVALIDATE_TIMES constants in all page files
- Affected files: src/app/page.tsx, src/app/berita/page.tsx, src/app/berita/[slug]/page.tsx, src/app/cari/page.tsx
- Changed from: `export const revalidate = 300 // REVALIDATE_TIMES.HOMEPAGE (5 minutes)`
- Changed to: `export const revalidate = REVALIDATE_TIMES.HOMEPAGE`
- Removed redundant comments (constants are self-documenting)
- All 1617 tests passing (no regressions)
- Single source of truth for revalidation times

**Benefits**:
1. **Reduced Maintenance**: Bug fixes or improvements to validation only need to be made once
2. **Consistency**: All validation logic defined once
3. **Type Safety**: Generic TypeScript types ensure compile-time type checking
4. **Testability**: Helper functions can be tested independently
5. **Code Clarity**: Smaller, focused methods are easier to understand
6. **Safer Defaults**: Service layer defaults to 'error' log level for better visibility
7. **Extensibility**: New entity types can reuse generic patterns
8. **Single Responsibility**: CacheMetricsCalculator focuses solely on metrics calculation

**REFACTOR-026: Extract Complex Retry Delay Logic**:
- Created `extractRetryAfterHeader()` helper (src/lib/api/retryStrategy.ts, lines 64-101)
- Created `calculateBackoffDelay()` helper (src/lib/api/retryStrategy.ts, lines 103-111)
- Simplified `getRetryDelay()` main method (src/lib/api/retryStrategy.ts, lines 113-120)
- Extracted Retry-After header parsing into dedicated method (38 lines)
- Extracted exponential backoff calculation into dedicated method (9 lines)
- Reduced main method from 37 lines to 8 lines
- Reduced cyclomatic complexity from 8+ to 2
- Reduced maximum nesting from 6 levels to 2-3 levels
- Bug fix: Added `Math.max(..., 0)` to prevent negative delays
- Test coverage: 1717 tests (1686 passed, 31 skipped, zero regressions)
- All tests passing: 1686 passed, 31 skipped (zero regressions)
- Lines added: +20 (38 + 9 + 8 = 55 lines total vs 37 lines before)
- File size: 142 → 162 lines

**Benefits**:
1. **Single Responsibility**: Each helper has one clear purpose
2. **Separation of Concerns**: Header parsing separate from backoff calculation
3. **Testability**: Each concern can be tested independently
4. **Readability**: Main method reads like a story ("try header, else backoff")
5. **DRY Principle**: No duplicate code between header parsing and backoff
6. **Maintainability**: Bug fixes or changes only require updating one helper
7. **Bug Fix**: Negative delays prevented with Math.max(..., 0)

**See Also**: [Task REFACTOR-026](./task.md#refactor-026)

**REFACTOR-027: Cache Key Factory Pattern**:
- Created `CacheKeyFactory` class (src/lib/cache.ts, lines 701-722)
- Added three static methods: `create()`, `createById()`, `createBySlug()`
- Enforced naming convention: `entity:param` format with colon separator
- Type-safe entity types using TypeScript literals
- Created new `cacheKeys` export using factory pattern (11 methods)
- Created new `cacheDependencies` export using `cacheKeys` internally
- Maintained backward compatibility with `CACHE_KEYS` and `CACHE_DEPENDENCIES` (aliased)
- Added `@deprecated` JSDoc tags to legacy exports for migration guidance
- Added 18 comprehensive tests covering all factory methods and backward compatibility
- Test coverage: 1694 → 1712 tests (+18 new tests)
- All tests passing: 1681 passed, 31 skipped (zero regressions)
- Lines eliminated: N/A (new factory implementation, backward compatibility maintained)
- Lines added: ~150 lines (factory class + tests)

**Benefits**:
1. **Type Safety**: Entity types validated at compile time (not runtime)
2. **DRY Principle**: Key format logic defined once in CacheKeyFactory
3. **Open/Closed**: Can add new entity types without modifying existing code
4. **Backward Compatibility**: Existing code continues to work, gradual migration path
5. **Maintainability**: Single source of truth for cache key format
6. **Extensibility**: New entity types added by extending factory type literal
7. **Code Organization**: Factory pattern separates concerns cleanly
8. **Testability**: Factory pattern easily testable (18 new tests)

**ARCH-UNUSED-001: Remove Unused Author Fetching**:
- Removed `getAuthorsMap()` function from `enhancedPostService.ts` (19 lines eliminated)
- Removed `WordPressAuthor` type import (no longer used in service layer)
- Removed call to `getAuthorsMap()` from `enrichPostWithDetails()`
- Eliminated 5 unnecessary API calls per post detail page
- Author data was fetched but never returned in `PostWithDetails` interface
- Performance improvement: Post detail pages no longer fetch unused author data
- Test coverage: All 1716 tests passing (no regressions)
- Lines eliminated: 19
- File size: 304 → 285 lines (5.9% reduction)

**Benefits**:
1. **Performance**: Eliminates 5 unnecessary API calls per post detail page
2. **Code Clarity**: Only fetches data that's actually used
3. **Maintainability**: Less code to maintain, simpler data flow
4. **Single Responsibility**: Service layer doesn't fetch unused data
5. **Simplicity**: Removed complexity without affecting functionality

**REFACTOR-029: Component Memoization Pattern Consolidation**:
- Created `memoization.ts` utility (src/lib/utils/memoization.ts, 25 lines)
- Added `createArePropsEqual<P>()` factory for shallow prop comparison
- Added `createDeepPropsEqual<P>()` factory for deep prop comparison
- Refactored 5 components (Button, Badge, Breadcrumb, PostCard, EmptyState) to use utility
- Eliminated 5 duplicate `arePropsEqual` functions
- Added comprehensive tests (18 tests covering all edge cases)
- Test coverage: 1759 tests passing (23 skipped)
- Component lines: 325 → 320 (-5 lines, 1.5% reduction)
- Total: +25 lines (utility) + 18 tests - 5 component lines = +38 lines net

**Benefits**:
1. **DRY Principle**: Memoization logic defined once in reusable utility
2. **Type Safety**: Prop keys validated at compile time with TypeScript
3. **Maintainability**: Single source of truth for memoization pattern
4. **Extensibility**: Can add new comparison strategies (deep, shallow, custom)
5. **Testability**: Factory logic tested once, not per component
6. **Code Clarity**: Smaller, focused component files

**See Also**: [Task REFACTOR-010](./task.md#refactor-010), [Task REFACTOR-011](./task.md#refactor-011), [Task REFACTOR-012](./task.md#refactor-012), [Task REFACTOR-014](./task.md#refactor-014), [Task REFACTOR-018](./task.md#refactor-018), [Task ARCH-ERROR-002](./task.md#arch-error-002), [Task REFACTOR-026](./task.md#refactor-026), [Task REFACTOR-027](./task.md#refactor-027), [Task ARCH-UNUSED-001](./task.md#arch-unused-001), [Task REFACTOR-028](./task.md#refactor-028), [Task REFACTOR-029](./task.md#refactor-029), [Task REFACTOR-030](./task.md#refactor-030)

**REFACTOR-030: WordPress API Method Factory**:
- Created `wpMethodFactory.ts` (src/lib/api/wpMethodFactory.ts, 111 lines)
- Added 5 factory methods: createCollectionMethod, createItemMethod, createIdMethod, createPostsMethod, createPostsWithHeadersMethod
- Refactored 9 WordPress API methods to use factory patterns
- Eliminated 15 duplicate async arrow functions from wordpress.ts
- Fixed N+1 query in search function (sequential API calls → batch API call with include parameter)
- Performance improvement: 82% API call reduction for 10 search results
- Added comprehensive tests (17 tests covering all factory methods and edge cases)
- wordpress.ts: 247 → 167 lines (-80 lines, 32% reduction)
- Test coverage: 1821 tests passing (23 skipped)
- All tests passing, ESLint and TypeScript compilation pass with 0 errors

**Benefits**:
1. **DRY Principle**: Common API method pattern defined once in factory
2. **Consistency**: All API methods follow same structure and patterns
3. **Type Safety**: Factory methods enforce consistent types with generics
4. **Maintainability**: Single source of truth for API method patterns
5. **Testability**: Factory logic tested once, not per method
6. **Performance**: N+1 query fix eliminates sequential API calls in search
7. **Code Clarity**: Smaller, focused wordpress.ts file with less duplication

**See Also**: [Task REFACTOR-010](./task.md#refactor-010), [Task REFACTOR-011](./task.md#refactor-011), [Task REFACTOR-012](./task.md#refactor-012), [Task REFACTOR-014](./task.md#refactor-014), [Task REFACTOR-018](./task.md#refactor-018), [Task ARCH-ERROR-002](./task.md#arch-error-002), [Task REFACTOR-026](./task.md#refactor-026), [Task REFACTOR-027](./task.md#refactor-027), [Task ARCH-UNUSED-001](./task.md#arch-unused-001), [Task REFACTOR-028](./task.md#refactor-028), [Task REFACTOR-029](./task.md#refactor-029), [Task REFACTOR-030](./task.md#refactor-030), [Task REFACTOR-031](./task.md#refactor-031), [Task REFACTOR-032](./task.md#refactor-032)

**REFACTOR-032: CacheManager Dependency Extraction**:
- Created `CacheDependencyManager` class (src/lib/cache/cacheDependencyManager.ts, 167 lines)
- Created `CacheConfig` module (src/lib/cache/cacheConfig.ts, 108 lines)
- Extracted dependency tracking logic from CacheManager (registerDependencies, invalidate, getDependencies)
- Extracted CACHE_TTL constants into separate configuration module
- Refactored CacheManager to delegate dependency operations to CacheDependencyManager
- Updated cache.ts to export CACHE_CONFIG from cacheConfig module
- All dependency management logic now centralized in CacheDependencyManager
- Cache configuration centralized in CacheConfig module

**Implementation Details**:

**CacheDependencyManager** (167 lines):
- `registerDependencies(key, dependencies, stats)` - Register bi-directional dependency relationships
- `invalidate(key, onDelete, stats)` - Cascade invalidation with recursive dependent deletion
- `getDependencies(key)` - Query dependencies and dependents for a key

**CacheConfig** (108 lines):
- `CACHE_CONFIG` object with all TTL constants (POSTS, POST, CATEGORIES, TAGS, MEDIA, SEARCH, AUTHOR)
- Legacy `CACHE_TTL` export for backward compatibility
- Comprehensive documentation for each TTL value

**CacheManager Refactoring**:
- Added `CacheDependencyManager` instance
- Updated `set()` to delegate dependency registration to `CacheDependencyManager`
- Updated `invalidate()` to delegate cascade invalidation to `CacheDependencyManager`
- Updated `getDependencies()` to delegate dependency queries to `CacheDependencyManager`
- Removed duplicate dependency management code from CacheManager
- Updated imports and exports to use extracted modules

**Code Metrics**:

| Metric | Before | After | Improvement |
|--------|---------|-------|-------------|
| **cache.ts** | 874 lines | 817 lines | -57 lines (6.5% reduction) |
| **CacheDependencyManager** | N/A | 167 lines | +167 lines (new module) |
| **CacheConfig** | N/A | 108 lines | +108 lines (new module) |
| **Total** | 874 lines | 1092 lines (817 + 167 + 108) | Net: +218 lines (modular architecture) |

**Test Results**:
- cache.test.ts: 69 tests passing (all dependency tracking tests pass)
- cacheMetricsCalculator.test.ts: 18 tests passing
- cacheCleanup.test.ts: 18 tests passing
- Total cache tests: 105 tests passing (0 failures, 0 regressions)
- Lint: 0 errors, 0 warnings
- TypeScript: 0 errors

**Benefits**:
1. **Single Responsibility**: CacheManager focuses on core cache operations (get, set, delete)
2. **Separation of Concerns**: Dependency tracking isolated in CacheDependencyManager
3. **Configuration Management**: Cache TTL values centralized in CacheConfig module
4. **Maintainability**: Changes to dependency logic only require updating CacheDependencyManager
5. **Testability**: CacheDependencyManager can be tested independently
6. **Open/Closed**: Can extend dependency management without modifying CacheManager
7. **Code Clarity**: Each module has a single, clear purpose
8. **Modularity**: Dependencies and configuration can be reused or replaced independently

**Anti-Patterns Avoided**:
- ❌ No god class (CacheManager reduced from 874 to 817 lines)
- ❌ No duplicate code (dependency logic defined once in CacheDependencyManager)
- ❌ No mixed concerns (cache operations, dependency tracking, and configuration separated)
- ❌ No tight coupling (CacheManager delegates to CacheDependencyManager)
- ❌ No breaking changes (backward compatible exports maintained)

**Architectural Principles Applied**:
1. **Single Responsibility Principle**: Each module has one clear responsibility
2. **Open/Closed Principle**: CacheDependencyManager can be extended without modifying CacheManager
3. **Dependency Inversion**: CacheManager depends on CacheDependencyManager abstraction
4. **DRY Principle**: Dependency management logic defined once
5. **Separation of Concerns**: Cache operations, dependency tracking, and configuration separated
6. **Modularity**: Independent modules that can be tested and maintained separately

**See Also**: [Task REFACTOR-032](./task.md#refactor-032)

## Integration Resilience Patterns

**Last Updated**: 2026-01-10 (Senior Integration Engineer)

**Integration Status**: ✅ Production-ready, all resilience patterns verified and tested

**Audit Summary**:
- ✅ All resilience patterns implemented and production-ready
- ✅ Circuit breaker, retry strategy, rate limiting, health check operational
- ✅ Comprehensive integration test coverage (21 tests)
- ✅ All 844 tests passing
- ✅ Configuration reviewed and validated for production

### Circuit Breaker
- **Purpose**: Prevent cascading failures by stopping calls to failing services
- **Configuration**:
  - Failure Threshold: 5 failures before opening circuit
  - Recovery Timeout: 60 seconds before attempting recovery
  - Success Threshold: 2 successful requests to close circuit
- **States**: CLOSED (normal), OPEN (blocking), HALF_OPEN (testing)
- **Implementation**: `src/lib/api/circuitBreaker.ts`
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001

### Retry Strategy
- **Purpose**: Automatically retry failed requests with exponential backoff
- **Configuration**:
  - Max Retries: 3 attempts
  - Initial Delay: 1000ms
  - Max Delay: 30000ms
  - Backoff Multiplier: 2x per retry
  - Jitter: Enabled to prevent thundering herd
- **Retry Conditions**:
  - Rate limit errors (429) - respects Retry-After header
  - Server errors (500-599)
  - Network errors (max 1 retry)
  - Timeout errors (max 1 retry)
- **Implementation**: `src/lib/api/retryStrategy.ts`
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001

### Error Handling
- **Error Types**:
  - `NETWORK_ERROR` - Connection issues
  - `TIMEOUT_ERROR` - Request timeouts
  - `RATE_LIMIT_ERROR` - Rate limiting (429)
  - `SERVER_ERROR` - Server-side errors (5xx)
  - `CLIENT_ERROR` - Client-side errors (4xx)
  - `CIRCUIT_BREAKER_OPEN` - Circuit is blocking requests
  - `UNKNOWN_ERROR` - Unhandled errors
- **Standardized Format**:
  ```typescript
  {
    type: ApiErrorType,
    message: string,
    statusCode?: number,
    retryable: boolean,
    timestamp: string,
    endpoint?: string
  }
  ```
- **Implementation**: `src/lib/api/errors.ts`
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001

### Request Cancellation
- **Purpose**: Cancel stale requests to prevent unnecessary processing
- **Implementation**: AbortController integration in API client
- **Usage**: All API methods accept optional `signal` parameter
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001

### Health Check
- **Purpose**: Monitor WordPress API availability and verify service health
- **Features**:
  - Simple health check to verify API responsiveness
  - Timeout support to prevent hanging requests
  - Automatic retry with configurable attempts and delays
  - Last check result storage for quick access
  - Integration with circuit breaker for smart recovery
- **HealthCheckResult Interface**:
  ```typescript
  {
    healthy: boolean,        // API health status
    timestamp: string,          // ISO 8601 timestamp
    latency: number,            // Response time in milliseconds
    message: string,            // Status message
    version?: string,           // WordPress API version (if available)
    error?: string              // Error details (if unhealthy)
  }
  ```
- **Implementation**: `src/lib/api/healthCheck.ts`
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001
- **Circuit Breaker Integration**:
  - When circuit breaker is in HALF_OPEN state, health check is performed before each request
  - If health check passes → Request proceeds, circuit may close
  - If health check fails → Request blocked with helpful error message
  - Prevents unnecessary API calls to recovering service
- **Usage Examples**:
  ```typescript
  // Basic health check
  const result = await checkApiHealth();
  if (result.healthy) {
    console.log(`API is healthy (${result.latency}ms)`);
  }

  // Health check with timeout
  const result = await checkApiHealthWithTimeout(5000);

  // Health check with retry
  const result = await checkApiHealthRetry(3, 1000);

  // Get last check result
  const lastCheck = getLastHealthCheck();
  ```

### Telemetry and Observability
- **Purpose**: Centralized metrics collection for monitoring resilience patterns
- **Implementation**: `src/lib/api/telemetry.ts`
- **Status**: ✅ Production-ready, added for INT-001 through INT-005
- **Telemetry System Architecture**:
  - In-memory event buffer (max 1000 events)
  - Auto-flush every 60 seconds
  - Event callback support for APM integration (DataDog, New Relic, Prometheus)
  - Event filtering by type and category
  - Statistics aggregation
- **Event Categories**:
  - **Circuit Breaker**: State changes, failures, successes, blocked requests
  - **Retry**: Retry attempts, retry successes, retry exhaustions
  - **Rate Limit**: Rate limit exceeded events, reset events
  - **Health Check**: Healthy and unhealthy health checks
  - **API Request**: Request completions with duration, cache hit/miss, error types
- **Telemetry Event Structure**:
  ```typescript
  interface TelemetryEvent {
    timestamp: string,      // ISO 8601 timestamp
    type: string,         // Event type (e.g., 'state-change', 'retry')
    category: 'circuit-breaker' | 'retry' | 'rate-limit' | 'health-check' | 'api-request',
    data: Record<string, unknown>  // Event-specific data
  }
  ```
- **Configuration**:
  ```typescript
  const telemetryCollector = new TelemetryCollector({
    enabled: true,        // Enable/disable via TELEMETRY_ENABLED env var
    maxEvents: 1000,     // Max events before auto-flush
    flushInterval: 60000, // Auto-flush interval (60 seconds)
    onEvent: (event) => {  // Custom event callback
      // Send to APM (DataDog, New Relic, etc.)
    }
  })
  ```
- **Health Check API Endpoints**:
  - **GET /api/health** - WordPress API health check (load balancer probes)
  - **GET /api/health/readiness** - Application readiness check (Kubernetes probes)
- **Observability Endpoint**:
  - **GET /api/observability/metrics** - Export all resilience pattern metrics
- **API Responses**:
  - **Health Check (200)**:
    ```json
    {
      "status": "healthy",
      "timestamp": "2026-01-10T10:00:00Z",
      "latency": 123,
      "version": "v2",
      "uptime": 3600
    }
    ```
  - **Metrics Endpoint**:
    ```json
    {
      "summary": {
        "totalEvents": 1234,
        "eventTypes": 5,
        "timestamp": "2026-01-10T10:00:00Z",
        "uptime": 3600
      },
      "circuitBreaker": {
        "stateChanges": 5,
        "failures": 23,
        "successes": 1567,
        "requestsBlocked": 12,
        "totalEvents": 1607
      },
      "retry": {
        "retries": 45,
        "retrySuccesses": 38,
        "retryExhausted": 7,
        "totalEvents": 90
      },
      "rateLimit": {
        "exceeded": 3,
        "resets": 0,
        "totalEvents": 3
      },
      "healthCheck": {
        "healthy": 120,
        "unhealthy": 5,
        "totalEvents": 125
      },
      "apiRequest": {
        "totalRequests": 1600,
        "successful": 1590,
        "failed": 10,
        "averageDuration": 125,
        "cacheHits": 1200,
        "cacheMisses": 400,
        "totalEvents": 1600
      }
    }
    ```
- **Kubernetes Probes**:
  ```yaml
  # Liveness probe
  livenessProbe:
    httpGet:
      path: /api/health
      port: 3000
    initialDelaySeconds: 30
    periodSeconds: 10

  # Readiness probe
  readinessProbe:
    httpGet:
      path: /api/health/readiness
      port: 3000
    initialDelaySeconds: 10
    periodSeconds: 5
  ```
- **Key Metrics to Monitor**:
  - **Circuit Breaker**: State (should be CLOSED), failure rate, blocked requests
  - **Retry**: Retry rate (< 20%), retry success rate (> 80%), exhaustions (< 5%)
  - **Rate Limit**: Rate limit hits, reset events
  - **Health Check**: Healthy/unhealthy ratio, consecutive failures
  - **API Request**: Response time (< 500ms), error rate (< 5%), cache hit rate (> 70%)
- **Alerting Rules**:
  - **CRITICAL**: Circuit breaker OPEN, Health check failed (3+ times), High retry exhaustion rate (> 5%)
  - **WARNING**: High circuit failure rate (> 10/min), High retry rate (> 20%), High response time (> 500ms), High error rate (> 5%)
  - **INFO**: Rate limit exceeded, Low cache hit rate (< 50%)
- **External APM Integration**:
  - Support for DataDog, New Relic, Prometheus, custom APM solutions
  - Event callback mechanism for real-time metric export
  - See [Monitoring Guide](./MONITORING.md) for integration examples
- **Documentation**: [Monitoring Guide](./MONITORING.md)
- **Tests**: 48 tests (28 telemetry tests + 20 API endpoint tests)

### Rate Limiting
- **Purpose**: Protect API from overload by limiting request rate
- **Configuration**:
  - Max Requests: 60 requests per window (WordPress API)
  - Window: 60000ms (1 minute)
  - Algorithm: Token bucket with sliding window
- **Features**:
  - Per-key limiting (supports multiple rate limiters)
  - Automatic window expiration
  - Graceful degradation with helpful error messages
  - Rate limit info (remaining requests, reset time)
- **Implementation**: `src/lib/api/rateLimiter.ts`
- **Status**: ✅ Production-ready, verified by INT-AUDIT-001

### API Route Rate Limiting
- **Purpose**: Protect API routes from DoS attacks
- **Configuration**:
  - Health endpoints: 300 requests/minute (5/sec)
  - Readiness endpoint: 300 requests/minute (5/sec)
  - Metrics endpoint: 60 requests/minute (1/sec)
  - Cache endpoints: 10 requests/minute (0.16/sec)
  - CSP Report endpoint: 30 requests/minute (0.5/sec)
- **Features**:
  - In-memory rate limiting per endpoint
  - Standard rate limit headers in responses
  - Graceful degradation with retry info
  - Separate limits per endpoint type
- **Implementation**: `src/lib/api/rateLimitMiddleware.ts`
- **Rate Limit Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Unix timestamp of window reset
  - `X-RateLimit-Reset-After`: Seconds until window resets
  - `Retry-After`: Seconds to wait before retry (429 responses)
- **Status**: ✅ Production-ready, added in INT-001

### Integration Audit (INT-AUDIT-001)

**Status**: ✅ Complete - Production-Ready
**Last Updated**: 2026-01-11 (Senior Integration Engineer)

**Audit Summary**:
- ✅ All resilience patterns implemented and production-ready
- ✅ Circuit breaker, retry strategy, rate limiting, health check operational
- ✅ Comprehensive integration test coverage (21 tests)
- ✅ All 1683 tests passing (1652 passed, 31 skipped)
- ✅ Complete documentation (api-specs.md, API_STANDARDIZATION.md, MONITORING.md, INTEGRATION_TESTING.md)
- ✅ Configuration reviewed and validated for production

**Audit Findings**:

1. **Integration Hardening**: ✅ Production-ready
   - Circuit breaker: Failure threshold 5, recovery 60s, success threshold 2
   - Retry strategy: Max 3 retries, exponential backoff with jitter
   - Rate limiting: 60 req/min with token bucket algorithm
   - Health check: API health verification with retry support
   - Request cancellation: AbortController integration

2. **API Standardization**: ✅ Complete
   - 31 standardized methods in `src/lib/api/standardized.ts`
   - Consistent naming: getById, getBySlug, getAll, search
   - Consistent response format: ApiResult<T>, ApiListResult<T>
   - Service layer migrated to use standardized API

3. **Error Response**: ✅ Standardized
   - 7 error types with consistent format
   - Retry flags for all error types
   - Metadata: timestamp, endpoint, cacheHit, retryCount
   - Helper functions: isRetryableError, shouldTriggerCircuitBreaker

4. **API Documentation**: ✅ Complete
   - OpenAPI 3.0 specifications (582 lines)
   - API Standardization Guidelines (721 lines)
   - Monitoring Guide (566 lines)
   - Integration Testing Guide (402 lines)

5. **Rate Limiting**: ✅ Production-ready
   - API rate limiting (60 req/min)
   - API route rate limiting (tiered limits by endpoint)
   - Rate limit headers in responses

**Gaps Identified**: None (all patterns production-ready)

**Potential Future Enhancements** (Non-Critical):
- Distributed tracing for request correlation
- Performance testing for high-traffic scenarios
- Chaos engineering for resilience validation
- Real-time APM integration (documented but not implemented)

**See Also**: [Task INT-AUDIT-001](./task.md#int-audit-001)

### OpenAPI Specification

**Last Updated**: 2026-01-11 (Senior Integration Engineer)

**Purpose**: Provide machine-readable API specification for automatic documentation generation and client code generation.

**Implementation**:
- File: `docs/openapi.yaml`
- Format: OpenAPI 3.0.3
- Endpoints documented:
  - Health check: GET /health, GET /health/readiness
  - Observability: GET /observability/metrics
  - Cache: GET /cache/stats, POST /cache/warm, POST /cache/clear
  - Security: POST /csp-report

**Usage**:
```bash
# Generate Swagger UI
docker run -p 8080:8080 -e SWAGGER_JSON=/openapi.yaml -v $(pwd):/usr/share/nginx swaggerapi/swagger-ui

# Generate API client (openapi-generator-cli)
openapi-generator-cli generate -i openapi.yaml -g typescript-axios -o ./generated-client

# Validate OpenAPI spec
npm install -g @apidevtools/swagger-cli
swagger-cli validate openapi.yaml
```

**Features**:
- Complete request/response schemas
- Rate limit annotations
- Tag organization (Health, Observability, Cache, Security)
- Examples for all endpoints
- Component schemas for reusability

**Status**: ✅ Complete - Production-ready

## Security Standards

1. **XSS Protection**: DOMPurify on all user-generated content with centralized `sanitizeHTML()` utility
2. **CSP**: Nonce-based Content Security Policy headers configured in proxy.ts
   - Development: Allows `'unsafe-inline'` and `'unsafe-eval'` for hot reload
   - Production: Removes `'unsafe-inline'` and `'unsafe-eval'` for maximum security
   - Report-uri endpoint for violation monitoring in development
3. **Rate Limiting**: API rate limiting (60 requests/minute with sliding window token bucket algorithm)
4. **Authentication**: JWT or session-based (if needed)
5. **Input Validation**: TypeScript + runtime validation with dataValidator.ts at API boundaries
6. **Security Headers**:
   - Strict-Transport-Security (HSTS): max-age=31536000; includeSubDomains; preload
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), etc.
7. **Dependency Security**: Regular npm audits, keep all dependencies up to date
8. **Secrets Management**: Never commit secrets, use .env.example for placeholder values

### Security Configuration Details

**Content Security Policy (CSP)**:
- Configuration location: `src/proxy.ts`
- Implementation: Nonce-based CSP generated per request
- Script sources: Self, nonce, WordPress domains (mitrabantennews.com, www.mitrabantennews.com)
- Style sources: Self, nonce, WordPress domains
- Object sources: none
- Frame ancestors: none
- Report endpoint: `/api/csp-report` (development only)

**XSS Protection**:
- Configuration location: `src/lib/utils/sanitizeHTML.ts`
- Implementation: DOMPurify with strict security policies
- Config modes: 'excerpt' (minimal tags) and 'full' (rich content)
- Forbidden tags: script, style, iframe, object, embed
- Forbidden attributes: onclick, onload, onerror, onmouseover

**Input Validation**:
- Configuration location: `src/lib/validation/dataValidator.ts`
- Implementation: Runtime validation at API boundaries
- Validated resources: Posts, Categories, Tags, Media, Authors
- Type guards: `isValidationResultValid<T>()`, `unwrapValidationResult<T>()`, `unwrapValidationResultSafe<T>()`
- Graceful degradation with fallback data on validation failures

**Rate Limiting**:
- Configuration location: `src/lib/api/rateLimiter.ts`
- Implementation: Token bucket algorithm with sliding window
- Max requests: 60 per minute
- Window size: 60000ms (1 minute)
- Per-key limiting supported
- Automatic window expiration

### Security Audit Checklist

- [x] No hardcoded secrets in source code
- [x] .env.example contains only placeholder values (no shell commands)
- [x] npm audit shows 0 vulnerabilities
- [x] All dependencies up to date
- [x] CSP headers configured with nonce support
- [x] No 'unsafe-inline' or 'unsafe-eval' in production CSP
- [x] All security headers present and correct
- [x] XSS protection (DOMPurify) applied to all user content
- [x] Input validation at API boundaries
- [x] Rate limiting implemented for API endpoints
- [x] .gitignore properly configured to exclude .env files
- [x] Error messages don't expose sensitive data
- [x] Logs don't contain secrets or passwords

**Last Security Audit**: 2026-01-19 (Principal Security Engineer) - All 14 checks verified ✅ (SEC-004)

**Security Status**: ✅ SECURE - No critical issues found

**See Also**: [Task SEC-004: Security Audit](./task.md#sec-004)

## Performance Standards

1. **Bundle Size**: < 200KB initial JS
2. **Lighthouse**: > 90 performance score
3. **API Caching**: Implement response caching
4. **Image Optimization**: Next.js Image component
5. **Code Splitting**: Route-based splitting
6. **Performance Monitoring**: Core metrics collection and tracking

### Performance Metrics Collection

**Last Updated**: 2026-02-02 (Principal Software Architect - PERF-MON-001: Core Performance Metrics Collection Complete)

**Overview**: Comprehensive performance metrics collection system for monitoring application performance, API response times, resource utilization, and error rates.

**Implementation**: `src/lib/api/performanceMetrics.ts` and `src/app/api/observability/performance/route.ts`

**Key Features**:

1. **Web Vitals Metrics** (Client-Side):
   - **FCP (First Contentful Paint)**: Time to first content render
   - **LCP (Largest Contentful Paint)**: Time to largest content element render
   - **CLS (Cumulative Layout Shift)**: Layout stability metric
   - **INP (Interaction to Next Paint)**: Interaction responsiveness
   - **TTFB (Time to First Byte)**: Server response latency

   **Rating Thresholds**:
   - **FCP**: Good (< 1.8s), Needs Improvement (1.8s - 3s), Poor (> 3s)
   - **LCP**: Good (< 2.5s), Needs Improvement (2.5s - 4s), Poor (> 4s)
   - **CLS**: Good (< 0.1), Needs Improvement (0.1 - 0.25), Poor (> 0.25)
   - **INP**: Good (< 200ms), Needs Improvement (200ms - 500ms), Poor (> 500ms)

2. **API Response Time Metrics**:
   - Tracks all API requests with duration, status code, cache hit status
   - Calculates percentiles: p50, p95, p99
   - Aggregates metrics by endpoint (method:endpoint)
   - Provides average, min, max response times

3. **Resource Utilization Metrics**:
   - **CPU Usage**: Percentage of CPU utilization
   - **Memory Usage**: MB usage and percentage of total memory
   - **Heap Usage**: Used MB, total MB, percentage for Node.js heap
   - Automatic resource monitoring with configurable intervals

4. **Error Rate Metrics**:
   - Tracks error rates by endpoint, method, and error type
   - Calculates error rate: errorCount / totalRequests
   - Automatic rate calculation when successes recorded
   - Supports tracking multiple error types per endpoint

**API Endpoints**:

- **GET /api/observability/performance** - Dedicated performance metrics endpoint
- **GET /api/observability/metrics** - Updated to include performance metrics

**Performance Metrics API Response**:
```json
{
  "summary": {
    "totalApiCalls": 1000,
    "totalErrorTypes": 5,
    "totalWebVitalEvents": 500,
    "timestamp": "2026-02-02T12:00:00Z",
    "uptime": 3600
  },
  "apiResponse": {
    "total": 1000,
    "p50": 150,
    "p95": 300,
    "p99": 500,
    "avg": 180,
    "min": 50,
    "max": 1000,
    "byEndpoint": {
      "GET:/api/posts": {
        "count": 500,
        "p50": 150,
        "p95": 300,
        "p99": 500,
        "avg": 180
      }
    }
  },
  "resourceUtilization": {
    "current": {
      "cpuUsagePercent": 45,
      "memoryUsageMB": 512,
      "memoryUsagePercent": 25,
      "heapUsedMB": 256,
      "heapTotalMB": 1024,
      "heapPercent": 25
    },
    "avgCpuUsage": 42,
    "avgMemoryUsage": 24,
    "avgHeapUsage": 23
  },
  "errorRates": [
    {
      "endpoint": "/api/posts",
      "method": "GET",
      "errorType": "NETWORK_ERROR",
      "count": 5,
      "totalRequests": 1000,
      "rate": 0.005
    }
  ],
  "webVitals": {
    "events": [...],
    "byMetricName": {
      "FCP": {
        "count": 100,
        "avg": 1200,
        "min": 800,
        "max": 2500
      }
    }
  }
}
```

**Client-Side Integration**:

The `useWebVitals` hook (`src/lib/utils/webVitals.ts`) automatically collects Web Vitals metrics:

```typescript
import { useWebVitals } from '@/lib/utils/webVitals'

function MyApp({ Component, pageProps }) {
  useWebVitals({
    reportToApi: true,
    apiEndpoint: '/api/observability/performance'
  })

  return <Component {...pageProps} />
}
```

**Server-Side Integration**:

For API response time tracking, use the `performanceMetricsCollector`:

```typescript
import { performanceMetricsCollector } from '@/lib/api/performanceMetrics'

const startTime = Date.now()
try {
  const response = await apiCall()
  performanceMetricsCollector.recordApiResponse({
    endpoint: '/api/posts',
    method: 'GET',
    duration: Date.now() - startTime,
    statusCode: response.status,
    cacheHit: false
  })
  performanceMetricsCollector.recordSuccess('/api/posts', 'GET')
} catch (error) {
  performanceMetricsCollector.recordApiResponse({
    endpoint: '/api/posts',
    method: 'GET',
    duration: Date.now() - startTime,
    statusCode: 500,
    cacheHit: false
  })
  performanceMetricsCollector.recordError('/api/posts', 'GET', 'NETWORK_ERROR')
}
```

**Resource Monitoring**:

Start automatic resource monitoring:

```typescript
import { startResourceMonitoring } from '@/lib/api/performanceMetrics'

// Monitor resources every 60 seconds (default)
startResourceMonitoring()

// Custom interval (30 seconds)
startResourceMonitoring(30000)
```

**Testing**:

- **Comprehensive Test Coverage**: 25 tests covering all performance metrics collection scenarios
- **Test File**: `__tests__/performanceMetrics.test.ts`
- **Test Coverage**:
  - Web Vitals recording and aggregation
  - API response time metrics with percentiles
  - Resource utilization metrics
  - Error rate tracking and calculation
  - Metric clearing and limits
  - Percentile calculation utilities

**Implementation Status**: ✅ Complete (PERF-MON-001)

**See Also**:
- [Task PERF-MON-001: Implement Core Performance Metrics Collection](./task.md#perf-mon-001)
- [Task PERF-MON-002: Integrate APM Provider](./task.md#perf-mon-002)
- [Integration Resilience Patterns](#integration-resilience-patterns)

## Data Architecture

### Data Models
- All data fetched from WordPress REST API
- TypeScript interfaces for type safety (compile-time)
- Runtime validation at API boundaries (dataValidator.ts)
- Enhanced data models with resolved relationships

### Data Validation
- **Runtime Validation**: `src/lib/validation/dataValidator.ts` validates all API responses
   - Posts, Categories, Tags, Media, Authors validated at boundaries
   - Type checking, required field verification, array validation
   - Graceful degradation with error logging
   - **Type Guards**: TypeScript type-safe validation helpers
     - `isValidationResultValid<T>()`: Type guard to narrow ValidationResult<T>
     - `unwrapValidationResult<T>()`: Extract data with error throwing
     - `unwrapValidationResultSafe<T>(): Extract data with fallback
- **Relationship Validation**: `src/lib/validation/relationshipValidator.ts` validates entity references
   - Validates post relationships (categories, tags, authors) against available data
   - Detects invalid reference IDs with clear error messages
   - Supports optional validation (can skip specific relationship types)
   - Non-blocking validation (logs warnings but continues execution)
   - Integrated into `enrichPostWithDetails()` for automatic validation
- **Compile-time Safety**: TypeScript provides static type checking
- **Fallback Data**: Invalid data triggers fallback mechanisms

### Data Fetching Strategies
- **Batch Operations**: Eliminates N+1 queries
  - `getMediaBatch()`: Fetch multiple media items in single request
  - `getMediaUrlsBatch()`: Batch URL resolution with caching
  - Reduces API calls by 80%+ for media assets
- **Parallel Fetching**: Independent API calls executed concurrently
- **Caching**: Three-tier caching strategy with advanced dependency tracking
   - In-memory cache (cacheManager) for frequent queries
   - **Dependency Tracking**: Bi-directional graph of cache relationships
   - **Cascade Invalidation**: Automatic invalidation of dependent caches
   - ISR for page-level caching
   - HTTP caching headers

**Cache Architecture Enhancements**:
- **Dependency-Aware Caching**: `cacheManager.set(key, data, ttl, dependencies)` supports explicit dependency tracking
- **Automatic Cascade Invalidation**: When a dependency is invalidated, all dependents are automatically cleared
- **Enhanced Telemetry**: Performance metrics, efficiency scoring, memory usage tracking
- **Smart Invalidation**: `invalidateByEntityType()` clears all caches for specific entity type
- **Orphan Cleanup**: Automatic removal of broken dependency references
- **Debug Tools**: `getDependencies()`, `getKeysByPattern()` for cache inspection

**Cache Dependencies**:
- Posts depend on: categories, tags, media
- Posts lists depend on: categories, tags
- Categories, tags, media, authors are leaf nodes (no dependencies)

**Cache Performance Metrics**:
- Hit rate tracking with efficiency scoring (high/medium/low)
- Cascade invalidation count and rate
- Dependency registration tracking
- Average TTL calculation
- Memory usage estimation (bytes/MB)

**Data Architecture Audit Status**: ✅ Verified (DATA-ARCH-008)
- All data architecture principles verified and properly implemented
- No critical issues found
- 236+ data-related tests passing (215 + 21 relationship validation)
- Production-ready data architecture

**See Also**: [Task DATA-ARCH-006: Cache Strategy Enhancement](./task.md#data-arch-006)
**See Also**: [Task DATA-ARCH-008: Data Architecture Audit](./task.md#data-arch-008)
**See Also**: [Task DATA-ARCH-009: Data Relationship Validation](./task.md#data-arch-009)
**See Also**: [Task ARCH-001: Layer Separation](./task.md#arch-001)
**See Also**: [API Specifications](./api-specs.md) - OpenAPI 3.0 specifications for API endpoints

### Service Layer Architecture

**Principle**: Clear separation of concerns with single responsibility per module.

**Layers**:
1. **API Layer** (`wordpress.ts`): WordPress API wrapper
   - Focuses solely on WordPress API operations
   - Handles GET requests to WordPress REST API endpoints
   - Provides batch operations (media batch, search)
   - **No cache management concerns** (extracted to cache.ts)
   - **Implements `IWordPressAPI` interface** for contract definition

2. **Service Layer** (`src/lib/services/`): Business logic abstraction
   - **postService.ts**: Basic service with fallback logic
   - **enhancedPostService.ts**: Enhanced service with:
     - Runtime data validation
     - Batch media fetching (N+1 query elimination)
     - Category/Tag resolution
     - **Dependency-aware caching** (automatic cascade invalidation)
     - Type-safe enriched data (PostWithMediaUrl, PostWithDetails)
     - **Implements `IPostService` interface** for contract definition
   - **cacheWarmer.ts**: Orchestration service for cache warming:
     - Decouples cache warming from API services
     - Removes circular dependency between wordpressAPI and enhancedPostService
     - Provides cache statistics (hits, misses, hit rate)
     - Parallel cache warming for optimal performance
     - Detailed results tracking (success/failure, latency per endpoint)

3. **Cache Layer** (`cache.ts`): Cache management with dependency tracking
   - In-memory cache with TTL and dependency-aware invalidation
   - Cache management operations (clear, stats, warm)
   - Single source of truth for cache operations
   - **Not coupled to API layer** (clean separation)

**Separation of Concerns** (ARCH-001):
- API layer: WordPress REST API calls only
- Service layer: Business logic, validation, enrichment
- Cache layer: Cache storage, invalidation, telemetry

### Interface Definitions (ARCH-INTERFACE-001)

**Principle**: Define contracts between modules for dependency inversion and improved testability.

**Interfaces Created**:
- `IWordPressAPI` (`src/lib/api/IWordPressAPI.ts`): WordPress API contract
  - Defines all WordPress API operations (posts, categories, tags, media, authors)
  - Includes optional `signal` parameter for request cancellation (AbortController)
  - Returns types include `null` for potentially missing resources (get*, getTag, getCategory, getMediaUrl)
- `IPostService` (`src/lib/services/IPostService.ts`): Post service contract
  - Defines post service operations (getLatest, getCategory, getAll, getPaginated, getBySlug, getById)
  - Includes enriched types (PostWithMediaUrl, PostWithDetails, PaginatedPostsResult)

**Benefits**:
1. **Dependency Inversion**: High-level modules depend on abstractions (interfaces), not low-level modules (API layer)
2. **Testability**: Easy to mock interfaces for unit testing
3. **Type Safety**: Explicit contracts documented in TypeScript interfaces
4. **Maintainability**: Clear boundaries between API and service layers
5. **Extensibility**: New implementations can be swapped without changing consumers

### Dependency Management (ARCH-DEP-001)

**Principle**: Apply Dependency Injection to break circular dependencies and improve modularity.

**Circular Dependency Cleanup**:
- **Before**: `client.ts` imported `checkApiHealth` from `healthCheck.ts`, which imported `apiClient` from `client.ts` (circular)
- **After**: `HealthChecker` accepts HTTP client via constructor parameter (Dependency Injection)
- **Implementation**:
  - `client.ts` creates `healthChecker` instance after `apiClient` is created
  - `client.ts` exports health check functions: `checkApiHealth()`, `checkApiHealthWithTimeout()`, `checkApiHealthRetry()`, `getLastHealthCheck()`
  - `healthCheck.ts` no longer imports `apiClient` directly, accepts `HttpClient` interface

**Dependency Injection Applied**:
```typescript
// HealthChecker accepts HTTP client via constructor (Dependency Injection)
export class HealthChecker {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }
}

// client.ts creates healthChecker with apiClient injected
const healthChecker = new HealthChecker(apiClient)
export async function checkApiHealth() {
  return healthChecker.check()
}
```

**Benefits**:
1. **Circular Dependency Eliminated**: Zero circular dependencies in codebase
2. **Testability**: Easy to mock HTTP client for health check tests
3. **Loose Coupling**: `healthCheck.ts` no longer depends on concrete `apiClient` implementation
4. **Flexibility**: Can inject different HTTP clients (for testing, mocking, or alternative implementations)
5. **SOLID Compliance**: Dependency Inversion Principle (DIP) applied

**Cache Module Cleanup**:
- **Removed**: `warmAll()` method from `cache.ts` that created circular dependency with `cacheWarmer.ts`
- **Result**: Cache manager now has single responsibility (cache storage only)
- **Orchestration**: Cache warming moved to `cacheWarmer.ts` as separate service

**See Also**: [Task ARCH-DEP-001: Dependency Cleanup](./task.md#arch-dep-001)
 
### Cache Fetch Utility (ARCH-CACHE-FETCH-001)

**Principle**: DRY (Don't Repeat Yourself) - eliminate duplicate cache management patterns across API layer.

**Problem**: Cache management logic was duplicated in API layer methods (`getMediaBatch`, `getMediaUrl`, `search`), violating DRY principle and mixing concerns.

**Solution**: Created generic `cacheFetch<T>()` utility function that provides consistent caching behavior:
- Check cache first
- Call fetch function on cache miss
- Set cache with result
- Handle errors gracefully
- Support optional TTL and dependencies
- Support optional data transformation

**Implementation** (`src/lib/utils/cacheFetch.ts`):
```typescript
interface CacheFetchOptions<T> {
  key: string;
  ttl: number;
  dependencies?: string[];
  transform?: (data: unknown) => T;
}

async function cacheFetch<T>(
  fetchFn: () => Promise<unknown>,
  options: CacheFetchOptions<T>
): Promise<T | null>
```

**Refactored Methods**:
- **search** method: Now uses `cacheFetch()` (15 lines → 12 lines)
- **getMediaUrl**: Kept original implementation (has special conditional caching logic)
- **getMediaBatch**: Kept original implementation (has partial cache fill logic)

**Benefits**:
1. **DRY Principle**: Caching pattern defined once, used in multiple places
2. **Single Responsibility**: API layer focuses on API calls, cacheFetch handles caching
3. **Consistency**: All cache operations use same pattern
4. **Maintainability**: Changes to caching logic only require updating cacheFetch
5. **Type Safety**: Generic types ensure compile-time type checking
6. **Testability**: cacheFetch has comprehensive test coverage (14 tests)
7. **Extensibility**: Easy to add new caching scenarios

**Tests Created** (`__tests__/cacheFetch.test.ts`):
- Cache hit scenario (2 tests)
- Cache miss scenario (4 tests)
- Error handling (3 tests)
- Edge cases (4 tests)
- Concurrent requests (1 test)

**See Also**: [Task ARCH-CACHE-FETCH-001: Cache Fetch Utility](./task.md#arch-cache-fetch-001)

### Cache Manager Interface Definition (ARCH-CACHE-INTERFACE-001)

**Principle**: Dependency Inversion - Define cache contract as abstraction to improve testability and flexibility.

**Problem**: Cache manager was a concrete class with no interface definition, creating tight coupling to implementation and making it difficult to mock for unit tests.

**Solution**: Created `ICacheManager` and `ICacheMetricsCalculator` interfaces to define cache contracts, and applied Dependency Injection to cache consumers.

**Implementation Details**:

1. **Created `ICacheManager` interface** (`src/lib/api/ICacheManager.ts`):
   - Defines all cache manager operations: `get()`, `set()`, `delete()`, `invalidate()`, `clearAll()`, `clearPattern()`, `getStats()`, `getPerformanceMetrics()`, `cleanup()`, `cleanupOrphanDependencies()`, `resetStats()`, `getMemoryUsage()`, `invalidateByEntityType()`, `getKeysByPattern()`, `getDependencies()`, `clear()`
   - Provides explicit contract for cache operations
   - Enables easy mocking for unit tests

2. **Created `ICacheMetricsCalculator` interface** (`src/lib/api/ICacheMetricsCalculator.ts`):
   - Defines all metrics calculation operations: `calculateStatistics()`, `calculateAverageTtl()`, `calculateEfficiencyLevel()`, `calculatePerformanceMetrics()`, `calculateMemoryUsage()`, `formatMetricsForDisplay()`
   - Enables testing of cache metrics without concrete implementation

3. **Updated `CacheManager` class** (`src/lib/cache.ts`):
   - Added `implements ICacheManager` to class declaration
   - Ensures all interface methods are implemented

4. **Updated `CacheMetricsCalculator` class** (`src/lib/cache/cacheMetricsCalculator.ts`):
   - Added `implements ICacheMetricsCalculator` to class declaration
   - Ensures all interface methods are implemented

5. **Applied Dependency Injection to `CacheWarmer`** (`src/lib/services/cacheWarmer.ts`):
   - Added constructor parameter: `constructor(cache: ICacheManager = cacheManager)`
   - Stores cache manager as private instance variable
   - Uses `this.cacheManager` for all cache operations
   - Allows tests to inject mock cache manager

6. **Added Optional Cache Injection to `EnhancedPostService`** (`src/lib/services/enhancedPostService.ts`):
   - Updated `getEntityMap()` function to accept optional `cacheManager` parameter
   - Provides default value from global `cacheManager` for backward compatibility
   - Allows tests to inject mock cache manager when needed

**Dependency Injection Applied**:

```typescript
// CacheWarmer accepts cache manager via constructor (Dependency Injection)
class CacheWarmer {
  private cacheManager: ICacheManager;

  constructor(cache: ICacheManager = cacheManager) {
    this.cacheManager = cache;
  }

  async warmCategories(): Promise<number> {
    const categories = await wordpressAPI.getCategories();
    this.cacheManager.set('categories', categories, CACHE_TTL.CATEGORIES);
    return Date.now() - startTime;
  }
}

// Default instance uses real cache manager
export const cacheWarmer = new CacheWarmer();
```

**Benefits**:

1. **Testability**: Easy to create mock cache manager for unit tests
2. **Loose Coupling**: Services depend on `ICacheManager` abstraction, not concrete implementation
3. **Flexibility**: Can swap cache implementations (e.g., Redis, Memcached) without changing consumers
4. **Type Safety**: Explicit contract ensures all cache operations are available
5. **SOLID Compliance**: Dependency Inversion Principle (DIP) applied
6. **Consistency**: Aligns with existing interface pattern (IWordPressAPI, IPostService)
7. **Backward Compatibility**: Default parameters maintain existing behavior

**Test Results**:
- 1616 tests passing (no regressions)
- 48 test suites passing
- 1 test suite skipped (WORDPRESS_API_AVAILABLE)
- ESLint passes with no errors
- TypeScript compilation passes

**See Also**: [Task ARCH-CACHE-INTERFACE-001: Cache Manager Interface Definition](./task.md#arch-cache-interface-001)

### Error Handling Refactoring (ARCH-ERROR-001)

**Principle**: Centralized error handling via apiClient resilience patterns instead of layer-specific error swallowing.

**Problem**: API layer methods (`getMediaBatch`, `getMediaUrl`) had their own error handling that caught errors and returned fallback values, bypassing the apiClient's resilience patterns (circuit breaker, retry strategy).

**Solution**: Removed error handling from API layer methods to let errors propagate to apiClient interceptors, where resilience patterns are applied. Service layer maintains graceful fallback behavior.

**Before Refactoring**:
```typescript
// getMediaBatch - Swallowed errors, bypassed resilience patterns
try {
  const response = await apiClient.get(getApiUrl('/wp/v2/media'), { params });
  // ... process response
} catch (error) {
  logger.warn('Failed to fetch media batch', error);
}
return result; // Partial result returned, error hidden

// getMediaUrl - Swallowed errors, bypassed resilience patterns
try {
  const media = await wordpressAPI.getMedia(mediaId, signal);
  // ... process media
} catch (error) {
  logger.warn(`Failed to fetch media ${mediaId}`, error);
  return null;
}
```

**After Refactoring**:
```typescript
// getMediaBatch - Errors propagate to apiClient resilience patterns
const response = await apiClient.get(getApiUrl('/wp/v2/media'), { params });
// ... process response
return result;

// getMediaUrl - Errors propagate to apiClient resilience patterns
const media = await wordpressAPI.getMedia(mediaId, signal);
const url = media.source_url;
if (url) {
  cacheManager.set(cacheKey, url, CACHE_TTL.MEDIA);
}
return url ?? null;
```

**Service Layer Error Handling**:
```typescript
// enrichPostsWithMediaUrls - Handles errors at service layer
try {
  mediaUrls = await wordpressAPI.getMediaUrlsBatch(mediaIds);
} catch (error) {
  logger.warn('Failed to fetch media URLs, using fallbacks', error);
  mediaUrls = new Map();
}

// enrichPostWithDetails - Handles errors at service layer
try {
  mediaUrl = await wordpressAPI.getMediaUrl(post.featured_media);
} catch (error) {
  logger.warn(`Failed to fetch media for post ${post.id}, using fallback`, error);
  mediaUrl = null;
}
```

**Benefits**:
1. **Consistent Error Handling**: All errors flow through apiClient's centralized resilience patterns
2. **Circuit Breaker Integration**: Media API failures now tracked and trigger circuit opening
3. **Retry Strategy Application**: Transient media failures automatically retried with backoff
4. **Better Observability**: Errors propagate to monitoring dashboards via circuit breaker stats
5. **Fail Fast**: Errors visible immediately instead of being hidden in logs
6. **Single Responsibility**: API layer focuses on API calls, error handling at appropriate level
7. **No Behavior Changes**: Service layer maintains graceful fallbacks (null media URLs, fallback posts)

**Error Flow**:
1. Component → Service Layer → API Layer (`getMediaBatch`/`getMediaUrl`)
2. API Layer → apiClient → Network Request
3. Error: apiClient interceptors handle error
   - Circuit breaker: Updates failure count, opens circuit if threshold exceeded
   - Retry strategy: Retries on transient errors (429, 5xx)
   - Error classification: Categorizes error types (NETWORK_ERROR, TIMEOUT_ERROR, etc.)
4. Error propagates to Service Layer (`fetchAndValidate` wrapper)
5. Service Layer: Returns fallback posts/empty results
6. Component: Renders fallback content

**Files Modified**:
- `src/lib/wordpress.ts` - Removed error handling from getMediaBatch and getMediaUrl
- `src/lib/services/enhancedPostService.ts` - Added error handling in service layer methods
- `__tests__/wordpressBatchOperations.test.ts` - Updated test expectations

**See Also**: [Task ARCH-ERROR-001: Error Handling Refactoring](./task.md#arch-error-001)

### Data Integrity
- Validation ensures data structure matches expected schema
- Fallback data provides graceful degradation
- Single source of truth for pagination limits
- No data duplication across layers

## Testing Standards

1. **Unit Tests**: > 80% coverage
2. **Integration Tests**: API resilience pattern integration tests (23 tests)
3. **E2E Tests**: Critical user flows (to be added)
4. **Test Types**: Jest + React Testing Library
5. **Resilience Tests**: Circuit breaker, retry strategy, error handling, rate limiting
6. **Data Validation Tests**: Runtime validation at API boundaries

### Integration Test Suite

**Location**: `__tests__/apiResilienceIntegration.test.ts` (23 tests)

**Purpose**: Verify that resilience patterns work together correctly

**Test Categories**:
1. Circuit Breaker + Retry Integration
2. Rate Limiting + Error Handling Integration
3. Retry Strategy + Error Classification Integration
4. Health Check + Circuit Breaker Integration
5. End-to-End API Request with All Resilience Patterns
6. Error Handling Across All Layers
7. Resilience Pattern Configuration Validation

**Running Integration Tests**:
```bash
# With WordPress API available
export WORDPRESS_API_AVAILABLE=true
npm test -- __tests__/apiResilienceIntegration.test.ts

# Without WordPress API (tests auto-skipped)
npm test -- __tests__/apiResilienceIntegration.test.ts
```

**Documentation**: [Integration Testing Guide](./INTEGRATION_TESTING.md)

## File Structure

```
src/
├── app/              # Next.js App Router
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Homepage
│   ├── error.tsx      # Error page
│   ├── not-found.tsx  # 404 page
│   ├── loading.tsx    # Loading page
│   ├── api/           # API routes
│   │   ├── cache/     # Cache management endpoint
│   │   └── csp-report/ # CSP violation report endpoint
│   └── berita/        # News post pages
│       ├── [slug]/    # Dynamic post slug
│       ├── page.tsx    # Post detail page
│       └── loading.tsx # Post loading skeleton
├── components/       # React components
│   ├── ClientLayout.tsx  # Client-side layout wrapper
│   ├── ErrorBoundary.tsx # Error boundary component
│   ├── layout/       # Layout components (Header, Footer)
│   ├── post/         # Post-related components
│   └── ui/           # UI components
├── lib/              # Utilities
│   ├── api/          # API layer (config, client, resilience)
│   │   ├── config.ts       # API configuration
│   │   ├── client.ts       # Axios client with interceptors & resilience
│   │   ├── errors.ts       # Standardized error types
│   │   ├── circuitBreaker.ts # Circuit breaker pattern
│   │   ├── retryStrategy.ts  # Retry strategy with backoff
│   │   ├── rateLimiter.ts    # Rate limiting with token bucket algorithm
│   │   ├── healthCheck.ts    # API health monitoring
│   │   ├── response.ts       # Standardized response wrappers
│   │   └── standardized.ts   # Standardized API methods
 │   ├── services/     # Business logic layer
 │   │   ├── cacheWarmer.ts # Cache warming orchestration service
 │   │   └── enhancedPostService.ts # Enhanced service with validation & batch operations
│   ├── validation/   # Data validation layer
│   │   └── dataValidator.ts # Runtime data validation at API boundaries
│   ├── utils/        # Utility functions
│   │   ├── logger.ts         # Centralized logging
│   │   ├── sanitizeHTML.ts   # XSS protection with DOMPurify
│   │   └── fallbackPost.ts  # Fallback post utilities
│   ├── constants/    # Constants
│   │   └── fallbackPosts.ts  # Fallback post data
│   ├── wordpress.ts  # WordPress API wrapper with batch operations
│   ├── cache.ts      # In-memory cache manager with TTL & dependency tracking
│   ├── proxy.ts      # Next.js proxy for CSP & security
│   └── csp-utils.ts  # CSP utility functions
└── types/            # TypeScript definitions
    └── wordpress.ts  # WordPress type definitions
```

## DevOps and CI/CD

### CI/CD Pipeline

**Location**: `.github/workflows/ci.yml`

**Pipeline Stages**:
1. **Test Stage**:
   - Checkout code
   - Setup Node.js 20 with npm cache
   - Install dependencies (npm ci)
   - Cache Next.js build artifacts
   - Run linting
   - Run type checking
   - Run tests

2. **Build Stage**:
   - Runs after test stage passes
   - Checkout code
   - Setup Node.js 20 with npm cache
   - Install dependencies (npm ci)
   - Restore Next.js build cache
   - Build application
   - Upload build artifacts

**Pipeline Optimizations**:
- ✅ npm caching in both test and build jobs (reduces install time by 70%+)
- ✅ Next.js build cache (speeds up rebuilds by 50%+)
- ✅ Removed complex SWC binary handling (Next.js handles automatically)
- ✅ Concurrency control to cancel outdated runs

### Containerization

**Docker Setup**:
- **Dockerfile**: Multi-stage build for optimized production image
  - Stage 1 (deps): Install production dependencies
  - Stage 2 (builder): Build Next.js application with standalone output
  - Stage 3 (runner): Lightweight production runtime

**Docker Compose Services**:
- **wordpress**: WordPress CMS (port 8080) - 512M RAM, 1.0 CPU
- **db**: MySQL 8.0 database - 1G RAM, 1.0 CPU
- **phpmyadmin**: Database management UI (port 8081) - 256M RAM, 0.5 CPU
- **frontend**: Next.js frontend (port 3000) - 1G RAM, 2.0 CPU

**Resource Limits** (Added: 2026-01-10):
- All containers have CPU and memory limits to prevent resource exhaustion
- WordPress: 512MB memory limit, 1.0 CPU cores
- MySQL: 1GB memory limit, 1.0 CPU cores
- phpMyAdmin: 256MB memory limit, 0.5 CPU cores
- Frontend: 1GB memory limit, 2.0 CPU cores
- Prevents runaway containers from affecting host system
- Ensures fair resource allocation across services

**Health Checks**:
- WordPress: HTTP health check on port 80
- MySQL: MySQL admin ping
- Frontend: Depends on WordPress health

### Deployment Architecture

**Environment Parity**:
- Development: `npm run dev` (local development)
- Staging: Docker Compose (production-like environment)
- Production: Docker container + load balancer (recommended)

**Deployment Strategies**:
1. **Blue-Green Deployment**: Zero-downtime deployments
2. **Rollback Protocol**: Immediate rollback on production issues
3. **Health Check**: Verify service health before routing traffic
4. **Cache Invalidation**: Clear build cache on major changes

### Monitoring and Observability

**Current Monitoring**:
- ✅ CI/CD pipeline status (GitHub Actions)
- ✅ Test results (795 tests passing)
- ✅ Security audit (0 vulnerabilities)
- ✅ Build time tracking

**Recommended Monitoring**:
- Application performance metrics (response time, error rate)
- Resource usage (CPU, memory, disk)
- Custom alerts (error rate > 5%, response time > 500ms)
- Log aggregation (centralized logging)
- APM tools (Datadog, New Relic, or similar)

### DevOps Best Practices

1. **Green Builds Only**: Never merge failing CI
2. **Infrastructure as Code**: All infrastructure in version control
3. **Automated Testing**: Test before deploy
4. **Rollback Ready**: Always have rollback plan
5. **Security First**: Regular audits, no hardcoded secrets
6. **Fast Feedback**: Failing CI reports clear errors

### CI/CD Commands

```bash
# Run all CI checks locally before push
npm run lint && npm run typecheck && npm run test && npm run build

# Security audit
npm run audit:security

# Check for outdated dependencies
npm run deps:check

# Update dependencies
npm run deps:update

# Docker operations
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f frontend   # Follow frontend logs
docker-compose build frontend      # Rebuild frontend
```

### Rollback Protocol

**Production Issues**:
1. Immediate rollback to previous working version
2. Root cause analysis (logs, metrics, error tracking)
3. Fix forward (not in production)
4. Test thoroughly (staging environment)
5. Deploy with careful monitoring
6. Document post-mortem (lessons learned)

**Rollback Commands**:
```bash
# Docker rollback
docker-compose down
docker pull previous-image:tag
docker-compose up -d

# Verify health
curl http://localhost:3000/health
```

## Development Standards

1. **Git Flow**: Feature branches → Dev → Main
2. **Code Review**: Required for all PRs
3. **Linting**: Pass `npm run lint` before commit
4. **Type Checking**: Pass `npm run typecheck` before commit
5. **Testing**: Pass `npm run test` before commit
6. **Security**: Run `npm run audit:security` regularly

## Code Quality Standards

1. **DRY Principle**: No code duplication - extract shared logic to utilities
2. **Utility Functions**: Centralized utilities in `src/lib/utils/`
   - `sanitizeHTML.ts`: XSS protection with DOMPurify
   - `logger.ts`: Centralized logging with log levels
   - `dateFormat.ts`: Date formatting utilities with locale support
3. **Type Safety**: All utility functions properly typed
4. **Configuration Management**: Centralize configuration constants
    - `src/lib/constants/appConstants.ts`: Magic number constants (TELEMETRY, PARSING, MEMORY, CACHE_METRICS, RATE_LIMIT)
    - `src/lib/constants/fallbackPosts.ts`: Fallback data constants
    - `src/lib/constants/uiText.ts`: UI text constants for localization layer
    - `src/lib/constants/buttonStyles.ts`: Button variant styles with design tokens
 5. **Layer Separation**: Text and formatting separated from presentation
    - UI text in `src/lib/constants/uiText.ts`
    - Date formatting in `src/lib/utils/dateFormat.ts`
    - Components import and use these utilities
 6. **Component Optimization**: 
    - **Server Components**: Do not use React.memo (server always re-renders)
    - **Client Components**: Use React.memo for frequently-rendered components with stable props
    - **Custom Comparison**: Provide custom comparison function when memoizing complex props
    - **Example**: PostCard component uses React.memo with arePropsEqual to prevent unnecessary re-renders

### Rendering Optimization Guidelines

**When to Use React.memo**:
- Component renders frequently (list items, cards, grid items)
- Parent components update frequently (Header, Footer, mobile menus)
- Props change infrequently relative to re-renders
- Expensive rendering operations (complex calculations, heavy DOM)

**When NOT to Use React.memo**:
- Server components (memoization has no effect)
- Components that always re-render due to changing props
- Simple components with minimal re-render cost
- Components with frequent prop changes (memoization overhead > benefit)

**Custom Comparison Function**:
- Compare only props that affect rendering output
- Use shallow comparison for primitive values
- Compare nested properties explicitly for complex objects
- Example: PostCard compares post.id, post.title.rendered, etc.

**See Also**: [Task PERF-001: PostCard Component Rendering Optimization](./task.md#perf-001)

**SearchBar Component** (Added: 2026-01-11):
A searchable input component with debouncing, loading states, and full accessibility support.

**Features**:
- Debounced input (configurable delay, default 300ms) to reduce API calls
- Loading state with spinner indicator
- Clear button to reset search query
- Full keyboard navigation support
- Form submission with Enter key
- ARIA attributes for screen readers
- Semantic HTML with `role="search"` and proper labeling
- Integrated into Header navigation with toggle button
- Added `role="searchbox"` to input element for proper ARIA support

**Header Integration** (Added: 2026-01-11):
SearchBar is integrated into Header navigation for easy access across all pages.

**Features**:
- Search button in desktop navigation (next to navigation items)
- Search button in mobile toolbar (next to menu button)
- Toggle visibility: Click search button to open/close search bar
- Escape key closes search bar when focused
- Escape key also closes mobile menu
- Search bar navigation to `/cari?q={query}` results page
- Responsive design: Search bar adapts to all screen sizes

**Usage**:
```tsx
import Header from '@/components/layout/Header'

// Header automatically includes search button
// Click search button to open search bar
// Type query and press Enter or wait for debounce
// Navigate to search results page (/cari?q=your-query)
```

**Design Tokens**:
- Uses `--color-surface`, `--color-text-primary`, `--color-text-muted`, `--color-primary` for colors
- Uses `--color-border` for borders
- Uses `--radius-md`, `--radius-sm` for border radius
- Uses `--transition-fast` for transitions

**Accessibility**:
- `role="search"` on form for landmark identification
- Associated label with `sr-only` class
- Search icon and loading indicator hidden with `aria-hidden="true"`
- Clear button has proper `aria-label`
- Input has `aria-label` and `aria-busy` attributes
- Full keyboard navigation (Tab, Enter)

**Responsive Design**:
- Mobile-first approach with responsive padding (`py-2 sm:py-3`)
- Responsive font sizes (`text-sm sm:text-base`)
- Full-width by default

**Memoization**:
- Uses `React.memo` with custom comparison function
- Prevents unnecessary re-renders when props unchanged
- Compares: `placeholder`, `isLoading`, `debounceMs`, `className`, `initialValue`, `ariaLabel`, `onSearch`

**Usage Example**:
```tsx
import SearchBar from '@/components/ui/SearchBar'

function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true)
    const posts = await searchPosts(searchQuery)
    setResults(posts)
    setIsLoading(false)
  }

  return (
    <div>
      <SearchBar
        onSearch={handleSearch}
        placeholder="Search articles..."
        isLoading={isLoading}
        debounceMs={300}
        ariaLabel="Search articles"
      />
    </div>
  )
}
```

**Tests**: 45 tests covering rendering, user input, clear button, loading state, form submission, accessibility, design tokens, responsive design, focus management, keyboard navigation, edge cases, and custom debounce

### Sanitization Standards

- All user-generated content must be sanitized before rendering
- Use centralized `sanitizeHTML()` utility from `src/lib/utils/sanitizeHTML`
- Two configuration modes: 'excerpt' (minimal) and 'full' (rich content)
- DOMPurify with strict security policies (no script/style/iframe tags)

## Future Considerations

- [ ] GraphQL integration (if REST proves insufficient)
- [ ] Static Site Generation (SSG) for better performance
- [ ] Internationalization (i18n)
- [ ] Analytics integration
- [ ] E2E testing with Playwright/Cypress
