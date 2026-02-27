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

## Implemented Features (Feb 2026)

### Related Articles on Post Detail Page
- **PR**: #532
- **Status**: Complete
- **Features**:
  - Added "Artikel Terkait" (Related Articles) section to post detail page
  - Fetches up to 3 related posts from the same primary category
  - Excludes current post from related posts
  - Uses PAGINATION_LIMITS.RELATED_POSTS config (default: 3)
  - Only displays when related posts are available
  - Parallel fetching with main post for optimal performance

## Patterns & Conventions (Related Articles)
- Use getRelatedPosts(categoryIds, excludeId) to fetch related posts
- Primary category is used as the main filter (first category in array)
- Related posts use PostWithMediaUrl type for display consistency
- UI text added to UI_TEXT.homePage.relatedHeading

## Implemented Features (Feb 2026)

### Reading Time Estimate (Issue #NEW)
- **Status**: Complete
- **Features**:
  - Added estimated reading time to post detail pages
  - Calculates based on 200 words per minute
  - Displays in MetaInfo component: "X baca" (X min read)
  - Shows as: Author • Date • X baca

## Patterns & Conventions (Reading Time)
- Use calculateReadingTime(content) to calculate reading time
- Reading time is displayed in MetaInfo component
- UI text: UI_TEXT.metaInfo.readingTime = 'baca'

## Implemented Features (Feb 2026)

### Personalized Content Recommendations (Issue #553)
- **PR**: #568
- **Status**: Complete
- **Features**:
  - Tracks reading patterns in localStorage (privacy-first)
  - Shows personalized recommendations based on user's reading history
  - Category-based recommendations (top 3 categories viewed)
  - Excludes already-read posts from recommendations
  - Feature flags for gradual rollout:
    - `NEXT_PUBLIC_FEATURE_PERSONALIZED_RECOMMENDATIONS=true` to enable
    - `NEXT_PUBLIC_FEATURE_RECOMMENDATION_ANALYTICS=true` for click tracking
  - Analytics: tracks recommendation clicks in localStorage

## Patterns & Conventions (Personalized Recommendations)
- Use readingHistory.ts utilities for localStorage operations
- Use getTopCategories(limit) to get user's preferred categories
- Use trackRecommendationClick(postId, source) for analytics
- API endpoints created: /api/posts, /api/media/[id]
- Component: PersonalizedRecommendations with loading states
- Component: ReadingTracker to automatically track post views
- Hook: useReadingTracker for tracking reading patterns

## Implemented Features (Feb 2026)

### Social Sharing Buttons
- **PR**: #588
- **Status**: Complete
- **Features**:
  - Added social sharing buttons to post detail pages
  - Supports Facebook, Twitter, WhatsApp, and copy link
  - Located below article title for easy access
  - Opens share dialogs in new windows
  - Copy link uses clipboard API with fallback

## Patterns & Conventions (Social Sharing)
- Use SocialShare component with title and url props
- Component uses SITE_URL for full URLs
- Share URLs use platform-specific sharing APIs
- All buttons have proper aria-labels in Indonesian
- UI text added to UI_TEXT.postDetail.share and UI_TEXT.postDetail.shareTo

## Implemented Features (Feb 2026)

### Reading Progress Bar
- **Status**: Complete
- **Features**:
  - Added reading progress bar at top of post detail pages
  - Shows scroll progress as user reads through article
  - Fixed position at top, doesn't interfere with content
  - Uses primary color for the progress indicator
  - Only shows when user has scrolled (progress > 0)
  - Uses requestAnimationFrame for smooth updates
  - Accessible with aria-valuenow, aria-valuemin, aria-valuemax

## Patterns & Conventions (Reading Progress)
- Use ReadingProgress component with optional targetId prop
- Default targetId is 'article-content' for post pages
- Component is memoized for performance
- Uses passive event listeners for scroll performance
- Cleanup on unmount removes event listeners

## Implemented Features (Feb 2026)

### Author Profile Pages (Issue #357)
- **Status**: Complete
- **Features**:
  - Created `/author/[id]` route - displays author profile with avatar, name, description, and link
  - Lists all posts by author with pagination
  - 12 posts per page with pagination
  - Uses standardizedAPI.getAuthorById for author lookup
  - Uses enhancedPostService.getPostsByAuthor for fetching posts
  - 5-minute cache revalidation (ISR)
  - Empty state when no posts available

## Patterns & Conventions (Author Pages)
- Use standardizedAPI.getAuthorById(id) for author lookup
- Use enhancedPostService.getPostsByAuthor(authorId, page, perPage) for fetching posts
- Author profile shows avatar_urls['96'], name, description, and link
- Route naming: /author/[id]
- Pagination basePath should include the author id for proper navigation
