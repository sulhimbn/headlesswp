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

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable or quota exceeded
  }
}

export function addBookmark(post: {
  id: number
  slug: string
  title: { rendered: string }
  featured_media: number
  categories: number[]
}): void {
  const bookmarks = getBookmarks()

  const existingIndex = bookmarks.findIndex(b => b.postId === post.id)
  if (existingIndex !== -1) {
    return
  }

  const newBookmark: BookmarkItem = {
    postId: post.id,
    slug: post.slug,
    title: post.title.rendered,
    thumbnail: post.featured_media > 0 ? `/berita/${post.slug}` : null,
    category: post.categories.length > 0 ? post.categories[0].toString() : null,
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

export function getBookmarks(): BookmarkItem[] {
  return getStorageItem<BookmarkItem[]>(BOOKMARKS_KEY, [])
}

export function isBookmarked(postId: number): boolean {
  const bookmarks = getBookmarks()
  return bookmarks.some(b => b.postId === postId)
}

export function clearAllBookmarks(): void {
  setStorageItem(BOOKMARKS_KEY, [])
}

export function getRecentBookmarks(limit: number = 5): BookmarkItem[] {
  const bookmarks = getBookmarks()
  return bookmarks.slice(0, limit)
}