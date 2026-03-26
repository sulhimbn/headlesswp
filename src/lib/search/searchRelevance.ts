import type { WordPressPost } from '@/types/wordpress';

export interface ScoredPost extends WordPressPost {
  relevanceScore: number;
}

export interface RelevanceScoringOptions {
  titleWeight: number;
  excerptWeight: number;
  contentWeight: number;
  exactPhraseBonus: number;
}

const DEFAULT_OPTIONS: RelevanceScoringOptions = {
  titleWeight: 10,
  excerptWeight: 5,
  contentWeight: 1,
  exactPhraseBonus: 15,
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
}

export function extractSearchableText(post: WordPressPost): { title: string; excerpt: string; content: string } {
  const title = extractTextFromHtml(post.title?.rendered || '');
  const excerpt = extractTextFromHtml(post.excerpt?.rendered || '');
  const content = extractTextFromHtml(post.content?.rendered || '');

  return { title, excerpt, content };
}

function extractTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function calculateRelevanceScore(
  post: WordPressPost,
  query: string,
  options: Partial<RelevanceScoringOptions> = {}
): number {
  const titleWeight = options.titleWeight ?? DEFAULT_OPTIONS.titleWeight;
  const excerptWeight = options.excerptWeight ?? DEFAULT_OPTIONS.excerptWeight;
  const contentWeight = options.contentWeight ?? DEFAULT_OPTIONS.contentWeight;
  const exactPhraseBonus = options.exactPhraseBonus ?? DEFAULT_OPTIONS.exactPhraseBonus;
  
  const normalizedQuery = query.toLowerCase().trim();
  const queryTokens = tokenize(normalizedQuery);
  const searchableText = extractSearchableText(post);

  if (queryTokens.length === 0) {
    return 0;
  }

  let score = 0;

  const exactPhraseTitle = searchableText.title.toLowerCase().includes(normalizedQuery);
  const exactPhraseExcerpt = searchableText.excerpt.toLowerCase().includes(normalizedQuery);
  const exactPhraseContent = searchableText.content.toLowerCase().includes(normalizedQuery);

  if (exactPhraseTitle) score += exactPhraseBonus;
  if (exactPhraseExcerpt) score += exactPhraseBonus;
  if (exactPhraseContent) score += exactPhraseBonus;

  const titleTokens = tokenize(searchableText.title);
  const excerptTokens = tokenize(searchableText.excerpt);
  const contentTokens = tokenize(searchableText.content);

  for (const queryToken of queryTokens) {
    for (let i = 0; i < titleTokens.length; i++) {
      if (titleTokens[i].includes(queryToken)) {
        const positionWeight = 1 + (1 - i / titleTokens.length) * 0.5;
        score += titleWeight * positionWeight;
      }
    }

    for (let i = 0; i < excerptTokens.length; i++) {
      if (excerptTokens[i].includes(queryToken)) {
        const positionWeight = 1 + (1 - i / excerptTokens.length) * 0.5;
        score += excerptWeight * positionWeight;
      }
    }

    for (let i = 0; i < contentTokens.length; i++) {
      if (contentTokens[i].includes(queryToken)) {
        const positionWeight = 1 + (1 - i / contentTokens.length) * 0.5;
        score += contentWeight * positionWeight;
      }
    }
  }

  return score;
}

export function rankPostsByRelevance(
  posts: WordPressPost[],
  query: string,
  options: Partial<RelevanceScoringOptions> = {}
): ScoredPost[] {
  if (!query.trim()) {
    return posts.map(post => ({ ...post, relevanceScore: 0 }));
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const scoredPosts = posts.map(post => ({
    ...post,
    relevanceScore: calculateRelevanceScore(post, query, mergedOptions),
  }));

  scoredPosts.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scoredPosts;
}