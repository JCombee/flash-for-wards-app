import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'info'
type Size = 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-lol-gold hover:bg-lol-gold/80 text-lol-dark font-semibold',
  secondary: 'bg-white/10 hover:bg-white/20 text-gray-300',
  ghost: 'bg-transparent hover:bg-white/10 text-gray-400',
  danger: 'bg-red-900/30 hover:bg-red-900/60 text-red-400',
  success: 'bg-green-600 hover:bg-green-500 text-white font-semibold',
  // Blue is reserved for live/in-progress states — an update waiting to install is one.
  info: 'bg-lol-blue hover:bg-lol-blue-dark text-lol-dark font-semibold'
}

const SIZES: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm'
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center gap-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
