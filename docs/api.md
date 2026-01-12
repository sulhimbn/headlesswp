# API Documentation

Complete guide to using the HeadlessWP API layer for WordPress REST API integration.

## Overview

The API layer provides a robust, resilient interface to WordPress REST API endpoints with built-in error handling, retry logic, circuit breaking, rate limiting, and caching.

## Base URL

```
Development: http://localhost:8080/wp-json/wp/v2/
Production: https://mitrabantennews.com/wp-json/wp/v2/
```

## Getting Started

### Import the API

```typescript
import { wordpressAPI } from '@/lib/wordpress';
import { enhancedPostService } from '@/lib/services/enhancedPostService';
import { standardizedAPI } from '@/lib/api/standardized';
```

## API Layer Architecture

The HeadlessWP codebase provides three API layers for different use cases:

### 1. WordPress API (`wordpressAPI`)

**Purpose**: Low-level, direct access to WordPress REST API

**When to Use**:
- When you need raw WordPress data without additional processing
- When you want to handle all error cases yourself
- When you need maximum control over API calls

**Characteristics**:
- Returns raw WordPress data or throws errors
- No automatic fallbacks
- No data validation
- No enrichment (media URLs, category/tag details)

**Example**:
```typescript
import { wordpressAPI } from '@/lib/wordpress';

const posts = await wordpressAPI.getPosts({ per_page: 10 });
const post = await wordpressAPI.getPost('my-post-slug');
```

---

### 2. Enhanced Post Service (`enhancedPostService`)

**Purpose**: High-level business logic with validation, caching, enrichment, and fallbacks

**When to Use**:
- In Next.js pages and components (recommended for app layer)
- When you need data validation
- When you need cached data with cascade invalidation
- When you need enriched data (media URLs, category/tag details)
- When you want automatic fallbacks on API failures

**Characteristics**:
- Runtime data validation
- Dependency-aware caching with cascade invalidation
- Batch media fetching (eliminates N+1 queries)
- Type-safe enriched data (PostWithMediaUrl, PostWithDetails)
- Graceful fallbacks on API failures
- Optimized for static site generation (SSG) and ISR

**Example**:
```typescript
import { enhancedPostService } from '@/lib/services/enhancedPostService';

const latestPosts = await enhancedPostService.getLatestPosts();
const post = await enhancedPostService.getPostBySlug('my-post-slug');
```

---

### 3. Standardized API (`standardizedAPI`)

**Purpose**: Direct API access with consistent error handling and response format

**When to Use**:
- When you want consistent error handling and response format
- When building API endpoints or services
- When you need metadata (timestamp, cache hit, retry count)
- When you want type-safe error handling with `ApiResult<T>`
- In proxy, server actions, or API routes

**Characteristics**:
- All methods return `ApiResult<T>` or `ApiListResult<T>`
- Consistent error format with error types
- Metadata (timestamp, endpoint, cache hit, retry count)
- Pagination metadata for list results
- Type-safe error handling with type guards

**Example**:
```typescript
import { standardizedAPI } from '@/lib/api/standardized';
import { isApiResultSuccessful } from '@/lib/api/response';

const result = await standardizedAPI.getPostById(123);
if (isApiResultSuccessful(result)) {
  console.log('Post loaded:', result.data.title.rendered);
  console.log('Cache hit:', result.metadata.cacheHit);
} else {
  console.error('Error type:', result.error.type);
  console.error('Message:', result.error.message);
}
```

---

### Decision Matrix

| Requirement | Recommended Layer |
|-------------|-------------------|
| Next.js page data fetching | enhancedPostService |
| Build-time data with fallbacks | enhancedPostService |
| API route/proxy | standardizedAPI |
| Direct API with error metadata | standardizedAPI |
| Raw WordPress data | wordpressAPI |
| Maximum control over errors | wordpressAPI or standardizedAPI |
| Data validation | enhancedPostService |
| Caching with cascade invalidation | enhancedPostService |
| Batch media fetching | enhancedPostService |
| Enriched data (media URLs, categories, tags) | enhancedPostService |
| Consistent error format | standardizedAPI |
| Metadata (cache, retries, timestamps) | standardizedAPI |

## Standardized API Reference

The standardized API provides type-safe, consistent error handling and response format for all WordPress REST API operations.

### Import and Setup

```typescript
import { standardizedAPI } from '@/lib/api/standardized';
import { isApiResultSuccessful } from '@/lib/api/response';
import { ApiErrorType } from '@/lib/api/errors';
```

### Response Format

#### Single Resource (`ApiResult<T>`)

```typescript
{
  data: T | null,                    // The requested data
  error: ApiError | null,            // Error if request failed
  metadata: {
    timestamp: string,                 // ISO 8601 timestamp
    endpoint?: string,                // API endpoint called
    cacheHit?: boolean,               // Was result cached?
    retryCount?: number               // Number of retries performed
  }
}
```

#### Collection (`ApiListResult<T>`)

```typescript
{
  data: T[] | null,                  // Array of items
  error: ApiError | null,            // Error if request failed
  metadata: {
    timestamp: string,
    endpoint?: string,
    cacheHit?: boolean,
    retryCount?: number
  },
  pagination: {
    page?: number,                    // Current page
    perPage?: number,                // Items per page
    total?: number,                  // Total items
    totalPages?: number               // Total pages
  }
}
```

### Posts API

#### Get Post by ID

Fetch a single post by its ID.

