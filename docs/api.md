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
import { postService } from '@/lib/services/postService';
```

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

## Post Service Reference

The post service provides high-level methods with built-in fallback logic for handling build-time failures.

### getLatestPosts

Get the latest posts with automatic fallback on failure.

```typescript
const posts = await postService.getLatestPosts();
```

**Behavior:**
- On success: Returns 6 latest posts from WordPress
- On failure: Returns 3 fallback posts with Indonesian error message
- Caches results automatically

**Returns:**
```typescript
Promise<WordPressPost[]>
```

**Example Usage in Next.js Page:**

```typescript
// src/app/page.tsx
import { postService } from '@/lib/services/postService';

export default async function HomePage() {
  const latestPosts = await postService.getLatestPosts();

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
const posts = await postService.getCategoryPosts();
```

**Behavior:**
- On success: Returns 3 posts from WordPress
- On failure: Returns 3 fallback posts with Indonesian error message
- Caches results automatically

**Returns:**
```typescript
Promise<WordPressPost[]>
```

---

### getPostBySlug

Get a single post by slug with null fallback on failure.

```typescript
const post = await postService.getPostBySlug('berita-terbaru');
```

**Behavior:**
- On success: Returns post data
- On failure: Returns null
- Logs error to console

**Returns:**
```typescript
Promise<WordPressPost | null>
```

**Example Usage in Next.js Dynamic Route:**

```typescript
// src/app/berita/[slug]/page.tsx
import { postService } from '@/lib/services/postService';

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await postService.getPostBySlug(params.slug);

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

### 1. Use Post Service for Build-Time Data

```typescript
// Good - uses postService with fallback
const posts = await postService.getLatestPosts();

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
  const post = await postService.getPostBySlug(slug);
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
2. Use `postService` methods (include fallback logic)
3. Ensure WordPress is running before build

### Timeout Errors

**Symptom:** Requests timeout after 10 seconds.

**Solution:**
1. Check WordPress API performance
2. Increase timeout: `API_TIMEOUT` in config
3. Reduce data requested (use `per_page` parameter)

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
  postService.getLatestPosts(),
  wordpressAPI.getCategories(),
  wordpressAPI.getTags(),
]);

// Avoid - sequential fetch
const posts = await postService.getLatestPosts();
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
import { postService } from '@/lib/services/postService';

test('returns fallback posts on error', async () => {
  jest.spyOn(wordpressAPI, 'getPosts').mockRejectedValue(new Error('API error'));

  const posts = await postService.getLatestPosts();
  expect(posts.length).toBe(3);
  expect(posts[0].title.rendered).toContain('Berita Utama');
});
```

---

## Additional Resources

- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Architecture Blueprint](./blueprint.md)
- [Task Backlog](./task.md)
