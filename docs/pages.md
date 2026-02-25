# Page Creation Guide

This guide explains how to create new pages in the headless WordPress Next.js application.

## Table of Contents

- [File Structure](#file-structure)
- [Creating a Basic Page](#creating-a-basic-page)
- [ISR Configuration](#isr-configuration)
- [Dynamic Routes](#dynamic-routes)
- [SEO Metadata](#seo-metadata)
- [Error Handling](#error-handling)
- [Loading States](#loading-states)
- [Complete Example](#complete-example)

---

## File Structure

Pages are located in `src/app/` directory using the App Router:

```
src/app/
├── page.tsx              # Home page (/)
├── berita/
│   ├── page.tsx          # News listing (/berita)
│   └── [slug]/
│       └── page.tsx      # Single post (/berita/my-post)
└── category/
    └── [slug]/
        └── page.tsx      # Category page (/category/my-category)
```

---

## Creating a Basic Page

### Simple Page

```tsx
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1>About Us</h1>
        <p>Welcome to our blog.</p>
      </main>
      <Footer />
    </div>
  );
}
```

### Page with Data Fetching

```tsx
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PostCard from '@/components/post/PostCard';
import enhancedPostService from '@/lib/services/enhancedPostService';

export const revalidate = 300; // ISR: revalidate every 5 minutes

export default async function BlogPage() {
  const posts = await enhancedPostService.getLatestPosts();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1>Latest Posts</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              mediaUrl={post.mediaUrl}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
```

---

## ISR Configuration

Use `revalidate` to enable Incremental Static Regeneration:

```tsx
// Revalidate every 5 minutes
export const revalidate = 300;

// Revalidate every hour
export const revalidate = 3600;

// Revalidate every 10 minutes
export const revalidate = 600;

// Use ISR=false or export const dynamic = 'force-dynamic' for no caching
export const dynamic = 'force-dynamic';
```

### Recommended Revalidation Times

| Page Type | Revalidate Time | Rationale |
|-----------|----------------|-----------|
| Home | 300 (5 min) | Frequently updated content |
| Blog Listing | 300 (5 min) | New posts appear regularly |
| Single Post | 3600 (1 hour) | Content rarely changes |
| Category | 600 (10 min) | Moderate update frequency |
| Search | N/A | Use client-side fetching |
| About/Static | 86400 (24 hours) | Rarely changes |

---

## Dynamic Routes

### Single Post Page

```tsx
// src/app/berita/[slug]/page.tsx

import { enhancedPostService } from '@/lib/services/enhancedPostService';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Badge from '@/components/ui/Badge';
import MetaInfo from '@/components/ui/MetaInfo';
import { sanitizeHTML } from '@/lib/utils/sanitizeHTML';

export const revalidate = 3600;

interface PageProps {
  params: { slug: string };
}

export default async function PostPage({ params }: PageProps) {
  const post = await enhancedPostService.getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const breadcrumbItems = [
    { label: 'Berita', href: '/berita' },
    { label: post.title.rendered, href: `/berita/${post.slug}` }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumb items={breadcrumbItems} />
        
        <article>
          {post.featured_media > 0 && post.mediaUrl && (
            <div className="relative h-64 md:h-96">
              <Image
                src={post.mediaUrl}
                alt={post.title.rendered}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          )}

          <h1 dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
          
          <MetaInfo date={post.date} />

          {post.categoriesDetails.length > 0 && (
            <div className="flex gap-2">
              {post.categoriesDetails.map((cat) => (
                <Badge key={cat.id} variant="category">
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}

          <div
            dangerouslySetInnerHTML={{ 
              __html: sanitizeHTML(post.content.rendered, 'full') 
            }}
          />
        </article>
      </main>
    </div>
  );
}
```

### Category Page

```tsx
// src/app/category/[slug]/page.tsx

import { enhancedPostService } from '@/lib/services/enhancedPostService';
import Header from '@/components/layout/Header';
import PostCard from '@/components/post/PostCard';
import Breadcrumb from '@/components/ui/Breadcrumb';

export const revalidate = 600;

interface PageProps {
  params: { slug: string };
}

export default async function CategoryPage({ params }: PageProps) {
  const categories = await enhancedPostService.getCategories();
  const category = categories.find((c) => c.slug === params.slug);

  if (!category) {
    return <div>Category not found</div>;
  }

  const posts = await enhancedPostService.getCategoryPosts();
  const categoryPosts = posts.filter((post) =>
    post.categories.includes(category.id)
  );

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: category.name, href: `#` }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb items={breadcrumbItems} />
        
        <h1>{category.name}</h1>
        {category.description && <p>{category.description}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categoryPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              mediaUrl={post.mediaUrl}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
```

---

## SEO Metadata

### Basic Metadata

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description for SEO',
};

export default function Page() {
  // ...
}
```

### Dynamic Metadata

```tsx
import type { Metadata } from 'next';
import { enhancedPostService } from '@/lib/services/enhancedPostService';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await enhancedPostService.getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title.rendered,
    description: post.excerpt.rendered.replace(/<[^>]*>/g, '').slice(0, 160),
    openGraph: {
      title: post.title.rendered,
      description: post.excerpt.rendered.replace(/<[^>]*>/g, '').slice(0, 160),
      images: post.mediaUrl ? [{ url: post.mediaUrl }] : [],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  // ...
}
```

---

## Error Handling

### Using notFound()

```tsx
import { notFound } from 'next/navigation';
import enhancedPostService from '@/lib/services/enhancedPostService';

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await enhancedPostService.getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return <div>{post.title.rendered}</div>;
}
```

### Custom Error Page

```tsx
// src/app/error.tsx

'use client';

import { useEffect } from 'react';
import Header from '@/components/layout/Header';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2>Something went wrong!</h2>
        <p>{error.message}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Try again
        </button>
      </main>
    </div>
  );
}
```

### Custom Not Found Page

```tsx
// src/app/not-found.tsx

import Link from 'next/link';
import Header from '@/components/layout/Header';

export default function NotFound() {
  return (
    <div>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <Link href="/" className="text-primary">
          Return
        </Link>
      </main Home>
    </div>
  );
}
```

---

## Loading States

### Loading Component

```tsx
// src/app/berita/loading.tsx

import PostCardSkeleton from '@/components/post/PostCardSkeleton';

export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

### Skeleton Patterns

```tsx
// src/app/loading.tsx

import Skeleton from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" className="h-8 w-1/2" />
      <Skeleton variant="text" className="h-4 w-full" />
      <Skeleton variant="text" className="h-4 w-3/4" />
      <Skeleton variant="rounded" className="h-64 w-full" />
    </div>
  );
}
```

---

## Complete Example

Here's a complete example of a category page with all the patterns:

```tsx
// src/app/category/[slug]/page.tsx

import type { Metadata } from 'next';
import { enhancedPostService } from '@/lib/services/enhancedPostService';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PostCard from '@/components/post/PostCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import SectionHeading from '@/components/ui/SectionHeading';

export const revalidate = 600;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const categories = await enhancedPostService.getCategories();
  const category = categories.find((c) => c.slug === params.slug);

  return {
    title: category ? `${category.name} - Blog` : 'Category Not Found',
    description: category?.description || 'Browse posts in this category',
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const categories = await enhancedPostService.getCategories();
  const category = categories.find((c) => c.slug === params.slug);

  if (!category) {
    notFound();
  }

  const posts = await enhancedPostService.getCategoryPosts();
  const categoryPosts = posts.filter((post) =>
    post.categories.includes(category.id)
  );

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: category.name, href: `/category/${category.slug}` }
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />
      
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />
        
        <SectionHeading className="mb-6">
          {category.name}
        </SectionHeading>
        
        {category.description && (
          <p className="text-lg text-[hsl(var(--color-text-secondary))] mb-8">
            {category.description}
          </p>
        )}

        {categoryPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[hsl(var(--color-text-muted))]">
              No posts in this category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                mediaUrl={post.mediaUrl}
                priority={index < 3}
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
```

---

## Best Practices

1. **Use Server Components**: Fetch data in server components for better performance.

2. **Set ISR Revalidation**: Use appropriate `revalidate` times for each page type.

3. **Handle Errors**: Always use `notFound()` when data is not found.

4. **Add SEO Metadata**: Include `generateMetadata` for dynamic pages.

5. **Use Loading States**: Create `loading.tsx` files for better UX.

6. **Use Breadcrumbs**: Help users navigate with Breadcrumb components.

7. **Use Semantic HTML**: Use proper `<main>`, `<article>`, `<section>` tags.

8. **Lazy Load Footer**: Use `dynamic()` for Footer to improve initial load.
