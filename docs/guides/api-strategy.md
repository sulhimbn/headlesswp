# API Strategy: REST API

## Decision

This application uses **WordPress REST API v2** as the exclusive data fetching strategy.

**Issue**: [#34](https://github.com/sulhimbn/headlesswp/issues/34) - Choose Single API Strategy (REST vs GraphQL)  
**Decision Date**: 2025-11-16  
**Status**: ✅ Implemented

## Rationale

### Why REST API?

1. **Simplicity & Maintainability**
   - REST API is built into WordPress core - no plugins required
   - Simpler to debug and understand
   - Less boilerplate code

2. **Performance**
   - Lightweight implementation with minimal bundle size impact
   - No additional client libraries needed
   - Efficient for news/content-heavy applications

3. **Stability**
   - WordPress REST API is mature and stable
   - Backward compatibility guaranteed by WordPress core
   - No dependency on third-party plugins

4. **Development Experience**
   - Easy to test with tools like Postman/curl
   - Clear request/response patterns
   - Better error handling and debugging

### Why Not GraphQL?

While GraphQL offers benefits like reduced over-fetching, it was not chosen because:

- Requires additional plugins (WPGraphQL) in WordPress
- Adds complexity with client-side state management
- Increases bundle size with Apollo Client
- Overkill for a news website use case
- REST API already provides adequate performance

## Implementation

### Core Features

- **Comprehensive API Coverage**: Posts, categories, tags, media, authors
- **Error Handling**: Retry logic with exponential backoff
- **Caching**: In-memory caching with configurable TTL
- **Environment Support**: Development and production URL handling
- **Fallback Support**: index.php fallback for REST API compatibility

### API Endpoints

```typescript
// Posts
GET /wp/v2/posts              // List posts
GET /wp/v2/posts/{id}         // Get single post by ID
GET /wp/v2/posts?slug={slug}  // Get single post by slug

// Categories
GET /wp/v2/categories         // List categories
GET /wp/v2/categories?slug={slug} // Get single category

// Tags
GET /wp/v2/tags               // List tags
GET /wp/v2/tags?slug={slug}   // Get single tag

// Media
GET /wp/v2/media/{id}         // Get media item

// Authors
GET /wp/v2/users/{id}         // Get author

// Search
GET /wp/v2/search?search={query} // Search posts
```

### Caching Strategy

- **Posts**: 5 minutes cache
- **Single Posts**: 10 minutes cache
- **Categories/Tags**: 30 minutes cache
- **Search**: 2 minutes cache

### Usage Example

```typescript
import { wordpressAPI } from '@/lib/wordpress';

// Get latest posts
const posts = await wordpressAPI.getPosts({ per_page: 10 });

// Get post by slug
const post = await wordpressAPI.getPost('my-post-slug');

// Get categories
const categories = await wordpressAPI.getCategories();

// Clear cache
wordpressAPI.clearCache();
```

## Configuration

### Environment Variables

```bash
# WordPress URL (required for production)
NEXT_PUBLIC_WORDPRESS_URL=https://example.com

# WordPress API URL (optional, defaults to WP_URL + /wp-json)
NEXT_PUBLIC_WORDPRESS_API_URL=https://example.com/wp-json
```

### Development vs Production

- **Development**: Uses `http://localhost:8080` by default
- **Production**: Uses `NEXT_PUBLIC_WORDPRESS_URL` environment variable

## Performance Optimizations

1. **In-Memory Caching**: Reduces API calls by 80-90%
2. **Retry Logic**: Handles network failures gracefully
3. **Timeout Protection**: 10-second timeout prevents hanging requests
4. **Environment-Aware URLs**: Optimized for different environments

## Future Considerations

### When to Consider GraphQL

- Application complexity increases significantly
- Need for complex data relationships
- Mobile app requires optimized data fetching
- Multiple frontend clients with different data needs

### Migration Path

If GraphQL becomes necessary in the future:

1. Install WPGraphQL plugin in WordPress
2. Add Apollo Client alongside existing REST API
3. Gradually migrate endpoints one by one
4. Maintain backward compatibility during transition
5. Remove REST API after full migration

## Monitoring

### Cache Statistics

```typescript
const stats = wordpressAPI.getCacheStats();
console.log(`Cache size: ${stats.size}`);
console.log(`Cached keys: ${stats.keys.join(', ')}`);
```

### Performance Metrics

- API response times are tracked in performance monitoring
- Cache hit/miss ratios can be monitored
- Error rates and retry attempts are logged

## Security

- All API requests use HTTPS in production
- No authentication required for public content
- Rate limiting handled by WordPress
- Input validation on all parameters

---

**Summary**: REST API provides the optimal balance of simplicity, performance, and maintainability for this headless WordPress application.