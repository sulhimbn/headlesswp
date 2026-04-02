# Page View Analytics

This module provides page view tracking for user behavior insights.

## Setup

### 1. Enable Analytics

By default, analytics is enabled. To disable it, set the environment variable:

```bash
ANALYTICS_ENABLED=false
```

### 2. Add Tracking to Your App

In your layout or a client component, add the page view tracker:

```tsx
// src/app/layout.tsx
import { usePageViewTracker } from '@/lib/hooks/usePageViewTracker'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  usePageViewTracker()
  
  return <>{children}</>
}
```

Or use the standalone initialization function:

```tsx
// In a useEffect or client-side entry point
import { initPageViewTracking } from '@/lib/hooks/usePageViewTracker'

useEffect(() => {
  return initPageViewTracking()
}, [])
```

## API Endpoints

### Track Page View

```
POST /api/analytics/track
```

**Request Body:**

```json
{
  "path": "/berita/some-article",
  "referrer": "https://google.com",
  "sessionId": "optional-session-id",
  "userAgent": "Mozilla/5.0...",
  "language": "en-US",
  "screenWidth": 1920,
  "country": "ID"
}
```

### Get Page Views

```
GET /api/analytics/page-views?period=7&limit=100
```

**Query Parameters:**
- `period`: Number of days (default: 7, max: 90)
- `limit`: Number of events to return (default: 100, max: 1000)

**Response:**

```json
{
  "summary": {
    "totalViews": 150,
    "uniquePages": 25,
    "uniqueSessions": 45,
    "topPages": [
      { "path": "/berita/latest", "count": 50 },
      { "path": "/", "count": 30 }
    ],
    "topReferrers": [
      { "referrer": "google.com", "count": 40 },
      { "referrer": "direct", "count": 20 }
    ],
    "averageTimeOnPage": 45000,
    "viewsByDate": [
      { "date": "2024-01-01", "count": 20 }
    ]
  },
  "events": [...]
}
```

## Configuration

The analytics module accepts the following configuration options:

```typescript
interface AnalyticsConfig {
  enabled: boolean           // Enable/disable tracking (default: true)
  sessionTimeout?: number   // Session timeout in ms (default: 30 min)
  maxEvents?: number        // Max events to store (default: 10000)
}
```

## Data Stored

- **Page path**: The URL path visited
- **Referrer**: Where the user came from (google.com, direct, etc.)
- **Session ID**: Unique session identifier
- **User agent**: Browser and device info
- **Time on page**: Approximate time spent on previous page
- **Screen width**: Device screen width
- **Language**: Browser language preference

## Example: Manual Tracking

```typescript
import { pageViewAnalytics } from '@/lib/analytics/pageViewAnalytics'

// Track a page view
const event = pageViewAnalytics.trackPageView({
  path: '/berita/my-article',
  referrer: 'https://twitter.com',
  sessionId: 'session_123'
})

// Get statistics
const stats = pageViewAnalytics.getStats(7) // Last 7 days
console.log(stats.totalViews)
console.log(stats.topPages)
```