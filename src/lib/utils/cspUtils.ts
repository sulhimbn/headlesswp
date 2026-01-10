import { logger } from './logger'

let lastGeneratedNonce: string | null = null

export function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)

  let result = ''
  for (let i = 0; i < array.length; i++) {
    result += String.fromCharCode(array[i])
  }
  const nonce = btoa(result)
  
  lastGeneratedNonce = nonce
  return nonce
}

export function getLastGeneratedNonce(): string | null {
  return lastGeneratedNonce
}

export function resetLastGeneratedNonce(): void {
  lastGeneratedNonce = null
}

export function isValidNonce(nonce: string): boolean {
  if (typeof nonce !== 'string') {
    return false
  }
  if (nonce.length === 0 || nonce.length > 100) {
    return false
  }
  
  try {
    atob(nonce)
    return true
  } catch {
    return false
  }
}

export function generateNonceWithLogging(): string {
  const nonce = generateNonce()
  logger.debug(`Generated CSP nonce`, { module: 'CSPUtils', nonceLength: nonce.length })
  return nonce
}
