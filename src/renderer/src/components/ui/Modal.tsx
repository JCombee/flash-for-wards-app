import type { ReactNode } from 'react'

interface ModalProps {
  children: ReactNode
  /** Tailwind max-width class for the panel, e.g. "max-w-lg". */
  width?: string
  /** Darker scrim for blocking first-run flows; the in-context editor uses the default. */
  strong?: boolean
}

export function Modal({ children, width = 'max-w-lg', strong = false }: ModalProps) {
  return (
    <div
      className={`fixed inset-0 ${strong ? 'bg-black/80' : 'bg-black/70'} flex items-center justify-center z-40`}
    >
      <div
        className={`bg-lol-dark-mid border border-lol-gold/40 rounded-lg p-6 w-full ${width} mx-4 max-h-[90vh] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  )
}
