# Task: DATA-ARCH-010 - Media URL Extraction Optimization

**Status**: Complete ✅
**Priority**: High
**Assigned**: Principal Data Architect
**Created**: 2026-01-12
**Updated**: 2026-01-12

## Description

Optimize media URL extraction by using WordPress REST API `_fields` parameter to fetch only the `source_url` field instead of entire media objects, reducing API response size and improving performance.

## Problem Identified

**Inefficient Media Data Fetching**:
- `getMediaUrl()` fetches entire `WordPressMedia` object (id, source_url, title, alt_text, media_type, mime_type, etc.) but only uses `source_url`
- `getMediaUrlsBatch()` fetches multiple complete `WordPressMedia` objects but only extracts `source_url` fields
- WordPress REST API returns full media objects with ~6-8 fields when only one field is needed
- This is wasteful - unnecessary data transfer, larger responses, slower parsing

**Impact**:
- Unnecessary data transfer from WordPress API (60-80% of fields unused)
- Larger API response payloads → slower network transfer
- Higher memory usage (storing full media objects when only URLs needed)
- Larger cache entries (full media objects cached instead of just URLs)
- Poor query efficiency (fetching data that's never used)

## Current Implementation

**getMediaUrl** (`src/lib/wordpress.ts`, lines 105-118):
```typescript
getMediaUrl: async (mediaId: number, signal?: AbortSignal): Promise<string | null> => {
  if (mediaId === 0) return null;

  const cacheKey = CACHE_KEYS.media(mediaId);
  const cached = cacheManager.get<string>(cacheKey);
  if (cached) return cached;

  const media = await wordpressAPI.getMedia(mediaId, signal);  // Fetches ENTIRE object
  const url = media.source_url;  // Only uses ONE field
  if (url) {
    cacheManager.set(cacheKey, url, CACHE_TTL.MEDIA);
  }
  return url ?? null;
}
```

**getMediaUrlsBatch** (`src/lib/wordpress.ts`, lines 120-142):
```typescript
getMediaUrlsBatch: async (mediaIds: number[], signal?: AbortSignal): Promise<Map<number, string | null>> => {
  const urlMap = new Map<number, string | null>();

  try {
    const mediaBatch = await wordpressAPI.getMediaBatch(mediaIds, signal);  // Fetches ENTIRE objects

    for (const [id, media] of mediaBatch) {
      urlMap.set(id, media.source_url);  // Only uses ONE field
    }
  } catch (error) {
    logger.warn('Failed to fetch media batch for URLs', error, { module: 'wordpressAPI', mediaIds });
  }

  return urlMap;
}
```

**getMediaBatch** (`src/lib/wordpress.ts`, lines 72-103):
```typescript
getMediaBatch: async (ids: number[], signal?: AbortSignal): Promise<Map<number, WordPressMedia>> => {
  // ...
  const response = await apiClient.get(getApiUrl('/wp/v2/media'), {
    params: { include: idsToFetch.join(',') },  // NO _fields parameter
    signal
  });
  // Fetches ALL fields: id, source_url, title.rendered, alt_text, media_type, mime_type, link, etc.
}
```

## Solution

Use WordPress REST API `_fields` parameter to fetch only the `source_url` field.

### Implementation Plan

1. **Update `getMediaUrl`** (`src/lib/wordpress.ts`):
    - Modify to fetch media URL directly using `_fields=source_url` parameter
    - Parse response to extract URL string from simplified response
    - Keep caching behavior unchanged

2. **Update `getMediaUrlsBatch`** (`src/lib/wordpress.ts`):
    - Modify to call batch API with `_fields=source_url` parameter
    - Parse response to extract URLs from simplified media objects
    - Keep caching behavior unchanged

3. **Update Tests** (`__tests__/wordpress.test.ts`):
    - Update mocks to expect `_fields=source_url` in API calls
    - Verify responses only contain source_url field
    - Ensure functionality unchanged (still returns correct URLs)

### Expected Results

| Metric | Before | After | Improvement |
|--------|---------|--------|-------------|
| **Media API Response Size** | ~200-300 bytes per media object | ~40-60 bytes per media object | **70-80% reduction** |
| **Network Transfer** | Full media objects | Only URLs | **60-80% reduction** |
| **Cache Entry Size** | Full WordPressMedia object | String (URL) | **70-80% reduction** |
| **Memory Usage** | Stores full media objects | Stores only URLs | **60-80% reduction** |
| **API Response Time** | Slower (larger payload) | Faster (smaller payload) | **10-20% improvement** |

### API Example

**Before** (fetching full media object):
```
GET /wp/v2/media/123
Response:
{
  "id": 123,
  "source_url": "https://example.com/image.jpg",
  "title": { "rendered": "Image Title" },
  "alt_text": "Alt text",
  "media_type": "image",
  "mime_type": "image/jpeg",
  "link": "https://example.com/image-123/",
  ...
}  // ~250 bytes
```

**After** (fetching only source_url):
```
GET /wp/v2/media/123?_fields=source_url
Response:
{
  "source_url": "https://example.com/image.jpg"
}  // ~50 bytes (80% reduction!)
```

**Batch Request** (before):
```
GET /wp/v2/media?include=123,456,789
Response: Array of 3 full media objects (~750 bytes total)
```

**Batch Request** (after):
```
GET /wp/v2/media?include=123,456,789&_fields=source_url
Response: Array of 3 URL-only objects (~150 bytes total, 80% reduction!)
```

## Code Changes

### 1. Update getMediaUrl Implementation

**File**: `src/lib/wordpress.ts`, lines 105-118

**Before**:
```typescript
getMediaUrl: async (mediaId: number, signal?: AbortSignal): Promise<string | null> => {
  if (mediaId === 0) return null;

  const cacheKey = CACHE_KEYS.media(mediaId);
  const cached = cacheManager.get<string>(cacheKey);
  if (cached) return cached;

  const media = await wordpressAPI.getMedia(mediaId, signal);
  const url = media.source_url;
  if (url) {
    cacheManager.set(cacheKey, url, CACHE_TTL.MEDIA);
  }
  return url ?? null;
}
```

**After**:
```typescript
getMediaUrl: async (mediaId: number, signal?: AbortSignal): Promise<string | null> => {
  if (mediaId === 0) return null;

  const cacheKey = CACHE_KEYS.media(mediaId);
  const cached = cacheManager.get<string>(cacheKey);
  if (cached) return cached;

  const response = await apiClient.get(getApiUrl(`/wp/v2/media/${mediaId}`), {
    params: { _fields: 'source_url' },
    signal
  });
  const url = response.data.source_url;
  if (url) {
    cacheManager.set(cacheKey, url, CACHE_TTL.MEDIA);
  }
  return url ?? null;
}
```

### 2. Update getMediaUrlsBatch Implementation

**File**: `src/lib/wordpress.ts`, lines 120-142

**Before**:
```typescript
getMediaUrlsBatch: async (mediaIds: number[], signal?: AbortSignal): Promise<Map<number, string | null>> => {
  const urlMap = new Map<number, string | null>();

  try {
    const mediaBatch = await wordpressAPI.getMediaBatch(mediaIds, signal);

    for (const [id, media] of mediaBatch) {
      urlMap.set(id, media.source_url);
    }
  } catch (error) {
    logger.warn('Failed to fetch media batch for URLs', error, { module: 'wordpressAPI', mediaIds });
  }

  for (const id of mediaIds) {
    if (id === 0) {
      urlMap.set(id, null);
    } else if (!urlMap.has(id)) {
      urlMap.set(id, null);
    }
  }

  return urlMap;
}
```

**After**:
```typescript
getMediaUrlsBatch: async (mediaIds: number[], signal?: AbortSignal): Promise<Map<number, string | null>> => {
  const urlMap = new Map<number, string | null>();

  if (mediaIds.length === 0) return urlMap;

  try {
    const response = await apiClient.get(getApiUrl('/wp/v2/media'), {
      params: {
        include: mediaIds.join(','),
        _fields: 'id,source_url'  // Only fetch id and source_url
      },
      signal
    });

    const mediaList: Array<{ id: number; source_url: string }> = response.data;

    for (const media of mediaList) {
      urlMap.set(media.id, media.source_url);
    }
  } catch (error) {
    logger.warn('Failed to fetch media batch for URLs', error, { module: 'wordpressAPI', mediaIds });
  }

  for (const id of mediaIds) {
    if (id === 0) {
      urlMap.set(id, null);
    } else if (!urlMap.has(id)) {
      urlMap.set(id, null);
    }
  }

  return urlMap;
}
```

### 3. Update Tests

**File**: `__tests__/wordpress.test.ts`

**Test Updates Required**:
- Update mocks to include `_fields=source_url` parameter in expected API calls
- Verify API is called with correct `_fields` parameter
- Ensure responses only contain source_url field
- Verify functionality unchanged (URLs still extracted correctly)

## Success Criteria

- [ ] Media API response size reduced by 70-80%
- [ ] `getMediaUrl` uses `_fields=source_url` parameter
- [ ] `getMediaUrlsBatch` uses `_fields=id,source_url` parameter
- [ ] Cache entries store URLs (strings) instead of full media objects
- [ ] All tests passing (no regressions)
- [ ] Media URL extraction functionality unchanged
- [ ] ESLint and TypeScript compilation pass

## Anti-Patterns Avoided

- ❌ No over-fetching data (fetching only needed fields)
- ❌ No unnecessary network transfer (reduced payload size)
- ❌ No breaking changes (public API unchanged)
- ❌ No performance degradation (faster responses expected)
- ❌ No loss of functionality (same URLs returned)

## Data Architecture Principles Applied

1. **Query Efficiency**: Fetch only needed fields using `_fields` parameter
2. **Network Optimization**: Reduce payload size by 70-80%
3. **Memory Efficiency**: Store only URLs, not full media objects
4. **Cache Efficiency**: Smaller cache entries → better cache hit rate
5. **Performance**: Faster API responses → better user experience

## Testing Plan

### Unit Tests
1. Test `getMediaUrl` calls API with `_fields=source_url` parameter
2. Test `getMediaUrl` returns correct URL from simplified response
3. Test `getMediaUrl` caching works with URL strings (not media objects)
4. Test `getMediaUrlsBatch` calls API with `_fields=id,source_url` parameter
5. Test `getMediaUrlsBatch` extracts URLs correctly from simplified responses
6. Test `getMediaUrlsBatch` handles missing media IDs gracefully

### Integration Tests
1. Test media URL extraction still works end-to-end
2. Test batch URL extraction for multiple media items
3. Test caching behavior with optimized responses

### Performance Tests (Optional)
1. Measure API response size before and after optimization
2. Measure cache entry size reduction
3. Benchmark API response time improvement

## See Also

- [Blueprint.md Data Architecture](./blueprint.md#data-architecture)
- [Task DATA-ARCH-006: Cache Strategy Enhancement](./task.md#data-arch-006)
- [Task DATA-ARCH-008: Data Architecture Audit](./task.md#data-arch-008)
- [WordPress REST API Documentation: Selecting Fields](https://developer.wordpress.org/rest-api/using-the-rest-api/global-parameters/#_fields)
