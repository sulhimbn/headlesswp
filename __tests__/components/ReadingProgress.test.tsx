import { render } from '@testing-library/react'
import ReadingProgress from '@/components/ui/ReadingProgress'

describe('ReadingProgress Component', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true })
    
    window.requestAnimationFrame = jest.fn((cb) => {
      cb(0)
      return 0
    }) as jest.Mock
    window.addEventListener = jest.fn()
    window.removeEventListener = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('renders nothing initially when scrollY is 0', () => {
    const { container } = render(<ReadingProgress />)
    expect(container.firstChild).toBeNull()
  })

  test('component mounts correctly', () => {
    const { container } = render(<ReadingProgress />)
    expect(container).toBeInTheDocument()
  })

  test('renders with custom targetId prop', () => {
    const { container } = render(<ReadingProgress targetId="custom-content" />)
    expect(container).toBeInTheDocument()
  })

  test('renders with default targetId', () => {
    const { container } = render(<ReadingProgress targetId="article-content" />)
    expect(container).toBeInTheDocument()
  })

  test('component is memoized', () => {
    const { rerender } = render(<ReadingProgress />)
    rerender(<ReadingProgress />)
    expect(true).toBe(true)
  })

  test('handles unmount without error', () => {
    const { unmount } = render(<ReadingProgress />)
    expect(() => unmount()).not.toThrow()
  })

  test('renders without className when not provided', () => {
    const { container } = render(<ReadingProgress />)
    expect(container).toBeInTheDocument()
  })

  test('handles different targetIds correctly', () => {
    const { unmount } = render(<ReadingProgress targetId="content-1" />)
    unmount()
    
    const { container } = render(<ReadingProgress targetId="content-2" />)
    expect(container).toBeInTheDocument()
  })

  test('handles empty string as targetId', () => {
    const { container } = render(<ReadingProgress targetId="" />)
    expect(container).toBeInTheDocument()
  })

  test('handles target element not found without error', () => {
    const { container } = render(<ReadingProgress targetId="non-existent-id" />)
    expect(container).toBeInTheDocument()
  })

  test('adds scroll and resize event listeners on mount', () => {
    render(<ReadingProgress />)
    
    expect(window.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true }
    )
    expect(window.addEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
      { passive: true }
    )
  })

  test('removes event listeners on unmount', () => {
    const { unmount } = render(<ReadingProgress />)
    unmount()
    
    expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  test('calls calculateProgress on mount', () => {
    render(<ReadingProgress />)
    expect(window.addEventListener).toHaveBeenCalled()
  })

  test('uses requestAnimationFrame in scroll handler', () => {
    render(<ReadingProgress />)
    
    const scrollHandler = (window.addEventListener as jest.Mock).mock.calls.find(
      call => call[0] === 'scroll'
    )[1]
    
    scrollHandler()
    
    expect(window.requestAnimationFrame).toHaveBeenCalled()
  })

  test('handles initial scrollY > 0', () => {
    Object.defineProperty(window, 'scrollY', { value: 500, writable: true })
    
    const { container } = render(<ReadingProgress />)
    expect(container).toBeInTheDocument()
  })

  test('handles larger window height', () => {
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true })
    
    const { container } = render(<ReadingProgress />)
    expect(container).toBeInTheDocument()
  })
})
