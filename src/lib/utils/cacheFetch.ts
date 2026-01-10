import { cacheManager } from '@/lib/cache';
import { logger } from './logger';

interface CacheFetchOptions<T> {
  key: string;
  ttl: number;
  dependencies?: string[];
  transform?: (data: unknown) => T;
}

async function cacheFetch<T>(
  fetchFn: () => Promise<unknown>,
  options: CacheFetchOptions<T>
): Promise<T | null> {
  const { key, ttl, dependencies, transform } = options;

  const cached = cacheManager.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  try {
    const data = await fetchFn();

    const result = transform ? transform(data) : (data as T);

    cacheManager.set(key, result, ttl, dependencies);

    return result;
  } catch (error) {
    logger.error(`Failed to fetch data for cache key: ${key}`, error, { module: 'cacheFetch' });
    return null;
  }
}

export { cacheFetch };
export type { CacheFetchOptions };
