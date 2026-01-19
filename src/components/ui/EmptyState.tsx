import Link from 'next/link'
import { memo } from 'react'
import { createArePropsEqual } from '@/lib/utils/memoization'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    href: string
  }
  className?: string
}

const EMPTYSTATE_PROPS: (keyof EmptyStateProps)[] = [
  'title',
  'description',
  'icon',
  'action',
  'className',
];

const arePropsEqual = createArePropsEqual<EmptyStateProps>(EMPTYSTATE_PROPS);

function EmptyStateComponent({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`} role="status" aria-live="polite" aria-atomic="true">
      {icon && (
        <div className="mx-auto h-12 w-12 text-[hsl(var(--color-text-muted))] mb-4" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-[hsl(var(--color-text-primary))] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-[hsl(var(--color-text-secondary))] mb-4 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center px-4 py-2 text-base font-medium text-white bg-[hsl(var(--color-primary))] rounded-[var(--radius-md)] hover:bg-[hsl(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 transition-colors duration-[var(--transition-normal)]"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}

export default memo(EmptyStateComponent, arePropsEqual)
