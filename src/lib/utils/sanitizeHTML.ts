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

export function sanitizeHTML(html: string, config: SanitizeConfig = 'full'): string {
  const sanitizeConfig = SANITIZE_CONFIGS[config]
  return DOMPurify.sanitize(html, sanitizeConfig)
}
