/**
 * Smart Cache Prefetch - AI-native Intelligent Cache Prefetching
 * 
 * This module provides intelligent cache prefetching that predicts user 
 * navigation patterns and preloads likely next pages.
 * 
 * Features:
 * - Navigation pattern tracking
 * - AI-powered prediction engine
 * - Automatic cache prefetching
 * - Client-side integration API
 * 
 * @module services/prefetch
 * 
 * @example
 * ```typescript
 * import { smartPrefetch } from '@/lib/services/prefetch';
 * 
 * // Track navigation and get predictions
 * const predictions = await smartPrefetch.trackAndPrefetch(
 *   sessionId,
 *   currentPage,
 *   referrer
 * );
 * 
 * // Get stats
 * const stats = smartPrefetch.getStats();
 * ```
 */

export { navigationTracker } from './navigationTracker';
export { predictionEngine } from './predictionEngine';
export { smartPrefetch, DEFAULT_PREFETCH_CONFIG } from './smartPrefetch';
export { default as smartPrefetchService } from './smartPrefetch';

export type {
  NavigationEvent,
  NavigationPattern,
  PageCategory,
  PredictionResult,
  PredictionReason,
  PrefetchTask,
  PrefetchConfig,
  PrefetchStats,
  PageAnalytics,
} from './types';
