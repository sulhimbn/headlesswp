import { memo } from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
}

function SkeletonComponent({ 
  className = '', 
  variant = 'rectangular' 
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full rounded-[var(--radius-sm)]',
    circular: 'h-10 w-10 rounded-full',
    rectangular: 'h-10 w-full',
    rounded: 'h-10 w-full rounded-[var(--radius-md)]',
  }

  const combinedClassName = `${variantClasses[variant]} bg-[hsl(var(--color-secondary-dark))] animate-pulse ${className}`.trim()

  return (
    <div 
      className={combinedClassName} 
      aria-hidden="true"
      role="presentation"
    />
  )
}

function arePropsEqual(prevProps: SkeletonProps, nextProps: SkeletonProps): boolean {
  return (
    prevProps.className === nextProps.className &&
    prevProps.variant === nextProps.variant
  )
}

export default memo(SkeletonComponent, arePropsEqual)
