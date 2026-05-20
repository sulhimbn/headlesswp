import { DEFAULT_SHORTCUTS, DEFAULT_CONFIG } from '@/lib/constants/keyboardShortcuts'

describe('keyboardShortcuts', () => {
  describe('DEFAULT_SHORTCUTS', () => {
    it('should have navigation shortcuts', () => {
      const navShortcuts = DEFAULT_SHORTCUTS.filter(s => s.category === 'navigation')
      expect(navShortcuts.length).toBeGreaterThan(0)
      expect(navShortcuts.some(s => s.key === 'j')).toBe(true)
      expect(navShortcuts.some(s => s.key === 'k')).toBe(true)
    })

    it('should have search shortcut', () => {
      const searchShortcuts = DEFAULT_SHORTCUTS.filter(s => s.category === 'search')
      expect(searchShortcuts.some(s => s.key === '/')).toBe(true)
    })

    it('should have accessibility shortcut for help', () => {
      const a11yShortcuts = DEFAULT_SHORTCUTS.filter(s => s.category === 'accessibility')
      expect(a11yShortcuts.some(s => s.key === '?')).toBe(true)
    })

    it('should have general shortcuts', () => {
      const generalShortcuts = DEFAULT_SHORTCUTS.filter(s => s.category === 'general')
      expect(generalShortcuts.some(s => s.key === 'Escape')).toBe(true)
    })
  })

  describe('DEFAULT_CONFIG', () => {
    it('should be enabled by default', () => {
      expect(DEFAULT_CONFIG.enabled).toBe(true)
    })

    it('should have shortcuts defined', () => {
      expect(DEFAULT_CONFIG.shortcuts).toBeDefined()
      expect(DEFAULT_CONFIG.shortcuts.length).toBeGreaterThan(0)
    })
  })
})
