import {
  generateNonce,
  getLastGeneratedNonce,
  resetLastGeneratedNonce,
  isValidNonce,
  generateNonceWithLogging
} from '@/lib/utils/cspUtils'

describe('CSP Utilities', () => {
  beforeEach(() => {
    resetLastGeneratedNonce()
  })

  describe('generateNonce', () => {
    it('should generate a nonce string', () => {
      const nonce = generateNonce()

      expect(typeof nonce).toBe('string')
      expect(nonce).toBeDefined()
      expect(nonce.length).toBeGreaterThan(0)
    })

    it('should generate different nonces on each call', () => {
      const nonce1 = generateNonce()
      const nonce2 = generateNonce()

      expect(nonce1).not.toBe(nonce2)
    })

    it('should generate unique nonces across multiple calls', () => {
      const nonces = new Set<string>()
      const numCalls = 100

      for (let i = 0; i < numCalls; i++) {
        nonces.add(generateNonce())
      }

      expect(nonces.size).toBe(numCalls)
    })

    it('should generate valid base64 encoded string', () => {
      const nonce = generateNonce()

      expect(() => atob(nonce)).not.toThrow()
    })

    it('should generate nonce with expected length (base64 of 16 bytes)', () => {
      const nonce = generateNonce()

      expect(nonce.length).toBe(24)
    })

    it('should store the generated nonce', () => {
      const nonce = generateNonce()
      const lastNonce = getLastGeneratedNonce()

      expect(lastNonce).toBe(nonce)
    })

    it('should use crypto.getRandomValues for randomness', () => {
      const spyOnCrypto = jest.spyOn(crypto, 'getRandomValues')

      generateNonce()

      expect(spyOnCrypto).toHaveBeenCalledWith(expect.any(Uint8Array))
      expect(spyOnCrypto).toHaveBeenCalled()

      spyOnCrypto.mockRestore()
    })

    it('should generate nonce with 16 bytes of random data', () => {
      const spyOnCrypto = jest.spyOn(crypto, 'getRandomValues')

      generateNonce()

      expect(spyOnCrypto).toHaveBeenCalledWith(expect.any(Uint8Array))

      const call = spyOnCrypto.mock.calls[0]
      const array = call[0] as Uint8Array

      expect(array.length).toBe(16)
      expect(array).toBeInstanceOf(Uint8Array)

      spyOnCrypto.mockRestore()
    })

    it('should not generate empty string', () => {
      const nonce = generateNonce()

      expect(nonce).not.toBe('')
      expect(nonce.length).toBeGreaterThan(0)
    })

    it('should not generate whitespace-only string', () => {
      const nonce = generateNonce()

      expect(nonce.trim()).toBe(nonce)
      expect(nonce.trim().length).toBeGreaterThan(0)
    })

    it('should handle multiple consecutive calls', () => {
      const nonces: string[] = []

      for (let i = 0; i < 10; i++) {
        nonces.push(generateNonce())
      }

      nonces.forEach(nonce => {
        expect(typeof nonce).toBe('string')
        expect(nonce.length).toBe(24)
        expect(() => atob(nonce)).not.toThrow()
      })
    })

    it('should work correctly in rapid succession', () => {
      const nonces = new Set<string>()
      const startTime = Date.now()

      for (let i = 0; i < 1000; i++) {
        nonces.add(generateNonce())
      }

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(nonces.size).toBeGreaterThan(990)
      expect(duration).toBeLessThan(1000)
    })
  })

  describe('getLastGeneratedNonce', () => {
    it('should return null when no nonce has been generated', () => {
      resetLastGeneratedNonce()
      const lastNonce = getLastGeneratedNonce()

      expect(lastNonce).toBeNull()
    })

    it('should return the last generated nonce', () => {
      generateNonce()
      const nonce1 = getLastGeneratedNonce()

      expect(nonce1).toBeDefined()
      expect(typeof nonce1).toBe('string')

      generateNonce()
      const nonce2 = getLastGeneratedNonce()

      expect(nonce2).toBeDefined()
      expect(typeof nonce2).toBe('string')
      expect(nonce1).not.toBe(nonce2)
    })

    it('should update after each generateNonce call', () => {
      const nonces: string[] = []

      for (let i = 0; i < 5; i++) {
        generateNonce()
        const last = getLastGeneratedNonce()
        if (last) nonces.push(last)
      }

      const uniqueNonces = new Set(nonces)
      expect(uniqueNonces.size).toBe(5)
    })

    it('should return same value as last generateNonce call', () => {
      const generated = generateNonce()
      const last = getLastGeneratedNonce()

      expect(last).toBe(generated)
    })

    it('should persist across multiple generateNonce calls', () => {
      generateNonce()
      const last1 = getLastGeneratedNonce()

      expect(last1).toBeDefined()

      generateNonce()
      const last2 = getLastGeneratedNonce()

      expect(last2).toBeDefined()
      expect(last1).not.toBe(last2)
    })
  })

  describe('resetLastGeneratedNonce', () => {
    it('should reset the last generated nonce to null', () => {
      generateNonce()
      expect(getLastGeneratedNonce()).toBeDefined()

      resetLastGeneratedNonce()

      expect(getLastGeneratedNonce()).toBeNull()
    })

    it('should allow generating new nonces after reset', () => {
      generateNonce()
      resetLastGeneratedNonce()
      expect(getLastGeneratedNonce()).toBeNull()

      const newNonce = generateNonce()

      expect(newNonce).toBeDefined()
      expect(getLastGeneratedNonce()).toBe(newNonce)
    })

    it('should be callable multiple times without side effects', () => {
      resetLastGeneratedNonce()
      resetLastGeneratedNonce()
      resetLastGeneratedNonce()

      expect(getLastGeneratedNonce()).toBeNull()
    })
  })

  describe('isValidNonce', () => {
    it('should return true for valid nonce generated by generateNonce', () => {
      const nonce = generateNonce()

      expect(isValidNonce(nonce)).toBe(true)
    })

    it('should return false for null', () => {
      expect(isValidNonce(null as unknown as string)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isValidNonce(undefined as unknown as string)).toBe(false)
    })

    it('should return false for non-string types', () => {
      expect(isValidNonce(123 as unknown as string)).toBe(false)
      expect(isValidNonce({} as unknown as string)).toBe(false)
      expect(isValidNonce([] as unknown as string)).toBe(false)
      expect(isValidNonce(true as unknown as string)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidNonce('')).toBe(false)
    })

    it('should return true for whitespace strings (valid base64)', () => {
      expect(isValidNonce('   ')).toBe(true)
      expect(isValidNonce('\t')).toBe(true)
      expect(isValidNonce('\n')).toBe(true)
    })

    it('should return false for very long string (> 100 chars)', () => {
      const longNonce = 'a'.repeat(101)

      expect(isValidNonce(longNonce)).toBe(false)
    })

    it('should return false for invalid base64 string', () => {
      expect(isValidNonce('this is not base64!')).toBe(false)
      expect(isValidNonce('abc@#$%')).toBe(false)
    })

    it('should return true for valid base64 strings', () => {
      expect(isValidNonce('dGVzdA==')).toBe(true)
      expect(isValidNonce('YWJjMTIzIT4kLm8/JjE/QCQlXiYqKScoPSc=')).toBe(true)
    })

    it('should return true for standard nonce length', () => {
      const nonce = generateNonce()

      expect(isValidNonce(nonce)).toBe(true)
    })

    it('should return true for strings at exactly 100 chars (edge case)', () => {
      const exactly100Chars = 'a'.repeat(100)

      expect(isValidNonce(exactly100Chars)).toBe(true)
    })

    it('should return false for strings at exactly 101 chars (edge case)', () => {
      const exactly101Chars = 'a'.repeat(101)

      expect(isValidNonce(exactly101Chars)).toBe(false)
    })

    it('should return true for valid short base64 strings', () => {
      expect(isValidNonce('dGVzdA==')).toBe(true)
      expect(isValidNonce('QQ==')).toBe(true)
    })

    it('should return false for string containing only padding', () => {
      expect(isValidNonce('====')).toBe(false)
    })

    it('should handle valid base64 strings with special characters', () => {
      expect(isValidNonce('dGVzdCBzdHJpbmc=')).toBe(true)
      expect(isValidNonce('YSti')).toBe(true)
    })
  })

  describe('generateNonceWithLogging', () => {
    it('should generate a valid nonce', () => {
      const nonce = generateNonceWithLogging()

      expect(typeof nonce).toBe('string')
      expect(nonce).toBeDefined()
      expect(nonce.length).toBeGreaterThan(0)
    })

    it('should generate different nonces on each call', () => {
      const nonce1 = generateNonceWithLogging()
      const nonce2 = generateNonceWithLogging()

      expect(nonce1).not.toBe(nonce2)
    })

    it('should generate valid base64 encoded string', () => {
      const nonce = generateNonceWithLogging()

      expect(() => atob(nonce)).not.toThrow()
    })

    it('should return same format as generateNonce', () => {
      const regularNonce = generateNonce()
      const loggedNonce = generateNonceWithLogging()

      expect(typeof regularNonce).toBe(typeof loggedNonce)
      expect(regularNonce.length).toBe(loggedNonce.length)
    })

    it('should store the generated nonce', () => {
      resetLastGeneratedNonce()
      generateNonceWithLogging()

      const lastNonce = getLastGeneratedNonce()

      expect(lastNonce).toBeDefined()
    })
  })

  describe('Integration Tests', () => {
    it('should maintain consistency across multiple functions', () => {
      resetLastGeneratedNonce()
      const nonce = generateNonce()

      expect(getLastGeneratedNonce()).toBe(nonce)
      expect(isValidNonce(nonce)).toBe(true)
    })

    it('should handle generate -> validate -> reset cycle', () => {
      generateNonce()
      const nonce = getLastGeneratedNonce()

      expect(isValidNonce(nonce as string)).toBe(true)

      resetLastGeneratedNonce()

      expect(getLastGeneratedNonce()).toBeNull()

      const newNonce = generateNonce()

      expect(isValidNonce(newNonce)).toBe(true)
    })

    it('should generate unique nonces for security requirements', () => {
      const nonces = new Set<string>()
      const numTests = 10000

      for (let i = 0; i < numTests; i++) {
        nonces.add(generateNonce())
      }

      const collisionRate = (numTests - nonces.size) / numTests
      expect(collisionRate).toBeLessThan(0.0001)
    })

    it('should work correctly in concurrent-like scenarios', () => {
      const nonces: string[] = []

      for (let i = 0; i < 100; i++) {
        nonces.push(generateNonce())
      }

      const allValid = nonces.every(n => isValidNonce(n))
      const allUnique = new Set(nonces).size === 100

      expect(allValid).toBe(true)
      expect(allUnique).toBe(true)
    })
  })
})
