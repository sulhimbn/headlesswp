'use client'

import { useEffect, useRef, memo } from 'react'
import Icon from './Icon'

interface KeyboardShortcut {
  key: string
  description: string
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS: KeyboardShortcut[] = [
  { key: '?', description: 'Tampilkan/sembunyikan bantuan' },
  { key: '/', description: 'Fokus pada pencarian' },
  { key: 'j', description: 'Artikel berikutnya' },
  { key: 'k', description: 'Artikel sebelumnya' },
  { key: 'Enter', description: 'Buka artikel yang dipilih' },
  { key: 'Escape', description: 'Tutup modal/menu' },
  { key: 'h', description: 'Ke halaman utama' },
  { key: 'b', description: 'Ke halaman berita' },
]

function KeyboardShortcutsHelpComponent({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    closeButtonRef.current?.focus()

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] border border-[hsl(var(--color-border))]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--color-border))]">
          <h2 id="shortcuts-title" className="text-lg font-semibold text-[hsl(var(--color-text-primary))]">
            Pintasan Keyboard
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-[var(--radius-md)] text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
            aria-label="Tutup"
          >
            <Icon type="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-3">
            {SHORTCUTS.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between">
                <span className="text-[hsl(var(--color-text-secondary))]">
                  {shortcut.description}
                </span>
                <kbd className="px-2 py-1 text-sm font-mono bg-[hsl(var(--color-secondary))] border border-[hsl(var(--color-border))] rounded-[var(--radius-sm)] text-[hsl(var(--color-text-primary))] min-w-[2rem] text-center">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 bg-[hsl(var(--color-secondary))] rounded-b-[var(--radius-lg)]">
          <p className="text-xs text-[hsl(var(--color-text-muted))] text-center">
            Tekan <kbd className="px-1 bg-[hsl(var(--color-surface))] rounded-[var(--radius-sm)]">?</kbd> kapan saja untuk melihat pintasan ini
          </p>
        </div>
      </div>
    </div>
  )
}

export default memo(KeyboardShortcutsHelpComponent)