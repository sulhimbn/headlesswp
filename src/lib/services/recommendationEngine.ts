import { RECOMMENDATION_CONFIG, RECOMMENDATION_ALGORITHM, ANALYTICS_CONFIG } from '@/lib/api/recommendationConfig';
import { wordpressAPI } from '@/lib/wordpress';
import { logger } from '@/lib/utils/logger';

export interface RecommendationItem {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  slug: string;
  featured_media: number;
  date: string;
  categories: number[];
  tags: number[];
  mediaUrl?: string | null;
  score: number;
}

export interface RecommendationOptions {
  currentPostId: number;
  currentCategoryIds: number[];
  currentTagIds: number[];
  limit?: number;
}

export interface CTRData {
  postId: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

const CTR_STORAGE_KEY = 'recommendation_ctr';
const IMPRESSIONS_KEY = 'recommendation_impressions';

function getStorageData<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorageData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable
  }
}

function calculatePostScore(
  post: { id: number; categories: number[]; tags: number[]; date: string },
  targetCategories: number[],
  targetTags: number[]
): number {
  if (!RECOMMENDATION_ALGORITHM.USE_CATEGORIES && !RECOMMENDATION_ALGORITHM.USE_TAGS) {
    return 0;
  }

  let score = 0;

  if (RECOMMENDATION_ALGORITHM.USE_CATEGORIES && targetCategories.length > 0) {
    const matchingCategories = post.categories.filter(cat => targetCategories.includes(cat));
    const categoryScore = (matchingCategories.length / targetCategories.length) * RECOMMENDATION_CONFIG.CATEGORY_WEIGHT;
    score += categoryScore;
  }

  if (RECOMMENDATION_ALGORITHM.USE_TAGS && targetTags.length > 0) {
    const matchingTags = post.tags.filter(tag => targetTags.includes(tag));
    const tagScore = (matchingTags.length / Math.max(targetTags.length, 1)) * RECOMMENDATION_CONFIG.TAG_WEIGHT;
    score += tagScore;
  }

  if (RECOMMENDATION_ALGORITHM.USE_RECENCY) {
    const postDate = new Date(post.date);
    const now = new Date();
    const ageInDays = (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageInDays <= RECOMMENDATION_CONFIG.MAX_AGE_DAYS) {
      const recencyScore = Math.max(0, (1 - ageInDays / RECOMMENDATION_CONFIG.MAX_AGE_DAYS)) * RECOMMENDATION_CONFIG.RECENCY_WEIGHT;
      score += recencyScore;
    }
  }

  return score;
}

export async function getRecommendations(options: RecommendationOptions): Promise<RecommendationItem[]> {
  const { currentPostId, currentCategoryIds, currentTagIds, limit = RECOMMENDATION_CONFIG.MAX_RECOMMENDATIONS } = options;

  try {
    const posts = await wordpressAPI.getPosts({
      per_page: 20
    });

    if (!posts || posts.length === 0) {
      logger.warn('No posts found for recommendations', undefined, { module: 'recommendationEngine' });
      return [];
    }

    const scoredPosts: RecommendationItem[] = posts
      .filter(post => post.id !== currentPostId)
      .map(post => ({
        ...post,
        categories: post.categories || [],
        tags: post.tags || [],
        mediaUrl: null,
        score: calculatePostScore(post, currentCategoryIds, currentTagIds)
      }))
      .sort((a: RecommendationItem, b: RecommendationItem) => b.score - a.score)
      .slice(0, limit);

    return scoredPosts;
  } catch (error) {
    logger.error('Failed to get recommendations', error, { module: 'recommendationEngine' });
    return [];
  }
}

export function trackImpression(postId: number): void {
  if (!ANALYTICS_CONFIG.TRACK_IMPRESSIONS || typeof window === 'undefined') return;

  const impressions = getStorageData<Record<number, number>>(IMPRESSIONS_KEY, {});
  impressions[postId] = (impressions[postId] || 0) + 1;
  setStorageData(IMPRESSIONS_KEY, impressions);
}

export function trackClick(postId: number): void {
  if (!ANALYTICS_CONFIG.TRACK_CLICKS || typeof window === 'undefined') return;

  const ctrData = getStorageData<Record<number, { impressions: number; clicks: number }>>(CTR_STORAGE_KEY, {});
  
  if (!ctrData[postId]) {
    const impressions = getStorageData<Record<number, number>>(IMPRESSIONS_KEY, {});
    ctrData[postId] = {
      impressions: impressions[postId] || 0,
      clicks: 0
    };
  }
  
  ctrData[postId].clicks += 1;
  setStorageData(CTR_STORAGE_KEY, ctrData);

  const impressions = getStorageData<Record<number, number>>(IMPRESSIONS_KEY, {});
  delete impressions[postId];
  setStorageData(IMPRESSIONS_KEY, impressions);
}

export function getCTRData(postId: number): CTRData | null {
  const ctrData = getStorageData<Record<number, { impressions: number; clicks: number }>>(CTR_STORAGE_KEY, {});
  const data = ctrData[postId];
  
  if (!data) return null;
  
  const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
  
  return {
    postId,
    impressions: data.impressions,
    clicks: data.clicks,
    ctr: Math.round(ctr * 100) / 100
  };
}

export function getAllCTRData(): CTRData[] {
  const ctrData = getStorageData<Record<number, { impressions: number; clicks: number }>>(CTR_STORAGE_KEY, {});
  
  return Object.entries(ctrData).map(([postId, data]) => ({
    postId: Number(postId),
    impressions: data.impressions,
    clicks: data.clicks,
    ctr: data.impressions > 0 ? Math.round((data.clicks / data.impressions) * 10000) / 100 : 0
  }));
}

export function clearCTRData(): void {
  setStorageData(CTR_STORAGE_KEY, {});
  setStorageData(IMPRESSIONS_KEY, {});
}