interface SectionHeadingProps {
  level?: 'h1' | 'h2' | 'h3'
  size?: 'lg' | 'md' | 'sm'
  children: React.ReactNode
  className?: string
}

const sizeStyles = {
  lg: 'text-3xl font-bold',
  md: 'text-2xl font-semibold',
  sm: 'text-xl font-semibold'
}

export default function SectionHeading({ level = 'h2', size = 'lg', children, className = '' }: SectionHeadingProps) {
  const baseClassName = `text-gray-900 ${sizeStyles[size]} ${className}`.trim()

  const HeadingTag = level

  return (
    <HeadingTag className={baseClassName}>
      {children}
    </HeadingTag>
  )
}