```typescript
const result = await standardizedAPI.getPostById(123);

if (isApiResultSuccessful(result)) {
  const post = result.data;
  console.log('Post:', post.title.rendered);
} else {
  console.error('Error:', result.error.message);
  console.error('Type:', result.error.type);
}
```

**Parameters**:
- `id: number` - Post ID

**Returns**: `Promise<ApiResult<WordPressPost>>`

**Error Types**:
- `CLIENT_ERROR` (404) - Post not found
- `SERVER_ERROR` - WordPress API error
- `NETWORK_ERROR` - Connection failed
- `TIMEOUT_ERROR` - Request timed out
- `CIRCUIT_BREAKER_OPEN` - Circuit breaker blocking requests

---

#### Get Post by Slug

Fetch a single post by its slug.

```typescript
const result = await standardizedAPI.getPostBySlug('my-post-slug');

if (isApiResultSuccessful(result)) {
  const post = result.data;
  console.log('Post:', post.title.rendered);
} else {
  console.error('Error:', result.error.message);
}
```

**Parameters**:
- `slug: string` - Post slug

**Returns**: `Promise<ApiResult<WordPressPost>>`

**Error Types**:
- `CLIENT_ERROR` (404) - Post not found
- `SERVER_ERROR` - WordPress API error
- `NETWORK_ERROR` - Connection failed
- `TIMEOUT_ERROR` - Request timed out
- `CIRCUIT_BREAKER_OPEN` - Circuit breaker blocking requests

---

#### Get All Posts

Fetch a collection of posts with optional filtering.

```typescript
// Get all posts (default: 10 per page)
const result = await standardizedAPI.getAllPosts();

// Get paginated posts
const result = await standardizedAPI.getAllPosts({
  page: 2,
  per_page: 10
});

// Get posts by category
const result = await standardizedAPI.getAllPosts({
  category: 5
});

if (isApiResultSuccessful(result)) {
  const posts = result.data;
  console.log('Total posts:', result.pagination?.total);
  console.log('Page:', result.pagination?.page);
  console.log('Cache hit:', result.metadata.cacheHit);
} else {
  console.error('Error:', result.error.message);
}
```

**Parameters**:
- `params?: PostQueryParams`
  - `page?: number` - Page number
  - `per_page?: number` - Posts per page (max 100)
  - `category?: number` - Filter by category ID
  - `tag?: number` - Filter by tag ID
  - `search?: string` - Search query

**Returns**: `Promise<ApiListResult<WordPressPost>>`

**Error Types**:
- `SERVER_ERROR` - WordPress API error
- `NETWORK_ERROR` - Connection failed
- `TIMEOUT_ERROR` - Request timed out
- `CIRCUIT_BREAKER_OPEN` - Circuit breaker blocking requests

---

#### Search Posts

Search for posts matching a query.

```typescript
const result = await standardizedAPI.searchPosts('pemilihan gubernur');

if (isApiResultSuccessful(result)) {
  const posts = result.data;
  console.log('Found', posts.length, 'posts');
  console.log('Cache hit:', result.metadata.cacheHit);
} else {
  console.error('Error:', result.error.message);
}
```

**Parameters**:
- `query: string` - Search query

**Returns**: `Promise<ApiListResult<WordPressPost>>`

**Error Types**:
- `SERVER_ERROR` - WordPress API error
- `NETWORK_ERROR` - Connection failed
- `TIMEOUT_ERROR` - Request timed out
- `CIRCUIT_BREAKER_OPEN` - Circuit breaker blocking requests

### Categories API

#### Get Category by ID

Fetch a single category by its ID.

```typescript
const result = await standardizedAPI.getCategoryById(5);

if (isApiResultSuccessful(result)) {
  const category = result.data;
  console.log('Category:', category.name);
} else {
  console.error('Error:', result.error.message);
}
```

**Parameters**:
- `id: number` - Category ID

**Returns**: `Promise<ApiResult<WordPressCategory>>`

---

#### Get Category by Slug

Fetch a single category by its slug.

```typescript
const result = await standardizedAPI.getCategoryBySlug('politik');

if (isApiResultSuccessful(result)) {
  const category = result.data;
  console.log('Category:', category.name);
} else {
  console.error('Error:', result.error.message);
}
```

**Parameters**:
- `slug: string` - Category slug

**Returns**: `Promise<ApiResult<WordPressCategory>>`

---

#### Get All Categories

Fetch all categories.

```typescript
const result = await standardizedAPI.getAllCategories();

if (isApiResultSuccessful(result)) {
  const categories = result.data;
  console.log('Total categories:', categories.length);
} else {
  console.error('Error:', result.error.message);
}
```

**Returns**: `Promise<ApiListResult<WordPressCategory>>`

### Tags API

#### Get Tag by ID

Fetch a single tag by its ID.

```typescript
const result = await standardizedAPI.getTagById(12);

if (isApiResultSuccessful(result)) {
  const tag = result.data;
  console.log('Tag:', tag.name);
} else {
  console.error('Error:', result.error.message);
}
```

**Parameters**:
- `id: number` - Tag ID

**Returns**: `Promise<ApiResult<WordPressTag>>`

---

#### Get Tag by Slug

Fetch a single tag by its slug.

```typescript
const result = await standardizedAPI.getTagBySlug('pemilu');

if (isApiResultSuccessful(result)) {
  const tag = result.data;
  console.log('Tag:', tag.name);
} else {
  console.error('Error:', result.error.message);
}
```

**Parameters**:
- `slug: string` - Tag slug

