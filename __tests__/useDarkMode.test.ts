import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn((event: string, handler: () => void) => {
      if (event === 'change') {
        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: jest.fn().mockImplementation(q => ({
            matches: false,
            media: q,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          })),
        })
      }
    }),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('useDarkMode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    document.documentElement.classList.remove('dark')
  })

  describe('Initial mode', () => {
    test('defaults to system mode when no stored value', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('system')
    })

    test('reads stored mode from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('dark')
    })

    test('defaults to light mode when stored value is light', () => {
      localStorageMock.getItem.mockReturnValue('light')
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.mode).toBe('light')
    })
  })

  describe('toggleDarkMode', () => {
    test('toggles from light to dark', () => {
      localStorageMock.getItem.mockReturnValue('light')
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dark-mode', 'dark')
    })

    test('toggles from dark to light', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dark-mode', 'light')
    })
  })

  describe('setDarkMode', () => {
    test('sets mode to dark', () => {
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('dark')
      })
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dark-mode', 'dark')
    })

    test('sets mode to light', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('light')
      })
      
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dark-mode', 'light')
    })

    test('sets mode to system', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('system')
      })
      
      expect(result.current.mode).toBe('system')
    })
  })

  describe('System preference detection', () => {
    test('detects dark system preference', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: true,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })
      
      localStorageMock.getItem.mockReturnValue('system')
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)
    })

    test('detects light system preference', () => {
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
      
      localStorageMock.getItem.mockReturnValue('system')
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('localStorage persistence', () => {
    test('persists mode to localStorage on setDarkMode', () => {
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('dark')
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('dark-mode', 'dark')
    })

    test('persists mode to localStorage on toggleDarkMode', () => {
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    test('reads from localStorage on initial render', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      renderHook(() => useDarkMode())
      expect(localStorageMock.getItem).toHaveBeenCalledWith('dark-mode')
    })
  })

  describe('isDark', () => {
    test('isDark is true when mode is dark', () => {
      localStorageMock.getItem.mockReturnValue('dark')
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)
    })

    test('isDark is false when mode is light', () => {
      localStorageMock.getItem.mockReturnValue('light')
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(false)
    })

    test('isDark reflects system preference when mode is system', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: true,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })
      
      localStorageMock.getItem.mockReturnValue('system')
      const { result } = renderHook(() => useDarkMode())
      expect(result.current.isDark).toBe(true)
    })
  })
})
