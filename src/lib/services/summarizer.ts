import { cacheManager } from '@/lib/cache';
import { logger } from '@/lib/utils/logger';
import { stripHtml } from '@/lib/utils/stripHtml';

export type SummaryProvider = 'openai' | 'anthropic' | 'local';

export interface SummarizationConfig {
  provider: SummaryProvider;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface SummarizationResult {
  summary: string;
  originalLength: number;
  summaryLength: number;
  cached: boolean;
  generatedAt: string;
}

const DEFAULT_SUMMARY_LENGTH = 150;
const CACHE_TTL_SUMMARY = 7 * 24 * 60 * 60 * 1000;

function getConfig(): SummarizationConfig {
  return {
    provider: (process.env.SUMMARY_PROVIDER as SummaryProvider) || 'local',
    apiKey: process.env.SUMMARY_API_KEY,
    model: process.env.SUMMARY_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.SUMMARY_MAX_TOKENS || '200', 10),
    temperature: parseFloat(process.env.SUMMARY_TEMPERATURE || '0.7'),
  };
}

function getCacheKey(postId: number): string {
  return `summary:${postId}`;
}

function extractTextFromContent(htmlContent: string): string {
  return stripHtml(htmlContent).trim();
}

async function generateSummaryWithOpenAI(
  text: string,
  config: SummarizationConfig
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a content summarizer. Create engaging, concise summaries of articles. Focus on the main points and key insights.',
        },
        {
          role: 'user',
          content: `Summarize this article in about ${DEFAULT_SUMMARY_LENGTH} characters:\n\n${text}`,
        },
      ],
      max_tokens: config.maxTokens || 200,
      temperature: config.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('OpenAI summarization failed', error, { module: 'summarizer' });
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function generateSummaryWithAnthropic(
  text: string,
  config: SummarizationConfig
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-haiku-20240307',
      max_tokens_to_sample: config.maxTokens || 200,
      temperature: config.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: `Summarize this article in about ${DEFAULT_SUMMARY_LENGTH} characters. Focus on the main points and key insights:\n\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('Anthropic summarization failed', error, { module: 'summarizer' });
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0]?.text || '';
}

function generateLocalSummary(text: string): string {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  
  if (sentences.length <= 2) {
    return text.substring(0, DEFAULT_SUMMARY_LENGTH * 2);
  }

  const firstSentence = sentences[0].trim();
  const secondSentence = sentences[1].trim();
  
  let summary = firstSentence;
  if (summary.length < DEFAULT_SUMMARY_LENGTH && secondSentence) {
    summary += '. ' + secondSentence;
  }
  
  if (summary.length > DEFAULT_SUMMARY_LENGTH * 1.5) {
    summary = summary.substring(0, DEFAULT_SUMMARY_LENGTH * 1.5).trim();
    if (!summary.endsWith('.')) {
      summary += '...';
    }
  } else {
    summary += '.';
  }
  
  return summary;
}

async function generateSummary(
  text: string,
  config: SummarizationConfig
): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return generateSummaryWithOpenAI(text, config);
    case 'anthropic':
      return generateSummaryWithAnthropic(text, config);
    case 'local':
    default:
      return generateLocalSummary(text);
  }
}

export async function summarizePost(
  postId: number,
  content: string
): Promise<SummarizationResult> {
  const config = getConfig();
  const cacheKey = getCacheKey(postId);

  const cached = cacheManager.get<string>(cacheKey);
  if (cached) {
    logger.debug('Using cached summary', { postId, module: 'summarizer' });
    return {
      summary: cached,
      originalLength: content.length,
      summaryLength: cached.length,
      cached: true,
      generatedAt: new Date().toISOString(),
    };
  }

  const text = extractTextFromContent(content);
  
  if (text.length < 50) {
    return {
      summary: text,
      originalLength: text.length,
      summaryLength: text.length,
      cached: false,
      generatedAt: new Date().toISOString(),
    };
  }

  try {
    const summary = await generateSummary(text, config);
    
    cacheManager.set(cacheKey, summary, CACHE_TTL_SUMMARY);
    
    logger.info('Summary generated', { postId, length: summary.length, module: 'summarizer' });
    
    return {
      summary,
      originalLength: text.length,
      summaryLength: summary.length,
      cached: false,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error('Summarization failed, falling back to local', error, { postId, module: 'summarizer' });
    
    const fallbackSummary = generateLocalSummary(text);
    
    return {
      summary: fallbackSummary,
      originalLength: text.length,
      summaryLength: fallbackSummary.length,
      cached: false,
      generatedAt: new Date().toISOString(),
    };
  }
}

export function isSummarizationEnabled(): boolean {
  const config = getConfig();
  return config.provider !== 'local' ? !!config.apiKey : true;
}

export function getSummarizationConfig(): SummarizationConfig {
  return getConfig();
}

export function clearSummaryCache(postId?: number): void {
  if (postId) {
    cacheManager.invalidate(getCacheKey(postId));
  } else {
    const cache = (cacheManager as unknown as { cache: Map<string, unknown> }).cache;
    if (cache) {
      for (const key of cache.keys()) {
        if (key.startsWith('summary:')) {
          cacheManager.invalidate(key);
        }
      }
    }
  }
}
