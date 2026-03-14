interface KeyboardShortcut {
  key: string
  description: string
  action: string
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: '?', description: 'Buka panduan pintasan keyboard', action: 'toggle-help' },
  { key: '/', description: 'Fokus ke pencarian', action: 'focus-search' },
  { key: 'g h', description: 'Ke halaman utama', action: 'go-home' },
  { key: 'g n', description: 'Ke halaman berita', action: 'go-news' },
  { key: 'Escape', description: 'Tutup dialog/panel', action: 'close-modal' },
  { key: 'j', description: 'Artikel berikutnya', action: 'next-post' },
  { key: 'k', description: 'Artikel sebelumnya', action: 'prev-post' },
]

export const isShortcutKey = (event: KeyboardEvent): boolean => {
  return event.key === '?' || 
         event.key === '/' || 
         event.key === 'Escape' ||
         (event.key === 'g' && !event.metaKey && !event.ctrlKey) ||
         event.key === 'j' ||
         event.key === 'k'
}

export const shouldPreventDefault = (event: KeyboardEvent): boolean => {
  const tagName = (event.target as HTMLElement)?.tagName
  const isInputFocused = tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
  
  if (isInputFocused) {
    return event.key === 'Escape'
  }
  
  return true
}