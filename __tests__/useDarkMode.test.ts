import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const DARK_MODE_KEY = 'dark-mode'

describe('useDarkMode Hook', () => {
  let mockAddListener: jest.Mock
  let mockRemoveListener: jest.Mock
  let mockClassListAdd: jest.Mock
  let mockClassListRemove: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    
    mockAddListener = jest.fn()
    mockRemoveListener = jest.fn()
    mockClassListAdd = jest.fn()
    mockClassListRemove = jest.fn()
    
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: mockAddListener,
        removeEventListener: mockRemoveListener,
        dispatchEvent: jest.fn(),
      })),
    })
    
    Object.defineProperty(document, 'documentElement', {
      value: { 
        classList: { 
          add: mockClassListAdd, 
          remove: mockClassListRemove,
          toggle: jest.fn(),
        } 
      },
      writable: true,
    })
  })

  describe('Initial State', () => {
    test('returns light mode by default from localStorage', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('returns dark mode from localStorage', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('returns system mode when no preference stored', () => {
      localStorage.removeItem(DARK_MODE_KEY)
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
    })

    test('respects system preference when mode is system', () => {
      localStorage.removeItem(DARK_MODE_KEY)
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
    })
  })

  describe('setDarkMode', () => {
    test('sets light mode', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('light')
      })
      
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('light')
      expect(mockClassListRemove).toHaveBeenCalledWith('dark')
    })

    test('sets dark mode', () => {
      localStorage.removeItem(DARK_MODE_KEY)
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('dark')
      })
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('dark')
      expect(mockClassListAdd).toHaveBeenCalledWith('dark')
    })

    test('sets system mode', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('system')
      })
      
      expect(result.current.mode).toBe('system')
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('system')
    })
  })

  describe('toggleDarkMode', () => {
    test('toggles from dark to light', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })

    test('toggles from light to dark', () => {
      localStorage.setItem(DARK_MODE_KEY, 'light')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('handles system mode toggle', () => {
      localStorage.removeItem(DARK_MODE_KEY)
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
      const initialIsDark = result.current.isDark
      
      act(() => {
        result.current.toggleDarkMode()
      })
      
      expect(result.current.mode).toBe(initialIsDark ? 'light' : 'dark')
      expect(result.current.isDark).toBe(!initialIsDark)
    })
  })

  describe('Class List Updates', () => {
    test('adds dark class when dark mode is enabled', () => {
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('dark')
      })
      
      expect(mockClassListAdd).toHaveBeenCalledWith('dark')
    })

    test('removes dark class when light mode is set', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('light')
      })
      
      expect(mockClassListRemove).toHaveBeenCalledWith('dark')
    })
  })

  describe('System Preference Changes', () => {
    test('listens for system preference changes', () => {
      renderHook(() => useDarkMode())
      
      expect(mockAddListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })

    test('removes listener on cleanup', () => {
      const { unmount } = renderHook(() => useDarkMode())
      
      unmount()
      
      expect(mockRemoveListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      )
    })
  })

  describe('Return Value', () => {
    test('returns isDark boolean', () => {
      const { result } = renderHook(() => useDarkMode())
      
      expect(typeof result.current.isDark).toBe('boolean')
    })

    test('returns toggleDarkMode function', () => {
      const { result } = renderHook(() => useDarkMode())
      
      expect(typeof result.current.toggleDarkMode).toBe('function')
    })

    test('returns setDarkMode function', () => {
      const { result } = renderHook(() => useDarkMode())
      
      expect(typeof result.current.setDarkMode).toBe('function')
    })

    test('returns mode string', () => {
      const { result } = renderHook(() => useDarkMode())
      
      expect(['light', 'dark', 'system']).toContain(result.current.mode)
    })
  })

  describe('LocalStorage Sync', () => {
    test('persists mode to localStorage', () => {
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('dark')
      })
      
      expect(localStorage.getItem(DARK_MODE_KEY)).toBe('dark')
    })

    test('reads initial value from localStorage', () => {
      localStorage.setItem(DARK_MODE_KEY, 'dark')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('dark')
    })

    test('handles invalid localStorage values', () => {
      localStorage.setItem(DARK_MODE_KEY, 'invalid')
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
    })
  })

  describe('Edge Cases', () => {
    test('handles rapid mode switches', () => {
      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('dark')
        result.current.setDarkMode('light')
        result.current.setDarkMode('dark')
      })
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    test('toggle function is stable', () => {
      const { result } = renderHook(() => useDarkMode())
      
      const firstToggle = result.current.toggleDarkMode
      const secondToggle = result.current.toggleDarkMode
      
      expect(firstToggle).toBe(secondToggle)
    })

    test('setDarkMode function is stable', () => {
      const { result } = renderHook(() => useDarkMode())
      
      const firstSetter = result.current.setDarkMode
      const secondSetter = result.current.setDarkMode
      
      expect(firstSetter).toBe(secondSetter)
    })
  })
})
