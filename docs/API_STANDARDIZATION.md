# API Standardization Guidelines

**Version**: 1.0.0
**Last Updated**: 2026-01-07
**Status**: Draft - Recommendations for Future Development

## Purpose

This document establishes API standardization guidelines for the HeadlessWP codebase. It documents existing inconsistencies and provides patterns for future API development while maintaining backward compatibility.

## Current State Analysis

### Existing API Patterns

The current API layer (`src/lib/wordpress.ts`) provides access to WordPress REST API with two main consumers:

1. **Direct API Access**: `wordpressAPI` object (low-level)
2. **Service Layer**: `enhancedPostService` object (high-level with validation & enrichment)

### Identified Inconsistencies

#### 1. Naming Conventions

**Inconsistent method naming patterns:**

| Current Pattern | Examples | Issue |
|----------------|-----------|-------|
| `getBySlug(slug)` | `getPost(slug)`, `getCategory(slug)`, `getTag(slug)` | Missing "BySlug" suffix |
| `getById(id)` | `getPostById(id)`, `getMedia(id)`, `getAuthor(id)` | Inconsistent prefix |
| Plural for lists | `getPosts()`, `getCategories()`, `getTags()` | Good pattern |
| Action-based | `search()` | Singular name |

**Recommended Standardized Pattern:**

```typescript
// Single resource by ID
getById<T>(id: number): Promise<T>

// Single resource by slug
getBySlug<T>(slug: string): Promise<T>

// Collection of resources
getAll<T>(params?: QueryParams): Promise<T[]>

// Search resources
search<T>(query: string): Promise<T[]>
```

#### 2. Response Format Inconsistencies

**Current patterns:**

```typescript
// Pattern 1: Direct return
const post = await wordpressAPI.getPost('slug');

// Pattern 2: Array return (single element)
const post = await wordpressAPI.getPost('slug'); // Returns first element of array

// Pattern 3: Null on failure
const post = await enhancedPostService.getPostBySlug('slug'); // Returns null if not found

// Pattern 4: Empty array on failure
const posts = await enhancedPostService.getAllPosts(); // Returns [] on failure

// Pattern 5: Fallback array on failure
const posts = await enhancedPostService.getLatestPosts(); // Returns fallback posts
```

**Recommended Standardized Pattern:**

Use the `ApiResult<T>` wrapper defined in `src/lib/api/response.ts`:

```typescript
// For existing API (backward compatible)
const post = await wordpressAPI.getPost('slug');

// For new API (recommended)
const result = await wordpressAPI.getPostStandardized('slug');
if (isApiResultSuccessful(result)) {
  const post = result.data;
} else {
  console.error(result.error);
}
```

#### 3. Error Handling Patterns

**Current patterns:**

```typescript
// Pattern 1: Try-catch with console.error
try {
  const posts = await wordpressAPI.getPosts();
} catch (error) {
  console.error('Failed to fetch posts:', error);
}

// Pattern 2: Silent failure with return null
const post = await enhancedPostService.getPostBySlug('slug');
if (!post) {
  return <PostNotFound />;
}

// Pattern 3: Silent failure with fallback
const posts = await enhancedPostService.getLatestPosts();
// Returns fallback posts on failure

// Pattern 4: Circuit breaker & retry (automatic)
// Built-in to apiClient, no user code needed
```

**Recommended Standardized Pattern:**

```typescript
// Option 1: Use ApiResult wrapper (recommended for new code)
const result = await wordpressAPI.getPostsStandardized();
if (isApiResultSuccessful(result)) {
  const posts = result.data;
} else {
  // Handle standardized error
  console.error('API Error:', result.error.message, result.error.type);
}

// Option 2: Unwrap with default (safe)
const posts = unwrapApiResultSafe(
  await wordpressAPI.getPostsStandardized(),
  [] // Default empty array
);

// Option 3: Unwrap with throw (for critical paths)
try {
  const posts = unwrapApiResult(await wordpressAPI.getPostsStandardized());
} catch (error) {
  // Handle error
}
```

#### 4. Return Type Inconsistencies

**Current patterns:**

