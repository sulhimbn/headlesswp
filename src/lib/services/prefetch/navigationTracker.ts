/**
 * Navigation Tracker
 * 
 * Tracks user navigation patterns to enable intelligent cache prefetching.
 * Records page visits, session data, and navigation sequences for pattern analysis.
 * 
 * @module prefetch/navigationTracker
 */

import type { NavigationEvent, NavigationPattern, PageCategory, PageAnalytics } from './types';
import { logger } from '@/lib/utils/logger';

/**
 * Categorize page path into page category
 */
function categorizePage(pagePath: string): PageCategory {
  const path = pagePath.toLowerCase();
  
  if (path === '/' || path === '') return 'home';
  if (path.startsWith('/berita/') && path.split('/').length > 2) return 'post_detail';
  if (path.startsWith('/berita')) return 'post_list';
  if (path.startsWith('/kategori/')) return 'category';
  if (path.startsWith('/tag/')) return 'tag';
  if (path.startsWith('/author/')) return 'author';
  if (path.startsWith('/cari') || path.includes('search')) return 'search';
  if (path.startsWith('/media/')) return 'media';
  
  return 'static';
}

/**
 * Navigation Tracker class
 * 
 * Tracks navigation events and patterns for the smart prefetch system.
 * Stores session data and provides analytics for prediction.
 */
class NavigationTracker {
  private sessions = new Map<string, NavigationPattern>();
  private events: NavigationEvent[] = [];
  private pageAnalytics = new Map<string, PageAnalytics>();
  
  private readonly maxEvents: number;
  private readonly sessionTimeout: number;

  constructor(maxEventsPerSession = 100, sessionTimeoutMs = 30 * 60 * 1000) {
    this.maxEvents = maxEventsPerSession;
    this.sessionTimeout = sessionTimeoutMs;
  }

  /**
   * Record a navigation event
   */
  trackNavigation(
    sessionId: string,
    pagePath: string,
    referrer?: string,
    deviceType?: 'desktop' | 'mobile' | 'tablet'
  ): void {
    const event: NavigationEvent = {
      sessionId,
      pagePath,
      timestamp: Date.now(),
      referrer,
      deviceType,
      pageCategory: categorizePage(pagePath),
    };

    this.events.push(event);
    
    // Keep events array bounded
    if (this.events.length > 10000) {
      this.events = this.events.slice(-5000);
    }

    this.updateSession(sessionId, pagePath);
    this.updatePageAnalytics(event);
    
    logger.debug('Navigation tracked', { 
      module: 'NavigationTracker', 
      sessionId, 
      pagePath 
    });
  }

  /**
   * Update session with new page visit
   */
  private updateSession(sessionId: string, pagePath: string): void {
    const now = Date.now();
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        path: [],
        startTime: now,
        lastActivity: now,
        pageCount: 0,
      };
      this.sessions.set(sessionId, session);
    }

    // Check session timeout
    if (now - session.lastActivity > this.sessionTimeout) {
      // Start new session sequence
      session.path = [];
      session.startTime = now;
    }

    // Add page to path if not duplicate of last page
    if (session.path.length === 0 || session.path[session.path.length - 1] !== pagePath) {
      session.path.push(pagePath);
      session.lastActivity = now;
      session.pageCount++;
      
      // Limit path length
      if (session.path.length > this.maxEvents) {
        session.path = session.path.slice(-this.maxEvents);
      }
    }

    // Clean up old sessions periodically
    this.cleanupOldSessions();
  }

  /**
   * Update page analytics
   */
  private updatePageAnalytics(event: NavigationEvent): void {
    const pagePath = event.pagePath;
    let analytics = this.pageAnalytics.get(pagePath);

    if (!analytics) {
      analytics = {
        pagePath,
        pageCategory: event.pageCategory || categorizePage(pagePath),
        totalVisits: 0,
        uniqueVisitors: new Set<string>().size,
        avgTimeOnPage: 0,
        bounceRate: 0,
        outgoingClicks: new Map(),
        nextPages: new Map(),
      };
      this.pageAnalytics.set(pagePath, analytics);
    }

    analytics.totalVisits++;

    if (event.referrer) {
      const referrerCount = analytics.nextPages.get(event.referrer) || 0;
      analytics.nextPages.set(event.referrer, referrerCount + 1);
    }
  }

  /**
   * Clean up old sessions
   */
  private cleanupOldSessions(): void {
    const now = Date.now();
    const timeout = this.sessionTimeout;

    for (const [sessionId, session] of this.sessions) {
      if (now - session.lastActivity > timeout) {
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Get navigation pattern for a session
   */
  getSessionPattern(sessionId: string): NavigationPattern | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get recent events for a session
   */
  getRecentEvents(sessionId: string, limit = 10): NavigationEvent[] {
    return this.events
      .filter(e => e.sessionId === sessionId)
      .slice(-limit);
  }

  /**
   * Get page analytics
   */
  getPageAnalytics(pagePath: string): PageAnalytics | null {
    return this.pageAnalytics.get(pagePath) || null;
  }

  /**
   * Get all page analytics
   */
  getAllPageAnalytics(): Map<string, PageAnalytics> {
    return this.pageAnalytics;
  }

  /**
   * Get popular next pages from analytics
   */
  getPopularNextPages(pagePath: string, limit = 5): Array<{ path: string; count: number }> {
    const analytics = this.pageAnalytics.get(pagePath);
    if (!analytics) return [];

    return Array.from(analytics.nextPages.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get frequent navigation paths
   */
  getFrequentPaths(minOccurrences = 2): Array<{ path: string[]; count: number }> {
    const pathCounts = new Map<string, number>();

    for (const session of this.sessions.values()) {
      if (session.path.length >= 2) {
        // Create path signature
        const signature = session.path.join('->');
        pathCounts.set(signature, (pathCounts.get(signature) || 0) + 1);
      }
    }

    return Array.from(pathCounts.entries())
      .filter(([_, count]) => count >= minOccurrences)
      .map(([signature, count]) => ({
        path: signature.split('->'),
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get active session count
   */
  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Get total events tracked
   */
  getTotalEvents(): number {
    return this.events.length;
  }

  /**
   * Reset all tracking data
   */
  reset(): void {
    this.sessions.clear();
    this.events = [];
    this.pageAnalytics.clear();
    logger.info('Navigation tracker reset', { module: 'NavigationTracker' });
  }
}

// Export singleton instance
export const navigationTracker = new NavigationTracker();
export default navigationTracker;