**Returns**: `Promise<ApiResult<WordPressTag>>`

---

#### Get All Tags

Fetch all tags.

```typescript
const result = await standardizedAPI.getAllTags();

if (isApiResultSuccessful(result)) {
  const tags = result.data;
  console.log('Total tags:', tags.length);
} else {
  console.error('Error:', result.error.message);
}
```

**Returns**: `Promise<ApiListResult<WordPressTag>>`

### Media API

#### Get Media by ID

Fetch media details (images, videos, etc.) by ID.

```typescript
const result = await standardizedAPI.getMediaById(456);

if (isApiResultSuccessful(result)) {
  const media = result.data;
  console.log('Media URL:', media.source_url);
  console.log('Alt text:', media.alt_text);
} else {
  console.error('Error:', result.error.message);
}
```

**Parameters**:
- `id: number` - Media ID

**Returns**: `Promise<ApiResult<WordPressMedia>>`

### Authors API

#### Get Author by ID

Fetch author details by ID.

```typescript
const result = await standardizedAPI.getAuthorById(1);

if (isApiResultSuccessful(result)) {
  const author = result.data;
  console.log('Author:', author.name);
  console.log('Description:', author.description);
} else {
  console.error('Error:', result.error.message);
}
```

**Parameters**:
- `id: number` - Author ID

**Returns**: `Promise<ApiResult<WordPressAuthor>>`

### Error Handling with Standardized API

The standardized API provides type-safe error handling using type guards.

#### Type Guard Usage

```typescript
import { isApiResultSuccessful } from '@/lib/api/response';

const result = await standardizedAPI.getPostById(123);

if (isApiResultSuccessful(result)) {
  // TypeScript knows result.error is null and result.data is not null
  const post = result.data;
  console.log('Post:', post.title.rendered);
} else {
  // TypeScript knows result.data is null and result.error is not null
  const error = result.error;
  console.error('Error:', error.message);
  console.error('Type:', error.type);
}
```

#### Error Type Switch

```typescript
import { ApiErrorType } from '@/lib/api/errors';

const result = await standardizedAPI.getPostById(123);

if (!isApiResultSuccessful(result)) {
  switch (result.error.type) {
    case ApiErrorType.NETWORK_ERROR:
      console.log('Network error occurred');
      break;

    case ApiErrorType.TIMEOUT_ERROR:
      console.log('Request timed out');
      break;

    case ApiErrorType.RATE_LIMIT_ERROR:
      console.log('Rate limit exceeded');
      break;

    case ApiErrorType.SERVER_ERROR:
      console.log('Server error (5xx)');
      break;

    case ApiErrorType.CLIENT_ERROR:
      console.log('Client error (4xx)');
      break;

    case ApiErrorType.CIRCUIT_BREAKER_OPEN:
      console.log('Service temporarily unavailable');
      break;

    default:
      console.log('Unknown error');
  }
}
```

#### Unwrapping Results

For cases where you want to throw errors or provide defaults:

```typescript
import { unwrapApiResult, unwrapApiResultSafe } from '@/lib/api/response';

// Unwrap with error throw (throws if error exists)
try {
  const post = unwrapApiResult(await standardizedAPI.getPostById(123));
  console.log('Post:', post.title.rendered);
} catch (error) {
  console.error('Failed to fetch post:', error);
}

// Unwrap with safe default (never throws)
const posts = unwrapApiResultSafe(
  await standardizedAPI.getAllPosts(),
  [] // Default empty array
);
console.log('Posts:', posts.length);
```

### Metadata Usage

All standardized API responses include metadata for debugging and monitoring.

```typescript
const result = await standardizedAPI.getPostById(123);

console.log('Timestamp:', result.metadata.timestamp);
console.log('Endpoint:', result.metadata.endpoint);
console.log('Cache hit:', result.metadata.cacheHit);
console.log('Retries:', result.metadata.retryCount);

if (result.pagination) {
  console.log('Page:', result.pagination.page);
  console.log('Total:', result.pagination.total);
  console.log('Pages:', result.pagination.totalPages);
}
```

### Best Practices

#### 1. Always Use Type Guards

```typescript
// Good - Type-safe
if (isApiResultSuccessful(result)) {
  const post = result.data;
}

// Bad - Manual checking (not type-safe)
if (!result.error) {
  const post = result.data;
}
```

#### 2. Handle All Error Types

```typescript
// Good - Handle each error type appropriately
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

// Bad - Generic error handling
if (result.error) {
  return <Error />;
}
```

#### 3. Leverage Metadata

```typescript
// Good - Use metadata for debugging
console.log('Cache hit:', result.metadata.cacheHit);
console.log('Endpoint:', result.metadata.endpoint);
console.log('Retries:', result.metadata.retryCount);

// Bad - Ignore metadata
const post = result.data;
```

#### 4. Check Retry Count

```typescript
const result = await standardizedAPI.getPostById(123);

if (result.metadata.retryCount && result.metadata.retryCount > 0) {
  console.log(`Request was retried ${result.metadata.retryCount} times`);
  // This might indicate API instability
}
```

#### 5. Use Pagination Metadata

```typescript
const result = await standardizedAPI.getAllPosts({ page: 1, per_page: 10 });

if (isApiResultSuccessful(result)) {
  const { page, total, totalPages } = result.pagination;
  console.log(`Showing page ${page} of ${totalPages} (${total} total posts)`);
}
```

### Comparison: When to Use Which API

