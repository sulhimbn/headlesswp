# AI-Powered Content Recommendations Engine

## Overview

This feature provides intelligent content recommendations on post detail pages based on category matching, tag relevance, and post recency. It tracks user engagement through click-through rate (CTR) analytics.

## Features

### 1. Recommendation Algorithm

The AI recommendation engine scores posts based on:
- **Category Matching** (60% weight): Posts with matching categories get higher scores
- **Tag Relevance** (30% weight): Posts with matching tags are prioritized
- **Recency** (10% weight): Recent posts (within 30 days) get bonus points

### 2. CTR Tracking

The system tracks:
- **Impressions**: When a recommendation is displayed
- **Clicks**: When a user clicks a recommendation
- **CTR Calculation**: (clicks / impressions) * 100

### 3. Personalization

The engine considers:
- User's reading history
- Top categories from user's past reading
- Top tags from user's interests
- Excludes already-read posts from recommendations

## Configuration

### Environment Variables

```bash
# Enable/disable features
NEXT_PUBLIC_FEATURE_AI_RECOMMENDATIONS=true
NEXT_PUBLIC_FEATURE_PERSONALIZED_RECOMMENDATIONS=true
NEXT_PUBLIC_FEATURE_RECOMMENDATION_ANALYTICS=true
NEXT_PUBLIC_FEATURE_RELATED_POSTS=false
```

### Configuration Files

#### `src/lib/api/recommendationConfig.ts`

```typescript
export const RECOMMENDATION_CONFIG = {
  MAX_HISTORY_ITEMS: 20,      // Max reading history entries
  MAX_RECOMMENDATIONS: 3,    // Max recommendations to show
  CATEGORY_WEIGHT: 0.6,       // Category match weight
  TAG_WEIGHT: 0.3,           // Tag match weight
  RECENCY_WEIGHT: 0.1,       // Recency bonus weight
  MAX_AGE_DAYS: 30,          // Max age for recency scoring
  MIN_RECOMMENDATIONS: 1,    // Minimum recommendations required
}

export const RECOMMENDATION_ALGORITHM = {
  USE_CATEGORIES: true,      // Enable category-based scoring
  USE_TAGS: true,            // Enable tag-based scoring
  USE_RECENCY: true,        // Enable recency scoring
  USE_PERSONALIZATION: true, // Enable user personalization
  FALLBACK_TO_POPULAR: true, // Fallback to popular if no matches
}

export const ANALYTICS_CONFIG = {
  TRACK_CLICKS: true,
  TRACK_IMPRESSIONS: true,
  SESSION_DURATION_MS: 30 * 60 * 1000,
  CTR_CALCULATION_WINDOW: 7 * 24 * 60 * 60 * 1000,
  STORE_LOCALLY: true,
  SEND_TO_ANALYTICS: false,
}
```

#### `src/lib/api/config.ts`

```typescript
export const FEATURE_FLAGS = {
  AI_RECOMMENDATIONS: process.env.NEXT_PUBLIC_FEATURE_AI_RECOMMENDATIONS === 'true',
  PERSONALIZED_RECOMMENDATIONS: process.env.NEXT_PUBLIC_FEATURE_PERSONALIZED_RECOMMENDATIONS === 'true',
  RECOMMENDATION_ANALYTICS: process.env.NEXT_PUBLIC_FEATURE_RECOMMENDATION_ANALYTICS === 'true',
  RELATED_POSTS: process.env.NEXT_PUBLIC_FEATURE_RELATED_POSTS !== 'false',
}
```

## Components

### AIRecommendations

The main component that displays AI-powered recommendations.

**Location**: `src/components/post/AIRecommendations.tsx`

**Props**:
- `currentPostId: number` - ID of the current post
- `currentCategoryIds: number[]` - Category IDs of current post
- `currentTagIds?: number[]` - Tag IDs of current post

**Usage**:
```tsx
import AIRecommendations from '@/components/post/AIRecommendations'

<AIRecommendations
  currentPostId={post.id}
  currentCategoryIds={post.categories}
  currentTagIds={post.tags}
/>
```

### PersonalizedRecommendations

Legacy component providing personalized recommendations based on reading history.

**Location**: `src/components/post/PersonalizedRecommendations.tsx`

## API Endpoints

### GET /api/recommendations/analytics

Returns CTR analytics data and configuration.

**Response**:
```json
{
  "ctrData": [
    {
      "postId": 123,
      "impressions": 50,
      "clicks": 5,
      "ctr": 10.0
    }
  ],
  "config": {
    "algorithm": { ... },
    "recommendation": { ... },
    "analytics": { ... }
  },
  "featureFlags": {
    "aiRecommendations": true,
    "personalizedRecommendations": true,
    "recommendationAnalytics": true
  }
}
```

### DELETE /api/recommendations/analytics

Clears all stored CTR data.

**Response**:
```json
{
  "success": true,
  "message": "CTR data cleared"
}
```

## Services

### recommendationEngine

Core recommendation service in `src/lib/services/recommendationEngine.ts`.

**Functions**:
- `getRecommendations(options)` - Fetch scored recommendations
- `trackImpression(postId)` - Track when a recommendation is shown
- `trackClick(postId)` - Track when a recommendation is clicked
- `getCTRData(postId)` - Get CTR for a specific post
- `getAllCTRData()` - Get all CTR data
- `clearCTRData()` - Clear all stored CTR data

## Storage

Data is stored in localStorage:
- `recommendation_ctr`: CTR click data
- `recommendation_impressions`: Impression counts

## Implementation Status

| Feature | Status |
|---------|--------|
| Category-based recommendations | ✅ |
| Tag-based recommendations | ✅ |
| Recency scoring | ✅ |
| Personalization (reading history) | ✅ |
| CTR tracking | ✅ |
| Analytics API | ✅ |
| Configuration options | ✅ |
| Documentation | ✅ |

## Related Components

- `PersonalizedRecommendations` - Legacy personalized recommendations
- `PostCard` - Card component for displaying posts
- `ReadingTracker` - Tracks user reading history