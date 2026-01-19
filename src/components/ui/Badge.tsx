import Link from 'next/link'
import { memo } from 'react'
import { createArePropsEqual } from '@/lib/utils/memoization'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'category' | 'tag' | 'default'
  className?: string
  href?: string
}

const BADGE_PROPS: (keyof BadgeProps)[] = [
  'variant',
  'href',
  'className',
  'children',
];

const arePropsEqual = createArePropsEqual<BadgeProps>(BADGE_PROPS);

const baseStyles = 'inline-flex items-center text-xs px-2 py-1 rounded-full'

const variantStyles = {
  category: 'bg-[hsl(var(--color-primary-light))] text-[hsl(var(--color-primary-dark))] font-medium',
  tag: 'bg-[hsl(var(--color-secondary-dark))] text-[hsl(var(--color-text-secondary))]',
  default: 'bg-[hsl(var(--color-secondary-dark))] text-[hsl(var(--color-text-secondary))]'
}

function BadgeComponent({ children, variant = 'default', className = '', href }: BadgeProps) {
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`.trim()

  if (href) {
    return (
      <Link
        href={href}
        className={`${combinedClassName} hover:opacity-80 transition-opacity duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--color-primary))]`}
      >
        {children}
      </Link>
    )
  }

  return (
    <span className={combinedClassName}>
      {children}
    </span>
  )
}

export default memo(BadgeComponent, arePropsEqual)
