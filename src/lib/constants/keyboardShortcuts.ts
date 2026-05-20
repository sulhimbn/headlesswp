export interface KeyboardShortcut {
  key: string
  description: string
  descriptionId: string
  category: 'navigation' | 'search' | 'accessibility' | 'general'
  requireInputFocus?: boolean
}

export interface KeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[]
  enabled: boolean
}

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'j', description: 'Navigasi ke artikel berikutnya', descriptionId: 'shortcut.nextPost', category: 'navigation' },
  { key: 'k', description: 'Navigasi ke artikel sebelumnya', descriptionId: 'shortcut.prevPost', category: 'navigation' },
  { key: 'Enter', description: 'Buka artikel yang dipilih', descriptionId: 'shortcut.openPost', category: 'navigation', requireInputFocus: true },
  { key: '/', description: 'Fokus ke pencarian', descriptionId: 'shortcut.focusSearch', category: 'search' },
  { key: '?', description: 'Tampilkan bantuan pintasan keyboard', descriptionId: 'shortcut.showHelp', category: 'accessibility' },
  { key: 'h', description: 'Kembali ke halaman utama', descriptionId: 'shortcut.goHome', category: 'navigation' },
  { key: 'b', description: 'Daftar berita', descriptionId: 'shortcut.goNews', category: 'navigation' },
  { key: 'Escape', description: 'Tutup overlay/popup', descriptionId: 'shortcut.close', category: 'general' },
]

export const DEFAULT_CONFIG: KeyboardShortcutsConfig = {
  shortcuts: DEFAULT_SHORTCUTS,
  enabled: true,
}
