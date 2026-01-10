interface SectionHeadingProps {
  level?: 'h1' | 'h2' | 'h3'
  size?: 'lg' | 'md' | 'sm'
  children: React.ReactNode
  className?: string
  id?: string
}

const sizeStyles = {
  lg: 'text-[var(--text-3xl)] font-bold',
  md: 'text-[var(--text-2xl)] font-semibold',
  sm: 'text-[var(--text-xl)] font-semibold'
}

export default function SectionHeading({ level = 'h2', size = 'lg', children, className = '', id }: SectionHeadingProps) {
  const baseClassName = `text-[hsl(var(--color-text-primary))] ${sizeStyles[size]} ${className}`.trim()

  const HeadingTag = level

  return (
    <HeadingTag id={id} className={baseClassName}>
      {children}
    </HeadingTag>
  )
}
