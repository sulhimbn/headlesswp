export interface PageView {
  path: string;
  timestamp: number;
  referrer?: string;
  userAgent?: string;
}

export interface PageViewStats {
  path: string;
  views: number;
  firstViewed: number;
  lastViewed: number;
}

export interface AnalyticsData {
  totalPageViews: number;
  uniquePaths: number;
  pageViews: PageViewStats[];
  recentPageViews: PageView[];
}

class AnalyticsService {
  private pageViews: PageView[] = [];
  private readonly maxEvents = 10000;

  trackPageView(path: string, referrer?: string, userAgent?: string): void {
    const pageView: PageView = {
      path,
      timestamp: Date.now(),
      referrer,
      userAgent,
    };

    this.pageViews.push(pageView);

    if (this.pageViews.length > this.maxEvents) {
      this.pageViews = this.pageViews.slice(-this.maxEvents);
    }
  }

  getAnalytics(limit = 100): AnalyticsData {
    const pathMap = new Map<string, PageViewStats>();

    for (const view of this.pageViews) {
      const existing = pathMap.get(view.path);
      if (existing) {
        existing.views++;
        if (view.timestamp < existing.firstViewed) {
          existing.firstViewed = view.timestamp;
        }
        if (view.timestamp > existing.lastViewed) {
          existing.lastViewed = view.timestamp;
        }
      } else {
        pathMap.set(view.path, {
          path: view.path,
          views: 1,
          firstViewed: view.timestamp,
          lastViewed: view.timestamp,
        });
      }
    }

    const pageViews = Array.from(pathMap.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);

    return {
      totalPageViews: this.pageViews.length,
      uniquePaths: pathMap.size,
      pageViews,
      recentPageViews: this.pageViews.slice(-50),
    };
  }

  getPageViewsByPath(path: string): PageView[] {
    return this.pageViews.filter(v => v.path === path);
  }

  clearAnalytics(): void {
    this.pageViews = [];
  }
}

export const analyticsService = new AnalyticsService();
