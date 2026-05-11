import {
  addBookmark,
  removeBookmark,
  toggleBookmark,
  getBookmarks,
  isBookmarked,
  clearBookmarks,
  getRecentBookmarks
} from '@/lib/utils/bookmarks'

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

beforeEach(() => {
  localStorageMock.clear()
})

describe('bookmarks utility', () => {
  describe('addBookmark()', () => {
    it('should add a bookmark to localStorage', () => {
      addBookmark(1, 'test-post', 'Test Post', 'https://example.com/image.jpg', 'News')
      const bookmarks = getBookmarks()
      
      expect(bookmarks).toHaveLength(1)
      expect(bookmarks[0].postId).toBe(1)
      expect(bookmarks[0].slug).toBe('test-post')
      expect(bookmarks[0].title).toBe('Test Post')
      expect(bookmarks[0].thumbnail).toBe('https://example.com/image.jpg')
      expect(bookmarks[0].category).toBe('News')
    })

    it('should add bookmark with null thumbnail and category', () => {
      addBookmark(2, 'another-post', 'Another Post')
      const bookmarks = getBookmarks()
      
      expect(bookmarks).toHaveLength(1)
      expect(bookmarks[0].thumbnail).toBeNull()
      expect(bookmarks[0].category).toBeNull()
    })

    it('should not add duplicate bookmark', () => {
      addBookmark(1, 'test-post', 'Test Post')
      addBookmark(1, 'test-post', 'Test Post')
      const bookmarks = getBookmarks()
      
      expect(bookmarks).toHaveLength(1)
    })

    it('should add multiple bookmarks and maintain order', () => {
      addBookmark(1, 'post-1', 'Post 1')
      addBookmark(2, 'post-2', 'Post 2')
      addBookmark(3, 'post-3', 'Post 3')
      const bookmarks = getBookmarks()
      
      expect(bookmarks).toHaveLength(3)
      expect(bookmarks[0].postId).toBe(3)
      expect(bookmarks[1].postId).toBe(2)
      expect(bookmarks[2].postId).toBe(1)
    })

    it('should remove oldest bookmark when exceeding 50', () => {
      for (let i = 1; i <= 51; i++) {
        addBookmark(i, `post-${i}`, `Post ${i}`)
      }
      const bookmarks = getBookmarks()
      
      expect(bookmarks).toHaveLength(50)
      expect(bookmarks[49].postId).toBe(2)
    })
  })

  describe('removeBookmark()', () => {
    it('should remove a bookmark by postId', () => {
      addBookmark(1, 'test-post', 'Test Post')
      addBookmark(2, 'another-post', 'Another Post')
      removeBookmark(1)
      const bookmarks = getBookmarks()
      
      expect(bookmarks).toHaveLength(1)
      expect(bookmarks[0].postId).toBe(2)
    })

    it('should handle removing non-existent bookmark', () => {
      addBookmark(1, 'test-post', 'Test Post')
      removeBookmark(999)
      const bookmarks = getBookmarks()
      
      expect(bookmarks).toHaveLength(1)
    })
  })

  describe('toggleBookmark()', () => {
    it('should add bookmark when not bookmarked', () => {
      const result = toggleBookmark(1, 'test-post', 'Test Post')
      const bookmarks = getBookmarks()
      
      expect(result).toBe(true)
      expect(bookmarks).toHaveLength(1)
    })

    it('should remove bookmark when already bookmarked', () => {
      addBookmark(1, 'test-post', 'Test Post')
      const result = toggleBookmark(1, 'test-post', 'Test Post')
      const bookmarks = getBookmarks()
      
      expect(result).toBe(false)
      expect(bookmarks).toHaveLength(0)
    })

    it('should toggle with full details', () => {
      toggleBookmark(1, 'test-post', 'Test Post', 'https://example.com/image.jpg', 'News')
      const bookmark = getBookmarks()[0]
      
      expect(bookmark.thumbnail).toBe('https://example.com/image.jpg')
      expect(bookmark.category).toBe('News')
    })
  })

  describe('getBookmarks()', () => {
    it('should return empty array when no bookmarks', () => {
      const bookmarks = getBookmarks()
      expect(bookmarks).toEqual([])
    })

    it('should return all bookmarks', () => {
      addBookmark(1, 'post-1', 'Post 1')
      addBookmark(2, 'post-2', 'Post 2')
      const bookmarks = getBookmarks()
      
      expect(bookmarks).toHaveLength(2)
    })
  })

  describe('isBookmarked()', () => {
    it('should return false when not bookmarked', () => {
      expect(isBookmarked(1)).toBe(false)
    })

    it('should return true when bookmarked', () => {
      addBookmark(1, 'test-post', 'Test Post')
      expect(isBookmarked(1)).toBe(true)
    })

    it('should return false for different postId', () => {
      addBookmark(1, 'test-post', 'Test Post')
      expect(isBookmarked(2)).toBe(false)
    })
  })

  describe('clearBookmarks()', () => {
    it('should remove all bookmarks', () => {
      addBookmark(1, 'post-1', 'Post 1')
      addBookmark(2, 'post-2', 'Post 2')
      clearBookmarks()
      const bookmarks = getBookmarks()
      
      expect(bookmarks).toHaveLength(0)
    })
  })

  describe('getRecentBookmarks()', () => {
    it('should return empty array when no bookmarks', () => {
      const recent = getRecentBookmarks(5)
      expect(recent).toEqual([])
    })

    it('should return limited number of bookmarks', () => {
      for (let i = 1; i <= 10; i++) {
        addBookmark(i, `post-${i}`, `Post ${i}`)
      }
      const recent = getRecentBookmarks(5)
      
      expect(recent).toHaveLength(5)
      expect(recent[0].postId).toBe(10)
    })

    it('should return all bookmarks when limit exceeds count', () => {
      addBookmark(1, 'post-1', 'Post 1')
      addBookmark(2, 'post-2', 'Post 2')
      const recent = getRecentBookmarks(10)
      
      expect(recent).toHaveLength(2)
    })

    it('should use default limit of 5', () => {
      for (let i = 1; i <= 10; i++) {
        addBookmark(i, `post-${i}`, `Post ${i}`)
      }
      const recent = getRecentBookmarks()
      
      expect(recent).toHaveLength(5)
    })
  })
})

describe('bookmarks localStorage', () => {
  it('should persist bookmarks in localStorage', () => {
    addBookmark(1, 'test-post', 'Test Post')
    
    const stored = localStorageMock.getItem('bookmarks')
    expect(stored).toBeTruthy()
    
    const parsed = JSON.parse(stored!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].postId).toBe(1)
  })

  it('should return empty array when localStorage is unavailable', () => {
    Object.defineProperty(global, 'localStorage', {
      value: undefined,
      writable: true
    })
    
    const bookmarks = getBookmarks()
    expect(bookmarks).toEqual([])
    
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock
    })
  })
})