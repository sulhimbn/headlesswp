import { renderHook, act, waitFor } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

describe('useDarkMode', () => {
  let originalMatchMedia: (query: string) => MediaQueryList
  let mockMatchMedia: jest.Mock

  beforeEach(() => {
    mockMatchMedia = jest.fn()
    originalMatchMedia = window.matchMedia
    window.matchMedia = mockMatchMedia
    localStorage.clear()
    jest.clearAllMocks()
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    document.documentElement.classList.remove('dark')
    localStorage.clear()
  })

  describe('Initial state', () => {
    it('should initialize with system mode by default', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
    })

    it('should set isDark to false initially when mode is system and system preference is light', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.isDark).toBe(false)
    })

    it('should set isDark to true when system preference is dark', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.isDark).toBe(true)
    })

    it('should load stored dark mode from localStorage', () => {
      localStorage.setItem('dark-mode', 'dark')
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('dark')
      expect(result.current.isDark).toBe(true)
    })

    it('should load light mode from localStorage', () => {
      localStorage.setItem('dark-mode', 'light')
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('light')
      expect(result.current.isDark).toBe(false)
    })
  })

  describe('toggleDarkMode', () => {
    it('should toggle from light to dark', async () => {
      localStorage.setItem('dark-mode', 'light')
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })

      await waitFor(() => {
        expect(result.current.mode).toBe('dark')
        expect(result.current.isDark).toBe(true)
      })
      expect(localStorage.getItem('dark-mode')).toBe('dark')
    })

    it('should toggle from dark to light', async () => {
      localStorage.setItem('dark-mode', 'dark')
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.toggleDarkMode()
      })

      await waitFor(() => {
        expect(result.current.mode).toBe('light')
        expect(result.current.isDark).toBe(false)
      })
      expect(localStorage.getItem('dark-mode')).toBe('light')
    })
  })

  describe('setDarkMode', () => {
    it('should set mode to dark', async () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('dark')
      })

      await waitFor(() => {
        expect(result.current.mode).toBe('dark')
        expect(result.current.isDark).toBe(true)
      })
      expect(localStorage.getItem('dark-mode')).toBe('dark')
    })

    it('should set mode to light', async () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('light')
      })

      await waitFor(() => {
        expect(result.current.mode).toBe('light')
        expect(result.current.isDark).toBe(false)
      })
      expect(localStorage.getItem('dark-mode')).toBe('light')
    })

    it('should set mode to system', async () => {
      localStorage.setItem('dark-mode', 'dark')
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      
      act(() => {
        result.current.setDarkMode('system')
      })

      await waitFor(() => {
        expect(result.current.mode).toBe('system')
        expect(result.current.isDark).toBe(false)
      })
      expect(localStorage.getItem('dark-mode')).toBe('system')
    })
  })

  describe('Document class', () => {
    it('should add dark class when isDark is true', async () => {
      localStorage.setItem('dark-mode', 'dark')
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      renderHook(() => useDarkMode())

      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('should remove dark class when isDark is false', async () => {
      localStorage.setItem('dark-mode', 'light')
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })

      renderHook(() => useDarkMode())

      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('System preference listener', () => {
    it('should listen for system preference changes', () => {
      const addEventListener = jest.fn()
      const removeEventListener = jest.fn()
      
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener,
      })

      renderHook(() => useDarkMode())

      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should update isDark when system preference changes and mode is system', async () => {
      const changeFns: ((e: { matches: boolean }) => void)[] = []
      const mockAddEventListener = jest.fn((event: string, handler: (e: { matches: boolean }) => void) => {
        if (event === 'change') {
          changeFns.push(handler)
        }
      })
      
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: mockAddEventListener,
        removeEventListener: jest.fn(),
      })

      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current.mode).toBe('system')
      expect(result.current.isDark).toBe(false)

      changeFns.forEach(fn => fn({ matches: true }))

      await waitFor(() => {
        expect(result.current.isDark).toBe(true)
      })
    })
  })
})
