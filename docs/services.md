# Service Layer Usage Guide

This guide provides examples for using the service layer in the headless WordPress project.

## Table of Contents

- [Overview](#overview)
- [EnhancedPostService](#enhancedpostservice)
- [Fetching Posts](#fetching-posts)
- [Fetching by Category/Tag](#fetching-by-categorytag)
- [Error Handling](#error-handling)
- [Cache Invalidation](#cache-invalidation)
- [Search Functionality](#search-functionality)

---

## Overview

The service layer provides a unified interface for fetching WordPress data. The main service is `enhancedPostService` which handles:

- Data fetching from WordPress API
- Data validation
- Error handling with fallbacks
- Media URL enrichment
- Relationship enrichment (categories, tags, authors)
- Caching

### Import

```ts
import enhancedPostService from '@/lib/services/enhancedPostService';
import type { PostWithMediaUrl, PostWithDetails, PaginatedPostsResult } from '@/lib/services/IPostService';
```

---

## EnhancedPostService

The `enhancedPostService` provides the following methods:

| Method | Description | Returns |
|--------|-------------|---------|
| `getLatestPosts()` | Fetch latest posts | `Promise<PostWithMediaUrl[]>` |
| `getCategoryPosts()` | Fetch posts for category pages | `Promise<PostWithMediaUrl[]>` |
| `getAllPosts()` | Fetch all posts | `Promise<PostWithMediaUrl[]>` |
| `getPaginatedPosts(page, perPage)` | Fetch paginated posts | `Promise<PaginatedPostsResult>` |
| `getPostBySlug(slug)` | Fetch single post by slug | `Promise<PostWithDetails \| null>` |
| `getPostById(id)` | Fetch single post by ID | `Promise<PostWithDetails \| null>` |
| `getCategories()` | Fetch all categories | `Promise<WordPressCategory[]>` |
| `getTags()` | Fetch all tags | `Promise<WordPressTag[]>` |
| `searchPosts(query, page, perPage)` | Search posts | `Promise<PaginatedPostsResult>` |

---

## Fetching Posts

### Fetching Latest Posts

```tsx
import enhancedPostService from '@/lib/services/enhancedPostService';
import type { PostWithMediaUrl } from '@/lib/services/IPostService';

async function getLatestPosts(): Promise<PostWithMediaUrl[]> {
  const posts = await enhancedPostService.getLatestPosts();
  return posts;
}
```

### Fetching Paginated Posts

```tsx
import enhancedPostService from '@/lib/services/enhancedPostService';
import type { PaginatedPostsResult } from '@/lib/services/IPostService';

async function getPostsPage(page: number = 1, perPage: number = 10): Promise<PaginatedPostsResult> {
  return await enhancedPostService.getPaginatedPosts(page, perPage);
}
```

### Server Component Example

```tsx
import enhancedPostService from '@/lib/services/enhancedPostService';
import PostCard from '@/components/post/PostCard';

export default async function HomePage() {
  const { posts } = await enhancedPostService.getPaginatedPosts(1, 6);

  return (
    <main>
      <h1>Latest Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            mediaUrl={post.mediaUrl}
          />
        ))}
      </div>
    </main>
  );
}
```

### Client Component with Loading

```tsx
'use client';

import { useState, useEffect } from 'react';
import enhancedPostService from '@/lib/services/enhancedPostService';
import PostCard from '@/components/post/PostCard';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';
import type { PostWithMediaUrl } from '@/lib/services/IPostService';

export default function LatestPosts() {
  const [posts, setPosts] = useState<PostWithMediaUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    enhancedPostService.getLatestPosts()
      .then(setPosts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => <PostCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return <div>Error loading posts: {error}</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} />
      ))}
    </div>
  );
}
```

---

## Fetching by Category/Tag

### Fetching Single Post with Details

```tsx
import enhancedPostService from '@/lib/services/enhancedPostService';
import type { PostWithDetails } from '@/lib/services/IPostService';

async function getPostBySlug(slug: string): Promise<PostWithDetails | null> {
  return await enhancedPostService.getPostBySlug(slug);
}
```

### Post Detail Page Example

```tsx
import { notFound } from 'next/navigation';
import enhancedPostService from '@/lib/services/enhancedPostService';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';

interface PageProps {
  params: { slug: string };
}

export default async function PostPage({ params }: PageProps) {
  const post = await enhancedPostService.getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Blog', href: '/blog' },
          { label: post.title.rendered, href: `/berita/${post.slug}` },
        ]}
      />

      <article>
        <h1 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />

        {post.mediaUrl && (
          <img src={post.mediaUrl} alt={post.title.rendered} />
        )}

        <div>
          {post.categoriesDetails.map((cat) => (
            <Badge key={cat.id} href={`/category/${cat.slug}`} variant="category">
              {cat.name}
            </Badge>
          ))}
        </div>

        <div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />

        {post.authorDetails && (
          <div>
            <span>By {post.authorDetails.name}</span>
          </div>
        )}
      </article>
    </main>
  );
}
```

### Fetching Categories and Tags

```tsx
import enhancedPostService from '@/lib/services/enhancedPostService';
import type { WordPressCategory, WordPressTag } from '@/types/wordpress';

async function getCategories(): Promise<WordPressCategory[]> {
  return await enhancedPostService.getCategories();
}

async function getTags(): Promise<WordPressTag[]> {
  return await enhancedPostService.getTags();
}
```

### Category Page Example

```tsx
import enhancedPostService from '@/lib/services/enhancedPostService';
import PostCard from '@/components/post/PostCard';

interface PageProps {
  params: { category: string };
}

export default async function CategoryPage({ params }: PageProps) {
  const categories = await enhancedPostService.getCategories();
  const category = categories.find((c) => c.slug === params.category);

  if (!category) {
    return <div>Category not found</div>;
  }

  const posts = await enhancedPostService.getCategoryPosts();
  const categoryPosts = posts.filter((post) =>
    post.categories.includes(category.id)
  );

  return (
    <main>
      <h1>{category.name}</h1>
      <p>{category.description}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoryPosts.map((post) => (
          <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} />
        ))}
      </div>
    </main>
  );
}
```

---

## Error Handling

The service layer handles errors automatically with fallback data. However, you should handle errors in your components.

### Basic Error Handling

```tsx
import enhancedPostService from '@/lib/services/enhancedPostService';
import EmptyState from '@/components/ui/EmptyState';

async function PostsSection() {
  try {
    const posts = await enhancedPostService.getLatestPosts();

    if (posts.length === 0) {
      return (
        <EmptyState
          title="No posts available"
          description="Check back later for new content."
        />
      );
    }

    return (
      <div>
        {posts.map((post) => (
          <div key={post.id}>{post.title.rendered}</div>
        ))}
      </div>
    );
  } catch (error) {
    return (
      <EmptyState
        title="Error loading posts"
        description="Something went wrong. Please try again."
        action={{ label: 'Retry', href: '/' }}
      />
    );
  }
}
```

### Handling Single Post Errors

```tsx
import { notFound } from 'next/navigation';
import enhancedPostService from '@/lib/services/enhancedPostService';

interface PageProps {
  params: { slug: string };
}

export default async function PostPage({ params }: PageProps) {
  const post = await enhancedPostService.getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return <div dangerouslySetInnerHTML={{ __html: post.content.rendered }} />;
}
```

---

## Cache Invalidation

The service uses caching internally. Cache is automatically managed, but you can interact with the cache manager if needed.

### Cache Keys and TTL

The cache configuration is available from:

```ts
import { cacheManager, CACHE_TTL, cacheKeys, cacheDependencies } from '@/lib/cache';
```

Common cache keys:

```ts
// Get cached posts
const posts = cacheManager.get<PostWithMediaUrl[]>(cacheKeys.latestPosts());

// Set cache
cacheManager.set(cacheKeys.latestPosts(), posts, CACHE_TTL.LATEST_POSTS, []);

// Invalidate cache
cacheManager.invalidate(cacheKeys.latestPosts());
```

### Cache TTL Values

```ts
console.log(CACHE_TTL);
// {
//   LATEST_POSTS: 300,       // 5 minutes
//   CATEGORY_POSTS: 300,     // 5 minutes
//   ALL_POSTS: 600,          // 10 minutes
//   SINGLE_POST: 3600,       // 1 hour
//   CATEGORIES: 86400,       // 24 hours
//   TAGS: 86400,             // 24 hours
// }
```

---

## Search Functionality

### Basic Search

```tsx
import enhancedPostService from '@/lib/services/enhancedPostService';

async function search(query: string, page: number = 1) {
  const results = await enhancedPostService.searchPosts(query, page, 10);
  return results;
}
```

### Search Page Example

```tsx
import { Suspense } from 'react';
import { search } from '@/lib/actions/search';
import SearchBar from '@/components/ui/SearchBar';
import PostCard from '@/components/post/PostCard';
import Pagination from '@/components/ui/Pagination';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';

interface PageProps {
  searchParams: { q?: string; page?: string };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const query = searchParams.q || '';
  const page = parseInt(searchParams.page || '1', 10);

  const results = await enhancedPostService.searchPosts(query, page, 10);

  return (
    <main>
      <SearchBar defaultValue={query} />

      {results.posts.length === 0 ? (
        <div>No results found for "{query}"</div>
      ) : (
        <>
          <p>Found {results.totalPosts} results</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.posts.map((post) => (
              <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={results.totalPages}
            basePath="/search"
            query={{ q: query }}
          />
        </>
      )}
    </main>
  );
}
```

### Client-Side Search

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/ui/SearchBar';

export default function SearchForm() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <SearchBar value={query} onChange={setQuery} onSubmit={handleSearch} />
  );
}
```

---

## Best Practices

1. **Use Server Components**: Fetch data in server components when possible for better performance.

2. **Handle Loading States**: Always show skeleton loaders while data is fetching.

3. **Handle Empty States**: Use EmptyState component when no data is available.

4. **Use Fallbacks**: The service automatically provides fallback data on errors.

5. **Type Safety**: Always use the TypeScript types from `IPostService`.

6. **Pagination**: Use `getPaginatedPosts` for large datasets rather than `getAllPosts`.

7. **Media URLs**: Use the `mediaUrl` property from `PostWithMediaUrl` for featured images.
