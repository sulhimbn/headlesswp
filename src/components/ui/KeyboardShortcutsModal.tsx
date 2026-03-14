'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { KEYBOARD_SHORTCUTS, shouldPreventDefault } from '@/lib/constants/keyboardShortcuts'
import Icon from '@/components/ui/Icon'

interface KeyboardShortcutsModalProps {
  onAction?: (action: string) => void
}

export default function KeyboardShortcutsModal({ onAction }: KeyboardShortcutsModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === '?' && !event.metaKey && !event.ctrlKey) {
      const tagName = (event.target as HTMLElement)?.tagName
      const isInputFocused = tagName === 'INPUT' || tagName === 'TEXTAREA'
      
      if (!isInputFocused) {
        event.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      setIsOpen(false)
    }
    
    if (isOpen && shouldPreventDefault(event)) {
      event.preventDefault()
    }
  }, [isOpen])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!isOpen) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      onClick={closeModal}
    >
      <div 
        className="w-full max-w-md mx-4 bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] border border-[hsl(var(--color-border))]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--color-border))]">
          <h2 id="keyboard-shortcuts-title" className="text-lg font-semibold text-[hsl(var(--color-text-primary))]">
            Pintasan Keyboard
          </h2>
          <button
            onClick={closeModal}
            className="p-1 text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] rounded-[var(--radius-sm)] transition-colors hover:bg-[hsl(var(--color-secondary))]"
            aria-label="Tutup"
          >
            <Icon type="close" className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="mb-4 text-sm text-[hsl(var(--color-text-secondary))]">
            Tekan <kbd className="px-2 py-0.5 text-xs font-mono bg-[hsl(var(--color-secondary))] rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))]">?</kbd> kapan saja untuk menampilkan/menutup panduan ini.
          </p>
          
          <ul className="space-y-3" role="list">
            {KEYBOARD_SHORTCUTS.map((shortcut) => (
              <li key={shortcut.action} className="flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--color-text-secondary))]">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.key.includes(' ') ? (
                    shortcut.key.split(' ').map((key, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <kbd className="px-2 py-1 text-xs font-mono bg-[hsl(var(--color-secondary))] rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))] min-w-[2rem] text-center">
                          {key}
                        </kbd>
                        {idx < shortcut.key.split(' ').length - 1 && (
                          <span className="text-[hsl(var(--color-text-muted))]">+</span>
                        )}
                      </span>
                    ))
                  ) : (
                    <kbd className="px-2 py-1 text-xs font-mono bg-[hsl(var(--color-secondary))] rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))] min-w-[2rem] text-center">
                      {shortcut.key}
                    </kbd>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="px-6 py-4 bg-[hsl(var(--color-secondary))] rounded-b-[var(--radius-lg)]">
          <p className="text-xs text-[hsl(var(--color-text-muted))]">
            Gunakan <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[hsl(var(--color-surface))] rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))]">Tab</kbd> untuk navigasi dan <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[hsl(var(--color-surface))] rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))]">Enter</kbd> untuk memilih.
          </p>
        </div>
      </div>
    </div>
  )

  if (typeof window === 'undefined') return null
  
  return createPortal(modalContent, document.body)
}