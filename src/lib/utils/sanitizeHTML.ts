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

const sanitizeCache = new Map<string, string>()

export function sanitizeHTML(html: string, config: SanitizeConfig = 'full'): string {
  const cacheKey = `${config}:${html}`
  
  const cached = sanitizeCache.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }
  
  const sanitizeConfig = SANITIZE_CONFIGS[config]
  const result = DOMPurify.sanitize(html, sanitizeConfig)
  
  sanitizeCache.set(cacheKey, result)
  return result
}