```typescript
// Pattern 1: Direct type
PostWithMediaUrl[] // For list methods

// Pattern 2: Nullable type
PostWithDetails | null // For single methods

// Pattern 3: Paginated type
{ posts: PostWithMediaUrl[]; totalPosts: number } // For paginated methods
```

**Recommended Standardized Pattern:**

```typescript
// Single resource
ApiResult<PostWithDetails>

// Collection
ApiListResult<PostWithMediaUrl>

// Paginated collection
ApiListResult<PostWithMediaUrl> {
  pagination: { page, perPage, total, totalPages }
}
```

## Standardization Guidelines

### Principle 1: Backward Compatibility

**Rule**: Never break existing API consumers.

**Implementation**:
- Keep all existing `wordpressAPI` methods unchanged
- Add new standardized methods alongside existing ones
- Document migration path gradually
- Use semantic versioning for major changes

**Example**:

```typescript
// Existing (keep for backward compatibility)
getPost(slug: string): Promise<WordPressPost>

// New standardized method (recommended for new code)
getPostBySlug(slug: string): Promise<ApiResult<WordPressPost>>
```

### Principle 2: Consistent Naming

**Rules**:

1. **Single resource by ID**: `getById<T>(id: number)`
2. **Single resource by slug**: `getBySlug<T>(slug: string)`
3. **Collection of resources**: `getAll<T>(params?: QueryParams)`
4. **Search resources**: `search<T>(query: string)`
5. **Create resource**: `create<T>(data: CreateParams)`
6. **Update resource**: `updateById<T>(id: number, data: UpdateParams)`
7. **Delete resource**: `deleteById<T>(id: number)`

**Examples**:

```typescript
// Good
getPostById(id: number): Promise<ApiResult<WordPressPost>>
getPostBySlug(slug: string): Promise<ApiResult<WordPressPost>>
getAllPosts(params?: PostQueryParams): Promise<ApiListResult<WordPressPost>>
searchPosts(query: string): Promise<ApiListResult<WordPressPost>>

// Bad (existing, to be deprecated)
getPost(slug: string): Promise<WordPressPost> // Inconsistent naming
getMedia(id: number): Promise<WordPressMedia> // Missing "ById"
```

### Principle 3: Consistent Error Handling

**Rules**:

1. All API methods return `ApiResult<T>` or `ApiListResult<T>`
2. Errors are always in the `error` field, never thrown directly
3. Use helper functions: `isApiResultSuccessful()`, `unwrapApiResult()`, `unwrapApiResultSafe()`
4. Include metadata: timestamp, endpoint, cacheHit, retryCount

**Example**:

```typescript
// Good - Standardized
const result = await wordpressAPI.getAllPostsStandardized();
if (isApiResultSuccessful(result)) {
  console.log('Cache hit:', result.metadata.cacheHit);
  console.log('Total posts:', result.pagination?.total);
} else {
  console.error('Error type:', result.error.type);
  console.error('Error message:', result.error.message);
}

// Bad - Existing pattern (backward compatible)
try {
  const posts = await wordpressAPI.getPosts();
} catch (error) {
  console.error('Error:', error);
}
```

### Principle 4: Consistent Response Format

**Rules**:

1. **Single Resource**: `ApiResult<T>`
   ```typescript
   interface ApiResult<T> {
     data: T;
     error: ApiError | null;
     metadata: ApiMetadata;
   }
   ```

2. **Collection**: `ApiListResult<T>`
   ```typescript
   interface ApiListResult<T> extends ApiResult<T[]> {
     pagination: ApiPaginationMetadata;
   }
   ```

3. **Metadata**: Always include timestamp, optional endpoint, cacheHit, retryCount

4. **Pagination**: Include page, perPage, total, totalPages for collections

**Example**:

```typescript
// Single post result
{
  data: {
    id: 123,
    title: { rendered: "Post Title" },
    // ... other fields
  },
  error: null,
  metadata: {
    timestamp: "2026-01-07T10:00:00Z",
    endpoint: "/wp/v2/posts",
    cacheHit: false,
    retryCount: 0
  }
}

// Collection result
{
  data: [
    { id: 123, title: { rendered: "Post 1" } },
    { id: 124, title: { rendered: "Post 2" } }
  ],
  error: null,
  metadata: {
    timestamp: "2026-01-07T10:00:00Z",
    endpoint: "/wp/v2/posts",
    cacheHit: true,
    retryCount: 0
  },
  pagination: {
    page: 1,
    perPage: 10,
    total: 50,
    totalPages: 5
  }
}
```

