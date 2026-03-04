import { cacheManager } from '@/lib/cache'
import { logger } from '@/lib/utils/logger'
import { stripHtml } from '@/lib/utils/stripHtml'

export type SEOProvider = 'openai' | 'anthropic' | 'local'

export interface SEOAnalysisConfig {
  provider: SEOProvider
  apiKey?: string
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface SEOSuggestion {
  type: 'critical' | 'warning' | 'info'
  category: string
  issue: string
  recommendation: string
  impact?: string
}

export interface SEOAnalysisResult {
  score: number
  suggestions: SEOSuggestion[]
  analyzedAt: string
  wordCount: number
  readabilityScore: number
}

const CACHE_TTL_SEO = 24 * 60 * 60 * 1000

function getConfig(): SEOAnalysisConfig {
  return {
    provider: (process.env.SEO_PROVIDER as SEOProvider) || 'local',
    apiKey: process.env.SEO_API_KEY,
    model: process.env.SEO_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.SEO_MAX_TOKENS || '500', 10),
    temperature: parseFloat(process.env.SEO_TEMPERATURE || '0.7'),
  }
}

function getCacheKey(postId: number): string {
  return `seo:${postId}`
}

function extractTextFromContent(htmlContent: string): string {
  return stripHtml(htmlContent).trim()
}

function calculateReadabilityScore(text: string): number {
  const words = text.split(/\s+/).filter(w => w.length > 0)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  
  if (words.length === 0 || sentences.length === 0) {
    return 0
  }
  
  const avgWordsPerSentence = words.length / sentences.length
  const avgCharsPerWord = text.replace(/\s/g, '').length / words.length
  
  let score = 100 - (avgWordsPerSentence * 2) - (avgCharsPerWord * 5)
  return Math.max(0, Math.min(100, Math.round(score)))
}

