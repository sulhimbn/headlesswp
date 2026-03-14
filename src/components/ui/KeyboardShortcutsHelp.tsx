'use client'

import { useEffect, useRef, useCallback } from 'react'
import Icon from '@/components/ui/Icon'
import { getShortcutKeyDisplay } from '@/lib/hooks/useKeyboardShortcuts'

interface KeyboardShortcutItem {
  key: string
  description: string
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS: KeyboardShortcutItem[] = [
  { key: '/', description: 'Fokus bilah pencarian' },
  { key: 'j', description: 'Navigasi ke artikel berikutnya' },
  { key: 'k', description: 'Navigasi ke artikel sebelumnya' },
  { key: '?', description: 'Tampilkan bantuan pintasan keyboard' },
  { key: 'Escape', description: 'Tutup modal atau menu' },
]

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const handleFocusTrap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (!focusableElements || focusableElements.length === 0) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleFocusTrap)
    return () => {
      document.removeEventListener('keydown', handleFocusTrap)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className="relative bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] max-w-md w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--color-border))]">
          <h2
            id="keyboard-shortcuts-title"
            className="text-lg font-semibold text-[hsl(var(--color-text-primary))]"
          >
            Pintasan Keyboard
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-[var(--radius-md)] text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
            aria-label="Tutup dialog bantuan pintasan keyboard"
          >
            <Icon type="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-[hsl(var(--color-text-secondary))] mb-4">
            Gunakan pintasan keyboard untuk navigasi yang lebih cepat.
          </p>

          <ul className="space-y-3" role="list">
            {SHORTCUTS.map((shortcut) => (
              <li key={shortcut.key} className="flex items-center justify-between">
                <span className="text-[hsl(var(--color-text-secondary))]">
                  {shortcut.description}
                </span>
                <kbd
                  className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-sm font-mono font-medium text-[hsl(var(--color-text-primary))] bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))] shadow-sm"
                  aria-label={`Tombol ${shortcut.key}`}
                >
                  {getShortcutKeyDisplay(shortcut.key)}
                </kbd>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t border-[hsl(var(--color-border))]">
          <p className="text-xs text-[hsl(var(--color-text-muted))] text-center">
            Tekan <kbd className="px-1 py-0.5 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] text-[hsl(var(--color-text-muted))]">?</kbd> kapan saja untuk melihat dialog ini
          </p>
        </div>
      </div>
    </div>
  )
}