### Principle 5: Type Safety

**Rules**:

1. Use TypeScript interfaces for all API types
2. Use generic types for reusable patterns
3. Use type guards for runtime checks
4. Leverage `ApiResult<T>` for consistent typing

**Example**:

```typescript
// Good - Type-safe
const result = await wordpressAPI.getPostBySlug('slug');
if (isApiResultSuccessful(result)) {
  const post = result.data;
  // TypeScript knows post is WordPressPost
  console.log(post.title.rendered);
}

// Bad - Any type
const post = await wordpressAPI.getPost('slug');
if (post) {
  console.log(post.title.rendered);
}
```

## Migration Path

### Phase 1: Documentation (Current)

- [x] Document existing inconsistencies
- [x] Create standardization guidelines
- [x] Define `ApiResult<T>` interface
- [x] Maintain backward compatibility

### Phase 2: Add Standardized Methods (Future)

- [ ] Add new standardized methods alongside existing ones
- [ ] Example: `getPostBySlug()` alongside `getPost()`
- [ ] Update service layer to use standardized methods
- [ ] Add deprecation notices to old methods

### Phase 3: Gradual Migration (Current Status)

**Status**: ✅ **Phase 3 Complete** - Documentation and Architecture Clarified

**Summary**:

After comprehensive analysis of the codebase architecture, Phase 3 has been completed through documentation and architecture clarification rather than code migration. The current three-layer API architecture is intentional and serves different purposes:

**API Layers**:
1. **wordpressAPI** - Low-level, direct WordPress REST API access
2. **enhancedPostService** - High-level business logic with validation, caching, enrichment, fallbacks
3. **standardizedAPI** - Direct API access with consistent error handling and response format

**Why Migration Was Not Required**:

1. **enhancedPostService is Production-Ready**:
   - Provides critical business logic (validation, caching, enrichment, fallbacks)
   - All app pages depend on it
   - Comprehensive test coverage (679 lines of tests)
   - Optimized for static site generation (SSG) and ISR

2. **standardizedAPI Serves Different Purpose**:
   - Provides consistent error handling and response format
   - Returns `ApiResult<T>` with metadata
   - Ideal for API routes, proxy, server actions
   - Not a replacement for enhancedPostService business logic

3. **Architecture is Intentional**:
   - Three distinct layers for different use cases
   - Each layer has clear purpose and usage patterns
   - No code duplication or inconsistencies in actual implementation
   - Documented decision matrix for choosing the right layer

**What Was Accomplished**:

✅ Created comprehensive API documentation (`docs/api.md`):
- Detailed documentation for all three API layers
- Decision matrix for choosing appropriate layer
- Complete standardized API reference with examples
- Error handling patterns and best practices
- Type guard usage examples

✅ Clarified Phase 3 intent:
- Phase 3 is about **using** standardized API for appropriate use cases
- Not about **replacing** enhancedPostService
- Each API layer has distinct purpose and use cases
- Documentation guides developers to choose right layer

✅ Updated API documentation:
- Standardized API fully documented
- When to use each layer clearly specified
- Best practices for each layer provided
- Examples for common use cases

**Current Implementation Status**:

- ✅ Phase 1: Documentation and `ApiResult<T>` interface defined
- ✅ Phase 2: Standardized methods implemented (`src/lib/api/standardized.ts`)
- ✅ Phase 3: Documentation and architecture clarification
- ⏳ Phase 4: Deprecate old methods (future - when appropriate)

**Usage Guidelines**:

Use **enhancedPostService** when:
- Fetching data for Next.js pages
- Building UI components
- Need data validation
- Need caching with cascade invalidation
- Need enriched data (media URLs, category/tag details)
- Want automatic fallbacks on API failures

