# Growth-Innovation-Strategist Agent Memory

## Domain Focus
- Growth: User engagement, content distribution, discovery features
- Innovation: New features that drive value
- Strategy: Measurable improvements aligned with business goals

## Implemented Features

### Search Results Pagination (Issue #354)
- **PR**: (to be created)
- **Status**: Complete
- **Features**:
  - Added pagination to search results at /cari page
  - 12 posts per page (configurable via PAGINATION_LIMITS.SEARCH_POSTS)
  - Pagination component updated to support query parameters
  - URL format: /cari?q=query&page=2

### RSS Feed (Issue #358)
- **PR**: #465
- **Status**: Complete
- **Features**:
  - Main RSS feed at `/api/rss` - returns latest 50 posts in RSS 2.0 format
  - Category-specific RSS feeds at `/api/rss/category/[slug]`
  - RSS feed discovery link in HTML head
  - 5-minute caching TTL

## Patterns & Conventions
- Use apiClient directly when needing custom params (like _fields)
- Use wordpressAPI.getCategories() without params for fetching all
- Follow RSS 2.0 specification for XML generation
- Use CACHE_TIMES from config for consistent caching
- Add proper Content-Type headers (application/rss+xml)
- Use PaginatedPostsResult type for paginated results

## Common Issues & Solutions
- Type errors with getPosts: use apiClient directly for _fields parameter
- Categories param in WordPress API uses singular "category", not plural

## Notes
- Issue #358 (ENGAGEMENT) has multiple sub-features: Comments, Newsletter, Social Sharing, RSS
- RSS was implemented as it's the smallest, safest, most measurable improvement
- Content Discovery issues (#357) are also in Growth domain for future work

## Implemented Features (Feb 2026)

### Category & Tag Pages with Linked Badges (Issue #357)
- **Status**: Complete
- **Features**:
  - Created `/kategori/[slug]` route - displays posts by category
  - Created `/tag/[slug]` route - displays posts by tag  
  - Category badges in post detail now link to `/kategori/[slug]`
  - Tag badges in post detail now link to `/tag/[slug]`
  - 12 posts per page with pagination
  - Uses standardizedAPI for category/tag lookups by slug
  - 5-minute cache revalidation

## Patterns & Conventions (Updated)
- Use standardizedAPI.getCategoryBySlug(slug) for category lookup
- Use standardizedAPI.getTagBySlug(slug) for tag lookup
- Use standardizedAPI.getAllPosts({ category: id }) for posts by category
- Use standardizedAPI.getAllPosts({ tag: id }) for posts by tag
- Route naming: Indonesian for consistency (/kategori, /tag)
- Pagination basePath should include the slug for proper navigation
