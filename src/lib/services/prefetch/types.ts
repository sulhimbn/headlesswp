/**
 * AI-native Smart Cache Prefetch Types
 * 
 * Defines the type definitions for the intelligent cache prefetching system
 * that predicts user navigation patterns and preloads likely next pages.
 * 
 * @module prefetch/types
 */

/**
 * Navigation event representing a single user page visit
 */
export interface NavigationEvent {
  /** Unique session identifier */
  sessionId: string;
  /** Current page path */
  pagePath: string;
  /** Timestamp of navigation */
  timestamp: number;
  /** Referrer page path */
  referrer?: string;
  /** User agent or device type hint */
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  /** Page category for pattern analysis */
  pageCategory?: PageCategory;
}

/**
 * Page categories for navigation pattern analysis
 */
export type PageCategory = 
  | 'home'
  | 'post_list'
  | 'post_detail'
  | 'category'
  | 'tag'
  | 'author'
  | 'search'
  | 'media'
  | 'static';

/**
 * Navigation pattern - sequence of pages visited in a session
 */
export interface NavigationPattern {
  sessionId: string;
  path: string[];
  startTime: number;
  lastActivity: number;
  pageCount: number;
}

/**
 * Prediction result with confidence score
 */
export interface PredictionResult {
  /** Predicted page path */
  pagePath: string;
  /** Confidence score 0-1 */
  confidence: number;
  /** Reason for prediction */
  reason: PredictionReason;
  /** Estimated cache key */
  cacheKey: string;
  /** Priority for prefetching (higher = more important) */
  priority: number;
}

/**
 * Reason for prediction
 */
export type PredictionReason = 
  | 'sequential'      // Next in sequence
  | 'category_popular' // Popular in category
  | 'related_content'  // Related to current content
  | 'frequent_path'   // Frequently visited path
  | 'new_content';    // New content in area

/**
 * Prefetch task for queue management
 */
export interface PrefetchTask {
  pagePath: string;
  cacheKey: string;
  priority: number;
  scheduledAt: number;
  retryCount: number;
}

/**
 * Smart prefetch configuration
 */
export interface PrefetchConfig {
  /** Maximum concurrent prefetch requests */
  maxConcurrentPrefetches: number;
  /** Time window for pattern analysis (ms) */
  patternWindowMs: number;
  /** Minimum confidence threshold for prefetch */
  minConfidenceThreshold: number;
  /** Maximum predictions to generate per request */
  maxPredictions: number;
  /** TTL for prefetched content (ms) */
  prefetchTtlMs: number;
  /** Session timeout (ms) */
  sessionTimeoutMs: number;
  /** Maximum navigation events to store per session */
  maxEventsPerSession: number;
}

/**
 * Prefetch statistics
 */
export interface PrefetchStats {
  /** Total prefetch requests */
  prefetchRequests: number;
  /** Successful prefetches */
  prefetchHits: number;
  /** Failed prefetches */
  prefetchMisses: number;
  /** Predictions generated */
  predictionsGenerated: number;
  /** Average confidence */
  avgConfidence: number;
  /** Active sessions */
  activeSessions: number;
}

/**
 * Navigation analytics for a page
 */
export interface PageAnalytics {
  pagePath: string;
  pageCategory: PageCategory;
  totalVisits: number;
  uniqueVisitors: number;
  avgTimeOnPage: number;
  bounceRate: number;
  outgoingClicks: Map<string, number>;
  nextPages: Map<string, number>;
}
