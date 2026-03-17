import { renderHook, act } from '@testing-library/react'
import { useKeyboardShortcuts, DEFAULT_SHORTCUTS } from '@/lib/hooks/useKeyboardShortcuts'

describe('useKeyboardShortcuts hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('DEFAULT_SHORTCUTS', () => {
    test('has all required shortcuts defined', () => {
      expect(DEFAULT_SHORTCUTS.length).toBeGreaterThan(0)
      expect(DEFAULT_SHORTCUTS.some(s => s.key === 'h')).toBe(true)
      expect(DEFAULT_SHORTCUTS.some(s => s.key === 'b')).toBe(true)
      expect(DEFAULT_SHORTCUTS.some(s => s.key === '/')).toBe(true)
      expect(DEFAULT_SHORTCUTS.some(s => s.key === '?')).toBe(true)
      expect(DEFAULT_SHORTCUTS.some(s => s.key === 'Escape')).toBe(true)
      expect(DEFAULT_SHORTCUTS.some(s => s.key === 'd' && s.alt)).toBe(true)
    })

    test('all shortcuts have descriptions', () => {
      DEFAULT_SHORTCUTS.forEach(shortcut => {
        expect(shortcut.description).toBeDefined()
        expect(typeof shortcut.description).toBe('string')
        expect(shortcut.description.length).toBeGreaterThan(0)
      })
    })

    test('all shortcuts have action functions', () => {
      DEFAULT_SHORTCUTS.forEach(shortcut => {
        expect(typeof shortcut.action).toBe('function')
      })
    })
  })

  describe('useKeyboardShortcuts', () => {
    test('renders without crashing when enabled', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({ enabled: true, shortcuts: [] })
      )
      expect(result.current).toBeUndefined()
    })

    test('renders without crashing when disabled', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({ enabled: false, shortcuts: [] })
      )
      expect(result.current).toBeUndefined()
    })

    test('handles empty shortcuts array', () => {
      const { result } = renderHook(() =>
        useKeyboardShortcuts({ enabled: true, shortcuts: [] })
      )
      expect(result.current).toBeUndefined()
    })
  })
})