function analyzeLocally(text: string, title: string): SEOAnalysisResult {
  const suggestions: SEOSuggestion[] = []
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
  const readabilityScore = calculateReadabilityScore(text)
  
  if (wordCount < 300) {
    suggestions.push({
      type: 'warning',
      category: 'Content Length',
      issue: 'Content is too short',
      recommendation: 'Aim for at least 300 words for better SEO performance',
      impact: 'Short content may not rank well for competitive keywords'
    })
  }
  
  if (title.length < 30) {
    suggestions.push({
      type: 'warning',
      category: 'Title',
      issue: 'Title is too short',
      recommendation: 'Use a title between 30-60 characters',
      impact: 'Short titles may not contain enough keywords'
    })
  }
  
  if (title.length > 60) {
    suggestions.push({
      type: 'info',
      category: 'Title',
      issue: 'Title is too long',
      recommendation: 'Keep title under 60 characters',
      impact: 'Long titles may be truncated in search results'
    })
  }
  
  const keywords = text.toLowerCase().split(/\s+/).filter(w => w.length > 4)
  const keywordFrequency = new Map<string, number>()
  keywords.forEach(k => {
    keywordFrequency.set(k, (keywordFrequency.get(k) || 0) + 1)
  })
  
  const topKeywords = Array.from(keywordFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  
  if (topKeywords.length > 0 && topKeywords[0][1] < 3) {
    suggestions.push({
      type: 'info',
      category: 'Keyword Density',
      issue: 'No dominant keywords found',
      recommendation: 'Consider repeating important keywords naturally',
      impact: 'Keyword prominence helps search engines understand content'
    })
  }
  
  const titleWord = title.toLowerCase().substring(0, 20).split(' ')[0]
  if (titleWord && !text.includes(titleWord)) {
    suggestions.push({
      type: 'info',
      category: 'Content Alignment',
      issue: 'Title keywords not in content',
      recommendation: 'Include main title keywords in the first paragraph',
      impact: 'Early keyword placement signals relevance'
    })
  }
  
  let score = 100
  suggestions.forEach(s => {
    if (s.type === 'critical') score -= 15
    else if (s.type === 'warning') score -= 8
    else score -= 3
  })
  
  return {
    score: Math.max(0, score),
    suggestions,
    analyzedAt: new Date().toISOString(),
    wordCount,
    readabilityScore
  }
}

async function analyzeWithOpenAI(
  text: string,
  title: string,
  config: SEOAnalysisConfig
): Promise<SEOAnalysisResult> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key not configured')
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
          content: `You are an SEO expert. Analyze the following article and provide specific, actionable suggestions for improving SEO. Return a JSON object with:
- score: overall SEO score (0-100)
- suggestions: array of objects with type (critical/warning/info), category, issue, recommendation, impact
- wordCount: number of words
- readabilityScore: estimated readability score (0-100)

Be specific and actionable in your recommendations.`
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nContent:\n${text}`
        },
      ],
      max_tokens: config.maxTokens || 500,
      temperature: config.temperature || 0.7,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    logger.error('OpenAI SEO analysis failed', error, { module: 'seo-analyzer' })
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const result = JSON.parse(data.choices[0]?.message?.content || '{}')
  
  return {
    score: result.score || 0,
    suggestions: result.suggestions || [],
    analyzedAt: new Date().toISOString(),
    wordCount: result.wordCount || 0,
    readabilityScore: result.readabilityScore || 0
  }
}

async function analyzeWithAnthropic(
  text: string,
  title: string,
  config: SEOAnalysisConfig
): Promise<SEOAnalysisResult> {
  if (!config.apiKey) {
    throw new Error('Anthropic API key not configured')
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
      max_tokens_to_sample: config.maxTokens || 500,
      temperature: config.temperature || 0.7,
      messages: [
        {
          role: 'user',
          content: `You are an SEO expert. Analyze the following article and provide specific, actionable suggestions for improving SEO. Return a JSON object with:
- score: overall SEO score (0-100)
- suggestions: array of objects with type (critical/warning/info), category, issue, recommendation, impact
- wordCount: number of words
- readabilityScore: estimated readability score (0-100)

Title: ${title}\n\nContent:\n${text}`
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    logger.error('Anthropic SEO analysis failed', error, { module: 'seo-analyzer' })
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  const result = JSON.parse(data.content[0]?.text || '{}')
  
  return {
    score: result.score || 0,
    suggestions: result.suggestions || [],
    analyzedAt: new Date().toISOString(),
    wordCount: result.wordCount || 0,
    readabilityScore: result.readabilityScore || 0
  }
}

export async function analyzeSEO(
  postId: number,
  content: string,
  title: string
): Promise<SEOAnalysisResult> {
  const config = getConfig()
  const cacheKey = getCacheKey(postId)

  const cached = cacheManager.get<SEOAnalysisResult>(cacheKey)
  if (cached) {
    logger.debug('Using cached SEO analysis', { postId, module: 'seo-analyzer' })
    return cached
  }

  const text = extractTextFromContent(content)
  
  if (text.length < 50) {
    return analyzeLocally(text, title)
  }

  try {
    let result: SEOAnalysisResult
    
    switch (config.provider) {
      case 'openai':
        result = await analyzeWithOpenAI(text, title, config)
        break
      case 'anthropic':
        result = await analyzeWithAnthropic(text, title, config)
        break
      default:
        result = analyzeLocally(text, title)
    }
    
    cacheManager.set(cacheKey, result, CACHE_TTL_SEO)
    logger.info('SEO analysis generated', { postId, score: result.score, module: 'seo-analyzer' })
    
    return result
  } catch (error) {
    logger.error('SEO analysis failed, falling back to local', error, { postId, module: 'seo-analyzer' })
    return analyzeLocally(text, title)
  }
}

export function isSEOAnalysisEnabled(): boolean {
  const config = getConfig()
  return config.provider !== 'local' ? !!config.apiKey : true
}

export function getSEOConfig(): SEOAnalysisConfig {
  return getConfig()
}

export function clearSEOCache(postId?: number): void {
  if (postId) {
    cacheManager.invalidate(getCacheKey(postId))
  } else {
    const cache = (cacheManager as unknown as { cache: Map<string, unknown> }).cache
    if (cache) {
      for (const key of cache.keys()) {
        if (key.startsWith('seo:')) {
          cacheManager.invalidate(key)
        }
      }
    }
  }
}