| Use Case | Recommended API | Why |
|----------|----------------|-----|
| Next.js page data fetching | `enhancedPostService` | Validation, caching, enrichment, fallbacks |
| API route / proxy | `standardizedAPI` | Consistent error format, metadata |
| Build-time data with fallbacks | `enhancedPostService` | Graceful degradation |
| Raw WordPress data | `wordpressAPI` | Maximum control, no processing |
| Direct API with error metadata | `standardizedAPI` | Type-safe error handling |
| Caching with cascade invalidation | `enhancedPostService` | Automatic dependency tracking |
| Batch media fetching | `enhancedPostService` | N+1 query elimination |
| Enriched data (media, categories, tags) | `enhancedPostService` | Automatic resolution |

## WordPress API Reference

### Posts

#### Get Posts

Fetch posts with optional filtering parameters.

```typescript
// Get all posts (default: 10 per page)
const posts = await wordpressAPI.getPosts();

// Get posts with pagination
const posts = await wordpressAPI.getPosts({
  page: 1,
  per_page: 10
});

// Get posts by category
const posts = await wordpressAPI.getPosts({
  category: 5
});

// Get posts by tag
const posts = await wordpressAPI.getPosts({
  tag: 3
});

// Search posts
const posts = await wordpressAPI.getPosts({
  search: 'pemilihan'
});
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| per_page | number | No | 10 | Posts per page (max 100) |
| category | number | No | - | Filter by category ID |
| tag | number | No | - | Filter by tag ID |
| search | string | No | - | Search query |

**Returns:**
```typescript
Promise<WordPressPost[]>
```

**Example Response:**
```typescript
[
  {
    id: 123,
    title: { rendered: "Berita Terbaru Hari Ini" },
    content: { rendered: "<p>Isi berita...</p>" },
    excerpt: { rendered: "<p>Ringkasan berita...</p>" },
    slug: "berita-terbaru-hari-ini",
    date: "2025-01-07T10:30:00",
    modified: "2025-01-07T10:30:00",
    author: 1,
    featured_media: 456,
    categories: [5, 8],
    tags: [12, 15],
    status: "publish",
    type: "post",
    link: "https://mitrabantennews.com/berita-terbaru-hari-ini"
  }
]
```

---

#### Get Post by Slug

Fetch a single post by its slug.

```typescript
const post = await wordpressAPI.getPost('berita-terbaru-hari-ini');
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| slug | string | Yes | Post slug |

**Returns:**
```typescript
Promise<WordPressPost>
```

---

#### Get Post by ID

Fetch a single post by its ID.

```typescript
const post = await wordpressAPI.getPostById(123);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Post ID |

**Returns:**
```typescript
Promise<WordPressPost>
```

---

### Categories

#### Get All Categories

```typescript
const categories = await wordpressAPI.getCategories();
```

**Returns:**
```typescript
Promise<WordPressCategory[]>
```

**Example Response:**
```typescript
[
  {
    id: 5,
    name: "Politik",
    slug: "politik",
    description: "Berita politik terkini",
    count: 150,
    link: "https://mitrabantennews.com/category/politik"
  }
]
```

---

#### Get Category by Slug

```typescript
const category = await wordpressAPI.getCategory('politik');
```

**Returns:**
```typescript
Promise<WordPressCategory>
```

---

### Tags

#### Get All Tags

```typescript
const tags = await wordpressAPI.getTags();
```

**Returns:**
```typescript
Promise<WordPressTag[]>
```

**Example Response:**
```typescript
[
  {
    id: 12,
    name: "Pemilu",
    slug: "pemilu",
    description: "Berita terkait pemilihan umum",
    count: 45
  }
]
```

---

#### Get Tag by Slug

```typescript
const tag = await wordpressAPI.getTag('pemilu');
```

**Returns:**
```typescript
Promise<WordPressTag>
```

---

### Media

#### Get Media by ID

Fetch media details (images, videos, etc.).

```typescript
const media = await wordpressAPI.getMedia(456);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Media ID |

**Returns:**
```typescript
Promise<WordPressMedia>
```

**Example Response:**
```typescript
{
  id: 456,
  date: "2025-01-07T10:00:00",
  slug: "berita-image",
  title: { rendered: "Berita Image" },
  media_type: "image",
  mime_type: "image/jpeg",
  source_url: "https://mitrabantennews.com/wp-content/uploads/2025/01/berita.jpg",
  alt_text: "Gambar berita",
  caption: { rendered: "" },
  description: { rendered: "" }
}
```

---

### Authors

#### Get Author by ID

Fetch author details.

```typescript
const author = await wordpressAPI.getAuthor(1);
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | number | Yes | Author ID |

**Returns:**
```typescript
Promise<WordPressAuthor>
```

**Example Response:**
```typescript
{
  id: 1,
  name: "John Doe",
  slug: "john-doe",
  description: "Editor senior",
  link: "https://mitrabantennews.com/author/john-doe",
  avatar_urls: {
    "24": "https://...",
    "48": "https://...",
    "96": "https://..."
  }
}
```

---

### Search

#### Search Content

Search across posts, pages, and other content types.

```typescript
const results = await wordpressAPI.search('pemilihan gubernur');
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Search query |

**Returns:**
```typescript
Promise<WordPressPost[]>
```

**Note:** Search results are automatically cached for 5 minutes.

---

## Enhanced Post Service Reference

The enhanced post service provides high-level methods with built-in fallback logic, validation, and data enrichment for handling build-time failures.

### getLatestPosts

