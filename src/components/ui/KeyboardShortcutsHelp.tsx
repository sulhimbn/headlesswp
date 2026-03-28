'use client'

import { useEffect, useState, useCallback } from 'react'
import Icon from './Icon'
import { UI_TEXT } from '@/lib/constants/uiText'

interface KeyboardShortcutsHelpProps {
  shortcuts: Array<{
    key: string
    description: string
    category: string
  }>
}

export default function KeyboardShortcutsHelp({ shortcuts }: KeyboardShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev)
    }

    window.addEventListener('toggleKeyboardHelp', handleToggle)
    return () => {
      window.removeEventListener('toggleKeyboardHelp', handleToggle)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const categories = ['search', 'navigation', 'accessibility'] as const
  const categoryLabels: Record<string, string> = {
    search: 'Search',
    navigation: 'Navigation',
    accessibility: 'Accessibility',
  }

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/50 transition-opacity" 
          onClick={handleClose}
          aria-hidden="true"
        />
        
        <div className="relative bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 
              id="keyboard-shortcuts-title" 
              className="text-xl font-semibold text-[hsl(var(--color-text-primary))]"
            >
              {UI_TEXT.keyboardShortcuts.title}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-[var(--radius-md)] text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2"
              aria-label={UI_TEXT.keyboardShortcuts.close}
            >
              <Icon type="close" className="h-5 w-5" />
            </button>
          </div>

          {categories.map(category => {
            const categoryShortcuts = shortcuts.filter(s => s.category === category)
            if (categoryShortcuts.length === 0) return null

            return (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-medium text-[hsl(var(--color-text-secondary))] uppercase tracking-wider mb-3">
                  {categoryLabels[category]}
                </h3>
                <ul className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span className="text-[hsl(var(--color-text-primary))]">
                        {shortcut.description}
                      </span>
                      <kbd className="inline-flex items-center px-2.5 py-1 text-sm font-mono bg-[hsl(var(--color-secondary-dark))] text-[hsl(var(--color-text-primary))] rounded-[var(--radius-sm)] border border-[hsl(var(--color-border))]">
                        {shortcut.key === ' ' ? 'Space' : shortcut.key}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}

          <div className="mt-6 pt-4 border-t border-[hsl(var(--color-border))]">
            <p className="text-sm text-[hsl(var(--color-text-muted))] text-center">
              {UI_TEXT.keyboardShortcuts.hint}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
