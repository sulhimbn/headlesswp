import { wordpressAPI } from '@/lib/wordpress';
import type { WordPressPost } from '@/types/wordpress';
import { cacheManager, CACHE_TTL, cacheKeys } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';

export interface SearchResult {
  post: WordPressPost;
  score: number;
  matchedTerms: string[];
}

export interface SemanticSearchResult {
  posts: SearchResult[];
  relatedQueries: string[];
  totalCount: number;
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'dengan', 'ini', 'itu', 'pada',
    'adalah', 'akan', 'sudah', 'ada', 'bisa', 'atau', 'jika', 'maka', 'oleh',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could',
    'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function calculateRelevanceScore(query: string, post: WordPressPost): { score: number; matchedTerms: string[] } {
  const queryTerms = extractKeywords(query);
  const titleTerms = extractKeywords(post.title.rendered);
  const contentTerms = extractKeywords(
    `${post.title.rendered} ${post.excerpt.rendered}`.replace(/<[^>]*>/g, '')
  );

  const matchedTerms: string[] = [];
  let score = 0;

  queryTerms.forEach(qt => {
    if (titleTerms.includes(qt)) {
      score += 10;
      if (!matchedTerms.includes(qt)) matchedTerms.push(qt);
    }
    if (contentTerms.includes(qt)) {
      score += 5;
      if (!matchedTerms.includes(qt)) matchedTerms.push(qt);
    }
  });

  const titleWords = post.title.rendered.toLowerCase().split(/\s+/);
  const queryLower = query.toLowerCase();
  titleWords.forEach(word => {
    if (word.includes(queryLower) || queryLower.includes(word)) {
      score += 3;
    }
  });

  const dateBonus = post.date ? (Date.now() - new Date(post.date).getTime()) / (1000 * 60 * 60 * 24) : 0;
  const daysSincePost = Math.min(dateBonus / 30, 2);
  score += 2 - daysSincePost;

  return { score, matchedTerms };
}

function generateRelatedQueries(query: string): string[] {
  const keywords = extractKeywords(query);
  const related: string[] = [];

  if (keywords.length > 0) {
    related.push(keywords[0]);
  }

  if (keywords.length > 1) {
    related.push(keywords.slice(0, 2).join(' '));
  }

  const categoryPatterns = [
    { keywords: ['politik', 'political'], related: ['politik indonesia', 'news politik'] },
    { keywords: ['ekonomi', 'economic', 'bisnis', 'business'], related: ['ekonomi indonesia', 'bisnis terbaru'] },
    { keywords: ['teknologi', 'technology', 'tech'], related: ['teknologi terbaru', 'tech news'] },
    { keywords: ['bola', 'football', 'sport'], related: ['sepak bola', 'sports news'] },
    { keywords: ['hiburan', 'entertainment', 'artis'], related: ['hiburan terbaru', 'news hiburan'] },
  ];

  for (const pattern of categoryPatterns) {
    if (pattern.keywords.some(kw => keywords.includes(kw))) {
      pattern.related.forEach(r => {
        if (!related.includes(r)) related.push(r);
      });
    }
  }

  return related.slice(0, 4);
}

export async function semanticSearch(
  query: string,
  page: number = 1,
  perPage: number = 12
): Promise<SemanticSearchResult> {
  const cacheKey = cacheKeys.search(`semantic_${query}`);

  const cached = cacheManager.get<SemanticSearchResult>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const { posts: wpPosts } = await wordpressAPI.search(query, 1, 50);

    if (wpPosts.length === 0) {
      const emptyResult: SemanticSearchResult = {
        posts: [],
        relatedQueries: generateRelatedQueries(query),
        totalCount: 0
      };
      cacheManager.set(cacheKey, emptyResult, CACHE_TTL.SEARCH);
      return emptyResult;
    }

    const scoredResults: SearchResult[] = wpPosts.map(post => {
      const { score, matchedTerms } = calculateRelevanceScore(query, post);
      return { post, score, matchedTerms };
    });

    scoredResults.sort((a, b) => b.score - a.score);

    const startIndex = (page - 1) * perPage;
    const paginatedResults = scoredResults.slice(startIndex, startIndex + perPage);
    const totalPosts = scoredResults.length;
    const calculatedTotalPages = Math.ceil(totalPosts / perPage);

    const result: SemanticSearchResult = {
      posts: paginatedResults,
      relatedQueries: generateRelatedQueries(query),
      totalCount: totalPosts
    };

    cacheManager.set(
      cacheKey,
      { ...result, totalPages: calculatedTotalPages },
      CACHE_TTL.SEARCH
    );

    return result;
  } catch (error) {
    logger.error('Semantic search failed', error, { module: 'semanticSearchService', query });
    return {
      posts: [],
      relatedQueries: generateRelatedQueries(query),
      totalCount: 0
    };
  }
}

export const semanticSearchService = {
  search: semanticSearch,
  extractKeywords,
  calculateRelevanceScore,
  generateRelatedQueries
};

export default semanticSearchService;
