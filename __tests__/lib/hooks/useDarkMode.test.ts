import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'

describe('useDarkMode hook', () => {
  let mockGetItem: jest.Mock
  let mockSetItem: jest.Mock
  let mockClassListAdd: jest.Mock
  let mockClassListRemove: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockGetItem = jest.fn()
    mockSetItem = jest.fn()
    mockClassListAdd = jest.fn()
    mockClassListRemove = jest.fn()

    jest.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }))

    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(mockGetItem)
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(mockSetItem)

    const mockClassList = {
      add: mockClassListAdd,
      remove: mockClassListRemove,
    }
    
    Object.defineProperty(document.documentElement, 'classList', {
      value: mockClassList,
      writable: true,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns default mode as system', () => {
    mockGetItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.mode).toBe('system')
  })

  test('returns isDark false by default when mode is system and system prefers light', () => {
    mockGetItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(false)
  })

  test('returns isDark true when mode is dark', () => {
    mockGetItem.mockReturnValue('dark')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(true)
  })

  test('returns isDark false when mode is light', () => {
    mockGetItem.mockReturnValue('light')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(false)
  })

  test('setDarkMode updates mode and localStorage', () => {
    mockGetItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useDarkMode())
    
    act(() => {
      result.current.setDarkMode('dark')
    })
    
    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
    expect(mockSetItem).toHaveBeenCalledWith('dark-mode', 'dark')
  })

  test('setDarkMode to system uses system preference', () => {
    mockGetItem.mockReturnValue('dark')
    
    const { result } = renderHook(() => useDarkMode())
    
    act(() => {
      result.current.setDarkMode('system')
    })
    
    expect(result.current.mode).toBe('system')
  })

  test('toggleDarkMode switches from light to dark', () => {
    mockGetItem.mockReturnValue('light')
    
    const { result } = renderHook(() => useDarkMode())
    
    act(() => {
      result.current.toggleDarkMode()
    })
    
    expect(result.current.mode).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  test('toggleDarkMode switches from dark to light', () => {
    mockGetItem.mockReturnValue('dark')
    
    const { result } = renderHook(() => useDarkMode())
    
    act(() => {
      result.current.toggleDarkMode()
    })
    
    expect(result.current.mode).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  test('adds dark class when isDark is true', () => {
    mockGetItem.mockReturnValue('dark')
    
    renderHook(() => useDarkMode())
    
    expect(mockClassListAdd).toHaveBeenCalledWith('dark')
  })

  test('removes dark class when isDark is false', () => {
    mockGetItem.mockReturnValue('light')
    
    renderHook(() => useDarkMode())
    
    expect(mockClassListRemove).toHaveBeenCalledWith('dark')
  })

  test('handles invalid stored mode defaults to system', () => {
    mockGetItem.mockReturnValue('invalid')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.mode).toBe('system')
  })
})
