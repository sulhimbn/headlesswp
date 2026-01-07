import Link from 'next/link'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'category' | 'tag' | 'default'
  className?: string
  href?: string
}

export default function Badge({ children, variant = 'default', className = '', href }: BadgeProps) {
  const baseStyles = 'inline-flex items-center text-xs px-2 py-1 rounded-full'
  
  const variantStyles = {
    category: 'bg-red-100 text-red-800',
    tag: 'bg-gray-100 text-gray-700',
    default: 'bg-gray-100 text-gray-700'
  }

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`.trim()

  if (href) {
    return (
      <Link
        href={href}
        className={`${combinedClassName} hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600`}
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
