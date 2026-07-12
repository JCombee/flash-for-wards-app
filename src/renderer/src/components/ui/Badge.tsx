import type { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'neutral' | 'accent'
  children: ReactNode
  onRemove?: () => void
}

export function Badge({ variant = 'neutral', children, onRemove }: BadgeProps) {
  const style =
    variant === 'accent'
      ? 'bg-lol-gold/15 border border-lol-gold/30 text-lol-gold-light'
      : 'bg-black/20 text-gray-400'

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs rounded ${style} ${onRemove ? 'pl-2 pr-1.5 py-0.5' : 'px-2 py-0.5'}`}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-gray-400 hover:text-white leading-none transition-colors"
        >
          ×
        </button>
      )}
    </span>
  )
}
