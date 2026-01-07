import Link from 'next/link'

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

export default function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`} role="status">
      {icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 mb-4 max-w-md mx-auto">
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center px-4 py-2 text-base font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
