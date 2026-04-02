import { apiClient, getApiUrl } from '@/lib/api/client';
import { cacheManager, cacheKeys } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';
import type { WordPressPost, WordPressCategory, WordPressTag } from '@/types/wordpress';

export interface ContentChangeDetectorConfig {
  pollIntervalMs: number;
  enabled: boolean;
}

export interface ContentChange {
  type: 'post' | 'category' | 'tag';
  id: number;
  slug?: string;
  action: 'created' | 'updated' | 'deleted';
  timestamp: string;
}

export interface ContentChangeMetrics {
  totalChecks: number;
  changesDetected: number;
  postChanges: number;
  categoryChanges: number;
  tagChanges: number;
  invalidationsTriggered: number;
  lastCheckTime: number | null;
  lastChangeTime: number | null;
}

export interface IContentChangeDetector {
  start(): void;
  stop(): void;
  checkForChanges(): Promise<ContentChange[]>;
  getMetrics(): ContentChangeMetrics;
}

class ContentChangeDetector implements IContentChangeDetector {
  private intervalId: NodeJS.Timeout | null = null;
  private lastPostModified: string = '';
  private lastCategoryModified: string = '';
  private lastTagModified: string = '';
  private config: ContentChangeDetectorConfig;
  private metrics: ContentChangeMetrics = {
    totalChecks: 0,
    changesDetected: 0,
    postChanges: 0,
    categoryChanges: 0,
    tagChanges: 0,
    invalidationsTriggered: 0,
    lastCheckTime: null,
    lastChangeTime: null,
  };
  private invalidationsTriggered: number = 0;

  constructor(config: ContentChangeDetectorConfig) {
    this.config = config;
  }

  start(): void {
    if (!this.config.enabled) {
      logger.info('Content change detection disabled', { module: 'ContentChangeDetector' });
      return;
    }

    if (this.intervalId) {
      logger.warn('Content change detector already running', { module: 'ContentChangeDetector' });
      return;
    }

    logger.info('Starting content change detection polling', { 
      module: 'ContentChangeDetector',
      intervalMs: this.config.pollIntervalMs 
    });

    this.intervalId = setInterval(async () => {
      try {
        const changes = await this.checkForChanges();
        if (changes.length > 0) {
          logger.info('Content changes detected', { 
            module: 'ContentChangeDetector', 
            count: changes.length,
            changes: changes.map(c => `${c.type}:${c.id}`)
          });
        }
      } catch (error) {
        logger.error('Error during content change detection', error, { 
          module: 'ContentChangeDetector' 
        });
      }
    }, this.config.pollIntervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('Content change detection stopped', { module: 'ContentChangeDetector' });
    }
  }

  async checkForChanges(): Promise<ContentChange[]> {
    const changes: ContentChange[] = [];
    this.metrics.totalChecks++;
    this.metrics.lastCheckTime = Date.now();

    try {
      const postChanges = await this.checkPostsForChanges();
      changes.push(...postChanges);

      const categoryChanges = await this.checkCategoriesForChanges();
      changes.push(...categoryChanges);

      const tagChanges = await this.checkTagsForChanges();
      changes.push(...tagChanges);

      if (changes.length > 0) {
        this.metrics.changesDetected += changes.length;
        this.metrics.lastChangeTime = Date.now();
        await this.handleContentChanges(changes);
      }
    } catch (error) {
      logger.error('Error checking for content changes', error, { 
        module: 'ContentChangeDetector' 
      });
    }

    return changes;
  }

  private async checkPostsForChanges(): Promise<ContentChange[]> {
    const changes: ContentChange[] = [];

    try {
      const response = await apiClient.get<WordPressPost[]>(
        getApiUrl('/wp/v2/posts'),
        { 
          params: { 
            per_page: 1, 
            orderby: 'modified',
            order: 'desc',
            _fields: 'id,modified,slug,status'
          }
        }
      );

      const mostRecentPost = response.data[0];

      if (mostRecentPost && this.lastPostModified !== mostRecentPost.modified) {
        if (this.lastPostModified) {
          const action = this.lastPostModified < mostRecentPost.modified ? 'updated' : 'created';
          changes.push({
            type: 'post',
            id: mostRecentPost.id,
            slug: mostRecentPost.slug,
            action,
            timestamp: mostRecentPost.modified
          });
          this.metrics.postChanges++;
        }
        this.lastPostModified = mostRecentPost.modified;
      }
    } catch (error) {
      logger.error('Error checking posts for changes', error, { 
        module: 'ContentChangeDetector' 
      });
    }

    return changes;
  }

