# Development Guide

Comprehensive guide for developing HeadlessWP. This guide covers development workflow, coding standards, testing, and contribution practices.

## Development Workflow

### Getting Started

For initial setup and prerequisites, see the main [README](../../README.md).

### Docker Development with Hot Reload

This project includes a Docker development environment with hot reload support for the Next.js frontend.

#### Starting Development Environment

```bash
# Start all services including frontend with hot reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# View logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f frontend

# Stop services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

#### How Hot Reload Works

The development configuration:
- Uses `Dockerfile.dev` which runs `npm run dev` (Next.js dev server)
- Mounts the source code as a volume (`.:/app`)
- Preserves `node_modules` and `.next` in anonymous volumes to avoid overwriting
- Changes to source files trigger automatic rebuild

#### Accessing Services

- **Frontend**: http://localhost:3000 (with hot reload)
- **WordPress**: http://localhost:8080
- **phpMyAdmin**: http://localhost:8081

#### Troubleshooting

```bash
# Rebuild after adding new dependencies
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build frontend --no-cache

# Clean volumes if having issues
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v

# Check frontend logs
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs frontend
```

### Daily Development Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Start development environment
docker-compose up -d
npm run dev

# 4. Make changes and test
npm run lint
npm run typecheck
npm run test

# 5. Commit changes (use conventional commits)
git commit -m "feat: add new feature"

# 6. Push and create PR
git push origin feature/your-feature-name
```

### Branch Strategy

