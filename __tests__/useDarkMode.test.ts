import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: () => {
      store = {}
    },
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
})

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
    // Reset matchMedia to default (light mode)
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
  })

  describe('System preference detection', () => {
    test('detects system preference as dark when OS is in dark mode', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(true)
    })

    test('detects system preference as light when OS is in light mode', () => {
      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(false)
    })

    test('updates isDark when system preference changes', () => {
      let changeHandler: ((e: { matches: boolean }) => void) | null = null
      
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((event: string, handler: (e: { matches: boolean }) => void) => {
          if (event === 'change') {
            changeHandler = handler
          }
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(false)

      // Simulate system preference change
      act(() => {
        if (changeHandler) {
          changeHandler({ matches: true })
        }
      })

      expect(result.current.isDark).toBe(true)
    })
  })

  describe('Persistence', () => {
    test('loads stored mode from localStorage on mount', () => {
      localStorageMock.setItem('dark-mode', 'dark')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('loads light mode from localStorage', () => {
      localStorageMock.setItem('dark-mode', 'light')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('loads system mode from localStorage', () => {
      localStorageMock.setItem('dark-mode', 'system')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
    })

    test('defaults to system mode when no stored value', () => {
      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
    })

    test('persists dark mode to localStorage when set', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('dark-mode', 'dark')
    })

    test('persists light mode to localStorage when set', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('light')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('dark-mode', 'light')
    })

    test('persists system mode to localStorage when set', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('system')
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith('dark-mode', 'system')
    })

    test('restores system preference after setting system mode', () => {
      localStorageMock.setItem('dark-mode', 'dark')
      
      // System preference is light
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false, // light mode
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useDarkMode())

      // Switch to system mode
      act(() => {
        result.current.setDarkMode('system')
      })

      // When system is light, isDark should be false
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('toggleDarkMode', () => {
    test('toggles from light to dark', () => {
      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(false)

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.isDark).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dark-mode', 'dark')
    })

    test('toggles from dark to light', () => {
      localStorageMock.setItem('dark-mode', 'dark')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.isDark).toBe(true)

      act(() => {
        result.current.toggleDarkMode()
      })

      expect(result.current.isDark).toBe(false)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dark-mode', 'light')
    })
  })

  describe('setDarkMode', () => {
    test('sets mode to dark and updates isDark', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('dark')
      })

      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('sets mode to light and updates isDark', () => {
      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('light')
      })

      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('sets mode to system and uses system preference', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      const { result } = renderHook(() => useDarkMode())

      act(() => {
        result.current.setDarkMode('system')
      })

      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('Invalid stored values', () => {
    test('defaults to system for invalid stored value', () => {
      localStorageMock.setItem('dark-mode', 'invalid')

      const { result } = renderHook(() => useDarkMode())

      expect(result.current.mode).toBe('system')
    })
  })
})
