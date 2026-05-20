import { logger } from '@/lib/utils/logger';
import type { WordPressPost } from '@/types/wordpress';
import { wordpressAPI } from '@/lib/wordpress';
import { performanceMetricsCollector, type ApiResponseTimeMetric } from '@/lib/api/performanceMetrics';

export interface SemanticSearchConfig {
  enabled: boolean;
  expansionEnabled: boolean;
  maxKeywords: number;
  minQueryLength: number;
  fallbackToTraditional: boolean;
}

export interface SemanticSearchResult {
  posts: WordPressPost[];
  totalPages: number;
  method: 'semantic' | 'traditional';
  query: string;
  expandedQuery?: string;
  metrics: SemanticSearchMetrics;
}

export interface SemanticSearchMetrics {
  semanticDuration: number;
  traditionalDuration: number;
  totalDuration: number;
  resultCount: number;
  usedExpansion: boolean;
}

const DEFAULT_CONFIG: SemanticSearchConfig = {
  enabled: process.env.SEMANTIC_SEARCH_ENABLED !== 'false',
  expansionEnabled: process.env.SEMANTIC_SEARCH_EXPANSION_ENABLED !== 'false',
  maxKeywords: parseInt(process.env.SEMANTIC_SEARCH_MAX_KEYWORDS || '5', 10),
  minQueryLength: parseInt(process.env.SEMANTIC_SEARCH_MIN_QUERY_LENGTH || '3', 10),
  fallbackToTraditional: process.env.SEMANTIC_SEARCH_FALLBACK !== 'false'
};

