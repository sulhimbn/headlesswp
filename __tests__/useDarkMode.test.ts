const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  get length() { return 0 },
}

const mockMatchMedia = jest.fn((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: mockLocalStorage,
})

import { 
  getSystemPreference, 
  getStoredMode
} from '@/lib/hooks/useDarkMode'

describe('useDarkMode', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  describe('getStoredMode', () => {
    it('should return system when no stored value', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      
      const result = getStoredMode()
      
      expect(result).toBe('system')
    })

    it('should return stored dark mode', () => {
      mockLocalStorage.getItem.mockReturnValue('dark')
      
      const result = getStoredMode()
      
      expect(result).toBe('dark')
    })

    it('should return stored light mode', () => {
      mockLocalStorage.getItem.mockReturnValue('light')
      
      const result = getStoredMode()
      
      expect(result).toBe('light')
    })

    it('should return stored system mode', () => {
      mockLocalStorage.getItem.mockReturnValue('system')
      
      const result = getStoredMode()
      
      expect(result).toBe('system')
    })

    it('should return system for invalid stored value', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid')
      
      const result = getStoredMode()
      
      expect(result).toBe('system')
    })
  })

  describe('getSystemPreference', () => {
    it('should return boolean for system preference', () => {
      const result = getSystemPreference()
      
      expect(typeof result).toBe('boolean')
    })
  })
})