'use client'

/**
 * Hook to get the CSP nonce for inline scripts and styles
 * This should be used when you need to add inline scripts or styles
 * that comply with the Content Security Policy
 */
export function useCspNonce(): string {
  // In client components, we need to get the nonce from the meta tag
  // This is set by the middleware and passed through the layout
  if (typeof window !== 'undefined') {
    // Client-side: try to get from meta tag
    const metaNonce = document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content')
    return metaNonce || ''
  }
  
  // Server-side: return empty string (middleware will handle it)
  return ''
}

/**
 * Utility function to add nonce to inline scripts
 * Usage: <script nonce={useCspNonce()}>{scriptContent}</script>
 */
export function addNonceToScript(scriptContent: string, nonce: string): string {
  if (!nonce) return scriptContent
  return scriptContent.replace(/<script(?![^>]*\snonce=)/g, `<script nonce="${nonce}"`)
}

/**
 * Utility function to add nonce to inline styles
 * Usage: <style nonce={useCspNonce()}>{styleContent}</style>
 */
export function addNonceToStyle(styleContent: string, nonce: string): string {
  if (!nonce) return styleContent
  return styleContent.replace(/<style(?![^>]*\snonce=)/g, `<style nonce="${nonce}"`)
}