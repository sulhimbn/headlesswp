import { wordpressAPI } from '@/lib/wordpress';
import { findRelatedTerms } from '@/lib/utils/synonyms';
import { WordPressPost } from '@/types/wordpress';

export interface SemanticSearchResult {
  posts: WordPressPost[];
  totalPages: number;
  semanticScore: number;
  usedFallback: boolean;
  relatedTerms: string[];
}

export interface SemanticSearchOptions {
  enableSynonymExpansion: boolean;
  enableReranking: boolean;
  similarityThreshold: number;
  timeoutMs: number;
}

const DEFAULT_OPTIONS: SemanticSearchOptions = {
  enableSynonymExpansion: true,
  enableReranking: true,
  similarityThreshold: 0.3,
  timeoutMs: 500,
};

interface TermFrequency {
  [term: string]: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);
}

function computeTermFrequency(tokens: string[]): TermFrequency {
  const tf: TermFrequency = {};
  for (const token of tokens) {
    tf[token] = (tf[token] || 0) + 1;
  }
  return tf;
}

function computeSimilarity(tokens1: string[], tokens2: string[]): number {
  if (tokens1.length === 0 || tokens2.length === 0) {
    return 0;
  }

  const tf1 = computeTermFrequency(tokens1);
  const tf2 = computeTermFrequency(tokens2);

  const terms1 = new Set(Object.keys(tf1));
  const terms2 = new Set(Object.keys(tf2));
  const intersection = new Set([...terms1].filter(x => terms2.has(x)));
  
  if (intersection.size === 0) {
    return 0;
  }

  const union = new Set([...terms1, ...terms2]);
  
  return intersection.size / union.size;
}

function rerankPosts(
  posts: WordPressPost[], 
  query: string, 
  options: SemanticSearchOptions
): { posts: WordPressPost[], score: number } {
  const queryTokens = tokenize(query);
  
  const scoredPosts = posts.map(post => {
    const titleTokens = tokenize(post.title?.rendered || '');
    const excerptTokens = tokenize(post.excerpt?.rendered || '');
    
    const titleSimilarity = computeSimilarity(queryTokens, titleTokens);
    const excerptSimilarity = computeSimilarity(queryTokens, excerptTokens);
    
    const combinedScore = (titleSimilarity * 0.7) + (excerptSimilarity * 0.3);
    
    return { post, score: combinedScore };
  });

  const filtered = scoredPosts.filter(p => p.score >= options.similarityThreshold);
  const sorted = filtered.sort((a, b) => b.score - a.score);
  
  const avgScore = sorted.length > 0 
    ? sorted.reduce((sum, p) => sum + p.score, 0) / sorted.length 
    : 0;

  return {
    posts: sorted.map(p => p.post),
    score: avgScore
  };
}

async function searchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<{ data?: T; error?: Error; timedOut: boolean }> {
  let timeoutHandle: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error('Search timeout'));
    }, timeoutMs);
  });

  try {
    const data = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return { data, timedOut: false };
  } catch (error) {
    clearTimeout(timeoutHandle!);
    if (error instanceof Error && error.message === 'Search timeout') {
      return { error: error as Error, timedOut: true };
    }
    return { error: error as Error, timedOut: false };
  }
}

export async function semanticSearch(
  query: string,
  page: number = 1,
  perPage: number = 12,
  options: Partial<SemanticSearchOptions> = {}
): Promise<SemanticSearchResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const relatedTerms = opts.enableSynonymExpansion 
    ? findRelatedTerms(query, 5) 
    : [];
  
  let expandedQuery = query;
  if (opts.enableSynonymExpansion && relatedTerms.length > 1) {
    expandedQuery = relatedTerms.join(' ');
  }

  const searchPromise = wordpressAPI.search(expandedQuery, page, perPage * 2);
  
  const { data, error, timedOut } = await searchWithTimeout(searchPromise, opts.timeoutMs);

  if (error || timedOut || !data) {
    const fallbackResult = await wordpressAPI.search(query, page, perPage);
    
    return {
      posts: fallbackResult.posts,
      totalPages: fallbackResult.totalPages,
      semanticScore: 0,
      usedFallback: true,
      relatedTerms: []
    };
  }

  let finalPosts = data.posts;
  let semanticScore = 1.0;

  if (opts.enableReranking && data.posts.length > 0) {
    const reranked = rerankPosts(data.posts, query, opts);
    finalPosts = reranked.posts.slice(0, perPage);
    semanticScore = reranked.score;
  } else {
    finalPosts = finalPosts.slice(0, perPage);
  }

  const standardizedPosts = finalPosts;

  return {
    posts: standardizedPosts,
    totalPages: Math.ceil(data.totalPages),
    semanticScore,
    usedFallback: false,
    relatedTerms
  };
}

export async function fallbackSearch(
  query: string,
  page: number = 1,
  perPage: number = 12
): Promise<SemanticSearchResult> {
  const result = await wordpressAPI.search(query, page, perPage);
  
  return {
    posts: result.posts,
    totalPages: result.totalPages,
    semanticScore: 0,
    usedFallback: true,
    relatedTerms: []
  };
}
