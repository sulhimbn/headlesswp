import DOMPurify from 'isomorphic-dompurify'

export type SanitizeConfig = 'excerpt' | 'full'

const SANITIZE_CONFIGS: Record<SanitizeConfig, { ALLOWED_TAGS: string[]; ALLOWED_ATTR: string[]; FORBID_TAGS: string[]; FORBID_ATTR: string[] }> = {
  excerpt: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'class'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover']
  },
  full: {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'id'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover']
  }
}

const CACHE_MAX_SIZE = 500;
const CACHE_TTL = 60 * 60 * 1000;

interface CacheEntry {
  result: string;
  timestamp: number;
}

const sanitizeCache = new Map<string, CacheEntry>();

export function sanitizeHTML(html: string, config: SanitizeConfig = 'full'): string {
  const cacheKey = `${config}:${html}`
  
  const cached = sanitizeCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  
  const sanitizeConfig = SANITIZE_CONFIGS[config]
  const result = DOMPurify.sanitize(html, sanitizeConfig)
  
  if (sanitizeCache.size >= CACHE_MAX_SIZE) {
    const oldestKey = sanitizeCache.keys().next().value;
    if (oldestKey !== undefined) {
      sanitizeCache.delete(oldestKey);
    }
  }
  
  sanitizeCache.set(cacheKey, { result, timestamp: Date.now() });
  return result;
}

export function sanitizeSchemaData(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return stripHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeSchemaData(item));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[key] = sanitizeSchemaData(value);
    }
    return sanitized;
  }

  return obj;
}

function stripHtml(html: string): string {
  let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  result = result.replace(/<[^>]*>?/gm, '');
  return result.trim();
}
