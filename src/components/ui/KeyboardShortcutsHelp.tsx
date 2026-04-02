'use client'

import { useEffect, useRef } from 'react'
import Icon from './Icon'
import { UI_TEXT } from '@/lib/constants/uiText'
import type { KeyboardShortcut } from '@/lib/constants/keyboardShortcuts'

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: KeyboardShortcut[]
}

export default function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const categories = {
    navigation: shortcuts.filter(s => s.category === 'navigation'),
    search: shortcuts.filter(s => s.category === 'search'),
    accessibility: shortcuts.filter(s => s.category === 'accessibility'),
    general: shortcuts.filter(s => s.category === 'general'),
  }

  const renderCategory = (title: string, categoryShortcuts: KeyboardShortcut[]) => {
    if (categoryShortcuts.length === 0) return null
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-[hsl(var(--color-text-muted))] uppercase tracking-wider mb-3">
          {title}
        </h3>
        <ul className="space-y-2">
          {categoryShortcuts.map(shortcut => (
            <li key={shortcut.key} className="flex items-center justify-between gap-4">
              <span className="text-[hsl(var(--color-text-primary))]">{shortcut.description}</span>
              <kbd className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 text-sm font-mono bg-[hsl(var(--color-secondary-dark))] border border-[hsl(var(--color-border))] rounded-[var(--radius-sm)] text-[hsl(var(--color-text-primary))] shadow-sm">
                {shortcut.key}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-help-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className="relative w-full max-w-md max-h-[80vh] overflow-y-auto bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 id="keyboard-help-title" className="text-xl font-bold text-[hsl(var(--color-text-primary))]">
            {UI_TEXT.shortcuts.title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-[var(--radius-md)] text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
            aria-label={UI_TEXT.shortcuts.close}
          >
            <Icon type="close" className="h-5 w-5" />
          </button>
        </div>
        {renderCategory(UI_TEXT.shortcuts.categories.navigation, categories.navigation)}
        {renderCategory(UI_TEXT.shortcuts.categories.search, categories.search)}
        {renderCategory(UI_TEXT.shortcuts.categories.accessibility, categories.accessibility)}
        {renderCategory(UI_TEXT.shortcuts.categories.general, categories.general)}
        <p className="text-sm text-[hsl(var(--color-text-muted))] mt-4 pt-4 border-t border-[hsl(var(--color-border))]">
          {UI_TEXT.shortcuts.hint}
        </p>
      </div>
    </div>
  )
}