- **main**: Production-ready code
- **agent**: Agent/automation branch
- **feature/***: New features
- **fix/***: Bug fixes
- **docs/***: Documentation changes

Always create a feature branch from `main`, not from other feature branches.

## Code Organization

### Directory Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── layout.tsx    # Root layout with providers
│   ├── page.tsx      # Homepage
│   ├── error.tsx     # Global error boundary
│   └── berita/      # News post pages
├── components/       # React components
│   ├── layout/       # Header, Footer
│   ├── post/         # PostCard, PostDetail
│   └── ui/          # Reusable UI components
├── lib/             # Core utilities and services
│   ├── api/         # API layer, resilience patterns
│   ├── services/    # Business logic (postService)
│   ├── validation/  # Runtime data validation
│   ├── utils/       # Utility functions
│   └── cache.ts     # Cache management
└── types/           # TypeScript definitions
```

### Component Guidelines

#### UI Components (`src/components/ui/`)

- Reusable, presentational components
- Use design tokens from `src/app/globals.css`
- Accept props for customization
- Include TypeScript interfaces for props

```typescript
// src/components/ui/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', onClick, children }: ButtonProps) {
  return (
    <button
      className={`
        bg-[hsl(var(--color-primary))]
        rounded-[var(--radius-md)]
        px-4 py-2
        transition-all duration-[var(--transition-normal)]
        ${size === 'sm' ? 'text-sm' : ''}
        ${size === 'lg' ? 'text-lg' : ''}
      `}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

#### Post Components (`src/components/post/`)

- Domain-specific components for posts
- Use enhancedPostService for data fetching
- Include loading states and error handling

```typescript
// src/components/post/PostCard.tsx
import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { formatDate } from '@/lib/utils/dateFormat'

export async function PostCard({ postId }: { postId: number }) {
  const post = await enhancedPostService.getPostById(postId)

  if (!post) {
    return <PostNotFound />
  }

  return (
    <article>
      <h2>{post.title.rendered}</h2>
      <time>{formatDate(post.date)}</time>
      <p>{post.excerpt.rendered}</p>
    </article>
  )
}
```

### API Layer Usage

Choose the right API layer based on your use case:

| Use Case | API Layer | Reason |
|----------|-----------|---------|
| Next.js page data fetching | `enhancedPostService` | Validation, caching, enrichment, fallbacks |
| API route / proxy | `standardizedAPI` | Consistent error format, metadata |
| Raw WordPress data | `wordpressAPI` | Maximum control, no processing |

```typescript
// Using enhancedPostService (recommended for pages)
import { enhancedPostService } from '@/lib/services/enhancedPostService'

const posts = await enhancedPostService.getLatestPosts()

// Using standardizedAPI (for API routes)
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'

const result = await standardizedAPI.getAllPosts()
if (isApiResultSuccessful(result)) {
  const posts = result.data
  console.log('Cache hit:', result.metadata.cacheHit)
}
```

See [API Documentation](../api.md) for complete API reference.

## Coding Standards

### TypeScript

- Use strict mode (enabled in `tsconfig.json`)
- Define interfaces for all props and data structures
- Avoid `any` type - use `unknown` or specific types
- Use type guards for runtime checks

```typescript
// Good
interface PostData {
  id: number
  title: { rendered: string }
}

function isPostData(data: unknown): data is PostData {
  return typeof data === 'object' &&
         data !== null &&
         'id' in data &&
         'title' in data
}

// Bad
function processData(data: any) {
  // No type safety
}
```

### Error Handling

```typescript
// Good - Use ApiResult wrapper
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'

const result = await standardizedAPI.getPostById(123)
if (!isApiResultSuccessful(result)) {
  console.error('Error:', result.error.type, result.error.message)
  return <ErrorPage error={result.error} />
}

// Bad - Generic try-catch
try {
  const post = await wordpressAPI.getPostById(123)
} catch (error) {
  console.error(error)
}
```

### Security

- **Always sanitize user content**:
```typescript
import { sanitizeHTML } from '@/lib/utils/sanitizeHTML'

const safeContent = sanitizeHTML(post.content.rendered, 'full')
<div dangerouslySetInnerHTML={{ __html: safeContent }} />
```

- **Use design tokens instead of hardcoded values**:
```typescript
// Good
className="bg-[hsl(var(--color-primary))]"

// Bad
className="bg-red-600"
```

- **Never commit secrets**: Use `.env.example` for placeholders only

### Performance

- **Use ISR for data-fetching pages**:
```typescript
export const revalidate = 300 // 5 minutes
```

- **Fetch data in parallel**:
```typescript
const [posts, categories] = await Promise.all([
  enhancedPostService.getLatestPosts(),
  wordpressAPI.getCategories(),
])
```

- **Implement loading states** for better UX

## Testing

### Running Tests

```bash
npm run test              # Run all tests once
npm run test:watch        # Run tests in watch mode
npm run test -- --coverage # Generate coverage report
```

### Test Structure

```typescript
// __tests__/componentName.test.ts
import { render, screen } from '@testing-library/react'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  describe('when rendered', () => {
    it('displays the title', () => {
      render(<MyComponent title="Test Title" />)
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })
  })

  describe('when button is clicked', () => {
    it('calls onClick handler', () => {
      const handleClick = jest.fn()
      render(<MyComponent onClick={handleClick} />)
      screen.getByRole('button').click()
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})
```

### Testing Best Practices

- **AAA Pattern**: Arrange, Act, Assert
- **Test behavior, not implementation**
- **Use descriptive test names** (`when X, it should Y`)
- **Mock external dependencies** (API, services)
- **Test both happy path and error cases**

### Coverage Goals

- **Unit tests**: > 80% coverage
- **Component tests**: Critical user flows
- **Integration tests**: API resilience patterns (23 tests exist)

## Debugging

### Common Issues

#### WordPress API Not Available

**Symptom**: API requests fail or timeout

**Solution**:
```bash
# Check WordPress container
docker-compose ps
docker-compose logs wordpress

# Check API is accessible
curl http://localhost:8080/wp-json/wp/v2/posts
```

#### Build Failures

**Symptom**: `npm run build` fails

**Solution**:
```bash
# Clean and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### Type Errors

**Symptom**: TypeScript compilation errors

**Solution**:
```bash
# Check types
npm run typecheck

# Fix issues incrementally
npm run typecheck -- --pretty
```

### Debugging Tools

- **Console logging**: Use `logger.info()`, `logger.error()` from `@/lib/utils/logger`
- **Network requests**: Check browser DevTools Network tab
- **React DevTools**: Inspect component state and props
- **Next.js DevTools**: View server components and data flow

## Common Development Tasks

### Adding a New Page

1. Create page in `src/app/[page-name]/page.tsx`
2. Add loading skeleton in `src/app/[page-name]/loading.tsx`
3. Use enhancedPostService for data fetching
4. Implement error handling
5. Add navigation to Header/Footer

```typescript
// src/app/new-page/page.tsx
import { enhancedPostService } from '@/lib/services/enhancedPostService'
import { PostCard } from '@/components/post/PostCard'

export default async function NewPage() {
  const posts = await enhancedPostService.getLatestPosts()

  return (
    <main>
      <h1>New Page</h1>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </main>
  )
}

// src/app/new-page/loading.tsx
import { PostCardSkeleton } from '@/components/post/PostCardSkeleton'

export default function Loading() {
  return (
    <main>
      <h1>Loading...</h1>
      <PostCardSkeleton />
      <PostCardSkeleton />
      <PostCardSkeleton />
    </main>
  )
}
```

### Adding a New UI Component

1. Create component in `src/components/ui/[ComponentName].tsx`
2. Define props interface
3. Use design tokens
4. Add variants and sizes as props
5. Export from components index

### Adding a New API Endpoint

1. Create endpoint in `src/app/api/[endpoint]/route.ts`
2. Use standardizedAPI for type-safe error handling
3. Implement proper error responses
4. Add rate limiting if needed

```typescript
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { standardizedAPI } from '@/lib/api/standardized'

export async function GET(request: NextRequest) {
  const result = await standardizedAPI.getAllPosts()

  if (!isApiResultSuccessful(result)) {
    return NextResponse.json(
      { error: result.error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(result.data)
}
```

## Pre-Commit Checklist

Before committing changes, ensure:

- [ ] `npm run lint` passes (ESLint)
- [ ] `npm run typecheck` passes (TypeScript)
- [ ] `npm run test` passes (all tests)
- [ ] New code has tests added
- [ ] Design tokens used (no hardcoded Tailwind values)
- [ ] User content sanitized (DOMPurify)
- [ ] No secrets committed
- [ ] Commit message follows conventional commits format

### Conventional Commits Format

```
<type>: <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks

Examples:
```
feat: add dark mode toggle
fix: resolve API timeout on slow connections
docs: update API documentation
refactor: extract cache logic to separate module
test: add unit tests for formatDate utility
```

## Performance Optimization

### Bundle Size

- Use dynamic imports for large components
- Implement code splitting at route level
- Analyze bundle size with `npm run build`

### API Optimization

- Use batch operations (getMediaBatch)
- Implement caching with cascade invalidation
- Fetch data in parallel
- Limit response size with `_fields` parameter

```typescript
// Good - Batch media fetching
const posts = await enhancedPostService.getLatestPosts()
// Media URLs automatically fetched in batch

// Good - Parallel fetching
const [posts, categories, tags] = await Promise.all([
  enhancedPostService.getLatestPosts(),
  wordpressAPI.getCategories(),
  wordpressAPI.getTags(),
])

// Good - Limit fields
const posts = await wordpressAPI.getPosts({
  _fields: 'id,title,excerpt,date'
})
```

## Docker Image Updates

This project uses Dependabot to automatically monitor and create PRs for Docker image updates.

### How Dependabot Works

Dependabot monitors these Docker files:
- `Dockerfile` - Node.js application image
- `docker-compose.yml` - WordPress, MySQL, phpMyAdmin images

When a new version is available, Dependabot automatically creates a pull request with the update.

### Image Update PRs

Docker update PRs include:
- Version bump (e.g., `mysql:8.0` → `mysql:8.4`)
- Release notes link
- Security vulnerability warnings if applicable

### Reviewing Docker Updates

When a Docker update PR is created:

1. **Check the changes** - Verify the new image version
2. **Review release notes** - Look for breaking changes
3. **Test locally** - Run `docker-compose build` to verify the image builds
4. **Check for vulnerabilities** - Review any security advisories

```bash
# Build and test the updated image
docker-compose build frontend
docker-compose up -d
```

### Manual Image Updates

To manually update a Docker image:

```bash
# Pull latest image
docker pull wordpress:latest

# Update version in docker-compose.yml
# Then rebuild
docker-compose build frontend
```

### Image Version Strategy

- **Node.js**: Use specific versions (e.g., `node:20.20.0-alpine`) for reproducibility
- **Database**: Use specific versions (e.g., `mysql:8.0`) - avoid `latest` for production
- **WordPress**: Can use `wordpress:latest` for development; consider pinned versions for production

## Additional Resources

- [Architecture Blueprint](../blueprint.md) - System architecture and design patterns
- [API Documentation](../api.md) - Complete API reference
- [Security Guide](./SECURITY.md) - Security best practices
- [Contributing Guide](./CONTRIBUTING.md) - Contribution guidelines
- [Task Backlog](../task.md) - Current development tasks
