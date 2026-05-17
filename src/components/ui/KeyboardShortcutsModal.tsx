'use client'

import { useEffect, useRef, useCallback } from 'react'
import Icon from './Icon'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { keys: ['/'], description: 'Fokus bilik carian' },
  { keys: ['?'], description: 'Paparkan pintasan papan kekunci' },
  { keys: ['Esc'], description: 'Tutup modal/menu' },
  { keys: ['j'], description: 'Post seterusnya (dalam senarai)' },
  { keys: ['k'], description: 'Post sebelumnya (dalam senarai)' },
]

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      closeButtonRef.current?.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return
        
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
      }

      document.addEventListener('keydown', handleTabKey)
      return () => document.removeEventListener('keydown', handleTabKey)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] border border-[hsl(var(--color-border))] p-6 animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            id="keyboard-shortcuts-title"
            className="text-xl font-semibold text-[hsl(var(--color-text-primary))]"
          >
            Pintasan Papan Kekunci
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 rounded-[var(--radius-md)] text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] hover:bg-[hsl(var(--color-bg-hover))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] transition-colors duration-[var(--transition-fast)]"
            aria-label="Tutup"
          >
            <Icon type="close" className="h-5 w-5" />
          </button>
        </div>

        <ul className="space-y-3" role="list">
          {SHORTCUTS.map((shortcut, index) => (
            <li key={index} className="flex items-center justify-between">
              <span className="text-[hsl(var(--color-text-secondary))]">
                {shortcut.description}
              </span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <kbd
                    key={keyIndex}
                    className="inline-flex items-center px-2.5 py-1 text-sm font-mono bg-[hsl(var(--color-bg-subtle))] border border-[hsl(var(--color-border))] rounded-[var(--radius-sm)] text-[hsl(var(--color-text-primary))] shadow-sm"
                  >
                    {key === ' ' ? 'Space' : key}
                  </kbd>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm text-[hsl(var(--color-text-muted))] text-center">
          Tekan <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[hsl(var(--color-bg-subtle))] border border-[hsl(var(--color-border))] rounded">[?]</kbd> untuk membuka dialog ini
        </p>
      </div>
    </div>
  )
}
