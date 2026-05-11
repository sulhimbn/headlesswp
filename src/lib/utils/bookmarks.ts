const BOOKMARKS_KEY = 'bookmarks'
const MAX_BOOKMARKS = 50

export interface BookmarkItem {
  postId: number
  slug: string
  title: string
  thumbnail: string | null
  category: string | null
  bookmarkedAt: number
}

function getStorageItem(key: string): BookmarkItem[] {
  if (typeof window === 'undefined') return []
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : []
  } catch {
    return []
  }
}

function setStorageItem(key: string, value: BookmarkItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function addBookmark(
  postId: number,
  slug: string,
  title: string,
  thumbnail: string | null = null,
  category: string | null = null
): void {
  const bookmarks = getBookmarks()
  
  const existingIndex = bookmarks.findIndex(b => b.postId === postId)
  if (existingIndex !== -1) {
    return
  }
  
  const newBookmark: BookmarkItem = {
    postId,
    slug,
    title,
    thumbnail,
    category,
    bookmarkedAt: Date.now(),
  }
  
  bookmarks.unshift(newBookmark)
  
  if (bookmarks.length > MAX_BOOKMARKS) {
    bookmarks.pop()
  }
  
  setStorageItem(BOOKMARKS_KEY, bookmarks)
}

export function removeBookmark(postId: number): void {
  const bookmarks = getBookmarks()
  const filtered = bookmarks.filter(b => b.postId !== postId)
  setStorageItem(BOOKMARKS_KEY, filtered)
}

export function toggleBookmark(
  postId: number,
  slug: string,
  title: string,
  thumbnail: string | null = null,
  category: string | null = null
): boolean {
  if (isBookmarked(postId)) {
    removeBookmark(postId)
    return false
  } else {
    addBookmark(postId, slug, title, thumbnail, category)
    return true
  }
}

export function getBookmarks(): BookmarkItem[] {
  return getStorageItem(BOOKMARKS_KEY)
}

export function isBookmarked(postId: number): boolean {
  const bookmarks = getBookmarks()
  return bookmarks.some(b => b.postId === postId)
}

export function clearBookmarks(): void {
  setStorageItem(BOOKMARKS_KEY, [])
}

export function getRecentBookmarks(limit: number = 5): BookmarkItem[] {
  const bookmarks = getBookmarks()
  return bookmarks.slice(0, limit)
}