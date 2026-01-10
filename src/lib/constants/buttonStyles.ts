export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

export const BUTTON_VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-[hsl(var(--color-primary))] text-white hover:bg-[hsl(var(--color-primary-dark))] shadow-md',
  secondary: 'bg-[hsl(var(--color-secondary-dark))] text-[hsl(var(--color-text-primary))] hover:bg-[hsl(var(--color-secondary))]',
  outline: 'border-2 border-[hsl(var(--color-primary))] text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-primary-light))]',
  ghost: 'text-[hsl(var(--color-text-secondary))] hover:text-[hsl(var(--color-primary))] hover:bg-[hsl(var(--color-secondary-dark))]'
} as const
