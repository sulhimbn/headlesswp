import { renderHook, act, waitFor } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const DARK_MODE_KEY = 'dark-mode'

describe('useDarkMode', () => {
  const mockMatchMedia = (isDark: boolean) => ({
    matches: isDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })
  })

  describe('Initial state', () => {
    test('defaults to system mode when no stored value', async () => {
      const mockMedia = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('system')
      })
    })

    test('reads stored mode from localStorage', async () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      const mockMedia = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('dark')
        expect(result.current.isDark).toBe(true)
      })
    })

    test('reads light mode from localStorage', async () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')
      const mockMedia = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('light')
        expect(result.current.isDark).toBe(false)
      })
    })

    test('handles invalid stored value by defaulting to system', async () => {
      localStorage.setItem(DARK_MODE_KEY, 'invalid-value')
      const mockMedia = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('system')
      })
    })
  })

  describe('System preference detection', () => {
    test('detects dark mode from system preference', async () => {
      const mockMedia = mockMatchMedia(true)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.isDark).toBe(true)
      })
    })

    test('detects light mode from system preference', async () => {
      const mockMedia = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.isDark).toBe(false)
      })
    })
  })

  describe('setDarkMode', () => {
    test('sets mode to dark and updates localStorage', async () => {
      const mockMedia = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('system')
      })

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('dark')
    })

    test('sets mode to light and updates localStorage', async () => {
      const mockMedia = mockMatchMedia(true)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.isDark).toBe(true)
      })

      act(() => {
        result.current.setDarkMode('light')
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('light')
    })

    test('sets mode to system and uses system preference', async () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      const mockMedia = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.isDark).toBe(true)
      })

      act(() => {
        result.current.setDarkMode('system')
      })

      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('toggleDarkMode', () => {
    test('toggles from light to dark', async () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')
      const mockMedia = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.isDark).toBe(false)
      })

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('toggles from dark to light', async () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      const mockMedia = mockMatchMedia(true)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.isDark).toBe(true)
      })

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('Class toggle on document', () => {
    test('adds dark class when isDark is true', async () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      const classAddSpy = jest.spyOn(document.documentElement.classList, 'add')

      renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(classAddSpy).toHaveBeenCalledWith('dark')
      })
    })

    test('removes dark class when isDark is false', async () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')
      const classRemoveSpy = jest.spyOn(document.documentElement.classList, 'remove')

      renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(classRemoveSpy).toHaveBeenCalledWith('dark')
      })
    })
  })

  describe('localStorage errors', () => {
    test('handles getItem errors gracefully', async () => {
      const mockMedia = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })
      
      const originalGetItem = localStorage.getItem
      Object.defineProperty(localStorage, 'getItem', {
        writable: true,
        value: jest.fn().mockImplementation(() => {
          throw new Error('localStorage not available')
        }),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('system')
      })
      
      Object.defineProperty(localStorage, 'getItem', {
        writable: true,
        value: originalGetItem,
      })
    })

    test('handles setItem errors gracefully', async () => {
      const mockMedia = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const originalSetItem = localStorage.setItem
      Object.defineProperty(localStorage, 'setItem', {
        writable: true,
        value: jest.fn().mockImplementation(() => {
          throw new Error('localStorage not available')
        }),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('system')
      })

      expect(() => {
        act(() => {
          result.current.setDarkMode('dark')
        })
      }).not.toThrow()
      
      Object.defineProperty(localStorage, 'setItem', {
        writable: true,
        value: originalSetItem,
      })
    })
  })

  describe('Return value', () => {
    test('returns all required properties', async () => {
      const mockMedia = mockMatchMedia(false)
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(() => mockMedia),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current).toHaveProperty('isDark')
        expect(result.current).toHaveProperty('toggleDarkMode')
        expect(result.current).toHaveProperty('setDarkMode')
        expect(result.current).toHaveProperty('mode')
      })
    })
  })
})