Get latest posts with automatic fallback on failure.

```typescript
const posts = await enhancedPostService.getLatestPosts();
```

**Behavior:**
- On success: Returns latest posts from WordPress with media URLs
- On failure: Returns fallback posts with Indonesian error message
- Caches results automatically with cascade invalidation
- Validates data before returning

**Returns:**
```typescript
Promise<PostWithMediaUrl[]>
```

**Example Usage in Next.js Page:**

```typescript
// src/app/page.tsx
import { enhancedPostService } from '@/lib/services/enhancedPostService';

export default async function HomePage() {
  const latestPosts = await enhancedPostService.getLatestPosts();

  return (
    <div>
      {latestPosts.map(post => (
        <article key={post.id}>
          <h2>{post.title.rendered}</h2>
          <p>{post.excerpt.rendered}</p>
        </article>
      ))}
    </div>
  );
}
```

---

### getCategoryPosts

Get category posts with automatic fallback on failure.

```typescript
const posts = await enhancedPostService.getCategoryPosts();
```

**Behavior:**
- On success: Returns posts from WordPress with media URLs
- On failure: Returns fallback posts with Indonesian error message
- Caches results automatically with cascade invalidation
- Validates data before returning

**Returns:**
```typescript
Promise<PostWithMediaUrl[]>
```

---

### getPostBySlug

Get a single post by slug with null fallback on failure.

```typescript
const post = await enhancedPostService.getPostBySlug('berita-terbaru');
```

**Behavior:**
- On success: Returns enriched post data with media URL, categories, and tags
- On failure: Returns null
- Logs error to console

**Returns:**
```typescript
Promise<PostWithDetails | null>
```

**Example Usage in Next.js Dynamic Route:**

```typescript
// src/app/berita/[slug]/page.tsx
import { enhancedPostService } from '@/lib/services/enhancedPostService';

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await enhancedPostService.getPostBySlug(params.slug);

  if (!post) {
    return <div>Post not found</div>;
  }

  return (
    <article>
      <h1>{post.title.rendered}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
    </article>
  );
}
```

---

## Request Cancellation

All API methods support request cancellation using AbortController.

```typescript
import { wordpressAPI } from '@/lib/wordpress';

// Create AbortController
const controller = new AbortController();
const signal = controller.signal;

// Make request with signal
const postsPromise = wordpressAPI.getPosts({}, signal);

// Cancel request if needed
controller.abort();

// This will throw an AbortError
try {
  const posts = await postsPromise;
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  }
}
```

**Use Case:** Cancel stale requests when navigating away from a page.

---

## Cache Management

### Automatic Caching

Search results are automatically cached for 5 minutes.

```typescript
// First call - fetches from API
const results1 = await wordpressAPI.search('pemilihan');

// Second call - returns cached result (within 5 minutes)
const results2 = await wordpressAPI.search('pemilihan');
```

### Manual Cache Management

#### Clear All Cache

```typescript
wordpressAPI.clearCache();
```

#### Clear Cache by Pattern

```typescript
// Clear all search cache
wordpressAPI.clearCache('search:');
```

#### Get Cache Statistics

```typescript
const stats = wordpressAPI.getCacheStats();
console.log(stats);
// Output: { size: 5, hits: 120, misses: 30 }
```

#### Warm Cache

Pre-load cache with frequently accessed data.

```typescript
await wordpressAPI.warmCache();
// Pre-loads: latest posts, categories, tags
```

---

## Error Handling

### Standardized Error Format

All API errors follow this format:

```typescript
{
  type: 'NETWORK_ERROR' | 'TIMEOUT_ERROR' | 'RATE_LIMIT_ERROR' | 'SERVER_ERROR' | 'CLIENT_ERROR' | 'CIRCUIT_BREAKER_OPEN' | 'UNKNOWN_ERROR',
  message: string,
  statusCode?: number,
  retryable: boolean,
  timestamp: string,
  endpoint?: string
}
```

### Error Types

| Error Type | Description | Retryable |
|------------|-------------|-----------|
| NETWORK_ERROR | Connection issues | Yes (1 retry) |
| TIMEOUT_ERROR | Request timeout | Yes (1 retry) |
| RATE_LIMIT_ERROR | Rate limiting (429) | Yes (respects Retry-After) |
| SERVER_ERROR | Server errors (500-599) | Yes |
| CLIENT_ERROR | Client errors (400-499) | No |
| CIRCUIT_BREAKER_OPEN | Circuit is blocking requests | No |
| UNKNOWN_ERROR | Unhandled errors | No |

### Handling Errors

```typescript
try {
  const posts = await wordpressAPI.getPosts();
} catch (error) {
  if (error.type === 'NETWORK_ERROR') {
    console.log('Network error occurred');
  } else if (error.type === 'CIRCUIT_BREAKER_OPEN') {
    console.log('Service is temporarily unavailable');
  } else if (error.type === 'RATE_LIMIT_ERROR') {
    console.log('Rate limit exceeded, please try again later');
  }
}
```

---

## Resilience Patterns

### Circuit Breaker

The circuit breaker prevents cascading failures by stopping calls to failing services.

**Configuration:**
```typescript
// src/lib/api/config.ts
CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5      // Failures before opening
CIRCUIT_BREAKER_RECOVERY_TIMEOUT = 60000    // 60 seconds recovery time
CIRCUIT_BREAKER_SUCCESS_THRESHOLD = 2       // Successes to close circuit
```

