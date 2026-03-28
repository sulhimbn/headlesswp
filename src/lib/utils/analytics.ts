declare global {
  interface Window {
    plausible?: (event: string, options?: PlausibleOptions) => void;
  }
}

interface PlausibleOptions {
  props?: Record<string, string | number | boolean>;
  u?: string;
}

interface PageViewData {
  title?: string;
  category?: string;
  author?: string;
  url?: string;
}

class Analytics {
  private domain: string;
  private enabled: boolean;

  constructor() {
    this.domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'localhost';
    this.enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
  }

  init(): void {
    if (!this.enabled) {
      return;
    }

    const script = document.createElement('script');
    script.defer = true;
    script.dataset.domain = this.domain;
    script.src = `https://plausible.io/js/script.js`;
    document.head.appendChild(script);
  }

  trackPageView(data?: PageViewData): void {
    if (!this.enabled || typeof window === 'undefined') {
      return;
    }

    if (window.plausible && data) {
      const props: Record<string, string | number | boolean> = {};
      if (data.title) props.title = data.title;
      if (data.category) props.category = data.category;
      if (data.author) props.author = data.author;
      if (data.url) props.url = data.url;
      window.plausible('pageview', { props });
    } else if (window.plausible) {
      window.plausible('pageview');
    }
  }

  trackEvent(eventName: string, props?: Record<string, string | number | boolean>): void {
    if (!this.enabled || typeof window === 'undefined') {
      return;
    }

    if (window.plausible) {
      window.plausible(eventName, { props });
    }
  }

  trackSearch(query: string): void {
    this.trackEvent('search', { query });
  }

  trackShare(platform: string, postTitle: string): void {
    this.trackEvent('share', { platform, postTitle });
  }

  trackReadProgress(progress: number, postTitle: string): void {
    this.trackEvent('read_progress', { progress: Math.round(progress), postTitle });
  }
}

export const analytics = new Analytics();

export function trackPageView(data?: PageViewData): void {
  analytics.trackPageView(data);
}

export function trackSearch(query: string): void {
  analytics.trackSearch(query);
}

export function trackShare(platform: string, postTitle: string): void {
  analytics.trackShare(platform, postTitle);
}

export function trackReadProgress(progress: number, postTitle: string): void {
  analytics.trackReadProgress(progress, postTitle);
}

export function initAnalytics(): void {
  analytics.init();
}