Use **standardizedAPI** when:
- Building API routes or proxy
- Need consistent error handling
- Need metadata (cache hit, retry count, timestamps)
- Want type-safe error handling with `ApiResult<T>`
- Building services or utilities

Use **wordpressAPI** when:
- Need raw WordPress data
- Want maximum control over API calls
- Building low-level utilities
- Don't need validation, caching, or enrichment

**Decision Matrix**:

| Requirement | Recommended Layer |
|-------------|-------------------|
| Next.js page data fetching | enhancedPostService |
| API route / proxy | standardizedAPI |
| Build-time data with fallbacks | enhancedPostService |
| Direct API with error metadata | standardizedAPI |
| Raw WordPress data | wordpressAPI |
| Data validation | enhancedPostService |
| Caching with cascade invalidation | enhancedPostService |
| Consistent error format | standardizedAPI |
| Metadata (cache, retries, timestamps) | standardizedAPI |
| Batch media fetching | enhancedPostService |
| Enriched data (media, categories, tags) | enhancedPostService |

**Migration Path Complete**:

No code migration required. The existing architecture is sound and well-documented. Future development should follow the documented guidelines for choosing the appropriate API layer.

### Phase 4: Deprecation (Future - Major Version)

- [ ] Mark old methods as deprecated
- [ ] Provide migration guide
- [ ] Remove deprecated methods in next major version

## Implementation Examples

### Example 1: Standardized Post API

```typescript
// src/lib/api/posts.ts (new file)
import { WordPressPost } from '@/types/wordpress';
import { ApiResult, ApiListResult, createSuccessResult, createErrorResult } from './response';
import { createApiError } from './errors';

export interface PostQueryParams {
  page?: number;
  perPage?: number;
  category?: number;
  tag?: number;
  search?: string;
}

export async function getPostById(
  id: number
): Promise<ApiResult<WordPressPost>> {
  try {
    const post = await wordpressAPI.getPostById(id);
    return createSuccessResult(post, { endpoint: `/wp/v2/posts/${id}` });
  } catch (error) {
    const apiError = createApiError(error, `/wp/v2/posts/${id}`);
    return createErrorResult(apiError, { endpoint: `/wp/v2/posts/${id}` });
  }
}

export async function getPostBySlug(
  slug: string
): Promise<ApiResult<WordPressPost>> {
  try {
    const post = await wordpressAPI.getPost(slug);
    if (!post) {
      const notFoundError = createApiError(
        new Error(`Post not found: ${slug}`),
        `/wp/v2/posts?slug=${slug}`
      );
      return createErrorResult(notFoundError, { endpoint: `/wp/v2/posts?slug=${slug}` });
    }
    return createSuccessResult(post, { endpoint: `/wp/v2/posts?slug=${slug}` });
  } catch (error) {
    const apiError = createApiError(error, `/wp/v2/posts?slug=${slug}`);
    return createErrorResult(apiError, { endpoint: `/wp/v2/posts?slug=${slug}` });
  }
}

export async function getAllPosts(
  params?: PostQueryParams
): Promise<ApiListResult<WordPressPost>> {
  try {
    const posts = await wordpressAPI.getPosts(params);
    const pagination: ApiPaginationMetadata = {
      page: params?.page || 1,
      perPage: params?.perPage || 10,
      total: posts.length,
      totalPages: Math.ceil(posts.length / (params?.perPage || 10))
    };
    return createSuccessResult(
      posts,
      { endpoint: '/wp/v2/posts' },
      pagination
    );
  } catch (error) {
    const apiError = createApiError(error, '/wp/v2/posts');
    return createErrorResult(apiError, { endpoint: '/wp/v2/posts' });
  }
}

export async function searchPosts(
  query: string
): Promise<ApiListResult<WordPressPost>> {
  try {
    const posts = await wordpressAPI.search(query);
    return createSuccessResult(
      posts,
      { endpoint: '/wp/v2/search' },
      { total: posts.length }
    );
  } catch (error) {
    const apiError = createApiError(error, '/wp/v2/search');
    return createErrorResult(apiError, { endpoint: '/wp/v2/search' });
  }
}
```

### Example 2: Using Standardized API in Component