**States:**
- **CLOSED**: Normal operation
- **OPEN**: Blocking requests
- **HALF_OPEN**: Testing recovery

**Example:**

```typescript
// After 5 failures, circuit opens
// All requests fail fast with CIRCUIT_BREAKER_OPEN error
// After 60 seconds, circuit moves to HALF_OPEN
// Next 2 requests test recovery
// If successful, circuit closes (back to normal)
```

### Retry Strategy

Automatic retry with exponential backoff and jitter.

**Configuration:**
```typescript
// src/lib/api/config.ts
RETRY_INITIAL_DELAY = 1000        // 1 second
RETRY_MAX_DELAY = 30000           // 30 seconds max
RETRY_BACKOFF_MULTIPLIER = 2       // Doubles each retry
MAX_RETRIES = 3                   // Maximum attempts
```

**Retry Delays:**
1st retry: ~1000ms (1 second)
2nd retry: ~2000ms (2 seconds)
3rd retry: ~4000ms (4 seconds)

**Jitter:** Random variance added to prevent thundering herd.

### Rate Limiting

Protects API from overload by limiting request rate using token bucket algorithm.

**Configuration:**
```typescript
// src/lib/api/config.ts
RATE_LIMIT_MAX_REQUESTS = 60      // 60 requests per window
RATE_LIMIT_WINDOW_MS = 60000        // 1 minute window
```

**Features:**
- **Token Bucket Algorithm**: Tracks requests with sliding window
- **Per-Key Limiting**: Supports multiple rate limiters (useful for user-based limiting)
- **Automatic Reset**: Window expires after configured time
- **Graceful Degradation**: Returns helpful error message with wait time
- **Rate Limit Info**: Get remaining requests and reset time

**Usage:**

Rate limiting is automatically applied to all API requests. No additional code needed.

```typescript
// Rate limiting is automatic - these requests will be limited
await wordpressAPI.getPosts();
await wordpressAPI.getPost(123);
await wordpressAPI.getCategories();
```

**Rate Limit Error:**

When rate limit is exceeded, a `RATE_LIMIT_ERROR` is thrown:

```typescript
try {
  await wordpressAPI.getPosts();
} catch (error) {
  if (error.type === ApiErrorType.RATE_LIMIT_ERROR) {
    console.error(`Rate limit exceeded: ${error.message}`);
    // Example: "Rate limit exceeded. Too many requests. Please try again in 5 seconds."
  }
}
```

**Advanced Usage (Per-Key Rate Limiting):**

```typescript
import { rateLimiterManager } from '@/lib/api/client'

// Check limit for specific key (e.g., user ID)
await rateLimiterManager.checkLimit('user-123');

// Get rate limit info
const info = rateLimiterManager.getInfo('user-123');
console.log(`${info.remainingRequests} requests remaining`);
console.log(`Resets at ${new Date(info.resetTime).toISOString()}`);

// Reset limiter
rateLimiterManager.reset('user-123');
```

---

## Health Check

Monitor WordPress API availability with health check endpoints.

### Basic Health Check

Check if WordPress API is healthy and available.

```typescript
import { checkApiHealth } from '@/lib/api/client';

const result = await checkApiHealth();

if (result.healthy) {
  console.log(`API is healthy (${result.latency}ms)`);
  if (result.version) {
    console.log(`WordPress API version: ${result.version}`);
  }
} else {
  console.error(`API is unhealthy: ${result.message}`);
  if (result.error) {
    console.error(`Error: ${result.error}`);
  }
}
```

**HealthCheckResult Interface:**
```typescript
interface HealthCheckResult {
  healthy: boolean;         // API status
  timestamp: string;           // ISO 8601 timestamp
  latency: number;            // Response time in milliseconds
  message: string;            // Status message
  version?: string;           // API version (if available)
  error?: string;             // Error details (if unhealthy)
}
```

---

### Health Check with Timeout

Set a timeout for health check to prevent hanging.

```typescript
import { checkApiHealthWithTimeout } from '@/lib/api/client';

const result = await checkApiHealthWithTimeout(5000);

if (result.healthy) {
  console.log('API is healthy');
} else if (result.message === 'Health check timed out') {
  console.log('Health check timed out after 5 seconds');
}
```

---

### Health Check with Retry

Automatically retry health check with exponential backoff.

```typescript
import { checkApiHealthRetry } from '@/lib/api/client';

const result = await checkApiHealthRetry(3, 1000);

if (result.healthy) {
  console.log('API is healthy after retries');
} else {
  console.log(`API unhealthy after 3 attempts: ${result.message}`);
}
```

**Parameters:**
- `maxAttempts`: Number of retry attempts (default: 3)
- `delayMs`: Delay between retries in milliseconds (default: 1000)

---

### Get Last Health Check

Retrieve the most recent health check result without making a new request.

```typescript
import { getLastHealthCheck } from '@/lib/api/client';

const lastCheck = getLastHealthCheck();

if (lastCheck) {
  console.log(`Last check: ${lastCheck.healthy ? 'HEALTHY' : 'UNHEALTHY'}`);
  console.log(`Checked at: ${lastCheck.timestamp}`);
  console.log(`Latency: ${lastCheck.latency}ms`);
} else {
  console.log('No health check has been performed yet');
}
```

---

### Health Check Integration with Circuit Breaker

Health checks are automatically performed when the circuit breaker is in HALF_OPEN state. This ensures that the circuit breaker only allows requests after verifying the WordPress API has recovered.

