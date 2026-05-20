import { logger } from '@/lib/utils/logger';

const OPENAI_EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';

export interface SemanticSearchConfig {
  enabled: boolean;
  apiKey: string | undefined;
  model: string;
}

export interface SearchResult {
  postId: number;
  score: number;
  title: string;
  excerpt: string;
}

function getConfig(): SemanticSearchConfig {
  return {
    enabled: process.env.NEXT_PUBLIC_SEMANTIC_SEARCH_ENABLED === 'true',
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small'
  };
}

export async function generateEmbedding(text: string, config: SemanticSearchConfig): Promise<number[] | null> {
  if (!config.apiKey) {
    logger.warn('OpenAI API key not configured for semantic search', undefined, { module: 'semanticSearch' });
    return null;
  }

  try {
    const response = await fetch(OPENAI_EMBEDDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        input: text.slice(0, 8000)
      })
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error(`OpenAI API error: ${response.status}`, undefined, { module: 'semanticSearch', error });
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (error) {
    logger.error('Failed to generate embedding', error, { module: 'semanticSearch' });
    return null;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function normalizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function computeContentHash(content: string): string {
  const normalized = normalizeText(content);
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export interface CachedEmbedding {
  hash: string;
  embedding: number[];
  timestamp: number;
}

const embeddingCache = new Map<string, CachedEmbedding>();
const CACHE_TTL = 3600000;

export async function getEmbeddingForContent(
  content: string,
  config: SemanticSearchConfig
): Promise<number[] | null> {
  const hash = computeContentHash(content);
  const cached = embeddingCache.get(hash);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.embedding;
  }

  const embedding = await generateEmbedding(content, config);

  if (embedding) {
    embeddingCache.set(hash, {
      hash,
      embedding,
      timestamp: Date.now()
    });
  }

  return embedding;
}

export async function semanticSearch(
  query: string,
  posts: Array<{ id: number; title: { rendered: string }; excerpt: { rendered: string }; content: { rendered: string } }>,
  config?: SemanticSearchConfig
): Promise<{ results: SearchResult[]; searchType: 'semantic' | 'keyword' }> {
  const cfg = config || getConfig();

  if (!cfg.enabled || !cfg.apiKey) {
    return { results: [], searchType: 'keyword' };
  }

  const queryEmbedding = await generateEmbedding(query, cfg);

  if (!queryEmbedding) {
    logger.warn('Failed to generate query embedding, falling back to keyword search', undefined, { module: 'semanticSearch' });
    return { results: [], searchType: 'keyword' };
  }

  const results: SearchResult[] = [];

  for (const post of posts) {
    const content = `${post.title.rendered} ${post.excerpt.rendered} ${post.content.rendered}`;
    const contentEmbedding = await getEmbeddingForContent(content, cfg);

    if (!contentEmbedding) continue;

    const score = cosineSimilarity(queryEmbedding, contentEmbedding);

    if (score > 0.3) {
      results.push({
        postId: post.id,
        score,
        title: post.title.rendered,
        excerpt: post.excerpt.rendered
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  return { results, searchType: 'semantic' };
}

export function isSemanticSearchEnabled(): boolean {
  const config = getConfig();
  return config.enabled && !!config.apiKey;
}

export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}

export const semanticSearchConfig = {
  get: getConfig,
  isEnabled: isSemanticSearchEnabled,
  clearCache: clearEmbeddingCache
};
