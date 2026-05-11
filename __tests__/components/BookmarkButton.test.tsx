import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BookmarkButton from '@/components/ui/BookmarkButton'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})

jest.mock('@/lib/utils/bookmarks', () => ({
  ...jest.requireActual('@/lib/utils/bookmarks'),
  toggleBookmark: jest.fn(),
  isBookmarked: jest.fn()
}))

import { toggleBookmark, isBookmarked } from '@/lib/utils/bookmarks'

const mockToggleBookmark = toggleBookmark as jest.MockedFunction<typeof toggleBookmark>
const mockIsBookmarked = isBookmarked as jest.MockedFunction<typeof isBookmarked>

describe('BookmarkButton Component', () => {
  const defaultProps = {
    postId: 1,
    slug: 'test-post',
    title: 'Test Post'
  }

  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  it('should render bookmark outline icon when not bookmarked', () => {
    mockIsBookmarked.mockReturnValue(false)
    
    render(<BookmarkButton {...defaultProps} />)
    
    const button = screen.getByRole('button', { name: /simpan ke markah/i })
    expect(button).toBeInTheDocument()
  })

  it('should render filled bookmark icon when bookmarked', () => {
    mockIsBookmarked.mockReturnValue(true)
    
    render(<BookmarkButton {...defaultProps} />)
    
    const button = screen.getByRole('button', { name: /hapus dari markah/i })
    expect(button).toBeInTheDocument()
  })

  it('should call toggleBookmark when clicked', async () => {
    mockIsBookmarked.mockReturnValue(false)
    mockToggleBookmark.mockReturnValue(true)
    
    render(<BookmarkButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockToggleBookmark).toHaveBeenCalledWith(
        1,
        'test-post',
        'Test Post',
        null,
        null
      )
    })
  })

  it('should pass thumbnail and category to toggleBookmark', () => {
    mockIsBookmarked.mockReturnValue(false)
    mockToggleBookmark.mockReturnValue(true)
    
    render(
      <BookmarkButton
        {...defaultProps}
        thumbnail="https://example.com/image.jpg"
        category="News"
      />
    )
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockToggleBookmark).toHaveBeenCalledWith(
      1,
      'test-post',
      'Test Post',
      'https://example.com/image.jpg',
      'News'
    )
  })

  it('should have correct styling when not bookmarked', () => {
    mockIsBookmarked.mockReturnValue(false)
    
    render(<BookmarkButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-[hsl(var(--color-text-muted))]')
  })

  it('should have correct styling when bookmarked', () => {
    mockIsBookmarked.mockReturnValue(true)
    
    render(<BookmarkButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-[hsl(var(--color-primary))]')
  })

  it('should have minimum touch target size', () => {
    mockIsBookmarked.mockReturnValue(false)
    
    render(<BookmarkButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('min-w-[44px]', 'min-h-[44px]')
  })

  it('should have aria-pressed attribute', () => {
    mockIsBookmarked.mockReturnValue(true)
    
    render(<BookmarkButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('should accept custom className', () => {
    mockIsBookmarked.mockReturnValue(false)
    
    render(<BookmarkButton {...defaultProps} className="custom-class" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should call toggleBookmark with correct arguments on each click', () => {
    mockIsBookmarked.mockReturnValue(false)
    mockToggleBookmark.mockReturnValue(true)
    
    render(<BookmarkButton {...defaultProps} />)
    
    const button = screen.getByRole('button')
    
    fireEvent.click(button)
    expect(mockToggleBookmark).toHaveBeenCalledTimes(1)
    
    fireEvent.click(button)
    expect(mockToggleBookmark).toHaveBeenCalledTimes(2)
  })
})