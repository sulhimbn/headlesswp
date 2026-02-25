import { cacheWarmer } from './cacheWarmer';
import { logger } from '@/lib/utils/logger';

class CacheInitializer {
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      logger.info('Initializing cache warming...', { module: 'CacheInitializer' });
      
      const result = await cacheWarmer.warmAll();
      
      if (result.failed > 0) {
        logger.warn(
          `Cache initialization completed with failures: ${result.failed}/${result.total}`,
          { module: 'CacheInitializer', results: result.results }
        );
      } else {
        logger.info(
          `Cache initialization completed: ${result.success}/${result.total}`,
          { module: 'CacheInitializer', results: result.results }
        );
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Cache initialization failed', error, { module: 'CacheInitializer' });
      this.initialized = false;
      this.initPromise = null;
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export const cacheInitializer = new CacheInitializer();
export default cacheInitializer;
