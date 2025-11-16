import DOMPurify from 'dompurify'

/**
 * Sanitizes HTML content to prevent XSS attacks while preserving safe HTML
 * Used for WordPress content that may contain unsafe HTML
 */
export function sanitizeHtml(html: string, options?: {
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
}): string {
  if (!html) return ''

  // Default configuration for WordPress content
  const defaultConfig = {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'i', 'b', 'u',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'pre', 'code',
      'div', 'span',
      'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'width', 'height',
      'class', 'id', 'style'
    ],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
    SANITIZE_DOM: true,
    KEEP_CONTENT: true
  }

  // Merge with custom options
  const config: any = {
    ...defaultConfig,
    RETURN_TRUSTED_TYPE: false,
    ...(options?.allowedTags && { ALLOWED_TAGS: options.allowedTags }),
    ...(options?.allowedAttributes && { ALLOWED_ATTR: options.allowedAttributes })
  }

  return DOMPurify.sanitize(html, config) as unknown as string
}

/**
 * Sanitizes and extracts plain text from HTML content
 * Useful for excerpts or meta descriptions
 */
export function sanitizeText(html: string): string {
  if (!html) return ''
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  }).trim()
}

/**
 * Validates if a URL is safe for use in href/src attributes
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    // Check if it's a relative URL or has a valid protocol
    const hasProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)
    const baseUrl = hasProtocol ? undefined : 'http://localhost'
    const parsedUrl = new URL(url, baseUrl)
    
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:']
    const allowedDomains = [
      'mitrabantennews.com',
      'www.mitrabantennews.com',
      'localhost'
    ]
    
    // Check protocol
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      return false
    }
    
    // For external URLs, check domain
    if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
      return allowedDomains.some(domain => 
        parsedUrl.hostname === domain || 
        parsedUrl.hostname.endsWith(`.${domain}`)
      )
    }
    
    return true
  } catch {
    return false
  }
}