```typescript
// No manual action needed - health check happens automatically
// When circuit breaker is HALF_OPEN, a health check is performed
// before allowing any actual API requests
```

**Integration Behavior:**
1. Circuit breaker detects failures and moves to OPEN state
2. After recovery timeout (60s), circuit moves to HALF_OPEN state
3. Before each request in HALF_OPEN state, health check is performed
4. If health check passes → Circuit moves to CLOSED (normal operation)
5. If health check fails → Request blocked with helpful error message

---

## TypeScript Types

### WordPressPost

```typescript
interface WordPressPost {
  id: number;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  date: string;          // ISO 8601
  modified: string;      // ISO 8601
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  status: string;
  type: string;
  link: string;
}
```

### WordPressCategory

```typescript
interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  link: string;
}
```

### WordPressTag

```typescript
interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
}
```

### WordPressMedia

```typescript
interface WordPressMedia {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  media_type: string;
  mime_type: string;
  source_url: string;
  alt_text: string;
  caption: { rendered: string };
  description: { rendered: string };
}
```

### WordPressAuthor

```typescript
interface WordPressAuthor {
  id: number;
  name: string;
  slug: string;
  description: string;
  link: string;
  avatar_urls: {
    [size: string]: string;
  };
}
```

---

## Environment Configuration

Configure API behavior via environment variables.

```env
# API Endpoints
NEXT_PUBLIC_WORDPRESS_API_URL=https://mitrabantennews.com/wp-json

# Resilience Configuration
SKIP_RETRIES=false  # Set to true during CI/build when WordPress backend is unavailable
```

---

## Best Practices

### 1. Use Enhanced Post Service for Build-Time Data

```typescript
// Good - uses enhancedPostService with fallback and validation
const posts = await enhancedPostService.getLatestPosts();

// Avoid - direct API call may fail during build
const posts = await wordpressAPI.getPosts();
```

### 2. Cancel Stale Requests

```typescript
// In a React component
useEffect(() => {
  const controller = new AbortController();
  
  wordpressAPI.getPosts({}, controller.signal).then(setPosts);
  
  return () => controller.abort(); // Cancel on unmount
}, []);
```

### 3. Handle Errors Gracefully

```typescript
try {
  const post = await enhancedPostService.getPostBySlug(slug);
  if (!post) {
    return <PostNotFound />;
  }
  return <PostDetail post={post} />;
} catch (error) {
  return <ErrorBoundary />;
}
```

### 4. Warm Cache on Startup

```typescript
// In layout.tsx or root component
useEffect(() => {
  wordpressAPI.warmCache();
}, []);
```

### 5. Use AbortController for Navigation

```typescript
import { useRouter } from 'next/navigation';

function PostList() {
  const router = useRouter();
  const controllerRef = useRef<AbortController | null>(null);

  const loadPosts = async () => {
    // Cancel previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const posts = await wordpressAPI.getPosts({}, controller.signal);
      setPosts(posts);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load posts:', error);
      }
    }
  };

  useEffect(() => {
    loadPosts();
    
    // Cancel on route change
    const cleanup = router.events?.on('routeChangeStart', () => {
      controllerRef.current?.abort();
    });

    return () => {
      cleanup?.();
      controllerRef.current?.abort();
    };
  }, [router]);

  return <div>{/* render posts */}</div>;
}
```

---

## Troubleshooting

### Circuit Breaker Open

**Symptom:** All requests fail with `CIRCUIT_BREAKER_OPEN` error.

**Solution:**
1. Wait 60 seconds for automatic recovery
2. Check WordPress API is running: http://localhost:8080/wp-json/wp/v2/
3. Check logs for underlying errors
4. Manually clear cache: `wordpressAPI.clearCache()`

### Rate Limiting

**Symptom:** Requests fail with 429 status code.

**Solution:**
1. Reduce request frequency
2. Implement client-side caching
3. Use `SKIP_RETRIES=true` during CI/build

### Build Failures

**Symptom:** Build fails due to API unavailability.

**Solution:**
1. Set `SKIP_RETRIES=true` in environment
2. Use `enhancedPostService` methods (include fallback logic)
3. Ensure WordPress is running before build

### Timeout Errors

**Symptom:** Requests timeout after 10 seconds.

**Solution:**
1. Check WordPress API performance
2. Increase timeout: `API_TIMEOUT` in config
3. Reduce data requested (use `per_page` parameter)

---

## Health Check & Observability Endpoints

### GET /api/health

**Purpose**: Check WordPress API health and availability.

**Usage**: Load balancer health probes, uptime monitoring services.

**Response** (Healthy - 200):
```json
{
  "status": "healthy",
  "timestamp": "2026-01-10T10:00:00Z",
  "latency": 123,
  "version": "v2",
  "uptime": 3600
}
```

**Response** (Unhealthy - 503):
```json
{
  "status": "unhealthy",
  "timestamp": "2026-01-10T10:00:00Z",
  "message": "API is unhealthy",
  "error": "ECONNREFUSED",
  "latency": 5000
}
```

**Example**:
```typescript
// From monitoring service
const response = await fetch('http://localhost:3000/api/health');
const health = await response.json();

if (health.status === 'healthy') {
  console.log(`API is healthy (${health.latency}ms)`);
} else {
  console.error(`API is unhealthy: ${health.error}`);
  // Trigger alert
}
```

**Kubernetes Liveness Probe**:
```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: headlesswp
    livenessProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
```

---

### GET /api/health/readiness

**Purpose**: Check if application is ready to receive traffic.

