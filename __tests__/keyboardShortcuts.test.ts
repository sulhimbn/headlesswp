import { getShortcutKeyDisplay } from '@/lib/hooks/useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  describe('getShortcutKeyDisplay', () => {
    it('returns "Esc" for Escape key', () => {
      expect(getShortcutKeyDisplay('Escape')).toBe('Esc')
    })

    it('returns "Space" for space key', () => {
      expect(getShortcutKeyDisplay(' ')).toBe('Space')
    })

    it('returns uppercase for other keys', () => {
      expect(getShortcutKeyDisplay('j')).toBe('J')
      expect(getShortcutKeyDisplay('k')).toBe('K')
      expect(getShortcutKeyDisplay('/')).toBe('/')
      expect(getShortcutKeyDisplay('?')).toBe('?')
    })
  })
})
