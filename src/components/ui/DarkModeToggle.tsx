'use client'

import { memo } from 'react'
import { useDarkMode } from '@/lib/hooks/useDarkMode'
import Icon from './Icon'
import { UI_TEXT } from '@/lib/constants/uiText'

interface DarkModeToggleProps {
  className?: string
}

const baseStyles = 'inline-flex items-center justify-center p-2 rounded-[var(--radius-md)] text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 transition-colors duration-[var(--transition-fast)]'

function DarkModeToggleComponent({ className = '' }: DarkModeToggleProps) {
  const { isDark, toggleDarkMode } = useDarkMode()

  return (
    <button
      type="button"
      className={`${baseStyles} ${className}`}
      onClick={toggleDarkMode}
      aria-label={isDark ? UI_TEXT.header.darkMode.enableLight : UI_TEXT.header.darkMode.enableDark}
    >
      <Icon type={isDark ? 'sun' : 'moon'} className="h-5 w-5" />
    </button>
  )
}

export default memo(DarkModeToggleComponent)