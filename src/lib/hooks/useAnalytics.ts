import { useEffect, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, trackSearch, trackShare, trackReadProgress, initAnalytics } from '@/lib/utils/analytics';

export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView({ url });
  }, [pathname, searchParams]);

  const handleSearch = useCallback((query: string) => {
    trackSearch(query);
  }, []);

  const handleShare = useCallback((platform: string, postTitle: string) => {
    trackShare(platform, postTitle);
  }, []);

  const handleReadProgress = useCallback((progress: number, postTitle: string) => {
    trackReadProgress(progress, postTitle);
  }, []);

  return {
    trackSearch: handleSearch,
    trackShare: handleShare,
    trackReadProgress: handleReadProgress,
  };
}
