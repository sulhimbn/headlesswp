import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

const mockMatchMedia = (matches: boolean) => ({
  matches,
  media: '(prefers-color-scheme: dark)',
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  dispatchEvent: jest.fn(),
})

describe('useDarkMode', () => {
  let addEventListenerMock: jest.Mock
  let removeEventListenerMock: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })

    addEventListenerMock = jest.fn()
    removeEventListenerMock = jest.fn()

    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        addEventListener: addEventListenerMock,
        removeEventListener: removeEventListenerMock,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
      writable: true,
    })

    document.documentElement.classList.remove('dark')
  })

  describe('Initial state from localStorage', () => {
    test('defaults to system mode when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
    })

    test('reads dark mode from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('reads light mode from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('reads system mode from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
    })

    test('defaults to system for invalid localStorage values', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
    })
  })

  describe('System preference detection', () => {
    test('detects system dark preference', () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation(() => mockMatchMedia(true)),
        writable: true,
      })
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.isDark).toBe(true)
    })

    test('detects system light preference', () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation(() => mockMatchMedia(false)),
        writable: true,
      })
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('toggleDarkMode', () => {
    test('toggles from dark to light', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dark-mode', 'light')
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('toggles from light to dark', () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dark-mode', 'dark')
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })
  })

  describe('setDarkMode', () => {
    test('sets dark mode explicitly', () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('dark')
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dark-mode', 'dark')
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('sets light mode explicitly', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('light')
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dark-mode', 'light')
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('sets system mode and uses system preference', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn().mockImplementation(() => mockMatchMedia(false)),
        writable: true,
      })
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('system')
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dark-mode', 'system')
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('localStorage persistence', () => {
    test('persists mode to localStorage on setDarkMode', () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('dark')
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('dark-mode', 'dark')
    })

    test('persists mode to localStorage on toggle', () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('Error handling for localStorage', () => {
    test('handles localStorage being unavailable on get', () => {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true,
      })
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
    })

    test('handles localStorage being unavailable on set', () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: mockLocalStorage.getItem,
          setItem: undefined,
        },
        writable: true,
      })
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(() => {
        act(() => {
          result.current.setDarkMode('dark')
        })
      }).not.toThrow()
    })

    test('handles localStorage quota exceeded', () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(() => {
        act(() => {
          result.current.setDarkMode('dark')
        })
      }).not.toThrow()
    })
  })

  describe('SSR safety', () => {
    test('handles undefined window (SSR)', () => {
      const originalWindow = global.window
      delete (global as unknown as { window?: undefined }).window
      
      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()
      
      global.window = originalWindow
    })

    test('handles undefined matchMedia (SSR)', () => {
      const originalMatchMedia = window.matchMedia
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        writable: true,
      })
      
      expect(() => {
        renderHook(() => useDarkMode())
      }).not.toThrow()
      
      Object.defineProperty(window, 'matchMedia', {
        value: originalMatchMedia,
        writable: true,
      })
    })
  })

  describe('CSS class application', () => {
    test('adds dark class when isDark is true', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(result.current.isDark).toBe(true)
    })

    test('removes dark class when isDark is false', () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      document.documentElement.classList.add('dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      expect(result.current.isDark).toBe(false)
    })

    test('updates CSS class when mode changes', () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(document.documentElement.classList.contains('dark')).toBe(false)
      
      act(() => {
        result.current.setDarkMode('dark')
      })
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  describe('Media query listener cleanup', () => {
    test('cleans up media query listener on unmount', () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      
      const { unmount } = renderHook(() => useDarkMode())
      
      unmount()
      
      expect(removeEventListenerMock).toHaveBeenCalled()
    })
  })

  describe('System preference change listener', () => {
    test('updates isDark when system preference changes while in system mode', () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      
      let eventListenerCallback: ((e: { matches: boolean }) => void) | null = null
      
      const customMockMatchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn((event: string, callback: (e: { matches: boolean }) => void) => {
          if (event === 'change') {
            eventListenerCallback = callback
          }
        }),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))
      
      Object.defineProperty(window, 'matchMedia', {
        value: customMockMatchMedia,
        writable: true,
      })
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)
      
      act(() => {
        if (eventListenerCallback) {
          eventListenerCallback({ matches: true })
        }
      })
      
      expect(result.current.isDark).toBe(true)
    })

    test('does not update isDark when system preference changes while in explicit mode', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      let eventListenerCallback: ((e: { matches: boolean }) => void) | null = null
      
      const customMockMatchMedia = jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: jest.fn((event: string, callback: (e: { matches: boolean }) => void) => {
          if (event === 'change') {
            eventListenerCallback = callback
          }
        }),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))
      
      Object.defineProperty(window, 'matchMedia', {
        value: customMockMatchMedia,
        writable: true,
      })
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
      
      act(() => {
        if (eventListenerCallback) {
          eventListenerCallback({ matches: true })
        }
      })
      
      expect(result.current.isDark).toBe(true)
    })
  })
})
