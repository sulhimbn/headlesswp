# Predictive Prefetching

This document describes the ML-based predictive prefetching system implemented to improve page load performance.

## Overview

The predictive prefetching system uses a lightweight Markov chain model to analyze user navigation patterns and prefetch likely next pages before the user navigates to them.

## Architecture

### Components

1. **Markov Model** (`src/lib/hooks/usePredictivePrefetch.ts`)
   - Tracks navigation transitions between page types
   - Stores transition counts in localStorage
   - Provides predictions based on frequency analysis

2. **PrefetchProvider** (`src/components/PrefetchProvider.tsx`)
   - Wraps the application to enable prefetching
   - Triggers prefetching on page visibility changes
   - Periodically prefetches during idle time

3. **SmartLink** (`src/components/SmartLink.tsx`)
   - Optional component for explicit prefetch triggers on hover

## How It Works

### Navigation Pattern Tracking

1. Every page navigation is recorded in the Markov model
2. The model stores transitions as `fromPage -> toPage` with counts
3. Page paths are normalized to categories (e.g., `/berita/some-slug` → `berita:some-slug`)
4. Data persists in localStorage across sessions

### Prediction Algorithm

```
1. Get current page category from URL path
2. Look up transitions from this category
3. Sort by transition count descending
4. Calculate confidence = count / totalTransitions
5. Return pages with confidence >= 70%
```

### Prefetch Triggers

- **On hover**: When user hovers over a link
- **On visibility**: When tab becomes visible
- **On idle**: 10% chance every 5 seconds when page is visible

## Metrics

The system tracks the following metrics in localStorage:

```typescript
interface PrefetchMetrics {
  prefetchAttempts: number  // Total prefetch requests
  prefetchHits: number      // Navigations to prefetched pages
  prefetchMisses: number    // Navigations to non-prefetched pages
  hitRate: number           // prefetchHits / prefetchAttempts
  averageConfidence: number // Average prediction confidence
}
```

Access metrics via `getMetricsData()` from `usePredictivePrefetch`.

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| CONFIDENCE_THRESHOLD | 0.7 | Minimum confidence to trigger prefetch |
| MAX_PATTERNS | 1000 | Maximum transition entries before scaling |
| Idle interval | 5000ms | How often to check for idle prefetch |
| Idle probability | 10% | Chance of prefetch on each idle check |

## Usage

### Basic Usage (Provider)

The `PrefetchProvider` is already integrated in `layout.tsx`. It automatically:
- Tracks navigation patterns
- Prefetches likely pages based on model
- Records metrics

### Using SmartLink

For explicit prefetch control on specific links:

```tsx
import SmartLink from '@/components/SmartLink'

<SmartLink href="/berita/my-article">
  Read more
</SmartLink>
```

### Accessing Predictions Programmatically

```tsx
import { usePredictivePrefetch } from '@/components/PrefetchProvider'

function MyComponent() {
  const { getPredictions, getMetricsData } = usePredictivePrefetch()
  
  const predictions = getPredictions('/berita/some-slug')
  const metrics = getMetricsData()
  
  return (
    <div>
      <p>Predicted pages: {predictions.map(p => p.path).join(', ')}</p>
      <p>Hit rate: {(metrics.hitRate * 100).toFixed(1)}%</p>
    </div>
  )
}
```

## Performance Considerations

- **Lightweight**: Uses simple frequency counting, no ML libraries
- **Client-side**: All processing happens in the browser
- **Persistent**: Model survives page reloads and sessions
- **Self-tuning**: Model improves as more navigation data is collected
- **Non-blocking**: Prefetch uses link prefetch API, doesn't block rendering

## Limitations

1. Requires minimum 3 navigation events before predictions become reliable
2. Works best for sites with consistent navigation patterns
3. localStorage has size limits (~5MB), oldest patterns are scaled down
4. Cannot predict first-time visitors without prior navigation data

## Future Improvements

- Add server-side model for new users (popular paths across all users)
- Implement A/B testing for prefetch effectiveness
- Add adaptive confidence threshold based on page complexity
- Integrate with service worker for offline prefetching