const KEYWORD_EXPANSION_MAP: Record<string, string[]> = {
  'berita': ['news', 'informasi', 'berita terbaru', 'headline'],
  'news': ['berita', 'informasi', 'headline', 'update'],
  'politik': ['politics', 'pemerintah', 'kebijakan', 'politik indonesia'],
  'ekonomi': ['economy', 'keuangan', 'bisnis', 'ekonomi indonesia'],
  'bisnis': ['business', 'entrepreneur', 'startup', 'keuangan'],
  'teknologi': ['technology', 'tech', 'digital', 'innovation'],
  'tech': ['teknologi', 'digital', 'teknologi', 'inovasi'],
  'olahraga': ['sports', 'sepakbola', 'bola', 'atlet'],
  'sports': ['olahraga', 'sepakbola', 'bola', 'atlet'],
  'hiburan': ['entertainment', 'artis', 'film', 'musik'],
  'entertainment': ['hiburan', 'artis', 'film', 'musik'],
  'pendidikan': ['education', 'sekolah', 'kampus', 'kuliah'],
  'education': ['pendidikan', 'sekolah', 'kampus', 'kuliah'],
  'kesehatan': ['health', 'medis', 'keseimbangan', 'wellness'],
  'health': ['kesehatan', 'medis', 'keseimbangan', 'wellness'],
  'politik indonesia': ['pemerintah', ' MPR', 'DPR', 'presiden', 'pilpres'],
  'pemerintah': ['politik', 'negara', 'kebijakan', 'pemerintah indonesia'],
  'islam': ['muslim', 'agama', 'keislaman', 'quran'],
  'muslim': ['islam', 'agama', 'keislaman', 'quran'],
  ' Indonesia': ['nusantara', 'bangsa', 'tanah air', 'RI'],
  'update': ['terbaru', 'terkini', 'terbaru', 'breaking'],
  'terbaru': ['update', 'terkini', 'Breaking news', 'terbaru saat ini'],
  'trending': ['populer', 'viral', 'hot', 'terpopuler'],
  'populer': ['trending', 'viral', 'hot', 'terpopuler'],
  'viral': ['trending', 'populer', 'hot', 'banyak dibicarakan'],
  'hot': ['trending', 'viral', 'populer', 'terpanas'],
  'terkini': ['terbaru', 'update', 'Breaking', 'terbaru saat ini'],
  'Breaking': ['terbaru', 'terkini', 'update', 'urgent'],
  'urgent': ['penting', 'mendesak', 'segera', 'kritis'],
  'penting': ['urgent', 'mendesak', 'signifikan', 'kritis'],
  'mendesak': ['urgent', 'penting', 'segera', 'kritis'],
  'kritis': ['urgent', 'penting', 'mendesak', 'serious'],
  'serious': ['kritis', 'penting', 'urgent', 'signifikan'],
  'signifikan': ['penting', 'besar', 'utama', 'krusial'],
  'besar': ['besar', 'utama', 'signifikan', 'besar'],
  'utama': ['utama', 'utama', 'signifikan', 'paling penting'],
  'paling penting': ['utama', 'signifikan', 'kritis', 'utama'],
  'krisis': ['kritis', 'darurat', 'urgent', 'masalah besar'],
  'darurat': ['urgent', 'krisis', 'segera', 'mendesak'],
  'masalah': ['isu', 'problem', 'permasalahan', 'kesulitan'],
  'isu': ['masalah', 'problem', 'permasalahan', 'topic'],
  'problem': ['masalah', 'isu', 'kesulitan', 'issue'],
  'kesulitan': ['masalah', 'susah', 'sulit', 'problem'],
  'sulit': ['susah', 'kesulitan', 'difficult', 'hard'],
  'susah': ['sulit', 'kesulitan', 'difficult', 'hard'],
  'difficult': ['sulit', 'susah', 'hard', 'challenging'],
  'hard': ['sulit', 'susah', 'difficult', 'challenging'],
  'challenging': ['difficult', 'hard', 'sulit', 'menantang'],
  'menantang': ['challenging', 'sulit', 'difficult', 'hard'],
  'interesting': ['menarik', 'interest', 'fascinating', 'penting'],
  'menarik': ['interesting', 'important', 'penting', 'fascinating'],
  'fascinating': ['menarik', 'interesting', 'awesome', 'luar biasa'],
  'luar biasa': ['fantastic', 'amazing', 'awesome', 'extraordinary'],
  'fantastic': ['luar biasa', 'amazing', 'awesome', 'extraordinary'],
  'amazing': ['luar biasa', 'fantastic', 'awesome', 'extraordinary'],
  'awesome': ['luar biasa', 'fantastic', 'amazing', 'great'],
  'great': ['bagus', 'baik', 'awesome', 'excellent'],
  'bagus': ['baik', 'great', 'good', 'excellent'],
  'baik': ['bagus', 'good', 'great', 'positive'],
  'good': ['baik', 'bagus', 'great', 'excellent'],
  'excellent': ['bagus', 'baik', 'great', 'good'],
  'positive': ['baik', 'positif', 'good', 'bagus'],
  'positif': ['positive', 'baik', 'good', 'bagus'],
  'negative': ['negatif', 'buruk', 'bad', 'tidak baik'],
  'negatif': ['negative', 'buruk', 'bad', 'tidak baik'],
  'buruk': ['bad', 'negative', 'negatif', 'tidak baik'],
  'bad': ['buruk', 'negative', 'negatif', 'tidak baik'],
  'tidak baik': ['buruk', 'bad', 'negative', 'negatif'],
  'important': ['penting', 'significant', 'urgent', 'key'],
  'significant': ['penting', 'important', 'besar', 'utama'],
  'key': ['penting', 'important', 'kunci', 'utama'],
  'kunci': ['key', 'penting', 'important', 'utama'],
  'crucial': ['penting', 'kritis', 'urgent', 'key'],
  'critical': ['kritis', 'crucial', 'urgent', 'penting'],
};

function expandQueryKeywords(query: string, maxKeywords: number): string[] {
  const words = query.toLowerCase().trim().split(/\s+/);
  const expanded: Set<string> = new Set(words);

  for (const word of words) {
    const expansions = KEYWORD_EXPANSION_MAP[word];
    if (expansions) {
      for (const expansion of expansions) {
        if (expanded.size >= maxKeywords + words.length) break;
        expanded.add(expansion);
      }
    }
  }

  return Array.from(expanded).slice(0, maxKeywords + words.length);
}

function createExpandedQuery(originalQuery: string, expandedKeywords: string[]): string {
  return expandedKeywords.join(' ');
}

export class SemanticSearchService {
  private config: SemanticSearchConfig;