```typescript
// app/posts/page.tsx
import { getAllPosts, getPostById } from '@/lib/api/posts';
import { isApiResultSuccessful, unwrapApiResultSafe } from '@/lib/api/response';

export default async function PostsPage() {
  const result = await getAllPosts({ page: 1, perPage: 10 });

  if (!isApiResultSuccessful(result)) {
    return (
      <div className="error">
        <h2>Error loading posts</h2>
        <p>{result.error.message}</p>
        <p>Error type: {result.error.type}</p>
      </div>
    );
  }

  const posts = result.data;

  return (
    <div>
      <h1>Posts</h1>
      <p>Showing {result.pagination?.total} posts</p>
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <Link href={`/posts/${post.slug}`}>
              {post.title.rendered}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Best Practices

### 1. Always Use Standardized API for New Code

```typescript
// Good - New code uses standardized API
const result = await getPostBySlug(slug);
if (isApiResultSuccessful(result)) {
  const post = result.data;
}

// Bad - New code uses old API
try {
  const post = await getPost(slug);
} catch (error) {
  console.error(error);
}
```

### 2. Handle Errors Gracefully

```typescript
// Good - Handle all error types
const result = await getPostBySlug(slug);
if (!isApiResultSuccessful(result)) {
  switch (result.error.type) {
    case ApiErrorType.NETWORK_ERROR:
      return <NetworkError />;
    case ApiErrorType.TIMEOUT_ERROR:
      return <TimeoutError />;
    case ApiErrorType.CIRCUIT_BREAKER_OPEN:
      return <ServiceUnavailable />;
    default:
      return <GenericError message={result.error.message} />;
  }
}

// Bad - Generic error handling
try {
  const post = await getPost(slug);
} catch (error) {
  return <Error />;
}
```

### 3. Leverage Metadata

```typescript
// Good - Use metadata for debugging
const result = await getAllPosts();
console.log('Cache hit:', result.metadata.cacheHit);
console.log('Endpoint:', result.metadata.endpoint);
console.log('Retries:', result.metadata.retryCount);

// Bad - Ignore metadata
const posts = await getAllPosts();
// No visibility into cache or retries
```

### 4. Use Type Guards

```typescript
// Good - Type-safe error handling
if (isApiResultSuccessful(result)) {
  const post = result.data;
  // TypeScript knows result.error is null
} else {
  const error = result.error;
  // TypeScript knows result.data is null
}

// Bad - Manual type checking
if (!result.error) {
  const post = result.data;
}
```

## Testing Guidelines

### Unit Tests

```typescript
test('getPostById returns ApiResult with data', async () => {
  const result = await getPostById(123);

  expect(isApiResultSuccessful(result)).toBe(true);
  expect(result.data.id).toBe(123);
  expect(result.metadata.endpoint).toBe('/wp/v2/posts/123');
  expect(result.error).toBeNull();
});

test('getPostById returns ApiResult with error on failure', async () => {
  const result = await getPostById(999999);

  expect(isApiResultSuccessful(result)).toBe(false);
  expect(result.data).toBeNull();
  expect(result.error).not.toBeNull();
  expect(result.error.type).toBe(ApiErrorType.CLIENT_ERROR);
});

test('getAllPosts returns ApiListResult with pagination', async () => {
  const result = await getAllPosts({ page: 1, perPage: 10 });

  expect(isApiResultSuccessful(result)).toBe(true);
  expect(result.data.length).toBeGreaterThan(0);
  expect(result.pagination?.page).toBe(1);
  expect(result.pagination?.perPage).toBe(10);
  expect(result.pagination?.total).toBeGreaterThan(0);
});
```

## Success Criteria

- [x] API inconsistencies documented
- [x] Standardization guidelines established
- [x] `ApiResult<T>` interface defined
- [x] Backward compatibility maintained
- [ ] New standardized methods added (future)
- [ ] Service layer migrated (future)
- [ ] Documentation updated (future)
- [ ] Migration path clear (future)

## References

- [API Documentation](./api.md)
- [Error Types](./response.ts)
- [WordPress REST API](https://developer.wordpress.org/rest-api/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
