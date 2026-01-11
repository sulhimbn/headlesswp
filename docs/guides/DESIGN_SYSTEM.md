# Design System Guide

Guide to HeadlessWP design system, including design tokens, component library, and usage patterns.

## Table of Contents

- [Overview](#overview)
- [Design Tokens](#design-tokens)
- [UI Components](#ui-components)
  - [Button](#button)
  - [Badge](#badge)
  - [Icon](#icon)
  - [SearchBar](#searchbar)
  - [MetaInfo](#metainfo)
  - [Pagination](#pagination)
  - [SectionHeading](#sectionheading)
  - [EmptyState](#emptystate)
  - [Skeleton](#skeleton)
  - [Breadcrumb](#breadcrumb)
- [Layout Components](#layout-components)
  - [Header](#header)
  - [Footer](#footer)
- [Design Principles](#design-principles)
- [Accessibility](#accessibility)
- [Best Practices](#best-practices)

---

## Overview

HeadlessWP uses a **design token-based system** for consistent, maintainable UI design. All components use CSS variables defined in `src/app/globals.css` as the single source of truth.

**Key Benefits**:
- **Consistency**: Visual consistency across all components
- **Maintainability**: Update design in one place
- **Theming**: Easy dark mode or custom themes
- **Scalability**: Centralized system that grows with application

---

## Design Tokens

### Quick Reference

All design tokens are CSS variables in `src/app/globals.css`. Use them instead of hardcoded Tailwind values.

**Colors**:
- Primary: `--color-primary` (red theme)
- Secondary: `--color-secondary` (gray neutrals)
- Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- Surface: `--color-surface`, `--color-background`
- Border: `--color-border`

**Spacing**:
- `--spacing-xs` (4px) to `--spacing-3xl` (64px)

**Typography**:
- `--text-xs` (12px) to `--text-3xl` (30px)

**Border Radius**:
- `--radius-sm` (4px) to `--radius-xl` (12px)

**Shadows**:
- `--shadow-sm` to `--shadow-xl`

**Transitions**:
- `--transition-fast` (150ms), `--transition-normal` (300ms), `--transition-slow` (500ms)

### Usage in Components

**Good - Using Design Tokens**:
```tsx
className="bg-[hsl(var(--color-primary))] rounded-[var(--radius-md)]"
```

**Bad - Hardcoded Values**:
```tsx
className="bg-red-600 rounded-md"
```

### Common Mappings

| Tailwind Class | Design Token |
|----------------|---------------|
| `bg-white` | `bg-[hsl(var(--color-surface))]` |
| `bg-gray-50` | `bg-[hsl(var(--color-background))]` |
| `bg-red-600` | `bg-[hsl(var(--color-primary))]` |
| `text-gray-900` | `text-[hsl(var(--color-text-primary))]` |
| `rounded-md` | `rounded-[var(--radius-md)]` |
| `shadow-md` | `shadow-[var(--shadow-md)]` |

For complete design tokens reference, see [Architecture Blueprint](../blueprint.md#design-tokens).

---

## UI Components

### Button

Primary interactive component for actions and navigation.

**Import**:
```tsx
import Button from '@/components/ui/Button'
```

**Props**:
| Prop | Type | Default | Description |
|------|-------|----------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Button style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `isLoading` | `boolean` | `false` | Show loading spinner |
| `fullWidth` | `boolean` | `false` | Full width container |
| `children` | `ReactNode` | - | Button content |

**Variants**:
- **Primary**: Main action buttons (red background)
- **Secondary**: Secondary actions (gray background)
- **Outline**: Bordered buttons (transparent background)
- **Ghost**: Minimal buttons (text-only, hover effect)

**Examples**:

```tsx
// Primary button
<Button onClick={handleSubmit}>Submit</Button>

// Secondary button
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>

// Loading state
<Button isLoading={isSubmitting} onClick={handleSubmit}>Submit</Button>

// Full width
<Button fullWidth onClick={handleAction}>Full Width</Button>

// Size variants
<Button size="sm" onClick={handleSmall}>Small</Button>
<Button size="md" onClick={handleMedium}>Medium</Button>
<Button size="lg" onClick={handleLarge}>Large</Button>
```

---

### Badge

Small label component for categories, tags, and status indicators.

**Import**:
```tsx
import Badge from '@/components/ui/Badge'
```

**Props**:
| Prop | Type | Default | Description |
|------|-------|----------|-------------|
| `variant` | `'category' \| 'tag' \| 'default'` | `'default'` | Badge style |
| `href` | `string` | - | Optional link destination |
| `children` | `ReactNode` | - | Badge content |
| `className` | `string` | `''` | Additional styles |

**Variants**:
- **Category**: Light red background, dark red text (for categories)
- **Tag**: Gray background, dark gray text (for tags)
- **Default**: Gray background, dark gray text

**Examples**:

```tsx
// Category badge (with link)
<Badge variant="category" href="/category/politik">
  Politik
</Badge>

// Tag badge (static)
<Badge variant="tag">Pemilu 2024</Badge>

// Default badge
<Badge>New</Badge>

// With custom styling
<Badge variant="category" className="ml-2">
  Ekonomi
</Badge>
```

---

### Icon

Reusable icon component with predefined icon types.

**Import**:
```tsx
import Icon from '@/components/ui/Icon'
```

**Props**:
| Prop | Type | Default | Description |
|------|-------|----------|-------------|
| `type` | IconType | - | Icon type (required) |
| `className` | `string` | `''` | Additional styles |
| `aria-hidden` | `boolean` | `true` | Hide from screen readers |

**Available Icon Types**:
- `facebook` - Facebook logo
- `twitter` - Twitter/X logo
- `instagram` - Instagram logo
- `close` - Close (X) icon
- `menu` - Hamburger menu icon
- `loading` - Loading spinner
- `search` - Magnifying glass

**Examples**:

```tsx
// Social icons
<Icon type="facebook" className="w-6 h-6" />
<Icon type="twitter" className="w-6 h-6" />
<Icon type="instagram" className="w-6 h-6" />

// UI icons
<Icon type="close" className="w-5 h-5" />
<Icon type="menu" className="w-6 h-6" />
<Icon type="search" className="w-5 h-5" />

// Loading spinner
<Icon type="loading" className="animate-spin w-5 h-5" />
```

---

### SearchBar

Search input with debouncing, loading states, and clear button.

**Import**:
```tsx
import { SearchBar } from '@/components/ui/SearchBar'
```

**Props**:
| Prop | Type | Default | Description |
|------|-------|----------|-------------|
| `onSearch` | `(query: string) => void` | - | Called when search query changes (debounced) |
| `placeholder` | `string` | `'Search...'` | Input placeholder text |
| `isLoading` | `boolean` | `false` | Show loading state |
| `debounceMs` | `number` | `300` | Debounce delay in milliseconds |
| `initialValue` | `string` | `''` | Initial search query |
| `ariaLabel` | `string` | `'Search'` | Accessibility label |
| `className` | `string` | `''` | Additional styles |

**Features**:
- **Debounced input**: Waits before triggering search (reduces API calls)
- **Loading state**: Shows spinner during search operations
- **Clear button**: Click to clear search query
- **Keyboard navigation**: Full Tab/Enter/Escape support
- **Accessibility**: ARIA attributes for screen readers

**Examples**:

```tsx
// Basic search
<SearchBar onSearch={(query) => console.log(query)} />

// With loading state
<SearchBar
  isLoading={isSearching}
  onSearch={handleSearch}
/>

// Custom debounce
<SearchBar
  debounceMs={500}
  onSearch={handleSearch}
/>

// With initial value
<SearchBar
  initialValue="pemilihan"
  onSearch={handleSearch}
/>

// Custom placeholder
<SearchBar
  placeholder="Cari berita..."
  onSearch={handleSearch}
/>
```

---

### MetaInfo

Displays post metadata (author, date) with separator.

**Import**:
```tsx
import { MetaInfo } from '@/components/ui/MetaInfo'
```

**Props**:
| Prop | Type | Default | Description |
|------|-------|----------|-------------|
| `author` | `string` | - | Author name |
| `date` | `string` | - | Post date |
| `separator` | `string` | `'•'` | Separator character |
| `className` | `string` | `''` | Additional styles |

**Examples**:

```tsx
// Basic usage
<MetaInfo
  author="John Doe"
  date="2024-01-15"
/>

// Custom separator
<MetaInfo
  author="John Doe"
  date="2024-01-15"
  separator="|"
/>

// With styling
<MetaInfo
  author="John Doe"
  date="2024-01-15"
  className="text-sm text-[hsl(var(--color-text-muted))]"
/>
```

---

### Pagination

Navigate through paginated content.

**Import**:
```tsx
import { Pagination } from '@/components/ui/Pagination'
```

**Props**:
| Prop | Type | Default | Description |
|------|-------|----------|-------------|
| `currentPage` | `number` | - | Current page number |
| `totalPages` | `number` | - | Total pages |
| `onPageChange` | `(page: number) => void` | - | Called when page changes |

**Examples**:

```tsx
// Basic pagination
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
/>

// In a post list page
<Pagination
  currentPage={page}
  totalPages={Math.ceil(totalPosts / postsPerPage)}
  onPageChange={(newPage) => router.push(`/berita?page=${newPage}`)}
/>
```

---

### SectionHeading

Consistent section headers with optional IDs for anchor linking.

**Import**:
```tsx
import { SectionHeading } from '@/components/ui/SectionHeading'
```

**Props**:
| Prop | Type | Default | Description |
|------|-------|----------|-------------|
| `children` | `ReactNode` | - | Heading text |
| `id` | `string` | - | Optional ID for anchor linking |

**Examples**:

```tsx
// Basic heading
<SectionHeading>Latest News</SectionHeading>

// With anchor link
<SectionHeading id="latest-news">Latest News</SectionHeading>

// Link to heading from anywhere
<a href="#latest-news">Go to Latest News</a>
```

---

### EmptyState

Display when no content is available.

**Import**:
```tsx
import { EmptyState } from '@/components/ui/EmptyState'
```

**Props**:
| Prop | Type | Default | Description |
|------|-------|----------|-------------|
| `message` | `string` | - | Message to display |
| `className` | `string` | `''` | Additional styles |

**Examples**:

```tsx
// No results message
<EmptyState message="No posts found" />

// Empty category
<EmptyState
  message="Tidak ada berita di kategori ini"
  className="py-12"
/>
```

---

### Skeleton

Loading placeholder components for various content types.

**Import**:
```tsx
import {
  PostCardSkeleton,
  SectionHeadingSkeleton,
  MetaInfoSkeleton,
  BadgeSkeleton
} from '@/components/ui/Skeleton'
```

**Available Skeletons**:
- `PostCardSkeleton` - Post card placeholder
- `SectionHeadingSkeleton` - Section heading placeholder
- `MetaInfoSkeleton` - Metadata placeholder
- `BadgeSkeleton` - Badge placeholder

**Examples**:

```tsx
// Loading state for post list
<div>
  <SectionHeadingSkeleton />
  <PostCardSkeleton />
  <PostCardSkeleton />
  <PostCardSkeleton />
</div>

// In loading.tsx file
export default function Loading() {
  return (
    <div>
      <SectionHeadingSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </div>
  )
}
```

---

### Breadcrumb

Navigation path showing user's location in site hierarchy.

**Import**:
```tsx
import { Breadcrumb } from '@/components/ui/Breadcrumb'
```

**Props**:
| Prop | Type | Default | Description |
|------|-------|----------|-------------|
| `items` | `BreadcrumbItem[]` | - | Breadcrumb items |

**BreadcrumbItem Interface**:
```tsx
interface BreadcrumbItem {
  label: string
  href?: string
}
```

**Examples**:

```tsx
// Breadcrumb on post page
<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Berita', href: '/berita' },
    { label: 'Politik', href: '/berita/politik' },
    { label: 'Post Title' }
  ]}
/>
```

---

## Layout Components

### Header

Site header with navigation and mobile menu.

**Import**:
```tsx
import { Header } from '@/components/layout/Header'
```

**Features**:
- Navigation menu with category links
- Mobile hamburger menu
- Skip-to-content link for accessibility

**Usage** (in `src/app/layout.tsx`):
```tsx
import { Header } from '@/components/layout/Header'

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

---

### Footer

Site footer with links and information.

**Import**:
```tsx
import { Footer } from '@/components/layout/Footer'
```

**Features**:
- Site information and links
- Social media icons
- Copyright information

**Usage** (in `src/app/layout.tsx`):
```tsx
import { Footer } from '@/components/layout/Footer'

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

---

## Design Principles

### 1. Design Tokens First

Always use design tokens instead of hardcoded values.

**Why?**
- Consistency across components
- Easy theming (dark mode)
- Centralized updates

**How?**
```tsx
// Good
className="bg-[hsl(var(--color-primary))]"

// Bad
className="bg-red-600"
```

### 2. Mobile-First Design

Start with mobile styles, then enhance for larger screens.

**Why?**
- Better performance on mobile
- Progressive enhancement
- Touch-friendly defaults

**How?**
```tsx
// Base styles (mobile)
<div className="p-4">

// Tablet enhancement
<div className="p-4 md:p-6">

// Desktop enhancement
<div className="p-4 md:p-6 lg:p-8">
```

### 3. Accessibility First

Ensure all interactive elements are accessible.

**Why?**
- WCAG AA compliance
- Better UX for all users
- Legal requirements

**How?**
```tsx
// Button with accessible name
<button aria-label="Close menu" onClick={handleClose}>
  <Icon type="close" aria-hidden="true" />
</button>

// Input with label
<label htmlFor="search">Search</label>
<input id="search" type="text" aria-label="Search articles" />

// Focus indicators
<button className="focus:ring-2 focus:ring-[hsl(var(--color-primary))]">
  Submit
</button>
```

### 4. Performance First

Optimize for fast rendering and smooth interactions.

**Why?**
- Better user experience
- Lower bounce rates
- Better SEO

**How?**
```tsx
// Memoize expensive components
import { memo } from 'react'

const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* rendering */}</div>
})

// Lazy load images
<Image src={imageUrl} alt="Alt text" loading="lazy" />

// Avoid unnecessary re-renders
const memoizedCallback = useCallback(() => {
  doSomething()
}, [dependencies])
```

---

## Accessibility

### Skip-to-Content Link

Implemented in `src/app/layout.tsx`, allows keyboard users to skip navigation.

### Focus Indicators

Global focus styles using design tokens:
```css
*:focus-visible {
  ring: 2px;
  ring-color: hsl(var(--color-primary));
}
```

### ARIA Attributes

All interactive elements have appropriate ARIA attributes:
- `aria-label` for buttons without visible text
- `aria-hidden` for decorative icons
- `aria-busy` for loading states
- `role="search"` on search forms

### Semantic HTML

Use appropriate HTML elements:
- `<header>`, `<nav>`, `<main>`, `<footer>` for layout
- `<article>` for posts
- `<h1>`-`<h6>` for headings
- `<button>` for actions

### Keyboard Navigation

Full keyboard support:
- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons/links
- **Escape**: Close modals/menus
- **Shift+Tab**: Navigate backwards

---

## Best Practices

### Component Composition

Build complex UIs from simple, reusable components.

**Example - Post Card**:
```tsx
import { Badge, MetaInfo } from '@/components/ui'
import { formatDate } from '@/lib/utils/dateFormat'

function PostCard({ post }) {
  return (
    <article>
      <h2>{post.title.rendered}</h2>
      <MetaInfo
        author={post.author.name}
        date={formatDate(post.date)}
      />
      <Badge variant="category" href={post.category.link}>
        {post.category.name}
      </Badge>
      <p>{post.excerpt.rendered}</p>
      <Button onClick={() => router.push(`/berita/${post.slug}`)}>
        Baca Selengkapnya
      </Button>
    </article>
  )
}
```

### Styling Conventions

- Use design tokens for all visual properties
- Apply spacing tokens for consistent gaps
- Use shadow tokens for elevation
- Apply transition tokens for animations

### Responsive Patterns

- Mobile-first base styles
- Enhance with `sm:`, `md:`, `lg:` breakpoints
- Test on actual devices, not just browser resize

### Error Boundaries

Wrap components with error boundaries for graceful failures.

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

<ErrorBoundary>
  <PostList />
</ErrorBoundary>
```

---

## Related Documentation

- [Architecture Blueprint](../blueprint.md#design-system) - Complete design tokens reference
- [Development Guide](./development.md) - Component development workflow
- [Security Guide](./SECURITY.md) - Security considerations
- [API Documentation](../api.md) - Data fetching and API usage

---

**Last Updated**: 2026-01-11
