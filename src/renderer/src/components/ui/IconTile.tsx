import type { ButtonHTMLAttributes } from 'react'

/**
 * Selectable circular game icon — rune styles, keystones, perks, stat shards.
 * Unselected is dimmed + grayscale; selected is full colour inside a gold ring.
 */
type Size = 'sm' | 'style' | 'md' | 'lg'

const DIMS: Record<Size, string> = {
  sm: 'w-8 h-8',
  style: 'w-9 h-9',
  md: 'w-10 h-10',
  lg: 'w-12 h-12'
}

interface IconTileProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  src: string
  alt: string
  selected: boolean
  size?: Size
}

export function IconTile({
  src,
  alt,
  selected,
  size = 'md',
  className = '',
  ...rest
}: IconTileProps) {
  return (
    <button
      type="button"
      title={alt}
      className={`${DIMS[size]} rounded-full transition-all ${
        selected
          ? 'ring-2 ring-lol-gold opacity-100'
          : 'opacity-40 grayscale hover:opacity-80 hover:grayscale-0'
      } ${className}`}
      {...rest}
    >
      <img src={src} alt={alt} className="w-full h-full object-contain" />
    </button>
  )
}
