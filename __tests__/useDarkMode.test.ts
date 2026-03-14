import { renderHook, act, waitFor } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

const DARK_MODE_KEY = 'dark-mode'

describe('useDarkMode', () => {
  let mockGetItem: jest.Mock
  let mockSetItem: jest.Mock

  beforeEach(() => {
    mockGetItem = jest.fn()
    mockSetItem = jest.fn()
    
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(mockGetItem)
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(mockSetItem)
    
    jest.spyOn(window, 'matchMedia').mockImplementation((query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))
    
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initial state from localStorage', () => {
    test('returns light mode when stored in localStorage', async () => {
      mockGetItem.mockReturnValue('light')

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('light')
      })
      expect(result.current.isDark).toBe(false)
    })

    test('returns dark mode when stored in localStorage', async () => {
      mockGetItem.mockReturnValue('dark')

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('dark')
      })
      expect(result.current.isDark).toBe(true)
    })

    test('returns system mode when nothing stored', async () => {
      mockGetItem.mockReturnValue(null)

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('system')
      })
    })

    test('returns system mode for invalid stored value', async () => {
      mockGetItem.mockReturnValue('invalid')

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('system')
      })
    })
  })

  describe('System preference detection', () => {
    test('detects system dark mode preference', async () => {
      mockGetItem.mockReturnValue(null)
      ;(window.matchMedia as jest.Mock).mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.isDark).toBe(true)
      })
    })

    test('detects system light mode preference', async () => {
      mockGetItem.mockReturnValue(null)
      ;(window.matchMedia as jest.Mock).mockReturnValue({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.isDark).toBe(false)
      })
    })

    test('updates isDark when system preference changes in system mode', async () => {
      mockGetItem.mockReturnValue(null)
      
      let listenerCallback: ((e: { matches: boolean }) => void) | null = null
      const mediaQueryMock = {
        matches: false,
        addEventListener: jest.fn((event: string, callback: (e: { matches: boolean }) => void) => {
          if (event === 'change') {
            listenerCallback = callback
          }
        }),
        removeEventListener: jest.fn(),
      }
      ;(window.matchMedia as jest.Mock).mockReturnValue(mediaQueryMock)

      const { result } = renderHook(() => useDarkMode())
      
      await waitFor(() => {
        expect(result.current.mode).toBe('system')
        expect(result.current.isDark).toBe(false)
      })

      act(() => {
        if (listenerCallback) {
          listenerCallback({ matches: true })
        }
      })

      await waitFor(() => {
        expect(result.current.isDark).toBe(true)
      })
    })

    test('does not update isDark on system preference change when mode is not system', async () => {
      mockGetItem.mockReturnValue('light')
      
      let listenerCallback: ((e: { matches: boolean }) => void) | null = null
      const mediaQueryMock = {
        matches: false,
        addEventListener: jest.fn((event: string, callback: (e: { matches: boolean }) => void) => {
          if (event === 'change') {
            listenerCallback = callback
          }
        }),
        removeEventListener: jest.fn(),
      }
      ;(window.matchMedia as jest.Mock).mockReturnValue(mediaQueryMock)

      const { result } = renderHook(() => useDarkMode())
      
      await waitFor(() => {
        expect(result.current.mode).toBe('light')
        expect(result.current.isDark).toBe(false)
      })

      act(() => {
        if (listenerCallback) {
          listenerCallback({ matches: true })
        }
      })

      expect(result.current.isDark).toBe(false)
    })
  })

  describe('toggleDarkMode', () => {
    test('toggles from light to dark', async () => {
      mockGetItem.mockReturnValue('light')

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('light')
      })

      act(() => {
        result.current.toggleDarkMode()
      })

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'dark')
        expect(result.current.isDark).toBe(true)
      })
    })

    test('toggles from dark to light', async () => {
      mockGetItem.mockReturnValue('dark')

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('dark')
      })

      act(() => {
        result.current.toggleDarkMode()
      })

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'light')
        expect(result.current.isDark).toBe(false)
      })
    })

    test('toggles from system light to dark', async () => {
      mockGetItem.mockReturnValue(null)

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('system')
      })

      act(() => {
        result.current.toggleDarkMode()
      })

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'dark')
        expect(result.current.isDark).toBe(true)
      })
    })
  })

  describe('setDarkMode', () => {
    test('sets dark mode explicitly', async () => {
      mockGetItem.mockReturnValue('light')

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('light')
      })

      act(() => {
        result.current.setDarkMode('dark')
      })

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'dark')
        expect(result.current.mode).toBe('dark')
        expect(result.current.isDark).toBe(true)
      })
    })

    test('sets light mode explicitly', async () => {
      mockGetItem.mockReturnValue('dark')

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('dark')
      })

      act(() => {
        result.current.setDarkMode('light')
      })

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'light')
        expect(result.current.mode).toBe('light')
        expect(result.current.isDark).toBe(false)
      })
    })

    test('sets system mode and uses system preference', async () => {
      mockGetItem.mockReturnValue('dark')
      ;(window.matchMedia as jest.Mock).mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('dark')
      })

      act(() => {
        result.current.setDarkMode('system')
      })

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'system')
        expect(result.current.mode).toBe('system')
        expect(result.current.isDark).toBe(true)
      })
    })
  })

  describe('localStorage persistence', () => {
    test('persists mode to localStorage on setDarkMode', async () => {
      mockGetItem.mockReturnValue('light')

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('light')
      })

      act(() => {
        result.current.setDarkMode('dark')
      })

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalledWith(DARK_MODE_KEY, 'dark')
      })
    })

    test('persists mode to localStorage on toggleDarkMode', async () => {
      mockGetItem.mockReturnValue('light')

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(result.current.mode).toBe('light')
      })

      act(() => {
        result.current.toggleDarkMode()
      })

      await waitFor(() => {
        expect(mockSetItem).toHaveBeenCalled()
      })
    })
  })

  describe('Document class manipulation', () => {
    test('adds dark class when isDark is true', async () => {
      mockGetItem.mockReturnValue('dark')

      renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })

    test('removes dark class when isDark is false', async () => {
      mockGetItem.mockReturnValue('light')

      document.documentElement.classList.add('dark')
      
      renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })
    })

    test('updates document class when toggling', async () => {
      mockGetItem.mockReturnValue('light')

      const { result } = renderHook(() => useDarkMode())

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(false)
      })

      act(() => {
        result.current.toggleDarkMode()
      })

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
    })
  })
})