**Usage**: Kubernetes readiness probes, deployment verification.

**Response** (Ready - 200):
```json
{
  "status": "ready",
  "checks": {
    "cache": {
      "status": "ok",
      "message": "Cache manager initialized"
    },
    "memory": {
      "status": "ok",
      "message": "Memory usage within limits"
    }
  },
  "timestamp": "2026-01-10T10:00:00Z",
  "uptime": 3600
}
```

**Response** (Not Ready - 503):
```json
{
  "status": "not-ready",
  "error": "Cache manager not initialized"
}
```

**Kubernetes Readiness Probe**:
```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: headlesswp
    readinessProbe:
      httpGet:
        path: /api/health/readiness
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
```

---

### GET /api/observability/metrics

**Purpose**: Export all resilience pattern metrics for monitoring dashboards and alerting.

**Usage**: Monitoring dashboards (Grafana, DataDog, New Relic), custom monitoring tools.

**Response**:
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
    "totalEvents": 1607,
    "recentEvents": [...]
  },
  "retry": {
    "retries": 45,
    "retrySuccesses": 38,
    "retryExhausted": 7,
    "totalEvents": 90,
    "recentEvents": [...]
  },
  "rateLimit": {
    "exceeded": 3,
    "resets": 0,
    "totalEvents": 3,
    "recentEvents": [...]
  },
  "healthCheck": {
    "healthy": 120,
    "unhealthy": 5,
    "totalEvents": 125,
    "recentEvents": [...]
  },
  "apiRequest": {
    "totalRequests": 1600,
    "successful": 1590,
    "failed": 10,
    "averageDuration": 125,
    "cacheHits": 1200,
    "cacheMisses": 400,
    "totalEvents": 1600,
    "recentEvents": [...]
  }
}
```

**Example - Monitor Circuit Breaker**:
```typescript
// From monitoring dashboard
const response = await fetch('http://localhost:3000/api/observability/metrics');
const metrics = await response.json();

// Check circuit breaker state
if (metrics.circuitBreaker.requestsBlocked > 0) {
  console.warn('Circuit breaker blocking requests!');
  // Trigger alert
}

// Check retry rate
const retryRate = metrics.retry.retries / metrics.apiRequest.totalRequests;
if (retryRate > 0.20) {
  console.warn(`High retry rate: ${retryRate.toFixed(2)}%`);
  // Trigger warning alert
}

// Check API response time
if (metrics.apiRequest.averageDuration > 500) {
  console.warn(`High API response time: ${metrics.apiRequest.averageDuration}ms`);
  // Trigger warning alert
}
```

**Example - Grafana Dashboard**:
```javascript
// Circuit Breaker State Changes
new PrometheusQuery(
  'circuit_breaker_state_changes_total',
  'Circuit Breaker State Changes'
);

// API Response Time
new PrometheusQuery(
  'api_request_duration_avg',
  'API Response Time (ms)'
);

// Cache Hit Rate
new PrometheusQuery(
  'api_request_cache_hits / api_request_total * 100',
  'Cache Hit Rate (%)'
);
```

**DataDog Integration**:
```typescript
// Send metrics to DataDog
const response = await fetch('http://localhost:3000/api/observability/metrics');
const metrics = await response.json();

fetch('https://http-intake.logs.datadoghq.com/v1/input/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'DD-API-KEY': process.env.DATADOG_API_KEY
  },
  body: JSON.stringify({
    ddsource: 'headlesswp',
    ddtags: 'env:production',
    message: 'Resilience metrics',
    metrics
  })
});
```

**See Also**: [Monitoring Guide](./MONITORING.md)

---

## Performance Tips

### 1. Use ISR Caching

```typescript
// In Next.js pages
export const revalidate = 300; // Revalidate every 5 minutes
```

### 2. Parallel API Calls

```typescript
// Good - parallel fetch
const [posts, categories, tags] = await Promise.all([
  enhancedPostService.getLatestPosts(),
  wordpressAPI.getCategories(),
  wordpressAPI.getTags(),
]);

// Avoid - sequential fetch
const posts = await enhancedPostService.getLatestPosts();
const categories = await wordpressAPI.getCategories();
const tags = await wordpressAPI.getTags();
```

### 3. Limit Response Size

```typescript
// Request only what you need
const posts = await wordpressAPI.getPosts({
  per_page: 10,          // Limit posts
  _fields: 'id,title,excerpt'  // Select specific fields
});
```

### 4. Warm Cache

```typescript
// Warm cache during startup
await wordpressAPI.warmCache();
```

---

## Testing

### Mock API Responses

```typescript
import { wordpressAPI } from '@/lib/wordpress';

// Mock API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

test('fetches posts', async () => {
  const mockPosts = [{ id: 1, title: { rendered: 'Test' } }];
  require('@/lib/api/client').apiClient.get.mockResolvedValue({ data: mockPosts });

  const posts = await wordpressAPI.getPosts();
  expect(posts).toEqual(mockPosts);
});
```

### Test Fallback Logic

```typescript
import { enhancedPostService } from '@/lib/services/enhancedPostService';

test('returns fallback posts on error', async () => {
  jest.spyOn(wordpressAPI, 'getPosts').mockRejectedValue(new Error('API error'));

  const posts = await enhancedPostService.getLatestPosts();
  expect(posts.length).toBeGreaterThanOrEqual(0);
});
```

---

## Additional Resources

- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Architecture Blueprint](./blueprint.md)
- [Task Backlog](./task.md)
