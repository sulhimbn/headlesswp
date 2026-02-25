# Component Usage Guide

This guide provides practical examples for using UI components in the headless WordPress project.

## Table of Contents

- [Button](#button)
- [Badge](#badge)
- [Breadcrumb](#breadcrumb)
- [Pagination](#pagination)
- [EmptyState](#emptystate)
- [PostCard](#postcard)
- [Skeleton](#skeleton)

---

## Button

The Button component supports multiple variants, sizes, and states.

### Basic Usage

```tsx
import Button from '@/components/ui/Button';

export default function MyPage() {
  return (
    <Button>Click me</Button>
  );
}
```

### Variants

```tsx
// Primary (default)
<Button variant="primary">Primary</Button>

// Secondary
<Button variant="secondary">Secondary</Button>

// Outline
<Button variant="outline">Outline</Button>

// Ghost
<Button variant="ghost">Ghost</Button>
```

### Sizes

```tsx
// Small
<Button size="sm">Small</Button>

// Medium (default)
<Button size="md">Medium</Button>

// Large
<Button size="lg">Large</Button>
```

### Loading State

```tsx
import { useState } from 'react';
import Button from '@/components/ui/Button';

function LoadingButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    await doSomething();
    setIsLoading(false);
  };

  return (
    <Button isLoading={isLoading} onClick={handleClick}>
      Submit
    </Button>
  );
}
```

### Full Width

```tsx
<Button fullWidth>Full Width Button</Button>
```

### Disabled State

```tsx
<Button disabled>Disabled</Button>
```

### With Custom ClassName

```tsx
<Button className="my-4">Custom Styling</Button>
```

---

## Badge

The Badge component is used for labels and categories.

### Basic Usage

```tsx
import Badge from '@/components/ui/Badge';

<Badge>Default Badge</Badge>
```

### Variants

```tsx
// Category variant (styled for categories)
<Badge variant="category">News</Badge>

// Tag variant (styled for tags)
<Badge variant="tag">Tutorial</Badge>

// Default variant
<Badge variant="default">Label</Badge>
```

### As Link

```tsx
import Badge from '@/components/ui/Badge';

<Badge href="/category/news" variant="category">
  News
</Badge>
```

### In a List

```tsx
import Badge from '@/components/ui/Badge';

function PostCategories({ categories }: { categories: string[] }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {categories.map((cat) => (
        <Badge key={cat} href={`/category/${cat.toLowerCase()}`} variant="category">
          {cat}
        </Badge>
      ))}
    </div>
  );
}
```

---

## Breadcrumb

The Breadcrumb component displays navigation path.

### Basic Usage

```tsx
import Breadcrumb from '@/components/ui/Breadcrumb';

<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: 'Post Title', href: '/blog/post-title' },
  ]}
/>
```

### With Dynamic Items

```tsx
import Breadcrumb from '@/components/ui/Breadcrumb';

function PostBreadcrumb({ category, postTitle }: { category: string; postTitle: string }) {
  const items = [
    { label: 'Home', href: '/' },
    { label: category, href: `/category/${category.toLowerCase()}` },
    { label: postTitle, href: '#' },
  ];

  return <Breadcrumb items={items} />;
}
```

---

## Pagination

The Pagination component provides navigation between pages.

### Basic Usage

```tsx
import Pagination from '@/components/ui/Pagination';

<Pagination
  currentPage={1}
  totalPages={5}
  basePath="/blog"
/>
```

### With Query Parameters

```tsx
import Pagination from '@/components/ui/Pagination';

<Pagination
  currentPage={2}
  totalPages={10}
  basePath="/search"
  query={{ category: 'news', sort: 'recent' }}
/>
```

### In a Page Component

```tsx
import Pagination from '@/components/ui/Pagination';

export default function BlogPage({ searchParams }: { searchParams: { page?: string } }) {
  const currentPage = parseInt(searchParams.page || '1', 10);
  const totalPages = 10;

  return (
    <main>
      {/* Post list */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        basePath="/blog"
      />
    </main>
  );
}
```

---

## EmptyState

The EmptyState component displays when there's no content.

### Basic Usage

```tsx
import EmptyState from '@/components/ui/EmptyState';

<EmptyState
  title="No posts found"
  description="There are no posts available at the moment."
/>
```

### With Action Button

```tsx
import EmptyState from '@/components/ui/EmptyState';

<EmptyState
  title="No results found"
  description="Try adjusting your search terms."
  action={{
    label: 'View all posts',
    href: '/blog',
  }}
/>
```

### With Custom Icon

```tsx
import EmptyState from '@/components/ui/EmptyState';
import { SomeIcon } from '@/components/ui/Icon';

<EmptyState
  title="No favorites yet"
  description="Start adding posts to your favorites."
  icon={<SomeIcon />}
/>
```

### For Error Handling

```tsx
import EmptyState from '@/components/ui/EmptyState';

function ErrorDisplay({ message }: { message: string }) {
  return (
    <EmptyState
      title="Something went wrong"
      description={message}
      action={{
        label: 'Try again',
        href: '/',
      }}
    />
  );
}
```

---

## PostCard

The PostCard component displays a post preview.

### Basic Usage

```tsx
import PostCard from '@/components/post/PostCard';
import type { WordPressPost } from '@/types/wordpress';

const post: WordPressPost = {
  id: 1,
  slug: 'hello-world',
  title: { rendered: 'Hello World' },
  excerpt: { rendered: '<p>This is the excerpt</p>' },
  date: '2024-01-15T10:00:00',
  featured_media: 0,
  categories: [],
  tags: [],
  author: 1,
};

<PostCard post={post} />
```

### With Featured Media

```tsx
<PostCard
  post={post}
  mediaUrl="https://example.com/image.jpg"
/>
```

### With Priority Loading

```tsx
// Use priority for above-the-fold images
<PostCard
  post={post}
  mediaUrl={post.mediaUrl}
  priority={true}
/>
```

### In a Grid

```tsx
import PostCard from '@/components/post/PostCard';
import type { PostWithMediaUrl } from '@/lib/services/IPostService';

function PostGrid({ posts }: { posts: PostWithMediaUrl[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          mediaUrl={post.mediaUrl}
        />
      ))}
    </div>
  );
}
```

### Server-Side Data Fetching

```tsx
import PostCard from '@/components/post/PostCard';
import enhancedPostService from '@/lib/services/enhancedPostService';

async function LatestPosts() {
  const posts = await enhancedPostService.getLatestPosts();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post, index) => (
        <PostCard
          key={post.id}
          post={post}
          mediaUrl={post.mediaUrl}
          priority={index < 3}
        />
      ))}
    </div>
  );
}
```

---

## Skeleton

The Skeleton component displays loading placeholders.

### Variants

```tsx
import Skeleton from '@/components/ui/Skeleton';

// Text skeleton (default)
<Skeleton variant="text" />

// Circular skeleton (for avatars)
<Skeleton variant="circular" />

// Rectangular skeleton (default when no variant)
<Skeleton variant="rectangular" />

// Rounded skeleton
<Skeleton variant="rounded" />
```

### With Custom Styling

```tsx
<Skeleton className="h-4 w-1/2" variant="text" />
<Skeleton className="h-20 w-20" variant="circular" />
<Skeleton className="h-32 w-full" variant="rounded" />
```

### Loading Card Skeleton

```tsx
import Skeleton from '@/components/ui/Skeleton';

function PostCardSkeleton() {
  return (
    <div className="bg-[hsl(var(--color-surface))] rounded-lg shadow-md overflow-hidden">
      <Skeleton variant="rectangular" className="h-48 w-full" />
      <div className="p-4">
        <Skeleton variant="text" className="h-6 w-3/4 mb-2" />
        <Skeleton variant="text" className="h-4 w-full mb-1" />
        <Skeleton variant="text" className="h-4 w-2/3 mb-3" />
        <Skeleton variant="text" className="h-3 w-1/4" />
      </div>
    </div>
  );
}
```

### Loading State Pattern

```tsx
'use client';

import { useState, useEffect } from 'react';
import PostCard from '@/components/post/PostCard';
import PostCardSkeleton from '@/components/post/PostCardSkeleton';
import enhancedPostService from '@/lib/services/enhancedPostService';
import type { PostWithMediaUrl } from '@/lib/services/IPostService';

export default function PostsLoader() {
  const [posts, setPosts] = useState<PostWithMediaUrl[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    enhancedPostService.getLatestPosts().then((posts) => {
      setPosts(posts);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
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

## Best Practices

1. **Use semantic HTML**: Components use proper ARIA attributes for accessibility.

2. **Memoization**: All components are memoized for performance. Use stable prop references when possible.

3. **Loading States**: Always show skeleton loaders while data is fetching.

4. **Error Handling**: Use EmptyState for error and empty result displays.

5. **Images**: Use the `priority` prop for above-the-fold PostCard images to improve LCP.