  constructor(config: Partial<SemanticSearchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig(): SemanticSearchConfig {
    return { ...this.config };
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  shouldUseSemanticSearch(query: string): boolean {
    if (!this.config.enabled) return false;
    if (!this.config.expansionEnabled) return false;
    if (query.length < this.config.minQueryLength) return false;
    return true;
  }

  async search(
    query: string,
    page: number = 1,
    perPage: number = 12,
    signal?: AbortSignal
  ): Promise<SemanticSearchResult> {
    const startTime = Date.now();
    const metrics: SemanticSearchMetrics = {
      semanticDuration: 0,
      traditionalDuration: 0,
      totalDuration: 0,
      resultCount: 0,
      usedExpansion: false
    };

    const queryTrack = `search:${query}:${page}`;
    const trackStartTime = Date.now();

    if (!query.trim()) {
      return {
        posts: [],
        totalPages: 0,
        method: 'traditional',
        query,
        metrics
      };
    }

    if (!this.shouldUseSemanticSearch(query)) {
      const traditionalStart = Date.now();
      const result = await wordpressAPI.search(query, page, perPage, signal);
      metrics.traditionalDuration = Date.now() - traditionalStart;
      metrics.totalDuration = Date.now() - startTime;
      metrics.resultCount = result.posts.length;

      this.recordSearchMetric(queryTrack, trackStartTime, false, result.posts.length);

      return {
        posts: result.posts,
        totalPages: result.totalPages,
        method: 'traditional',
        query,
        metrics
      };
    }

    const expandedKeywords = expandQueryKeywords(query, this.config.maxKeywords);
    const expandedQuery = createExpandedQuery(query, expandedKeywords);
    const usedExpansion = expandedKeywords.length > query.split(/\s+/).length;

    let semanticResult: { posts: WordPressPost[], totalPages: number } | null = null;
    let semanticFailed = false;

    if (usedExpansion) {
      const semanticStart = Date.now();
      try {
        semanticResult = await wordpressAPI.search(expandedQuery, page, perPage, signal);
        metrics.semanticDuration = Date.now() - semanticStart;

        if (semanticResult.posts.length === 0 && this.config.fallbackToTraditional) {
          semanticFailed = true;
        }
      } catch (error) {
        logger.warn('Semantic search failed, falling back to traditional', error, { module: 'SemanticSearchService', query: expandedQuery });
        semanticFailed = true;
      }
    } else {
      semanticFailed = true;
    }

    if (semanticFailed || !semanticResult) {
      const traditionalStart = Date.now();
      const result = await wordpressAPI.search(query, page, perPage, signal);
      metrics.traditionalDuration = Date.now() - traditionalStart;
      metrics.totalDuration = Date.now() - startTime;
      metrics.resultCount = result.posts.length;

      this.recordSearchMetric(queryTrack, trackStartTime, false, result.posts.length);

      return {
        posts: result.posts,
        totalPages: result.totalPages,
        method: 'traditional',
        query,
        metrics
      };
    }

    metrics.totalDuration = Date.now() - startTime;
    metrics.resultCount = semanticResult.posts.length;
    metrics.usedExpansion = usedExpansion;

    this.recordSearchMetric(queryTrack, trackStartTime, true, semanticResult.posts.length);

    return {
      posts: semanticResult.posts,
      totalPages: semanticResult.totalPages,
      method: 'semantic',
      query,
      expandedQuery: usedExpansion ? expandedQuery : undefined,
      metrics
    };
  }

  private recordSearchMetric(
    queryTrack: string,
    startTime: number,
    usedSemantic: boolean,
    resultCount: number
  ): void {
    const duration = Date.now() - startTime;

    const metric: ApiResponseTimeMetric = {
      endpoint: '/semantic-search',
      method: 'GET',
      duration,
      statusCode: 200,
      cacheHit: false
    };

    performanceMetricsCollector.recordApiResponse(metric);

    logger.info(`Semantic search completed`, {
      module: 'SemanticSearchService',
      queryTrack,
      usedSemantic,
      resultCount,
      duration
    });
  }

  addKeywordExpansion(keyword: string, expansions: string[]): void {
    KEYWORD_EXPANSION_MAP[keyword.toLowerCase()] = expansions;
  }

  removeKeywordExpansion(keyword: string): boolean {
    if (KEYWORD_EXPANSION_MAP[keyword.toLowerCase()]) {
      delete KEYWORD_EXPANSION_MAP[keyword.toLowerCase()];
      return true;
    }
    return false;
  }
}

export const semanticSearchService = new SemanticSearchService();

export function createSemanticSearchService(config?: Partial<SemanticSearchConfig>): SemanticSearchService {
  return new SemanticSearchService(config);
}