  private async checkCategoriesForChanges(): Promise<ContentChange[]> {
    const changes: ContentChange[] = [];

    try {
      const response = await apiClient.get<WordPressCategory[]>(
        getApiUrl('/wp/v2/categories'),
        { 
          params: { 
            per_page: 1, 
            orderby: 'modified',
            order: 'desc',
            _fields: 'id,modified,slug'
          }
        }
      );

      const mostRecentCategory = response.data[0];

      if (mostRecentCategory && this.lastCategoryModified !== mostRecentCategory.modified) {
        if (this.lastCategoryModified && mostRecentCategory.modified) {
          const action = this.lastCategoryModified < mostRecentCategory.modified ? 'updated' : 'created';
          changes.push({
            type: 'category',
            id: mostRecentCategory.id,
            slug: mostRecentCategory.slug,
            action,
            timestamp: mostRecentCategory.modified
          });
          this.metrics.categoryChanges++;
        }
        if (mostRecentCategory.modified) {
          this.lastCategoryModified = mostRecentCategory.modified;
        }
      }
    } catch (error) {
      logger.error('Error checking categories for changes', error, { 
        module: 'ContentChangeDetector' 
      });
    }

    return changes;
  }

  private async checkTagsForChanges(): Promise<ContentChange[]> {
    const changes: ContentChange[] = [];

    try {
      const response = await apiClient.get<WordPressTag[]>(
        getApiUrl('/wp/v2/tags'),
        { 
          params: { 
            per_page: 1, 
            orderby: 'modified',
            order: 'desc',
            _fields: 'id,modified,slug'
          }
        }
      );

      const mostRecentTag = response.data[0];

      if (mostRecentTag && this.lastTagModified !== mostRecentTag.modified) {
        if (this.lastTagModified && mostRecentTag.modified) {
          const action = this.lastTagModified < mostRecentTag.modified ? 'updated' : 'created';
          changes.push({
            type: 'tag',
            id: mostRecentTag.id,
            slug: mostRecentTag.slug,
            action,
            timestamp: mostRecentTag.modified
          });
          this.metrics.tagChanges++;
        }
        if (mostRecentTag.modified) {
          this.lastTagModified = mostRecentTag.modified;
        }
      }
    } catch (error) {
      logger.error('Error checking tags for changes', error, { 
        module: 'ContentChangeDetector' 
      });
    }

    return changes;
  }

  private async handleContentChanges(changes: ContentChange[]): Promise<void> {
    for (const change of changes) {
      await this.invalidateCacheForChange(change);
    }
    this.metrics.invalidationsTriggered = this.invalidationsTriggered;
  }

  private async invalidateCacheForChange(change: ContentChange): Promise<void> {
    switch (change.type) {
      case 'post':
        if (change.action === 'deleted') {
          cacheManager.invalidate(cacheKeys.postById(change.id));
          cacheManager.invalidate(cacheKeys.post(change.slug || ''));
        } else {
          cacheManager.invalidate(cacheKeys.postById(change.id));
          cacheManager.invalidate(cacheKeys.post(change.slug || ''));
          cacheManager.invalidate(cacheKeys.posts());
        }
        this.invalidationsTriggered += change.action === 'deleted' ? 1 : 3;
        break;

      case 'category':
        cacheManager.invalidate(cacheKeys.category(change.slug || change.id.toString()));
        cacheManager.invalidate(cacheKeys.categories());
        cacheManager.invalidate(cacheKeys.posts());
        this.invalidationsTriggered += 3;
        break;

      case 'tag':
        cacheManager.invalidate(cacheKeys.tag(change.slug || change.id.toString()));
        cacheManager.invalidate(cacheKeys.tags());
        cacheManager.invalidate(cacheKeys.posts());
        this.invalidationsTriggered += 3;
        break;
    }

    logger.info('Cache invalidated for content change', {
      module: 'ContentChangeDetector',
      change
    });
  }

  getMetrics(): ContentChangeMetrics {
    return {
      ...this.metrics,
      invalidationsTriggered: this.invalidationsTriggered
    };
  }
}

const DEFAULT_POLL_INTERVAL = 60000;

let contentChangeDetector: IContentChangeDetector | null = null;

export function createContentChangeDetector(
  config?: Partial<ContentChangeDetectorConfig>
): IContentChangeDetector {
  const finalConfig: ContentChangeDetectorConfig = {
    pollIntervalMs: config?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL,
    enabled: config?.enabled ?? process.env.CONTENT_CHANGE_DETECTION_ENABLED !== 'false',
  };

  contentChangeDetector = new ContentChangeDetector(finalConfig);
  return contentChangeDetector;
}

export function getContentChangeDetector(): IContentChangeDetector | null {
  return contentChangeDetector;
}

export function initializeContentChangeDetection(): void {
  if (!contentChangeDetector) {
    contentChangeDetector = createContentChangeDetector();
  }
  contentChangeDetector.start();
}

export function stopContentChangeDetection(): void {
  if (contentChangeDetector) {
    contentChangeDetector.stop();
  }
}

export default ContentChangeDetector;