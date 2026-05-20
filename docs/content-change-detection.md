# Content Change Detection for Proactive Cache Invalidation

## Overview

This feature detects content changes in WordPress and automatically invalidates related cache entries to ensure users always see fresh content without waiting for cache TTL expiration.

## How It Works

The content change detector monitors WordPress for changes to:
- **Posts** (created, updated, deleted)
- **Categories** (created, updated, deleted)
- **Tags** (created, updated, deleted)

When a change is detected, the system automatically invalidates:
- The specific entity cache entry (post, category, or tag)
- Related list caches (posts list, categories list, tags list)
- Any dependent cache entries through the cascade invalidation system

## Detection Methods

### Polling (Default)

The detector polls the WordPress API at a configurable interval to check for changes. By default, it checks every 60 seconds.

```typescript
// Configuration (in environment variables)
CONTENT_CHANGE_DETECTION_ENABLED=true
CONTENT_CHANGE_POLL_INTERVAL_MS=60000  // 60 seconds (default)
```

### Webhook Support

For more real-time detection, you can also use the webhook endpoint:

```
POST /api/webhooks/content-change
```

Payload format:
```json
{
  "type": "post|category|tag",
  "action": "created|updated|deleted",
  "id": 123,
  "slug": "post-slug",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Monitoring

Access content change detection metrics:

```
GET /api/observability/content-changes
```

Response example:
```json
{
  "enabled": true,
  "totalChecks": 1440,
  "changesDetected": 5,
  "postChanges": 3,
  "categoryChanges": 1,
  "tagChanges": 1,
  "invalidationsTriggered": 15,
  "lastCheckTime": 1704067200000,
  "lastChangeTime": 1704063600000,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Integration with Cache System

The content change detection integrates with the existing cache dependency system:

```
category:5 (invalidated)
    ↑
    | (dependency)
    |
post:123 (automatically invalidated)
    ↑
    | (dependent)
    |
posts-list:cat5 (automatically invalidated)
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CONTENT_CHANGE_DETECTION_ENABLED` | `true` | Enable/disable change detection |
| `CONTENT_CHANGE_POLL_INTERVAL_MS` | `60000` | Polling interval in milliseconds |

### Programmatic Configuration

```typescript
import { createContentChangeDetector } from '@/lib/services/contentChangeDetector';

const detector = createContentChangeDetector({
  pollIntervalMs: 30000, // 30 seconds
  enabled: true
});

detector.start();
```

## Usage in WordPress Plugin (Optional)

To enable real-time webhook notifications from WordPress, install a webhook plugin and configure it to POST to your application's webhook endpoint when content changes.

Example WordPress plugin configuration:
- Trigger: Post/Category/Tag created, updated, or deleted
- URL: `https://your-site.com/api/webhooks/content-change`
- Method: POST
- Headers: Content-Type: application/json

## Metrics

The following metrics are tracked:

- `totalChecks`: Total number of polling cycles performed
- `changesDetected`: Total number of content changes detected
- `postChanges`: Number of post changes detected
- `categoryChanges`: Number of category changes detected
- `tagChanges`: Number of tag changes detected
- `invalidationsTriggered`: Total number of cache invalidations triggered
- `lastCheckTime`: Timestamp of the last check
- `lastChangeTime`: Timestamp of the last detected change