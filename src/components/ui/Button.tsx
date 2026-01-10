import { ButtonHTMLAttributes, forwardRef } from 'react'
import { BUTTON_VARIANT_STYLES, type ButtonVariant } from '@/lib/constants/buttonStyles'
import { Icon } from './Icon'

type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
}

const variantStyles = BUTTON_VARIANT_STYLES

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

const baseStyles = 'font-medium rounded-[var(--radius-md)] transition-all duration-[var(--transition-normal)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 focus:shadow-md disabled:opacity-50 disabled:cursor-not-allowed'

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const widthStyles = fullWidth ? 'w-full' : ''

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <Icon type="loading" className="animate-spin -ml-1 mr-2 h-4 w-4 inline" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
